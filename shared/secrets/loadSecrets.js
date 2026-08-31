export async function loadSecretsFromManager({ secretsManagerUrl, bootstrapToken, serviceName, logger = console, maxRetries = 5, retryDelay = 3000, fetchFn = globalThis.fetch, }) {
    if (!bootstrapToken) {
        throw new Error('BOOTSTRAP_TOKEN missing in .env - cannot fetch secrets');
    }

    logger.info?.(`Fetching secrets for '${serviceName}' from secrets-manager...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetchFn(
                `${secretsManagerUrl}/api/v1/secrets/${serviceName}`,
                {
                    method: 'GET',
                    headers: {
                        'X-Bootstrap-Token': bootstrapToken,
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(8000),
                }
            );

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(`Secrets manager responded ${response.status}: ${body.message || 'unknown'}`);
            }

            const { secrets } = await response.json();

            if (!secrets || typeof secrets !== 'object') {
                throw new Error('Invalid secrets payload received');
            }

            let injectedCount = 0;
            for (const [key, value] of Object.entries(secrets)) {
                if (!process.env[key]) {
                    process.env[key] = value;
                    injectedCount++;
                }
            }

            logger.info?.(`Secrets loaded - ${injectedCount} vars injected`, {
                service: serviceName,
                attempt,
            });
            return;

        } catch (err) {
            logger.warn?.(`Attempt ${attempt}/${maxRetries} failed: ${err.message}`);

            if (attempt === maxRetries) {
                throw new Error(
                    `Failed to load secrets after ${maxRetries} attempts. Is secrets-manager running?`
                );
            }

            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }
}
