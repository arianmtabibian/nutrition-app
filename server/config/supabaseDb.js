// Supabase PostgreSQL database configuration
const { Pool } = require('pg');

// Create connection pool for PostgreSQL
const createSupabaseConnection = () => {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;
  
  if (!connectionString) {
    console.log('⚠️ No DATABASE_URL found, using local SQLite fallback');
    // Return null to indicate we should use SQLite fallback
    return null;
  }
  
  console.log('🔄 Connecting to Supabase PostgreSQL...');
  console.log('🔄 Connection string format:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    },
    // Connection pool settings optimized for Render
    max: 5, // Reduced max connections for serverless
    idleTimeoutMillis: 10000, // Shorter idle timeout
    connectionTimeoutMillis: 10000, // Longer connection timeout
    // Force IPv4 to avoid IPv6 issues
    host: connectionString.includes('@') ? connectionString.split('@')[1].split(':')[0] : undefined,
  });

  // Test the connection
  pool.on('connect', (client) => {
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
