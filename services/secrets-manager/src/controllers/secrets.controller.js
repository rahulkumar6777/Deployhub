import { logger } from '../config/logger.js';
import { getSecretsForService } from '../services/secretsRegistry.service.js';


export const fetchSecrets = async (req, res) => {

  const { serviceName } = req.params;
  try {


    const bundle = getSecretsForService(serviceName);
    if (!bundle) {
      logger.warn('Unknown service requested secrets', { serviceName });
      return res.status(404).json({
        success: false,
        message: `Service '${serviceName}' is not registered`
      });
    }

    return res.status(200).json({
      success: true, secrets: bundle
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch secrets'
    });
  }
};