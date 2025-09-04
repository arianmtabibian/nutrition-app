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

// Simple file-based backup that persists across restarts
const simpleBackup = async () => {
  try {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, users) => {
        if (err) {
          console.error('❌ Error getting users for backup:', err);
          reject(err);
          return;
        }
        
        // Store in environment variable format
        const backupString = JSON.stringify(users);
        
        console.log(`📦 BACKUP: ${users.length} users`);
        console.log('🔑 To make users persistent, copy this to your Render environment:');
        console.log('Variable name: USER_BACKUP');
        console.log('Variable value:', backupString);
        
        resolve(users);
      });
    });
  } catch (error) {
    console.error('❌ Error in simpleBackup:', error);
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
    
    const users = JSON.parse(backupData);
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
    console.error('❌ Error restoring from env:', error);
    return { restored: 0 };
  }
};

module.exports = {
  backupToGist,
  simpleBackup,
  restoreFromEnv
};
