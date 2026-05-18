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
    console.log('--- REVIEWS TABLE COLUMNS ---');
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'reviews'
    `);
    cols.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable=${row.is_nullable}, default=${row.column_default})`);
    });

    console.log('\n--- REVIEWS COUNT AND RECENT DATA ---');
    const reviewsCount = await client.query('SELECT COUNT(*) FROM reviews');
    console.log('Reviews count:', reviewsCount.rows[0].count);

    const sample = await client.query('SELECT * FROM reviews LIMIT 5');
    console.log('Sample reviews:', JSON.stringify(sample.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error executing query', err.stack);
    process.exit(1);
  }
});
