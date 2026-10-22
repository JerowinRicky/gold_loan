import { AuthService } from '../services/authService.js';
import { loginSchema, changePasswordSchema } from '../validators/schemas.js';
export class AuthController {
    static async adminLogin(req, res, next) {
        try {
            const validated = loginSchema.parse(req.body);
            const result = await AuthService.login(validated.identifier, validated.password, 'ADMIN');
            res.json({
                success: true,
                message: 'Admin login successful',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async customerLogin(req, res, next) {
        try {
            const validated = loginSchema.parse(req.body);
            const result = await AuthService.login(validated.identifier, validated.password);
            res.json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const validated = changePasswordSchema.parse(req.body);
            await AuthService.changePassword(req.user.id, validated.currentPassword, validated.newPassword);
            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getMe(req, res, next) {
        try {
            const user = await AuthService.getMe(req.user.id);
            res.json({
                success: true,
                data: user,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
