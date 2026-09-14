import dotenv from 'dotenv';
import { isIP } from 'node:net';
import { print as logger } from '../../../../shared/utils/print.js';

const bootstrapFileEnv = {};
dotenv.config({ quiet: true, processEnv: bootstrapFileEnv });

const SERVICE_NAME = 'api-gateway';
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_SECRETS_RESPONSE_BYTES = 64 * 1024;

const ALLOWED_SECRET_KEYS = new Set([
    'NODE_ENV',
    'PORT',
    'FRONTEND_URL',
    'ADMIN_FRONTEND_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'REDIS_TLS',
    'IDENTITY_SERVICE_URL',
    'PROJECT_SERVICE_URL',
    'INTERNAL_SECRET',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
]);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const bootstrapSetting = (key) => process.env[key] ?? bootstrapFileEnv[key];

const isLoopback = (hostname) => {
    const unwrapped = hostname.startsWith('[') && hostname.endsWith(']')
        ? hostname.slice(1, -1)
        : hostname;
    return unwrapped === 'localhost' ||
        unwrapped === '::1' ||
        (isIP(unwrapped) === 4 && unwrapped.split('.')[0] === '127');
};

const secretsEndpoint = (rawUrl) => {
    let baseUrl;
    try {
        baseUrl = new URL(rawUrl);
    } catch {
        throw new Error('SECRETS_MANAGER_URL must be a valid URL');
    }

    if (!['http:', 'https:'].includes(baseUrl.protocol)) {
        throw new Error('SECRETS_MANAGER_URL must use http or https');
    }

    const insecureExplicitlyAllowed = bootstrapSetting('ALLOW_INSECURE_SECRETS_MANAGER') === 'true';
    if (baseUrl.protocol !== 'https:' && !isLoopback(baseUrl.hostname) && !insecureExplicitlyAllowed) {
        throw new Error('SECRETS_MANAGER_URL must use HTTPS outside loopback');
    }

    if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
        throw new Error('SECRETS_MANAGER_URL must not contain credentials, a query, or a fragment');
    }

    return new URL(`/api/v1/secrets/${SERVICE_NAME}`, baseUrl);
};

const readLimitedJson = async (response) => {
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_SECRETS_RESPONSE_BYTES) {
        throw new Error('Secrets manager response exceeded the size limit');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Secrets manager returned an empty response');

    const chunks = [];
    let received = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > MAX_SECRETS_RESPONSE_BYTES) {
            await reader.cancel();
            throw new Error('Secrets manager response exceeded the size limit');
        }
        chunks.push(value);
    }

    const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');
    try {
        return JSON.parse(body);
    } catch {
        throw new Error('Secrets manager returned invalid JSON');
    }
};

const injectAllowedSecrets = (payload) => {
    if (!payload?.secrets || typeof payload.secrets !== 'object' || Array.isArray(payload.secrets)) {
        throw new Error('Secrets manager returned an invalid payload');
    }

    let injectedCount = 0;
    for (const [key, value] of Object.entries(payload.secrets)) {
        if (!ALLOWED_SECRET_KEYS.has(key) || process.env[key]) continue;
        if (!['string', 'number', 'boolean'].includes(typeof value)) {
            throw new Error(`Secret ${key} has an invalid value type`);
        }
        process.env[key] = String(value);
        injectedCount += 1;
    }

    return injectedCount;
};

export async function loadSecrets() {
    try {
        const configuredServiceName = bootstrapSetting('APIGATEWAY_SERVICE_NAME')?.trim();
        if (configuredServiceName && configuredServiceName !== SERVICE_NAME) {
            throw new Error(`APIGATEWAY_SERVICE_NAME must be ${SERVICE_NAME}`);
        }

        const bootstrapToken = bootstrapSetting('BOOTSTRAP_TOKEN');
        if (!bootstrapToken || bootstrapToken.length < 32) {
            throw new Error('BOOTSTRAP_TOKEN missing in .env - cannot fetch secrets');
        }

        const endpoint = secretsEndpoint(bootstrapSetting('SECRETS_MANAGER_URL'));
        logger.info?.(`Fetching secrets for '${SERVICE_NAME}' from secrets-manager...`);

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Bootstrap-Token': bootstrapToken,
                    },
                    redirect: 'error',
                    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                });

                if (!response.ok) {
                    throw new Error(`Secrets manager responded with status ${response.status}`);
                }

                const injectedCount = injectAllowedSecrets(await readLimitedJson(response));
                logger.info?.(`Secrets loaded - ${injectedCount} gateway vars injected`, {
                    service: SERVICE_NAME,
                    attempt,
                });
                return;
            } catch (error) {
                logger.warn?.(`Secrets bootstrap attempt ${attempt}/${MAX_ATTEMPTS} failed`, {
                    error: error.name,
                });

                if (attempt === MAX_ATTEMPTS) {
                    throw new Error(`Failed to load ${SERVICE_NAME} secrets after ${MAX_ATTEMPTS} attempts`);
                }
                await sleep(500 * attempt);
            }
        }
    } finally {
        delete process.env.BOOTSTRAP_TOKEN;
        delete bootstrapFileEnv.BOOTSTRAP_TOKEN;
    }
}
