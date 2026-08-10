const jwt = require("jsonwebtoken");
require("dotenv").config();

function authMiddleware(req, res, next) {

    const header = req.headers.authorization;

    // Check Authorization header
    if (!header) {
        return res.status(401).json({
            error: "Missing authorization header"
        });
    }

    // Expected format:
    // Authorization: Bearer <token>

    const parts = header.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            error: "Invalid authorization format"
        });
    }

    const token = parts[1];

    try {

        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store decoded JWT information
        req.user = payload;

        next();

    } catch (err) {

        console.error("JWT verification error:", err.message);

        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
}

module.exports = authMiddleware;