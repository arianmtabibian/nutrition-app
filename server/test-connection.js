// Simple connection test for debugging
const { Pool } = require('pg');

// Test different connection configurations
const testConnection = async () => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Jpmorgan558739!@db.byfrtbyeumfibpoqkorx.supabase.co:5432/postgres';
  
  console.log('🔄 Testing Supabase connection...');
  console.log('🔄 Connection string (masked):', connectionString.replace(/:[^:@]*@/, ':****@'));
  
  // Try different connection methods
  const configs = [
    {
      name: 'Direct connection string',
      config: {
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Parsed connection',
      config: {
        host: 'db.byfrtbyeumfibpoqkorx.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Jpmorgan558739!',
        ssl: { rejectUnauthorized: false }
      }
    }
  ];
  
  for (const { name, config } of configs) {
    try {
      console.log(`\n🔄 Trying ${name}...`);
      
      const pool = new Pool(config);
      
      // Test query with timeout
      const result = await Promise.race([
        pool.query('SELECT 1 as test, NOW() as timestamp'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 15000))
      ]);
      
      console.log(`✅ ${name} SUCCESS:`, result.rows[0]);
      await pool.end();
      
      // If we get here, connection works
      return true;
      
    } catch (error) {
      console.log(`❌ ${name} FAILED:`, error.message);
    }
  }
  
  console.log('\n❌ All connection attempts failed');
  return false;
};

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
