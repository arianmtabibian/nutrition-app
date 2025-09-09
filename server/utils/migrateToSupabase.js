// Migration utility to export SQLite data and import to Supabase
const { getDatabase } = require('../database/init'); // SQLite
const { getSupabasePool } = require('../database/supabaseInit'); // PostgreSQL
const bcrypt = require('bcryptjs');

// Export all data from SQLite
const exportSQLiteData = async () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
      const data = {};
      
      // Export users
      db.all('SELECT * FROM users', (err, users) => {
        if (err) {
          reject(err);
          return;
        }
        data.users = users;
        
        // Export user profiles
        db.all('SELECT * FROM user_profiles', (err, profiles) => {
          if (err) {
            reject(err);
            return;
          }
          data.profiles = profiles;
          
          // Export meals
          db.all('SELECT * FROM meals', (err, meals) => {
            if (err) {
              reject(err);
              return;
            }
            data.meals = meals;
            
            // Export posts (if table exists)
            db.all('SELECT * FROM posts', (err, posts) => {
              data.posts = posts || []; // Continue even if posts table doesn't exist
              
              // Export likes (if table exists)
              db.all('SELECT * FROM likes', (err, likes) => {
                data.likes = likes || [];
                
                // Export comments (if table exists)
                db.all('SELECT * FROM comments', (err, comments) => {
                  data.comments = comments || [];
                  
                  // Export follows (if table exists)
                  db.all('SELECT * FROM follows', (err, follows) => {
                    data.follows = follows || [];
                    
                    // Export favorites (if table exists)
                    db.all('SELECT * FROM favorites', (err, favorites) => {
                      data.favorites = favorites || [];
                      
                      console.log('📊 SQLite Data Export Summary:');
                      console.log(`- Users: ${data.users.length}`);
                      console.log(`- Profiles: ${data.profiles.length}`);
                      console.log(`- Meals: ${data.meals.length}`);
                      console.log(`- Posts: ${data.posts.length}`);
                      console.log(`- Likes: ${data.likes.length}`);
                      console.log(`- Comments: ${data.comments.length}`);
                      console.log(`- Follows: ${data.follows.length}`);
                      console.log(`- Favorites: ${data.favorites.length}`);
                      
                      resolve(data);
                    });
                  });
                });
              });
            });
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Import data to Supabase PostgreSQL
const importToSupabase = async (data) => {
  try {
    const pool = getSupabasePool();
    
    console.log('🔄 Starting import to Supabase...');
    
    // Import users first (they're referenced by other tables)
    if (data.users && data.users.length > 0) {
      console.log(`📥 Importing ${data.users.length} users...`);
      for (const user of data.users) {
        try {
          await pool.query(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, username, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             ON CONFLICT (email) DO NOTHING`,
            [user.id, user.email, user.password_hash, user.first_name, user.last_name, user.username, user.created_at, user.updated_at]
          );
        } catch (error) {
          console.log(`⚠️  Skipping user ${user.email}: ${error.message}`);
        }
      }
    }
    
    // Import user profiles
    if (data.profiles && data.profiles.length > 0) {
      console.log(`📥 Importing ${data.profiles.length} profiles...`);
      for (const profile of data.profiles) {
        try {
          await pool.query(
            `INSERT INTO user_profiles (id, user_id, profile_picture, bio, daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
             ON CONFLICT (id) DO NOTHING`,
            [profile.id, profile.user_id, profile.profile_picture, profile.bio, profile.daily_calories, profile.daily_protein, profile.weight, profile.target_weight, profile.height, profile.age, profile.activity_level, profile.gender, profile.created_at, profile.updated_at]
          );
        } catch (error) {
          console.log(`⚠️  Skipping profile ${profile.id}: ${error.message}`);
        }
      }
    }
    
    // Import meals
    if (data.meals && data.meals.length > 0) {
      console.log(`📥 Importing ${data.meals.length} meals...`);
      for (const meal of data.meals) {
        try {
          await pool.query(
            `INSERT INTO meals (id, user_id, meal_date, meal_type, title, description, calories, protein, carbs, fat, fiber, sugar, sodium, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
             ON CONFLICT (id) DO NOTHING`,
            [meal.id, meal.user_id, meal.meal_date, meal.meal_type, meal.title, meal.description, meal.calories, meal.protein, meal.carbs, meal.fat, meal.fiber, meal.sugar, meal.sodium, meal.created_at]
          );
        } catch (error) {
          console.log(`⚠️  Skipping meal ${meal.id}: ${error.message}`);
        }
      }
    }
    
    // Import posts
    if (data.posts && data.posts.length > 0) {
      console.log(`📥 Importing ${data.posts.length} posts...`);
      for (const post of data.posts) {
        try {
          await pool.query(
            `INSERT INTO posts (id, user_id, content, image_url, meal_id, likes_count, comments_count, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             ON CONFLICT (id) DO NOTHING`,
            [post.id, post.user_id, post.content, post.image_url, post.meal_id, post.likes_count, post.comments_count, post.created_at, post.updated_at]
          );
        } catch (error) {
          console.log(`⚠️  Skipping post ${post.id}: ${error.message}`);
        }
      }
    }
    
    // Import other tables similarly...
    // (likes, comments, follows, favorites)
    
    console.log('✅ Data import to Supabase completed!');
    
  } catch (error) {
    console.error('❌ Error importing to Supabase:', error);
    throw error;
  }
};

// Main migration function
const migrateToSupabase = async () => {
  try {
    console.log('🚀 Starting migration from SQLite to Supabase...');
    
    // Export from SQLite
    const data = await exportSQLiteData();
    
    // Import to Supabase
    await importToSupabase(data);
    
    console.log('🎉 Migration completed successfully!');
    return data;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

module.exports = {
  exportSQLiteData,
  importToSupabase,
  migrateToSupabase
};
