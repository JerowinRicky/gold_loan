import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { GoldService } from '../services/goldService.js';
import { goldItemSchema } from '../validators/schemas.js';

export class GoldController {
  public static async addGoldItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const loanId = req.params.loanId as string;
      const validated = goldItemSchema.parse(req.body);
      const item = await GoldService.addGoldItem(loanId, validated, req.user);
      res.status(201).json({
        success: true,
        message: 'Gold item added to loan',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const goldItemId = req.params.id as string;
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded',
          error: 'FILE_REQUIRED',
        });
      }

      const fileUrl = `/uploads/gold/${req.file.filename}`;
      const imageType = (req.body.imageType as string) || 'FRONT';

      const image = await GoldService.attachImage(
        goldItemId,
        {
          url: fileUrl,
          filename: req.file.filename,
          imageType,
        },
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Gold item image uploaded successfully',
        data: image,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const itemType = req.query.itemType as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await GoldService.listInventory({ search, status, itemType, page, limit });
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
