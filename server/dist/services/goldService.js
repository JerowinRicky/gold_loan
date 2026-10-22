import { Decimal } from '../utils/decimal.js';
import { prisma } from '../utils/prisma.js';
import { AuditService } from './auditService.js';
export class GoldService {
    /**
     * Add a gold item to an existing loan
     */
    static async addGoldItem(loanId, data, adminUser) {
        const loan = await prisma.loan.findUnique({ where: { id: loanId } });
        if (!loan)
            throw new Error('Loan not found');
        const item = await prisma.goldItem.create({
            data: {
                loanId,
                itemType: data.itemType,
                description: data.description,
                grossWeight: new Decimal(data.grossWeight),
                netWeight: new Decimal(data.netWeight),
                purity: data.purity,
                estimatedValue: new Decimal(data.estimatedValue),
                loanValue: new Decimal(data.loanValue),
                status: 'PLEDGED',
                notes: data.notes || null,
                images: data.imageUrls?.length
                    ? {
                        create: data.imageUrls.map((url, i) => ({
                            fileUrl: url,
                            fileName: `gold-item-${Date.now()}-${i}.jpg`,
                            imageType: i === 0 ? 'FRONT' : 'CLOSEUP',
                        })),
                    }
                    : undefined,
            },
            include: { images: true },
        });
        await AuditService.log({
            userId: adminUser?.id,
            userName: adminUser?.name || 'Admin',
            action: 'ADD_GOLD_ITEM',
            entityType: 'GOLD_ITEM',
            entityId: item.id,
            newValue: {
                loanNumber: loan.loanNumber,
                itemType: data.itemType,
                netWeight: data.netWeight,
                purity: data.purity,
            },
        });
        return item;
    }
    /**
     * Attach uploaded image to a gold item
     */
    static async attachImage(goldItemId, file, adminUser) {
        const goldItem = await prisma.goldItem.findUnique({ where: { id: goldItemId } });
        if (!goldItem)
            throw new Error('Gold item not found');
        const image = await prisma.goldImage.create({
            data: {
                goldItemId,
                fileUrl: file.url,
                fileName: file.filename,
                imageType: file.imageType || 'FRONT',
            },
        });
        await AuditService.log({
            userId: adminUser?.id,
            userName: adminUser?.name || 'Admin',
            action: 'UPLOAD_GOLD_IMAGE',
            entityType: 'GOLD_ITEM',
            entityId: goldItemId,
            newValue: { fileUrl: file.url, imageType: file.imageType },
        });
        return image;
    }
    /**
     * List all gold inventory (pledged, released, or auctioned)
     */
    static async listInventory(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, Math.min(100, params.limit || 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status && params.status !== 'ALL')
            where.status = params.status;
        if (params.itemType && params.itemType !== 'ALL')
            where.itemType = params.itemType;
        if (params.search) {
            const q = params.search.trim();
            where.OR = [
                { description: { contains: q, mode: 'insensitive' } },
                { itemType: { contains: q, mode: 'insensitive' } },
                { purity: { contains: q, mode: 'insensitive' } },
                { loan: { loanNumber: { contains: q, mode: 'insensitive' } } },
                { loan: { customer: { name: { contains: q, mode: 'insensitive' } } } },
            ];
        }
        const [total, items] = await Promise.all([
            prisma.goldItem.count({ where }),
            prisma.goldItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    images: true,
                    loan: {
                        select: {
                            id: true,
                            loanNumber: true,
                            status: true,
                            customer: {
                                select: { id: true, name: true, phone: true, customerId: true },
                            },
                        },
                    },
                },
            }),
        ]);
        return {
            items: items.map((i) => ({
                ...i,
                grossWeight: i.grossWeight.toString(),
                netWeight: i.netWeight.toString(),
                estimatedValue: i.estimatedValue.toString(),
                loanValue: i.loanValue.toString(),
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
