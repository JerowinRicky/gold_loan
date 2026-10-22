import { ReportService } from '../services/reportService.js';
import { prisma } from '../utils/prisma.js';
export class ReportController {
    static async getAdminDashboard(req, res, next) {
        try {
            const summary = await ReportService.getAdminDashboardSummary();
            res.json({
                success: true,
                data: summary,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getCustomerDashboard(req, res, next) {
        try {
            const customerId = req.user.role === 'CUSTOMER' ? req.user.id : req.query.customerId;
            const summary = await ReportService.getCustomerDashboardSummary(customerId);
            res.json({
                success: true,
                data: summary,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getReports(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const reports = await ReportService.getReports({ startDate, endDate });
            res.json({
                success: true,
                data: reports,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAuditLogs(req, res, next) {
        try {
            const entityType = req.query.entityType;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 25;
            const skip = (page - 1) * limit;
            const where = {};
            if (entityType && entityType !== 'ALL')
                where.entityType = entityType;
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
        }
        catch (err) {
            next(err);
        }
    }
}
