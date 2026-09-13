export const internalApiCallMiddleware = (options) => {

    const { secret, logger = console, header = "x-microservice-secret", } = options

    return (req, res, next) => {

        const incoming = req.headers[header];

        const isValid = incoming === secret;

        if (!isValid) {
            logger.warn("Blocked Internal API Call - Invalid Secret");
            return res.status(403).json({ message: "Forbidden" });
        }

        next();

    }
}