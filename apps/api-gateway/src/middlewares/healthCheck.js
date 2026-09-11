import axios from "axios";
import { services } from "../config/services.js";
import { print as logger } from "../../../../shared/utils/print.js";
import { sendServiceHealthAlert } from "../utils/mail.js";


const HEALTH_CHECK_INTERVAL_MS = 30000;

const sendHealthAlert = async ({ serviceName, status, service, error }) => {
    try {
        await sendServiceHealthAlert({
            serviceName,
            status,
            url: service.url,
            error,
            checkedAt: service.lastChecked,
        });
    } catch (mailError) {
        logger.error({
            service: serviceName,
            status,
            error: mailError.message,
            type: 'health_alert'
        }, 'Failed to send service health alert');
    }
};

export const checkHealth = async () => {
    await Promise.all(
        Object.entries(services).map(async ([name, service]) => {
            const hasPreviousCheck = service.lastChecked !== null;
            const previousStatus = service.isHealthy;

            try {

                await axios.get(`${service.url}/health`, { timeout: 3000 });

                services[name].isHealthy = true;
                services[name].lastError = null;
                services[name].lastChecked = new Date();

                if (hasPreviousCheck && !previousStatus) {
                    logger.info({
                        service: name,
                        status: 'up',
                        type: 'health_check'
                    }, 'Service is back UP');

                    await sendHealthAlert({
                        serviceName: name,
                        status: 'up',
                        service: services[name],
                    });
                }
            } catch (error) {
                services[name].isHealthy = false;
                services[name].lastError = error.message;
                services[name].lastChecked = new Date();

                if (hasPreviousCheck && previousStatus) {
                    logger.warn({
                        service: name,
                        status: 'down',
                        error: error.message,
                        type: 'health_check'
                    }, 'Service went DOWN');

                    await sendHealthAlert({
                        serviceName: name,
                        status: 'down',
                        service: services[name],
                        error: error.message,
                    });
                }
            }
        })
    );
};

export const startHealthCheck = async () => {
    await checkHealth();
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
    return interval;
}

export const checkHealthMiddleware = (serviceName) => {
    return async (req, res, next) => {
        const service = services[serviceName];

        if (!service) {
            logger.error({ service: serviceName }, 'Unknown service configured in route');
            return res.status(500).json({
                success: false,
                message: 'Service is not configured'
            });
        }

        if (!service.isHealthy) {
            res.setHeader('Retry-After', String(HEALTH_CHECK_INTERVAL_MS / 1000));
            res.setHeader('Cache-Control', 'no-store');
            return res.status(503).json({
                success: false,
                message: 'Service is currently unavailable',
                traceId: req.traceId
            })
        }

        next();
    }
}
