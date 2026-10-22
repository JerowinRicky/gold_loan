import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { SettingsService } from '../services/settingsService.js';
import { updateSettingsSchema } from '../validators/schemas.js';

export class SettingsController {
  public static async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = updateSettingsSchema.parse(req.body);
      const updated = await SettingsService.updateSettings(validated, req.user);
      res.json({
        success: true,
        message: 'Business settings updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

