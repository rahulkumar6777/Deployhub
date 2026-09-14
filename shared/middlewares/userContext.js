export default (req, res, next) => {
    const userHeader = req.headers["x-user-context"];

    if (!userHeader) {
        return res.status(401).json({ message: "User context missing" });
    }

    try {
        req.user = JSON.parse(userHeader);
        next();
    } catch (err) {
        return res.status(400).json({ message: "Invalid user context" });
    }
};