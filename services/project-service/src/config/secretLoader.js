import dotenv from 'dotenv';
import { loadSecretsFromManager } from "../../../../shared/secrets/loadSecrets.js";
import { print as logger } from '../../../../shared/utils/print.js';


dotenv.config();

const SECRET_MANAGER_URL = process.env.SECRETS_MANAGER_URL
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_TOKEN
const SERVICE_NAME = process.env.PROJECT_SERVICE_NAME

export function loadSecret(params) {
    return loadSecretsFromManager({
        secretsManagerUrl: SECRET_MANAGER_URL,
        bootstrapToken: BOOTSTRAP_TOKEN,
        serviceName: SERVICE_NAME,
        logger: logger
    })
};