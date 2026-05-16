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
    const res = await client.query('SELECT id, name, status, city FROM hostels');
    console.log('Hostels found:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkHostels();
