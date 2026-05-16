const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'khizar0920',
  database: 'roomzy_db',
});

client.connect().then(async () => {
  try {
    await client.query('ALTER TABLE conversations ALTER COLUMN owner_id DROP NOT NULL;');
    console.log('Successfully dropped NOT NULL on owner_id');
    
    await client.query('ALTER TABLE conversations ALTER COLUMN booking_id DROP NOT NULL;');
    console.log('Successfully dropped NOT NULL on booking_id');
    
    await client.query('ALTER TABLE conversations ALTER COLUMN hostel_id DROP NOT NULL;');
    console.log('Successfully dropped NOT NULL on hostel_id');
    
    process.exit(0);
  } catch (err) {
    console.error('Error executing query', err.stack);
    process.exit(1);
  }
});
