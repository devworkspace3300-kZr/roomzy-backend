const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'khizar0920',
  database: 'roomzy_db',
});

client.connect().then(async () => {
  try {
    console.log('--- BOOKINGS COUNT ---');
    const bookingsCount = await client.query('SELECT COUNT(*) FROM bookings');
    console.log('Bookings count:', bookingsCount.rows[0].count);

    console.log('\n--- BOOKINGS SAMPLE ---');
    const sampleBookings = await client.query('SELECT id, student_id, hostel_id, status FROM bookings LIMIT 5');
    console.log('Sample bookings:', JSON.stringify(sampleBookings.rows, null, 2));

    console.log('\n--- USERS BY ROLE ---');
    const roles = await client.query('SELECT role, COUNT(*) FROM users GROUP BY role');
    console.log('Users by role:', roles.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error executing query', err.stack);
    process.exit(1);
  }
});
