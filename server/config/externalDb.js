// External database configuration for persistent storage
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use external database service for true persistence
const getDatabaseConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    // For production, try multiple persistent storage options
    const possiblePaths = [
      '/opt/render/project/data/nutrition.db',      // Render persistent disk
      '/var/data/nutrition.db',                     // Alternative persistent path
      process.env.DATABASE_URL,                     // External database URL
      process.env.DB_PATH                           // Custom path from env
    ];
    
    // Use the first available path
    for (const dbPath of possiblePaths) {
      if (dbPath) {
        console.log('🔄 Attempting to use database path:', dbPath);
        return dbPath;
      }
    }
    
    // Fallback to current directory (last resort)
    console.log('⚠️  Using fallback database path in current directory');
    return './nutrition.db';
  } else {
    // Local development
    return path.join(__dirname, '..', 'nutrition.db');
  }
};

const createPersistentDatabase = () => {
  const dbPath = getDatabaseConfig();
  
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('✅ Created database directory:', dbDir);
    }
  } catch (error) {
    console.log('⚠️  Could not create directory:', error.message);
  }
  
  console.log('📁 Using database path:', dbPath);
  
  // Create database with WAL mode for better concurrency
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
    } else {
      console.log('✅ Connected to persistent SQLite database');
      
      // Enable WAL mode for better performance and concurrency
      db.run('PRAGMA journal_mode=WAL;', (err) => {
        if (err) {
          console.log('⚠️  Could not enable WAL mode:', err.message);
        } else {
          console.log('✅ WAL mode enabled for database');
        }
      });
      
      // Set synchronous mode for better durability
      db.run('PRAGMA synchronous=NORMAL;', (err) => {
        if (err) {
          console.log('⚠️  Could not set synchronous mode:', err.message);
        } else {
          console.log('✅ Synchronous mode set to NORMAL');
        }
      });
    }
  });
  
  return db;
};

module.exports = {
  getDatabaseConfig,
  createPersistentDatabase
};
