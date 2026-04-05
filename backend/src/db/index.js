const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-eu-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xhvgcdbwmqsnbeczdnzz',
  password: 'Wedding@2024#Femi',
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    release();
    console.log('Connected to Supabase PostgreSQL');
  }
});

module.exports = pool;