const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'khizar0920',
  database: 'roomzy_db'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'");
    console.log('COLUMNS:', JSON.stringify(res.rows.map(r => r.column_name)));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
