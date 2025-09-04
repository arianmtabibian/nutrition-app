const sqlite3 = require('sqlite3').verbose();
const { createPersistentDatabase } = require('../config/externalDb');

// Use the persistent database configuration
const db = createPersistentDatabase();

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          username TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User profiles table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          profile_picture TEXT,
          bio TEXT,
          daily_calories INTEGER,
          daily_protein INTEGER,
          weight REAL,
          target_weight REAL,
          height REAL,
          age INTEGER,
          activity_level TEXT,
          gender TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Meals table
      db.run(`
        CREATE TABLE IF NOT EXISTS meals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          meal_date DATE NOT NULL,
          meal_type TEXT NOT NULL,
          description TEXT NOT NULL,
          calories INTEGER NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fat REAL NOT NULL,
          fiber REAL NOT NULL,
          sugar REAL NOT NULL,
          sodium REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Daily nutrition summary table
      db.run(`
        CREATE TABLE IF NOT EXISTS daily_nutrition (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE UNIQUE NOT NULL,
          total_calories INTEGER DEFAULT 0,
          total_protein REAL DEFAULT 0,
          total_carbs REAL DEFAULT 0,
          total_fat REAL DEFAULT 0,
          total_fiber REAL DEFAULT 0,
          total_sugar REAL DEFAULT 0,
          total_sodium REAL DEFAULT 0,
          calories_goal INTEGER NOT NULL,
          protein_goal REAL NOT NULL,
          calories_met BOOLEAN DEFAULT FALSE,
          protein_met BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Social media tables
      db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT,
          image_url TEXT,
          meal_data TEXT,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS post_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(post_id, user_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS post_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS user_follows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          follower_id INTEGER NOT NULL,
          following_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(follower_id, following_id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date ON daily_nutrition(user_id, date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id)`);

      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

function getDatabase() {
  return db;
}

module.exports = {
  initializeDatabase,
  getDatabase
};
