import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AuthService } from '../services/authService.js';
import { loginSchema, changePasswordSchema } from '../validators/schemas.js';

export class AuthController {
  public static async adminLogin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated.identifier, validated.password, 'ADMIN');
      res.json({
        success: true,
        message: 'Admin login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async customerLogin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated.identifier, validated.password);
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = changePasswordSchema.parse(req.body);
      await AuthService.changePassword(req.user!.id, validated.currentPassword, validated.newPassword);
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);
      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}

