import { timingSafeEqual } from 'node:crypto';
import { validateHeaderName } from 'node:http';

export const internalApiCallMiddleware = ({
    secret,
    logger = console,
    header = 'x-microservice-secret',
} = {}) => {
    if (typeof secret !== 'string' || secret.length < 32 || /\s/.test(secret)) {
        throw new Error('Internal service secret must contain at least 32 characters without whitespace');
    }
    validateHeaderName(header);
    const headerName = header.toLowerCase();
    const expected = Buffer.from(secret);

    return (req, res, next) => {
        const incoming = req.headers[headerName];
        let headerCount = 0;
        for (let i = 0; i < (req.rawHeaders?.length ?? 0); i += 2) {
            if (req.rawHeaders[i].toLowerCase() === headerName) headerCount++;
        }

        const isValid = headerCount <= 1 &&
            typeof incoming === 'string' &&
            Buffer.byteLength(incoming) === expected.length &&
            timingSafeEqual(Buffer.from(incoming), expected);

        if (!isValid) {
            logger.warn('Blocked Internal API Call - Invalid Secret');
            return res.status(403).json({ message: 'Forbidden' });
        }

        next();
    };
};
