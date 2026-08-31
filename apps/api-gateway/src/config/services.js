import { ENV } from "../lib/env.js";

export const services = {
    Identity: {
        url: ENV.SERVICES_URL.IDENTITY,
        isHealthy: false,
        lastChecked: null,
        lastError: null
    }
}
