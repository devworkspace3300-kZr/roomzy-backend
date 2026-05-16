const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roomzy_db',
    password: 'khizar0920', 
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('hostels', 'users')
    `);
    console.log('Schema:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkSchema();
