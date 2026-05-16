const { Client } = require('pg');

async function checkHostels() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roomzy_db',
    password: 'khizar0920', 
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT h.*, u.full_name as "ownerName" FROM hostels h JOIN users u ON h.owner_id = u.id');
    console.log('Hostels found:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkHostels();
