const { Client } = require('pg');

const client = new Client({
  host: 'localhost', port: 5432, user: 'postgres',
  password: 'khizar0920', database: 'roomzy_db',
});

client.connect().then(async () => {
  try {
    const res = await client.query(`SELECT enum_range(NULL::payment_status)`);
    console.log('Actual DB payment_status enum values:', JSON.stringify(res.rows[0]));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
});
