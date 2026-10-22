import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { AuditService } from './auditService.js';
import { LoanCalculationService } from './loanCalculationService.js';
export class CustomerService {
    /**
     * Create a new customer with auto-generated Customer ID and temporary password
     */
    static async createCustomer(data, adminUser) {
        // Check if phone or email already exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ phone: data.phone }, { email: data.email }],
            },
        });
        if (existing) {
            if (existing.phone === data.phone) {
                throw new Error('A customer with this phone number already exists.');
            }
            throw new Error('A customer with this email address already exists.');
        }
        // Auto-generate customer ID: CUST-100X
        const lastUser = await prisma.user.findFirst({
            where: { customerId: { not: null } },
            orderBy: { createdAt: 'desc' },
            select: { customerId: true },
        });
        let nextNumber = 1001;
        if (lastUser?.customerId && lastUser.customerId.startsWith('CUST-')) {
            const parsed = parseInt(lastUser.customerId.replace('CUST-', ''), 10);
            if (!isNaN(parsed)) {
                nextNumber = parsed + 1;
            }
        }
        const customerId = `CUST-${nextNumber}`;
        // Generate temporary password
        const tempPassword = `Gold@${data.phone.slice(-4)}`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const newUser = await prisma.user.create({
            data: {
                customerId,
                name: data.name,
                phone: data.phone,
                email: data.email,
                passwordHash,
                role: 'CUSTOMER',
                status: 'ACTIVE',
                mustChangePassword: true, // Force change on first login as required
                profile: {
                    create: {
                        dateOfBirth: data.dateOfBirth,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        pincode: data.pincode,
                        idType: data.idType,
                        idNumber: data.idNumber,
                        idDocument: data.idDocument,
                    },
                },
            },
            include: {
                profile: true,
            },
        });
        await AuditService.log({
            userId: adminUser?.id,
            userName: adminUser?.name || 'Admin',
            action: 'CREATE_CUSTOMER',
            entityType: 'CUSTOMER',
            entityId: newUser.id,
            newValue: { customerId, name: data.name, phone: data.phone },
        });
        return {
            customer: newUser,
            temporaryPassword: tempPassword,
        };
    }
    /**
     * List customers with search, status filters, and pagination
     */
    static async listCustomers(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, Math.min(100, params.limit || 15));
        const skip = (page - 1) * limit;
        const where = {
            role: 'CUSTOMER',
            deletedAt: null,
        };
        if (params.search) {
            const q = params.search.trim();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { customerId: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (params.filter === 'ACTIVE') {
            where.status = 'ACTIVE';
        }
        else if (params.filter === 'INACTIVE') {
            where.status = 'INACTIVE';
        }
        else if (params.filter === 'HAS_LOAN') {
            where.loans = { some: { status: { in: ['ACTIVE', 'OVERDUE'] } } };
        }
        else if (params.filter === 'NO_LOAN') {
            where.loans = { none: { status: { in: ['ACTIVE', 'OVERDUE'] } } };
        }
        const [total, customers] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    profile: true,
                    loans: {
                        where: { deletedAt: null },
                        include: {
                            payments: { where: { status: 'SUCCESS' } },
                        },
                    },
                    payments: {
                        where: { status: 'SUCCESS' },
                        orderBy: { paidAt: 'desc' },
                        take: 1,
                    },
                },
            }),
        ]);
        // Augment with financial summary
        const formatted = customers.map((c) => {
            const activeLoans = c.loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
            let totalOutstanding = 0;
            for (const loan of activeLoans) {
                const sum = LoanCalculationService.calculateLoanSummary({
                    loanAmount: loan.loanAmount.toString(),
                    interestRate: loan.interestRate.toString(),
                    durationMonths: loan.durationMonths,
                    startDate: loan.startDate,
                    maturityDate: loan.maturityDate,
                    status: loan.status,
                }, loan.payments.map((p) => ({
                    amount: p.amount.toString(),
                    principalComponent: p.principalComponent.toString(),
                    interestComponent: p.interestComponent.toString(),
                    status: p.status,
                    paidAt: p.paidAt,
                })));
                totalOutstanding += parseFloat(sum.totalOutstanding);
            }
            return {
                id: c.id,
                customerId: c.customerId,
                name: c.name,
                phone: c.phone,
                email: c.email,
                status: c.status,
                createdAt: c.createdAt,
                activeLoansCount: activeLoans.length,
                totalOutstanding: totalOutstanding.toFixed(2),
                lastPayment: c.payments[0]
                    ? {
                        amount: c.payments[0].amount.toString(),
                        paidAt: c.payments[0].paidAt || c.payments[0].createdAt,
                    }
                    : null,
            };
        });
        return {
            customers: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get single customer by ID
     */
    static async getCustomerById(id) {
        const customer = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                loans: {
                    where: { deletedAt: null },
                    include: {
                        goldItems: { include: { images: true } },
                        payments: { where: { status: 'SUCCESS' } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                appointments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });
        if (!customer)
            throw new Error('Customer not found');
        return customer;
    }
    /**
     * Update customer basic profile (by customer or admin)
     */
    static async updateProfile(userId, data, performingUser) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user)
            throw new Error('User not found');
        if (data.email && data.email !== user.email) {
            const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
            if (emailExists)
                throw new Error('Email address is already in use.');
        }
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                email: data.email || user.email,
                profile: {
                    upsert: {
                        create: {
                            address: data.address,
                            city: data.city,
                            state: data.state,
                            pincode: data.pincode,
                        },
                        update: {
                            address: data.address ?? user.profile?.address,
                            city: data.city ?? user.profile?.city,
                            state: data.state ?? user.profile?.state,
                            pincode: data.pincode ?? user.profile?.pincode,
                        },
                    },
                },
            },
            include: { profile: true },
        });
        await AuditService.log({
            userId: performingUser?.id || userId,
            userName: performingUser?.name || user.name,
            action: 'UPDATE_CUSTOMER_PROFILE',
            entityType: 'CUSTOMER',
            entityId: userId,
            oldValue: { email: user.email, address: user.profile?.address },
            newValue: { email: updated.email, address: updated.profile?.address },
        });
        return updated;
    }
}
