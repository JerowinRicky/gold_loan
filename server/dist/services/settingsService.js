import { Decimal } from '../utils/decimal.js';
import { prisma } from '../utils/prisma.js';
import { AuditService } from './auditService.js';
export class SettingsService {
    static async getSettings() {
        let settings = await prisma.systemSetting.findFirst();
        if (!settings) {
            settings = await prisma.systemSetting.create({
                data: {
                    shopName: 'Sri Lakshmi Gold Finance & Loans',
                    shopAddress: 'Shop #4, Market Main Road, Commercial Complex, Bengaluru, Karnataka 560001',
                    shopPhone: '+91 98450 12345',
                    shopEmail: 'contact@lakshmigoldloans.in',
                    defaultInterestRate: new Decimal(2.0),
                    defaultDurationMonths: 6,
                    processingFeePercent: new Decimal(1.0),
                    slotDurationMinutes: 30,
                    workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat',
                    openingTime: '09:30',
                    closingTime: '18:30',
                },
            });
        }
        return {
            ...settings,
            defaultInterestRate: settings.defaultInterestRate.toString(),
            processingFeePercent: settings.processingFeePercent.toString(),
        };
    }
    static async updateSettings(data, adminUser) {
        const current = await this.getSettings();
        const updated = await prisma.systemSetting.update({
            where: { id: current.id },
            data: {
                shopName: data.shopName ?? current.shopName,
                shopAddress: data.shopAddress ?? current.shopAddress,
                shopPhone: data.shopPhone ?? current.shopPhone,
                shopEmail: data.shopEmail ?? current.shopEmail,
                defaultInterestRate: data.defaultInterestRate !== undefined ? new Decimal(data.defaultInterestRate) : undefined,
                defaultDurationMonths: data.defaultDurationMonths ?? current.defaultDurationMonths,
                processingFeePercent: data.processingFeePercent !== undefined ? new Decimal(data.processingFeePercent) : undefined,
                slotDurationMinutes: data.slotDurationMinutes ?? current.slotDurationMinutes,
                workingDays: data.workingDays ?? current.workingDays,
                openingTime: data.openingTime ?? current.openingTime,
                closingTime: data.closingTime ?? current.closingTime,
                upiEnabled: data.upiEnabled !== undefined ? data.upiEnabled : undefined,
                upiId: data.upiId !== undefined ? data.upiId : undefined,
                upiPhone: data.upiPhone !== undefined ? data.upiPhone : undefined,
                upiName: data.upiName !== undefined ? data.upiName : undefined,
                cashCollectionEnabled: data.cashCollectionEnabled !== undefined ? data.cashCollectionEnabled : undefined,
            },
        });
        await AuditService.log({
            userId: adminUser?.id,
            userName: adminUser?.name || 'Admin',
            action: 'UPDATE_SYSTEM_SETTINGS',
            entityType: 'SETTINGS',
            entityId: String(updated.id),
            oldValue: current,
            newValue: updated,
        });
        return {
            ...updated,
            defaultInterestRate: updated.defaultInterestRate.toString(),
            processingFeePercent: updated.processingFeePercent.toString(),
        };
    }
}
