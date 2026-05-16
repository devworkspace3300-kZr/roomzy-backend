const { Client } = require('pg');

async function findStudent() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roomzy_db',
    password: 'khizar0920', 
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, email, role FROM users WHERE role = 'student' LIMIT 1");
    console.log('Student found:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

findStudent();
