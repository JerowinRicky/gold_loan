import { GoldService } from '../services/goldService.js';
import { goldItemSchema } from '../validators/schemas.js';
export class GoldController {
    static async addGoldItem(req, res, next) {
        try {
            const loanId = req.params.loanId;
            const validated = goldItemSchema.parse(req.body);
            const item = await GoldService.addGoldItem(loanId, validated, req.user);
            res.status(201).json({
                success: true,
                message: 'Gold item added to loan',
                data: item,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async uploadImage(req, res, next) {
        try {
            const goldItemId = req.params.id;
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file uploaded',
                    error: 'FILE_REQUIRED',
                });
            }
            const fileUrl = `/uploads/gold/${req.file.filename}`;
            const imageType = req.body.imageType || 'FRONT';
            const image = await GoldService.attachImage(goldItemId, {
                url: fileUrl,
                filename: req.file.filename,
                imageType,
            }, req.user);
            res.status(201).json({
                success: true,
                message: 'Gold item image uploaded successfully',
                data: image,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async listInventory(req, res, next) {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const itemType = req.query.itemType;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const result = await GoldService.listInventory({ search, status, itemType, page, limit });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
