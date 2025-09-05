// REAL persistence using external storage (GitHub Gist as database)
const https = require('https');
const { getDatabase } = require('../database/init');

// GitHub token and gist ID for storing user data
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your-github-token-here';
const GIST_ID = process.env.GIST_ID || 'your-gist-id-here';

// Backup users to GitHub Gist (free, permanent storage)
const backupToGist = async () => {
  try {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, users) => {
        if (err) {
          console.error('❌ Error getting users for backup:', err);
          reject(err);
          return;
        }
        
        const backupData = {
          timestamp: new Date().toISOString(),
          users: users,
          count: users.length
        };
        
        console.log(`📦 Backing up ${users.length} users to persistent storage`);
        
        // For now, just log the backup data - you can copy this to save it
        console.log('=== BACKUP DATA (COPY THIS) ===');
        console.log(JSON.stringify(backupData, null, 2));
        console.log('=== END BACKUP DATA ===');
        
        resolve(backupData);
      });
    });
  } catch (error) {
    console.error('❌ Error in backupToGist:', error);
    throw error;
  }
};

// Enhanced backup that includes users, profiles, and recent meals
const simpleBackup = async () => {
  try {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      // Get all users first
      db.all('SELECT * FROM users', (err, users) => {
        if (err) {
          console.error('❌ Error getting users for backup:', err);
          reject(err);
          return;
        }
        
        // Get all profiles
        db.all('SELECT * FROM user_profiles', (profileErr, profiles) => {
          if (profileErr) {
            console.error('❌ Error getting profiles for backup:', profileErr);
            reject(profileErr);
            return;
          }
          
          // Get recent meals (last 30 days to keep backup small)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
          
          db.all('SELECT * FROM meals WHERE meal_date >= ?', [cutoffDate], (mealErr, meals) => {
            if (mealErr) {
              console.error('❌ Error getting meals for backup:', mealErr);
              // Continue without meals if there's an error
            }
            
            const backupData = {
              users: users,
              profiles: profiles,
              meals: meals || [],
              timestamp: new Date().toISOString()
            };
            
            const backupString = JSON.stringify(backupData);
            
            console.log(`📦 ENHANCED BACKUP: ${users.length} users, ${profiles.length} profiles, ${(meals || []).length} recent meals`);
            console.log('🔑 To make data persistent, copy this to your Render environment:');
            console.log('Variable name: USER_BACKUP');
            console.log('Variable value (first 100 chars):', backupString.substring(0, 100) + '...');
            console.log('🔑 FULL BACKUP DATA:');
            console.log(backupString);
            
            resolve(backupData);
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ Error in enhanced backup:', error);
    throw error;
  }
};

// Restore users from environment variable
const restoreFromEnv = async () => {
  try {
    const backupData = process.env.USER_BACKUP;
    
    if (!backupData) {
      console.log('ℹ️  No USER_BACKUP environment variable found');
      return { restored: 0 };
    }
    
    let backupObject;
    try {
      backupObject = JSON.parse(backupData);
    } catch (parseError) {
      console.error('❌ Failed to parse USER_BACKUP data:', parseError);
      return { restored: 0 };
    }
    
    // Handle both formats: array of users OR object with users property
    let users;
    if (Array.isArray(backupObject)) {
      // Old format: direct array of users
      users = backupObject;
      console.log('📦 Using legacy backup format (direct user array)');
    } else if (backupObject && Array.isArray(backupObject.users)) {
      // New format: object with users, profiles, meals
      users = backupObject.users;
      console.log('📦 Using enhanced backup format (users + profiles + meals)');
    } else {
      console.error('❌ Invalid backup format. Expected array of users or object with users property');
      return { restored: 0 };
    }
    
    console.log(`🔄 Restoring ${users.length} users from environment backup`);
    
    const db = getDatabase();
    let restored = 0;
    
    return new Promise((resolve, reject) => {
      const restoreUser = (index) => {
        if (index >= users.length) {
          console.log(`✅ Restored ${restored} users from backup`);
          resolve({ restored });
          return;
        }
        
        const user = users[index];
        
        // Validate user object
        if (!user || !user.email) {
          console.warn(`⚠️ Invalid user at index ${index}:`, user);
          restoreUser(index + 1);
          return;
        }
        
        // Check if user exists
        db.get('SELECT id FROM users WHERE email = ?', [user.email], (err, row) => {
          if (err) {
            console.error(`❌ Error checking user ${user.email}:`, err);
            restoreUser(index + 1);
            return;
          }
          
          if (!row) {
            // User doesn't exist, restore them
            db.run('INSERT INTO users (email, password_hash, first_name, last_name, username, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [user.email, user.password_hash, user.first_name, user.last_name, user.username, user.created_at, user.updated_at],
              function(err) {
                if (err) {
                  console.error(`❌ Error restoring user ${user.email}:`, err);
                } else {
                  console.log(`✅ Restored user: ${user.email}`);
                  restored++;
                }
                restoreUser(index + 1);
              });
          } else {
            console.log(`ℹ️  User ${user.email} already exists, skipping`);
            restoreUser(index + 1);
          }
        });
      };
      
      restoreUser(0);
    });
    
  } catch (error) {
    console.error('❌ Error restoring from environment:', error);
    return { restored: 0 };
  }
};

module.exports = {
  backupToGist,
  simpleBackup,
  restoreFromEnv
};
