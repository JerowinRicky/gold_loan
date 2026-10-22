import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'goldloan_production_jwt_secret_key_secure_2026';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token required',
            error: 'UNAUTHORIZED',
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            customerId: decoded.customerId,
            name: decoded.name,
            email: decoded.email,
            phone: decoded.phone,
            role: decoded.role,
            mustChangePassword: decoded.mustChangePassword,
        };
        next();
    }
    catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired session token',
            error: 'FORBIDDEN',
        });
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED',
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: insufficient permissions',
                error: 'FORBIDDEN',
            });
        }
        next();
    };
};
