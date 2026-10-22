import { CustomerService } from '../services/customerService.js';
import { createCustomerSchema, updateProfileSchema } from '../validators/schemas.js';
export class CustomerController {
    static async createCustomer(req, res, next) {
        try {
            const validated = createCustomerSchema.parse(req.body);
            const result = await CustomerService.createCustomer(validated, req.user);
            res.status(201).json({
                success: true,
                message: 'Customer registered successfully',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async listCustomers(req, res, next) {
        try {
            const search = req.query.search;
            const filter = req.query.filter;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 15;
            const result = await CustomerService.listCustomers({ search, filter, page, limit });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getCustomer(req, res, next) {
        try {
            const id = req.params.id;
            // Allow customer to view their own profile, or admin to view any
            if (req.user?.role === 'CUSTOMER' && req.user.id !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only view your own profile.',
                    error: 'FORBIDDEN',
                });
            }
            const customer = await CustomerService.getCustomerById(id);
            res.json({
                success: true,
                data: customer,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const id = req.params.id || req.user.id;
            if (req.user?.role === 'CUSTOMER' && req.user.id !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                    error: 'FORBIDDEN',
                });
            }
            const validated = updateProfileSchema.parse(req.body);
            const updated = await CustomerService.updateProfile(id, validated, req.user);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
