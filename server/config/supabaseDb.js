// Supabase PostgreSQL database configuration
const { Pool } = require('pg');

// Create connection pool for PostgreSQL
const createSupabaseConnection = () => {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or SUPABASE_URL environment variable is required for Supabase connection');
  }
  
  console.log('🔄 Connecting to Supabase PostgreSQL...');
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    },
    // Connection pool settings
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });

  // Test the connection
  pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err);
  });

  return pool;
};

// Helper function to run queries with proper error handling
const query = async (text, params = []) => {
  const pool = createSupabaseConnection();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  } finally {
    // Don't close the pool here - let it manage connections automatically
  }
};

module.exports = {
  createSupabaseConnection,
  query
};
