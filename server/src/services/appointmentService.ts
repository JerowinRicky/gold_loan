import { prisma } from '../utils/prisma.js';
import { AuditService } from './auditService.js';

export class AppointmentService {
  /**
   * Auto-generate time slots for a given date (e.g. 10:00 to 18:00 every 30 mins)
   */
  public static async generateSlots(data: {
    date: string;
    startTime: string; // "10:00"
    endTime: string;   // "18:00"
    slotDurationMinutes?: number;
  }) {
    const duration = data.slotDurationMinutes || 30;
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const slotsToCreate: { date: string; startTime: string; endTime: string }[] = [];

    while (currentMinutes + duration <= endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60);
      const slotStartM = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + duration;
      const slotEndH = Math.floor(slotEndMinutes / 60);
      const slotEndM = slotEndMinutes % 60;

      const formatTime = (h: number, m: number) =>
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      slotsToCreate.push({
        date: data.date,
        startTime: formatTime(slotStartH, slotStartM),
        endTime: formatTime(slotEndH, slotEndM),
      });

      currentMinutes += duration;
    }

    let createdCount = 0;
    for (const slot of slotsToCreate) {
      try {
        await prisma.availabilitySlot.upsert({
          where: {
            date_startTime: {
              date: slot.date,
              startTime: slot.startTime,
            },
          },
          update: {
            endTime: slot.endTime,
            isActive: true,
          },
          create: {
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: true,
          },
        });
        createdCount++;
      } catch (e) {
        // Continue if duplicate
      }
    }

    return { date: data.date, totalGenerated: createdCount };
  }

  /**
   * Get available slots for a customer on a given date
   */
  public static async getAvailableSlots(date: string) {
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        date,
        isActive: true,
      },
      include: {
        appointment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return slots.map((s) => {
      const isBooked =
        s.appointment !== null &&
        ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(s.appointment.status);

      return {
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: !isBooked,
      };
    });
  }

  /**
   * Book appointment with concurrency protection to prevent double-booking
   */
  public static async bookAppointment(data: {
    customerId: string;
    slotId: string;
    purpose: 'NEW_LOAN' | 'GOLD_PLEDGE' | 'PAYMENT' | 'GOLD_RELEASE' | 'DOCUMENT_SUBMISSION' | 'OTHER';
    notes?: string;
  }) {
    // Generate unique appointment number: APT-XXXXX
    const lastApt = await prisma.appointment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { appointmentNumber: true },
    });

    let nextNum = 101;
    if (lastApt?.appointmentNumber?.startsWith('APT-')) {
      const parsed = parseInt(lastApt.appointmentNumber.replace('APT-', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    const appointmentNumber = `APT-${String(nextNum).padStart(5, '0')}`;

    // Concurrency-safe atomic booking
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: data.slotId },
        include: { appointment: true },
      });

      if (!slot) {
        throw new Error('Selected time slot does not exist.');
      }

      if (!slot.isActive) {
        throw new Error('This time slot is no longer available.');
      }

      if (
        slot.appointment &&
        ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(slot.appointment.status)
      ) {
        throw new Error('This time slot has just been reserved by another customer. Please choose another time.');
      }

      // If slot had a CANCELLED appointment, remove or reassign it
      if (slot.appointment && slot.appointment.status === 'CANCELLED') {
        await tx.appointment.delete({ where: { id: slot.appointment.id } });
      }

      const appointment = await tx.appointment.create({
        data: {
          appointmentNumber,
          customerId: data.customerId,
          slotId: data.slotId,
          date: slot.date,
          timeSlot: `${slot.startTime} - ${slot.endTime}`,
          purpose: data.purpose,
          status: 'CONFIRMED', // Direct confirmation for streamlined local shop experience
          notes: data.notes || null,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          slot: true,
        },
      });

      return appointment;
    });

    await AuditService.log({
      userId: data.customerId,
      userName: result.customer.name,
      action: 'BOOK_APPOINTMENT',
      entityType: 'APPOINTMENT',
      entityId: result.id,
      newValue: {
        appointmentNumber,
        date: result.date,
        timeSlot: result.timeSlot,
        purpose: result.purpose,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: data.customerId,
        title: 'Appointment Confirmed',
        message: `Your appointment (${appointmentNumber}) for ${result.purpose.replace('_', ' ')} is confirmed on ${result.date} at ${result.timeSlot}.`,
        type: 'APPOINTMENT',
      },
    });

    return result;
  }

  /**
   * Cancel appointment (by customer or admin)
   */
  public static async cancelAppointment(id: string, user: { id: string; role: string; name: string }) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!appointment) throw new Error('Appointment not found.');

    if (user.role === 'CUSTOMER' && appointment.customerId !== user.id) {
      throw new Error('Access denied: You cannot cancel another customer\'s appointment.');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Completed appointments cannot be cancelled.');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CANCEL_APPOINTMENT',
      entityType: 'APPOINTMENT',
      entityId: id,
    });

    return updated;
  }

  /**
   * Update appointment status (Admin only)
   */
  public static async updateStatus(
    id: string,
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
    adminNotes?: string,
    adminUser?: { id: string; name: string }
  ) {
    const apt = await prisma.appointment.findUnique({ where: { id } });
    if (!apt) throw new Error('Appointment not found.');

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes ?? apt.adminNotes,
      },
      include: { customer: true },
    });

    await AuditService.log({
      userId: adminUser?.id,
      userName: adminUser?.name || 'Admin',
      action: 'UPDATE_APPOINTMENT_STATUS',
      entityType: 'APPOINTMENT',
      entityId: id,
      oldValue: { status: apt.status },
      newValue: { status, adminNotes },
    });

    return updated;
  }

  /**
   * List appointments with date, customer, status filters
   */
  public static async listAppointments(params: {
    customerId?: string;
    date?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.customerId) where.customerId = params.customerId;
    if (params.date) where.date = params.date;
    if (params.status && params.status !== 'ALL') where.status = params.status;

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { appointmentNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q } } },
      ];
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
        include: {
          customer: {
            select: { id: true, customerId: true, name: true, phone: true },
          },
          slot: true,
        },
      }),
    ]);

    return {
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

