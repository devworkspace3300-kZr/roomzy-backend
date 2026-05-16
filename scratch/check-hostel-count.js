const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:khizar0920@localhost:5432/roomzy_db'
});

async function check() {
  try {
    await client.connect();
    const res = await client.query("SELECT count(*) FROM hostels WHERE status = 'verified'");
    console.log('Verified Hostels:', res.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
