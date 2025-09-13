// PostgreSQL database initialization for Supabase
const { createSupabaseConnection } = require('../config/supabaseDb');

let pool = null;

// Initialize PostgreSQL database with all tables
const initializeSupabaseDatabase = async () => {
  try {
    console.log('🔄 Initializing Supabase PostgreSQL database...');
    
    // Test connection first
    pool = createSupabaseConnection();
    
    // Test the connection with a simple query
    console.log('🔄 Testing database connection...');
    await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        username VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        profile_picture TEXT,
        bio TEXT,
        daily_calories INTEGER,
        daily_protein INTEGER,
        weight DECIMAL(5,2),
        target_weight DECIMAL(5,2),
        height DECIMAL(5,2),
        age INTEGER,
        activity_level VARCHAR(20),
        gender VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Meals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal_date DATE NOT NULL,
        meal_type VARCHAR(20) NOT NULL,
        title VARCHAR(200),
        description TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein DECIMAL(8,2) NOT NULL,
        carbs DECIMAL(8,2) NOT NULL,
        fat DECIMAL(8,2) NOT NULL,
        fiber DECIMAL(8,2) NOT NULL,
        sugar DECIMAL(8,2) NOT NULL,
        sodium DECIMAL(8,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Posts table (for social features)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url TEXT,
        meal_id INTEGER REFERENCES meals(id) ON DELETE SET NULL,
        allow_comments BOOLEAN DEFAULT true,
        hide_like_count BOOLEAN DEFAULT false,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      )
    `);

    // Comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Follows table (for social features)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);

    // Favorites table (for meals)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, meal_id)
      )
    `);

    // Post bookmarks table (for social posts)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      )
    `);

    // Add missing columns to existing posts table if they don't exist
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS hide_like_count BOOLEAN DEFAULT false;
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at DESC);
    `);

    console.log('✅ Supabase PostgreSQL database initialized successfully');
    return pool;
    
  } catch (error) {
    console.error('❌ Error initializing Supabase database:', error);
    throw error;
  }
};

// Get the database pool
const getSupabasePool = () => {
  if (!pool) {
    console.log('⚠️ Database pool not available');
    return null;
  }
  return pool;
};

// Close database connection
const closeSupabaseConnection = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Supabase database connection closed');
  }
};

module.exports = {
  initializeSupabaseDatabase,
  getSupabasePool,
  closeSupabaseConnection
};
