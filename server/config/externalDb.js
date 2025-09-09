// External database configuration for persistent storage
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use external database service for true persistence
const getDatabaseConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    // RENDER FREE TIER ISSUE: Filesystem is ephemeral!
    // We need to use an external database service
    
    // Try environment variables first
    if (process.env.DATABASE_URL) {
      console.log('🔄 Using DATABASE_URL from environment');
      return process.env.DATABASE_URL;
    }
    
    if (process.env.DB_PATH) {
      console.log('🔄 Using DB_PATH from environment:', process.env.DB_PATH);
      return process.env.DB_PATH;
    }
    
    // For Render, try persistent disk mount points
    const renderPaths = [
      '/opt/render/project/data/nutrition.db',      // Render persistent disk (paid)
      '/tmp/nutrition.db',                          // Temporary but better than nothing
      './data/nutrition.db'                         // Relative path
    ];
    
    for (const dbPath of renderPaths) {
      const dir = path.dirname(dbPath);
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        console.log('🔄 Attempting to use database path:', dbPath);
        return dbPath;
      } catch (error) {
        console.log('⚠️  Cannot use path:', dbPath, error.message);
        continue;
      }
    }
    
    // CRITICAL: Warn about data persistence issue
    console.log('🚨 WARNING: Using ephemeral storage! Data will be lost on restart!');
    console.log('🚨 Consider upgrading to Render paid plan or using external DB service');
    return './nutrition.db';
  } else {
    // Local development - use persistent local file
    const localPath = path.join(__dirname, '..', 'database', 'nutrition.db');
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return localPath;
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
