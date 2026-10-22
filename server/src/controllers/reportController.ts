import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ReportService } from '../services/reportService.js';
import { AuditService } from '../services/auditService.js';
import { prisma } from '../utils/prisma.js';

export class ReportController {
  public static async getAdminDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await ReportService.getAdminDashboardSummary();
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getCustomerDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.role === 'CUSTOMER' ? req.user!.id : (req.query.customerId as string);
      const summary = await ReportService.getCustomerDashboardSummary(customerId);
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const reports = await ReportService.getReports({ startDate, endDate });
      res.json({
        success: true,
        data: reports,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entityType = req.query.entityType as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (entityType && entityType !== 'ALL') where.entityType = entityType;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

