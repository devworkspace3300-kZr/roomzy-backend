const { Client } = require('pg');

async function checkRooms() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roomzy_db',
    password: 'khizar0920', 
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM rooms WHERE hostel_id = $1', ['4c87c935-487b-4778-92b9-a3ea4b955e0e']);
    console.log('Rooms found:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkRooms();
