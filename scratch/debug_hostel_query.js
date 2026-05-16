const { Client } = require('pg');

async function debugHostel() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roomzy_db',
    password: 'khizar0920', 
    port: 5432,
  });

  try {
    await client.connect();
    // Try to simulate the TypeORM query
    const id = '4c87c935-487b-4778-92b9-a3ea4b955e0e';
    const query = `
      SELECT * FROM hostels h
      LEFT JOIN users u ON h.owner_id = u.id
      LEFT JOIN hostel_images hi ON h.id = hi.hostel_id
      WHERE h.id = $1 OR h.slug = $1
    `;
    const res = await client.query(query, [id]);
    console.log('Query result:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('SQL Error:', err.message);
  } finally {
    await client.end();
  }
}

debugHostel();
