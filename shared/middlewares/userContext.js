export default (req, res, next) => {
    const userHeader = req.headers["x-user-context"];

    if (!userHeader) {
        return res.status(401).json({ message: "User context missing" });
    }

    let user;
    try {
        user = JSON.parse(userHeader);
    } catch {
        return res.status(400).json({ message: "Invalid user context" });
    }

    if (
        !user ||
        typeof user !== 'object' ||
        typeof user._id !== 'string' ||
        typeof user.tokenId !== 'string' ||
        !user._id ||
        !user.tokenId
    ) {
        return res.status(400).json({ message: "Invalid user context" });
    }

    req.user = Object.freeze({ _id: user._id, tokenId: user.tokenId });
    return next();
};
