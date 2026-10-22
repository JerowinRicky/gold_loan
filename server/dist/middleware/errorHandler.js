import { ZodError } from 'zod';
export const errorHandler = (err, req, res, next) => {
    console.error('[Error Details]:', err);
    if (err instanceof ZodError) {
        const errorMap = {};
        err.errors.forEach((e) => {
            const field = e.path.join('.') || 'root';
            if (!errorMap[field])
                errorMap[field] = [];
            errorMap[field].push(e.message);
        });
        return res.status(400).json({
            success: false,
            message: 'Validation failed for one or more fields',
            error: 'VALIDATION_ERROR',
            errors: errorMap,
        });
    }
    // Handle Multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            error: 'UPLOAD_ERROR',
        });
    }
    // Handle Prisma known errors
    if (err.code === 'P2002') {
        const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
        return res.status(409).json({
            success: false,
            message: `A record with this ${target} already exists.`,
            error: 'DUPLICATE_ENTRY',
        });
    }
    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    const message = err.message || 'An unexpected internal error occurred';
    res.status(statusCode).json({
        success: false,
        message,
        error: err.code || 'SERVER_ERROR',
    });
};
