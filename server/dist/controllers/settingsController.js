import { SettingsService } from '../services/settingsService.js';
import { updateSettingsSchema } from '../validators/schemas.js';
export class SettingsController {
    static async getSettings(req, res, next) {
        try {
            const settings = await SettingsService.getSettings();
            res.json({
                success: true,
                data: settings,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateSettings(req, res, next) {
        try {
            const validated = updateSettingsSchema.parse(req.body);
            const updated = await SettingsService.updateSettings(validated, req.user);
            res.json({
                success: true,
                message: 'Business settings updated successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
