// User backup system to external storage
const { getDatabase } = require('../database/init');

// Backup all users to a JSON format
const backupAllUsers = async () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
      
      db.all('SELECT id, email, password_hash, first_name, last_name, username, created_at, updated_at FROM users', (err, rows) => {
        if (err) {
          console.error('❌ Error backing up users:', err);
          reject(err);
          return;
        }
        
        console.log(`📦 Backed up ${rows.length} users`);
        resolve(rows);
      });
    } catch (error) {
      console.error('❌ Error in backupAllUsers:', error);
      reject(error);
    }
  });
};

// Restore users from backup
const restoreUsersFromBackup = async (usersData) => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
      let restored = 0;
      let skipped = 0;
      
      const restoreUser = (index) => {
        if (index >= usersData.length) {
          console.log(`✅ Restore complete: ${restored} restored, ${skipped} skipped`);
          resolve({ restored, skipped });
          return;
        }
        
        const user = usersData[index];
        
        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [user.email], (err, row) => {
          if (err) {
            console.error(`❌ Error checking user ${user.email}:`, err);
            restoreUser(index + 1);
            return;
          }
          
          if (row) {
            // User exists, skip
            skipped++;
            restoreUser(index + 1);
          } else {
            // Restore user
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
          }
        });
      };
      
      restoreUser(0);
    } catch (error) {
      console.error('❌ Error in restoreUsersFromBackup:', error);
      reject(error);
    }
  });
};

// Save backup to environment variable (simple approach)
const saveBackupToEnv = async () => {
  try {
    const users = await backupAllUsers();
    const backupData = JSON.stringify(users);
    
    console.log('📝 User backup data (copy this to your Render environment variables):');
    console.log('Key: USER_BACKUP_DATA');
    console.log('Value:', backupData);
    
    return backupData;
  } catch (error) {
    console.error('❌ Error saving backup to env:', error);
    throw error;
  }
};

// Load backup from environment variable
const loadBackupFromEnv = async () => {
  try {
    const backupData = process.env.USER_BACKUP_DATA;
    
    if (!backupData) {
      console.log('ℹ️  No backup data found in environment variables');
      return;
    }
    
    console.log('🔄 Loading users from backup...');
    const users = JSON.parse(backupData);
    
    const result = await restoreUsersFromBackup(users);
    console.log(`✅ Backup restore complete: ${result.restored} users restored`);
    
    return result;
  } catch (error) {
    console.error('❌ Error loading backup from env:', error);
    throw error;
  }
};

module.exports = {
  backupAllUsers,
  restoreUsersFromBackup,
  saveBackupToEnv,
  loadBackupFromEnv
};
