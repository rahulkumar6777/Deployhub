import dotenv from 'dotenv';
import { print as logger } from '../../../../shared/utils/print.js';
import { loadSecretsFromManager } from '../../../../shared/secrets/loadSecrets.js';

dotenv.config();

const SECRETS_MANAGER_URL = process.env.SECRETS_MANAGER_URL;
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_TOKEN;
const SERVICE_NAME = process.env.DEPLOY_DYNAMIC_NODE_AGENT_SERVICE_NAME;

export async function loadSecrets() {
    if (!SECRETS_MANAGER_URL) {
        throw new Error('SECRETS_MANAGER_URL is missing');
    }
    if (!BOOTSTRAP_TOKEN) {
        throw new Error('BOOTSTRAP_TOKEN is missing');
    }

    if (!SERVICE_NAME) {
        throw new Error('SERVICE_NAME is missing');
    }

    return loadSecretsFromManager({
        secretsManagerUrl: SECRETS_MANAGER_URL,
        bootstrapToken: BOOTSTRAP_TOKEN,
        serviceName: SERVICE_NAME,
        logger,
    });
}
