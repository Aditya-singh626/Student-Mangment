function authorizeRoles(...allowedRoles) {

    return (req, res, next) => {

        // Authentication middleware should run first
        if (!req.user) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }

        // Check user's role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        next();
    };
}

module.exports = authorizeRoles;