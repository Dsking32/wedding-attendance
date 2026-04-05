
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS guests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      section VARCHAR(100),
      pin VARCHAR(5) UNIQUE NOT NULL,
      qr_data VARCHAR(100) UNIQUE NOT NULL,
      checked_in BOOLEAN DEFAULT FALSE,
      check_in_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS checkin_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
      method VARCHAR(10) CHECK (method IN ('qr', 'pin')),
      scanned_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err.message);
  }
};

module.exports = createTables;