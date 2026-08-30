import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function authenticate(req, res, next) {
  const token = req.headers['x-bootstrap-token'];

  if (!token) {

    logger.warn('Secret fetch rejected — no bootstrap token', {
      ip: clientIp(req),
      path: req.path,
    });

    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // here token is provided by user
  const provided = Buffer.from(token);

  // here token take from env
  const expected = Buffer.from(env.BOOTSTRAP_TOKEN);

  // here check both is equal or not
  const isValid = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);


  if (!isValid) {
    logger.warn('Secret fetch rejected — invalid bootstrap token', {
      ip: clientIp(req),
      serviceName: req.params.serviceName,
    });
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
}
