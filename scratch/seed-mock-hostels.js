const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:khizar0920@localhost:5432/roomzy_db'
});

const mockHostels = [
  {
    name: 'Al-Madina Executive Hostel',
    city: 'Abbottabad',
    area: 'Mandian',
    gender: 'boys_only',
    price: 12000,
    description: 'Premium boys hostel with high-speed WiFi, 24/7 security, and quality meals. Located near COMSATS Abbottabad.',
    address: 'Near COMSATS University, Mandian, Abbottabad'
  },
  {
    name: 'Pine City Girls Residence',
    city: 'Abbottabad',
    area: 'Jinnahabad',
    gender: 'girls_only',
    price: 15000,
    description: 'Safe and secure residence for female students with laundry services and backup generator.',
    address: 'Street 4, Jinnahabad, Abbottabad'
  },
  {
    name: 'Karakoram Students Hub',
    city: 'Mansehra',
    area: 'Ghazikot',
    gender: 'boys_only',
    price: 10000,
    description: 'Affordable accommodation for Hazara University students with a quiet study environment.',
    address: 'Ghazikot Township, Mansehra'
  },
  {
    name: 'Hazara Heights Hostel',
    city: 'Mansehra',
    area: 'Dhudial',
    gender: 'co_ed',
    price: 13500,
    description: 'Modern hostel with separate wings for boys and girls. Walking distance from university gate.',
    address: 'Dhudial, Mansehra'
  },
  {
    name: 'The Scholar Residence',
    city: 'Abbottabad',
    area: 'Nawanshehr',
    gender: 'boys_only',
    price: 11500,
    description: 'Quiet environment tailored for medical students. 10 minutes from AMC.',
    address: 'Main Bazar, Nawanshehr, Abbottabad'
  },
  {
    name: 'Green View Girls Hostel',
    city: 'Abbottabad',
    area: 'Kakul',
    gender: 'girls_only',
    price: 16000,
    description: 'Luxurious girls hostel with attached baths and weekly cleaning services.',
    address: 'Kakul Road, Abbottabad'
  },
  {
    name: 'Aspire Student Living',
    city: 'Mansehra',
    area: 'City Center',
    gender: 'boys_only',
    price: 9500,
    description: 'Conveniently located near the transport hub with easy access to all universities.',
    address: 'Shinkiari Road, Mansehra'
  },
  {
    name: 'Unity Executive Suites',
    city: 'Abbottabad',
    area: 'Link Road',
    gender: 'co_ed',
    price: 18000,
    description: 'High-end suites for postgraduate students and researchers with private study areas.',
    address: 'Link Road, Abbottabad'
  }
];

async function seed() {
  try {
    await client.connect();
    
    // Get a random owner user ID
    const userRes = await client.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
    if (userRes.rows.length === 0) {
        console.error("No owner found to assign hostels to.");
        return;
    }
    const ownerId = userRes.rows[0].id;

    for (const h of mockHostels) {
      const slug = h.name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000);
      const query = `
        INSERT INTO hostels (id, name, slug, city, area, "full_address", "gender_type", "starting_price", description, "owner_id", status, "verified_at", "created_at", "updated_at")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified', NOW(), NOW(), NOW())
      `;
      await client.query(query, [h.name, slug, h.city, h.area, h.address, h.gender, h.price, h.description, ownerId]);
      console.log(`Seeded: ${h.name}`);
    }
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

seed();
