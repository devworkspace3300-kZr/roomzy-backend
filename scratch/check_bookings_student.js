const { Client } = require('pg');

async function checkBookings() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roomzy_db',
    password: 'khizar0920', 
    port: 5432,
  });

  try {
    await client.connect();
    const studentId = '0e01fb3a-7111-4c0e-b9cc-654287152998';
    const res = await client.query('SELECT * FROM bookings WHERE student_id = $1', [studentId]);
    console.log('Bookings found:', res.rows.length);
    if (res.rows.length > 0) {
      console.log('Sample booking:', JSON.stringify(res.rows[0], null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkBookings();
