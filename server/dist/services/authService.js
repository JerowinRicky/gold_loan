import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { AuditService } from './auditService.js';
const JWT_SECRET = process.env.JWT_SECRET || 'goldloan_production_jwt_secret_key_secure_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export class AuthService {
    static async login(identifier, pass, expectedRole) {
        // Customers can login with phone or customerId or email; Admin logs in with email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier },
                    { customerId: identifier },
                ],
                deletedAt: null,
            },
            include: {
                profile: true,
            },
        });
        if (!user) {
            throw new Error('Invalid credentials. User not found.');
        }
        if (user.status !== 'ACTIVE') {
            throw new Error(`Your account status is ${user.status.toLowerCase()}. Please contact the administrator.`);
        }
        if (expectedRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF') {
            throw new Error('Access denied: Admin credentials required.');
        }
        const isValidPassword = await bcrypt.compare(pass, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid password.');
        }
        const token = jwt.sign({
            id: user.id,
            customerId: user.customerId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        await AuditService.log({
            userId: user.id,
            userName: user.name,
            action: 'USER_LOGIN',
            entityType: 'AUTH',
            entityId: user.id,
            newValue: { role: user.role, method: 'PASSWORD' },
        });
        return {
            token,
            user: {
                id: user.id,
                customerId: user.customerId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
                createdAt: user.createdAt,
                profile: user.profile,
            },
        };
    }
    static async changePassword(userId, currentPass, newPass) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found.');
        const isValid = await bcrypt.compare(currentPass, user.passwordHash);
        if (!isValid)
            throw new Error('Incorrect current password.');
        const hashed = await bcrypt.hash(newPass, 10);
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashed,
                mustChangePassword: false,
            },
        });
        await AuditService.log({
            userId: user.id,
            userName: user.name,
            action: 'PASSWORD_CHANGE',
            entityType: 'AUTH',
            entityId: user.id,
        });
        return { success: true };
    }
    static async getMe(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
            },
        });
        if (!user)
            throw new Error('User not found.');
        return {
            id: user.id,
            customerId: user.customerId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
            createdAt: user.createdAt,
            profile: user.profile,
        };
    }
}
