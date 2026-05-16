const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'khizar0920',
  database: 'roomzy_db',
});

client.connect()
  .then(() => {
    console.log('SUCCESS: Connected to database');
    return client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
  })
  .then(res => {
    console.log('Tables:', res.rows.map(r => r.tablename));
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR: Could not connect to database', err.message);
    process.exit(1);
  });
