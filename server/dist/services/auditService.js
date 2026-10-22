import { prisma } from '../utils/prisma.js';
export class AuditService {
    static async log(params) {
        try {
            const oldValStr = params.oldValue
                ? typeof params.oldValue === 'object'
                    ? JSON.stringify(params.oldValue)
                    : String(params.oldValue)
                : null;
            const newValStr = params.newValue
                ? typeof params.newValue === 'object'
                    ? JSON.stringify(params.newValue)
                    : String(params.newValue)
                : null;
            await prisma.auditLog.create({
                data: {
                    userId: params.userId || null,
                    userName: params.userName || 'System',
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    oldValue: oldValStr,
                    newValue: newValStr,
                    ipAddress: params.ipAddress || null,
                },
            });
        }
        catch (err) {
            console.error('Failed to write audit log:', err);
        }
    }
}
