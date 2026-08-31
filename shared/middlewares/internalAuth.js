import crypto from 'crypto';

export const createInternalAUthMiddleware = (options) => {

    const { secret, logger = console, header = "x-internal-secret", } = options
    return (req, res, next) => {

        const incoming = req.headers[header];

        const provided = Buffer.from(String(incoming || ''));
        const expected = Buffer.from(String(secret || ''));
        const isValid =
            provided.length === expected.length &&
            crypto.timingSafeEqual(provided, expected);

        if (!isValid) {
            logger.warn("Block internal Request")
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    }
}
