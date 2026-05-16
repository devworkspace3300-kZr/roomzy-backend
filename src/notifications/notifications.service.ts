import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  // Placeholder notification methods
  
  notifyOwnerNewBookingRequest(ownerId: string, studentId: string, bookingId: string) {
    console.log(`Owner ${ownerId} notified: New booking request from student ID ${studentId} (Booking ID: ${bookingId})`);
  }

  notifyStudentBookingApproved(studentId: string, bookingId: string) {
    console.log(`Booking ${bookingId} approved for student ${studentId}`);
  }

  notifyStudentBookingRejected(studentId: string, bookingId: string, reason?: string) {
    console.log(`Booking ${bookingId} rejected for student ${studentId}. Reason: ${reason ?? 'N/A'}`);
  }

  notifyPaymentDeadline(studentId: string, bookingId: string) {
    console.log(`Payment deadline approaching for booking ${bookingId} (student ${studentId})`);
  }

  notifyCheckout(studentId: string, bookingId: string) {
    console.log(`Student ${studentId} checked out from booking ${bookingId}`);
  }
}
