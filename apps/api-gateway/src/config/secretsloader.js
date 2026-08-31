import dotenv from 'dotenv';
import { print as logger } from '../../../../shared/utils/print.js';
import { loadSecretsFromManager } from '../../../../shared/secrets/loadSecrets.js';


dotenv.config();

const SECRETS_MANAGER_URL = process.env.SECRETS_MANAGER_URL;
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_TOKEN;
const SERVICE_NAME = process.env.APIGATEWAY_SERVICE_NAME;

export async function loadSecrets() {
    return loadSecretsFromManager({
        secretsManagerUrl: SECRETS_MANAGER_URL,
        bootstrapToken: BOOTSTRAP_TOKEN,
        serviceName: SERVICE_NAME,
        logger,
    });
}
