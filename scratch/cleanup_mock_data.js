const { Client } = require('pg');

async function cleanup() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roomzy_db',
    password: 'khizar0920',
    port: 5432,
  });

  try {
    await client.connect();
    const targetId = 'adb0d851-8ffe-42ac-95f6-8ac87e807fa3';
    
    // We need to delete dependent records first
    await client.query('DELETE FROM room_images WHERE room_id IN (SELECT id FROM rooms WHERE hostel_id != $1)', [targetId]);
    await client.query('DELETE FROM rooms WHERE hostel_id != $1', [targetId]);
    await client.query('DELETE FROM hostel_images WHERE hostel_id != $1', [targetId]);
    await client.query('DELETE FROM hostel_amenities WHERE hostel_id != $1', [targetId]);
    await client.query('DELETE FROM hostels WHERE id != $1', [targetId]);
    
    console.log('Cleanup complete. Only hostel ' + targetId + ' remains.');
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  } finally {
    await client.end();
  }
}

cleanup();
