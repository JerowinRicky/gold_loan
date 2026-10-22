import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma.js';
import { Decimal } from '../utils/decimal.js';
import { LoanCalculationService } from '../services/loanCalculationService.js';
async function seed() {
    console.log('--- Starting Gold Loan Management System Seeding ---');
    // Ensure uploads directory exists
    const uploadGoldDir = path.resolve(process.cwd(), 'uploads/gold');
    if (!fs.existsSync(uploadGoldDir)) {
        fs.mkdirSync(uploadGoldDir, { recursive: true });
    }
    // Create sample SVG images for gold items if not present
    const sampleImages = [
        { name: 'gold-chain-front.svg', label: '22K Hallmarked Gold Chain (18.42g)' },
        { name: 'gold-ring-closeup.svg', label: '22K Traditional Gold Ring (6.8g)' },
        { name: 'gold-bangles.svg', label: '22K Intricate Bangles Pair (32.5g)' },
        { name: 'gold-necklace.svg', label: '22K Wedding Bridal Necklace (45.0g)' },
        { name: 'gold-coin-24k.svg', label: '24K (999) Pure Gold Bullion Coin (10.0g)' },
    ];
    for (const img of sampleImages) {
        const filePath = path.join(uploadGoldDir, img.name);
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <radialGradient id="gGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFF2B2"/>
          <stop offset="50%" stop-color="#E5A93C"/>
          <stop offset="100%" stop-color="#9C6B16"/>
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="#2E2315"/>
      <rect x="20" y="20" width="360" height="260" rx="10" fill="#1C140A" stroke="#E5A93C" stroke-width="2"/>
      <circle cx="200" cy="130" r="70" fill="url(#gGrad)" stroke="#664406" stroke-width="3"/>
      <circle cx="200" cy="130" r="55" fill="none" stroke="#FFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>
      <text x="200" y="140" font-family="sans-serif" font-size="28" font-weight="bold" fill="#3D2604" text-anchor="middle">916</text>
      <text x="200" y="240" font-family="sans-serif" font-size="14" font-weight="600" fill="#F4EBDD" text-anchor="middle">${img.label}</text>
    </svg>`;
        fs.writeFileSync(filePath, svgContent, 'utf-8');
    }
    // 1. Clean existing records
    console.log('Cleaning existing records...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.availabilitySlot.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.paymentSchedule.deleteMany();
    await prisma.goldImage.deleteMany();
    await prisma.goldItem.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemSetting.deleteMany();
    // 2. System Settings
    console.log('Creating System Settings...');
    await prisma.systemSetting.create({
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
    // 3. Admin User
    console.log('Creating Admin User...');
    const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
    const adminUser = await prisma.user.create({
        data: {
            name: 'Owner Admin',
            email: 'admin@example.com',
            phone: '9845012345',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            mustChangePassword: false,
        },
    });
    // 4. Create 5 Customers
    console.log('Creating 5 Customers...');
    const customersData = [
        {
            customerId: 'CUST-1001',
            name: 'Rahul Kumar',
            email: 'rahul.kumar@example.com',
            phone: '9876543210',
            dob: '1988-04-12',
            address: '#142, 3rd Cross, Rajajinagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560010',
            idType: 'AADHAAR',
            idNumber: '4829-1234-5678',
            password: 'Gold@3210',
        },
        {
            customerId: 'CUST-1002',
            name: 'Anjali Sharma',
            email: 'anjali.sharma@example.com',
            phone: '9876543211',
            dob: '1992-09-24',
            address: '#45, Temple Street, Malleshwaram',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560003',
            idType: 'PAN',
            idNumber: 'ABCPS1234K',
            password: 'Gold@3211',
        },
        {
            customerId: 'CUST-1003',
            name: 'Arun Patel',
            email: 'arun.patel@example.com',
            phone: '9876543212',
            dob: '1985-01-15',
            address: '#89, Gandhi Bazaar, Basavanagudi',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560004',
            idType: 'AADHAAR',
            idNumber: '9821-4321-8765',
            password: 'Gold@3212',
        },
        {
            customerId: 'CUST-1004',
            name: 'Priya Verma',
            email: 'priya.verma@example.com',
            phone: '9876543213',
            dob: '1995-11-03',
            address: '#12, 1st Main, Jayanagar 4th Block',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560041',
            idType: 'VOTER_ID',
            idNumber: 'KA-04-129481',
            password: 'Gold@3213',
        },
        {
            customerId: 'CUST-1005',
            name: 'Suresh Reddy',
            email: 'suresh.reddy@example.com',
            phone: '9876543214',
            dob: '1979-07-29',
            address: '#56, 80ft Road, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            idType: 'DRIVING_LICENSE',
            idNumber: 'KA0320150012345',
            password: 'Gold@3214',
        },
    ];
    const createdCustomers = [];
    for (const c of customersData) {
        const hash = await bcrypt.hash(c.password, 10);
        const u = await prisma.user.create({
            data: {
                customerId: c.customerId,
                name: c.name,
                email: c.email,
                phone: c.phone,
                passwordHash: hash,
                role: 'CUSTOMER',
                status: 'ACTIVE',
                mustChangePassword: false,
                profile: {
                    create: {
                        dateOfBirth: c.dob,
                        address: c.address,
                        city: c.city,
                        state: c.state,
                        pincode: c.pincode,
                        idType: c.idType,
                        idNumber: c.idNumber,
                    },
                },
            },
        });
        createdCustomers.push(u);
    }
    // 5. Create 5 Gold Loans
    console.log('Creating 5 Gold Loans with pledge items & schedules...');
    const now = new Date();
    const year = now.getFullYear();
    // Loan 1: Rahul Kumar (Active, ₹50,000, 2% monthly)
    const l1Start = new Date(now.getFullYear(), now.getMonth() - 2, 10);
    const l1Mat = new Date(l1Start);
    l1Mat.setMonth(l1Mat.getMonth() + 6);
    const l1Schedules = LoanCalculationService.generatePaymentSchedule(50000, 2.0, 6, l1Start);
    const loan1 = await prisma.loan.create({
        data: {
            loanNumber: `GL-${year}-00101`,
            customerId: createdCustomers[0].id,
            loanAmount: new Decimal(50000),
            interestRate: new Decimal(2.0),
            interestType: 'MONTHLY_SIMPLE',
            durationMonths: 6,
            startDate: l1Start,
            maturityDate: l1Mat,
            processingFee: new Decimal(500),
            status: 'ACTIVE',
            notes: 'Customer pledged traditional gold chain. All purity hallmarked 916.',
            goldItems: {
                create: [
                    {
                        itemType: 'Gold Chain',
                        description: '22K Hallmarked curb chain with hook lock',
                        grossWeight: new Decimal(18.42),
                        netWeight: new Decimal(17.95),
                        purity: '22K (916)',
                        estimatedValue: new Decimal(195000),
                        loanValue: new Decimal(135000),
                        status: 'PLEDGED',
                        images: {
                            create: [
                                {
                                    fileUrl: '/uploads/gold/gold-chain-front.svg',
                                    fileName: 'gold-chain-front.svg',
                                    imageType: 'FRONT',
                                },
                            ],
                        },
                    },
                    {
                        itemType: 'Gold Ring',
                        description: '22K Men\'s signet ring with engraved design',
                        grossWeight: new Decimal(7.2),
                        netWeight: new Decimal(6.8),
                        purity: '22K (916)',
                        estimatedValue: new Decimal(74000),
                        loanValue: new Decimal(52000),
                        status: 'PLEDGED',
                        images: {
                            create: [
                                {
                                    fileUrl: '/uploads/gold/gold-ring-closeup.svg',
                                    fileName: 'gold-ring-closeup.svg',
                                    imageType: 'CLOSEUP',
                                },
                            ],
                        },
                    },
                ],
            },
            paymentSchedules: {
                create: l1Schedules.map((s, idx) => ({
                    dueDate: s.dueDate,
                    principalAmount: new Decimal(s.principalAmount),
                    interestAmount: new Decimal(s.interestAmount),
                    totalDue: new Decimal(s.totalDue),
                    paidAmount: idx < 2 ? new Decimal(s.interestAmount) : new Decimal(0),
                    status: idx < 2 ? 'PAID' : 'PENDING',
                })),
            },
        },
    });
    // Payments for Loan 1
    await prisma.payment.createMany({
        data: [
            {
                receiptNumber: `RCP-${year}-00101`,
                loanId: loan1.id,
                customerId: createdCustomers[0].id,
                amount: new Decimal(1000),
                interestComponent: new Decimal(1000),
                paymentType: 'INTEREST_ONLY',
                paymentMethod: 'UPI',
                gatewayOrderId: 'order_seed_001',
                gatewayPaymentId: 'pay_seed_001',
                status: 'SUCCESS',
                paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 10),
            },
            {
                receiptNumber: `RCP-${year}-00102`,
                loanId: loan1.id,
                customerId: createdCustomers[0].id,
                amount: new Decimal(1000),
                interestComponent: new Decimal(1000),
                paymentType: 'INTEREST_ONLY',
                paymentMethod: 'CASH',
                receivedBy: 'Staff Counter',
                status: 'SUCCESS',
                paidAt: new Date(now.getFullYear(), now.getMonth(), 10),
            },
        ],
    });
    // Loan 2: Anjali Sharma (Active, ₹85,000, 1.8% monthly)
    const l2Start = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const l2Mat = new Date(l2Start);
    l2Mat.setMonth(l2Mat.getMonth() + 6);
    const l2Schedules = LoanCalculationService.generatePaymentSchedule(85000, 1.8, 6, l2Start);
    await prisma.loan.create({
        data: {
            loanNumber: `GL-${year}-00102`,
            customerId: createdCustomers[1].id,
            loanAmount: new Decimal(85000),
            interestRate: new Decimal(1.8),
            interestType: 'MONTHLY_SIMPLE',
            durationMonths: 6,
            startDate: l2Start,
            maturityDate: l2Mat,
            processingFee: new Decimal(850),
            status: 'ACTIVE',
            goldItems: {
                create: [
                    {
                        itemType: 'Gold Bangles',
                        description: 'Pair of 22K floral embossed bangles',
                        grossWeight: new Decimal(33.0),
                        netWeight: new Decimal(32.5),
                        purity: '22K (916)',
                        estimatedValue: new Decimal(350000),
                        loanValue: new Decimal(245000),
                        status: 'PLEDGED',
                        images: {
                            create: [
                                {
                                    fileUrl: '/uploads/gold/gold-bangles.svg',
                                    fileName: 'gold-bangles.svg',
                                    imageType: 'FRONT',
                                },
                            ],
                        },
                    },
                ],
            },
            paymentSchedules: {
                create: l2Schedules.map((s) => ({
                    dueDate: s.dueDate,
                    principalAmount: new Decimal(s.principalAmount),
                    interestAmount: new Decimal(s.interestAmount),
                    totalDue: new Decimal(s.totalDue),
                    paidAmount: new Decimal(0),
                    status: 'PENDING',
                })),
            },
        },
    });
    // Loan 3: Arun Patel (Overdue, ₹1,20,000, 2.0% monthly)
    const l3Start = new Date(now.getFullYear(), now.getMonth() - 7, 5);
    const l3Mat = new Date(l3Start);
    l3Mat.setMonth(l3Mat.getMonth() + 6);
    const l3Schedules = LoanCalculationService.generatePaymentSchedule(120000, 2.0, 6, l3Start);
    await prisma.loan.create({
        data: {
            loanNumber: `GL-${year}-00103`,
            customerId: createdCustomers[2].id,
            loanAmount: new Decimal(120000),
            interestRate: new Decimal(2.0),
            interestType: 'MONTHLY_SIMPLE',
            durationMonths: 6,
            startDate: l3Start,
            maturityDate: l3Mat,
            processingFee: new Decimal(1200),
            status: 'OVERDUE',
            notes: 'Maturity period passed without final renewal. Payment reminder sent.',
            goldItems: {
                create: [
                    {
                        itemType: 'Gold Necklace',
                        description: '22K Royal choker necklace with earrings',
                        grossWeight: new Decimal(46.2),
                        netWeight: new Decimal(45.0),
                        purity: '22K (916)',
                        estimatedValue: new Decimal(490000),
                        loanValue: new Decimal(340000),
                        status: 'PLEDGED',
                        images: {
                            create: [
                                {
                                    fileUrl: '/uploads/gold/gold-necklace.svg',
                                    fileName: 'gold-necklace.svg',
                                    imageType: 'FRONT',
                                },
                            ],
                        },
                    },
                ],
            },
            paymentSchedules: {
                create: l3Schedules.map((s, idx) => ({
                    dueDate: s.dueDate,
                    principalAmount: new Decimal(s.principalAmount),
                    interestAmount: new Decimal(s.interestAmount),
                    totalDue: new Decimal(s.totalDue),
                    paidAmount: idx < 3 ? new Decimal(s.interestAmount) : new Decimal(0),
                    status: idx < 3 ? 'PAID' : 'OVERDUE',
                })),
            },
        },
    });
    // Loan 4: Priya Verma (Fully Settled & Gold Released, CLOSED)
    const l4Start = new Date(now.getFullYear(), now.getMonth() - 4, 1);
    const l4Mat = new Date(l4Start);
    l4Mat.setMonth(l4Mat.getMonth() + 3);
    const loan4 = await prisma.loan.create({
        data: {
            loanNumber: `GL-${year}-00104`,
            customerId: createdCustomers[3].id,
            loanAmount: new Decimal(40000),
            interestRate: new Decimal(1.9),
            interestType: 'MONTHLY_SIMPLE',
            durationMonths: 3,
            startDate: l4Start,
            maturityDate: l4Mat,
            processingFee: new Decimal(400),
            status: 'CLOSED',
            goldReleased: true,
            releasedAt: new Date(now.getFullYear(), now.getMonth() - 1, 2),
            releasedBy: 'Owner Admin',
            releaseNotes: 'Customer settled all principal and interest in full. Gold handed over with signature.',
            goldItems: {
                create: [
                    {
                        itemType: 'Gold Bracelet',
                        description: '22K solid curb bracelet',
                        grossWeight: new Decimal(15.2),
                        netWeight: new Decimal(15.0),
                        purity: '22K (916)',
                        estimatedValue: new Decimal(162000),
                        loanValue: new Decimal(110000),
                        status: 'RELEASED',
                    },
                ],
            },
        },
    });
    // Payments for Loan 4 (Principal + Interest paid)
    await prisma.payment.createMany({
        data: [
            {
                receiptNumber: `RCP-${year}-00103`,
                loanId: loan4.id,
                customerId: createdCustomers[3].id,
                amount: new Decimal(2280),
                interestComponent: new Decimal(2280),
                paymentType: 'INTEREST_ONLY',
                paymentMethod: 'UPI',
                status: 'SUCCESS',
                paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            },
            {
                receiptNumber: `RCP-${year}-00104`,
                loanId: loan4.id,
                customerId: createdCustomers[3].id,
                amount: new Decimal(40000),
                principalComponent: new Decimal(40000),
                paymentType: 'FULL_SETTLEMENT',
                paymentMethod: 'BANK_TRANSFER',
                referenceNumber: 'NEFT982187361',
                receivedBy: 'Owner Admin',
                status: 'SUCCESS',
                paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 2),
            },
        ],
    });
    // Loan 5: Suresh Reddy (Active, ₹60,000, 24K Bullion Coins)
    const l5Start = new Date(now.getFullYear(), now.getMonth(), 1);
    const l5Mat = new Date(l5Start);
    l5Mat.setMonth(l5Mat.getMonth() + 6);
    const l5Schedules = LoanCalculationService.generatePaymentSchedule(60000, 2.0, 6, l5Start);
    await prisma.loan.create({
        data: {
            loanNumber: `GL-${year}-00105`,
            customerId: createdCustomers[4].id,
            loanAmount: new Decimal(60000),
            interestRate: new Decimal(2.0),
            interestType: 'MONTHLY_SIMPLE',
            durationMonths: 6,
            startDate: l5Start,
            maturityDate: l5Mat,
            processingFee: new Decimal(600),
            status: 'ACTIVE',
            goldItems: {
                create: [
                    {
                        itemType: 'Gold Coins',
                        description: 'Two 24K 999 purity investment bullion coins in tamper-evident packaging',
                        grossWeight: new Decimal(20.0),
                        netWeight: new Decimal(20.0),
                        purity: '24K (999)',
                        estimatedValue: new Decimal(235000),
                        loanValue: new Decimal(165000),
                        status: 'PLEDGED',
                        images: {
                            create: [
                                {
                                    fileUrl: '/uploads/gold/gold-coin-24k.svg',
                                    fileName: 'gold-coin-24k.svg',
                                    imageType: 'FRONT',
                                },
                            ],
                        },
                    },
                ],
            },
            paymentSchedules: {
                create: l5Schedules.map((s) => ({
                    dueDate: s.dueDate,
                    principalAmount: new Decimal(s.principalAmount),
                    interestAmount: new Decimal(s.interestAmount),
                    totalDue: new Decimal(s.totalDue),
                    paidAmount: new Decimal(0),
                    status: 'PENDING',
                })),
            },
        },
    });
    // 6. Generate Slots & Today's Appointments (Requirement #8)
    console.log('Generating Appointments & Slots...');
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const timeSlots = [
        { start: '10:00', end: '10:30' },
        { start: '10:30', end: '11:00' },
        { start: '11:00', end: '11:30' },
        { start: '11:30', end: '12:00' },
        { start: '12:00', end: '12:30' },
        { start: '14:00', end: '14:30' },
        { start: '14:30', end: '15:00' },
        { start: '15:00', end: '15:30' },
        { start: '15:30', end: '16:00' },
        { start: '16:00', end: '16:30' },
        { start: '16:30', end: '17:00' },
    ];
    const createdTodaySlots = [];
    for (const ts of timeSlots) {
        const s = await prisma.availabilitySlot.create({
            data: {
                date: todayStr,
                startTime: ts.start,
                endTime: ts.end,
                isActive: true,
            },
        });
        createdTodaySlots.push(s);
    }
    // Also create slots for tomorrow
    for (const ts of timeSlots) {
        await prisma.availabilitySlot.create({
            data: {
                date: tomorrowStr,
                startTime: ts.start,
                endTime: ts.end,
                isActive: true,
            },
        });
    }
    // Today's appointments matching specification #8:
    // 10:00 AM | Rahul Kumar | Gold Pledge | Confirmed
    // 11:30 AM | Anjali Sharma | Payment | Pending
    // 4:00 PM  | Arun Patel | Gold Release | Confirmed
    await prisma.appointment.create({
        data: {
            appointmentNumber: 'APT-00101',
            customerId: createdCustomers[0].id,
            slotId: createdTodaySlots[0].id, // 10:00
            date: todayStr,
            timeSlot: '10:00 - 10:30',
            purpose: 'GOLD_PLEDGE',
            status: 'CONFIRMED',
            notes: 'Pledging additional gold ring for loan enhancement',
        },
    });
    await prisma.appointment.create({
        data: {
            appointmentNumber: 'APT-00102',
            customerId: createdCustomers[1].id,
            slotId: createdTodaySlots[3].id, // 11:30
            date: todayStr,
            timeSlot: '11:30 - 12:00',
            purpose: 'PAYMENT',
            status: 'PENDING',
            notes: 'Monthly interest cash payment at counter',
        },
    });
    await prisma.appointment.create({
        data: {
            appointmentNumber: 'APT-00103',
            customerId: createdCustomers[2].id,
            slotId: createdTodaySlots[9].id, // 16:00
            date: todayStr,
            timeSlot: '16:00 - 16:30',
            purpose: 'GOLD_RELEASE',
            status: 'CONFIRMED',
            notes: 'Final settlement and physical gold handover verification',
        },
    });
    // 7. Seed Notifications
    console.log('Seeding Customer Notifications...');
    await prisma.notification.createMany({
        data: [
            {
                userId: createdCustomers[0].id,
                title: 'Interest Payment Due',
                message: 'Your next monthly interest of ₹1,000 for loan GL-2026-00101 is due on 10th of next month.',
                type: 'PAYMENT_REMINDER',
                isRead: false,
            },
            {
                userId: createdCustomers[0].id,
                title: 'Payment Confirmed',
                message: 'Your counter payment of ₹1,000 (Receipt: RCP-2026-00102) has been credited.',
                type: 'PAYMENT_SUCCESS',
                isRead: true,
                readAt: new Date(),
            },
            {
                userId: createdCustomers[2].id,
                title: 'Overdue Loan Notice',
                message: 'Loan GL-2026-00103 has overdue schedules. Please visit the shop or pay online to prevent penal interest.',
                type: 'PAYMENT_REMINDER',
                isRead: false,
            },
        ],
    });
    // 8. Audit Logs
    console.log('Seeding initial Audit Logs...');
    await prisma.auditLog.createMany({
        data: [
            {
                userId: adminUser.id,
                userName: adminUser.name,
                action: 'SYSTEM_INITIALIZATION',
                entityType: 'SETTINGS',
                entityId: '1',
                newValue: 'System initialized with business settings and security rules',
            },
            {
                userId: adminUser.id,
                userName: adminUser.name,
                action: 'SANCTION_LOAN',
                entityType: 'LOAN',
                entityId: loan1.id,
                newValue: 'Sanctioned loan GL-2026-00101 for ₹50,000 to Rahul Kumar',
            },
        ],
    });
    console.log('\n=============================================');
    console.log('✓ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('ADMIN LOGIN CREDENTIALS:');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin@12345');
    console.log('---------------------------------------------');
    console.log('TEST CUSTOMER LOGIN CREDENTIALS:');
    console.log('  Customer 1: Rahul Kumar   | Phone: 9876543210 | Pass: Gold@3210 (CUST-1001)');
    console.log('  Customer 2: Anjali Sharma | Phone: 9876543211 | Pass: Gold@3211 (CUST-1002)');
    console.log('  Customer 3: Arun Patel    | Phone: 9876543212 | Pass: Gold@3212 (CUST-1003)');
    console.log('  Customer 4: Priya Verma   | Phone: 9876543213 | Pass: Gold@3213 (CUST-1004)');
    console.log('  Customer 5: Suresh Reddy  | Phone: 9876543214 | Pass: Gold@3214 (CUST-1005)');
    console.log('=============================================\n');
}
seed()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
