import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly dataSource: DataSource) {}

  async createReview(studentId: string, bookingId: string, dto: any) {
    // Verify booking belongs to student and is completed
    const bookings = await this.dataSource.query(`
      SELECT * FROM bookings WHERE id = $1 AND "studentId" = $2
    `, [bookingId, studentId]);

    if (!bookings || bookings.length === 0) {
      throw new NotFoundException('Booking not found or not authorized');
    }

    const booking = bookings[0];
    if (booking.status !== 'completed' && booking.status !== 'active_stay') {
      throw new BadRequestException('You can only review completed stays or active stays');
    }

    const {
      overall_rating, cleanliness, food_quality, safety_security,
      facilities_match, owner_management, value_for_money, title, body
    } = dto;

    if (!overall_rating || !body) {
      throw new BadRequestException('Rating and Review comment are required');
    }

    try {
      const result = await this.dataSource.query(`
        INSERT INTO reviews (
          booking_id, student_id, hostel_id, overall_rating, cleanliness, food_quality, 
          safety_security, facilities_match, owner_management, value_for_money, 
          title, body, stay_duration_months, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
        RETURNING *
      `, [
        bookingId, studentId, booking.hostelId, overall_rating, cleanliness || overall_rating,
        food_quality || overall_rating, safety_security || overall_rating, facilities_match || overall_rating,
        owner_management || overall_rating, value_for_money || overall_rating,
        title || 'Great Stay!', body, booking.durationMonths || 1
      ]);

      return { success: true, message: 'Review submitted and is pending approval', data: result[0] };
    } catch (e: any) {
      if (e.code === '23505') { // Unique constraint violation
        throw new BadRequestException('You have already submitted a review for this booking');
      }
      this.logger.error('Failed to submit review', e);
      throw new BadRequestException('Failed to submit review');
    }
  }

  async getHostelReviews(hostelId: string) {
    const reviews = await this.dataSource.query(`
      SELECT r.*, u."fullName" as student_name, u.avatar as student_avatar
      FROM reviews r
      JOIN users u ON u.id = r.student_id
      WHERE r.hostel_id = $1 AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `, [hostelId]);
    return { success: true, data: reviews };
  }

  async getAllReviewsAdmin() {
    const reviews = await this.dataSource.query(`
      SELECT r.*, u."fullName" as student_name, h.name as hostel_name
      FROM reviews r
      JOIN users u ON u.id = r.student_id
      JOIN hostels h ON h.id = r.hostel_id
      ORDER BY r.created_at DESC
    `);
    return { success: true, data: reviews };
  }
}
