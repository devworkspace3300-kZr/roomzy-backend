const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'khizar0920',
  database: 'roomzy_db',
});

const studentId = 'a6e6a8fa-c83a-4bb1-b9db-5aaf98327311';
const bookingId = '07730744-92e4-4322-8071-ab51c58ead33';
const dto = {
  overall_rating: 5,
  body: 'This is a test review body to check database insertion.',
  title: 'Great Stay!'
};

client.connect().then(async () => {
  try {
    console.log('Step 1: Verify booking belongs to student and is completed');
    const bookingsRes = await client.query(`
      SELECT * FROM bookings WHERE id = $1 AND student_id = $2
    `, [bookingId, studentId]);

    console.log('Bookings returned:', bookingsRes.rows);
    if (!bookingsRes.rows || bookingsRes.rows.length === 0) {
      console.error('Booking not found or not authorized');
      process.exit(1);
    }

    const booking = bookingsRes.rows[0];
    console.log('Booking status:', booking.status);

    const {
      overall_rating, cleanliness, food_quality, safety_security,
      facilities_match, owner_management, value_for_money, title, body
    } = dto;

    console.log('Step 2: Try to insert review');
    const result = await client.query(`
      INSERT INTO reviews (
        booking_id, student_id, hostel_id, overall_rating, cleanliness, food_quality, 
        safety_security, facilities_match, owner_management, value_for_money, 
        title, body, stay_duration_months, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
      RETURNING *
    `, [
      bookingId, studentId, booking.hostel_id, overall_rating, cleanliness || overall_rating,
      food_quality || overall_rating, safety_security || overall_rating, facilities_match || overall_rating,
      owner_management || overall_rating, value_for_money || overall_rating,
      title || 'Great Stay!', body, booking.duration_months || 1
    ]);

    console.log('Review inserted successfully:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('FAILED TO INSERT REVIEW:', err);
    process.exit(1);
  }
});
