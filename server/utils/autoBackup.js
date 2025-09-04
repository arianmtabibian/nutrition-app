// Automatic backup and restore system for ALL users
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../database/init');

const BACKUP_FILE = '/tmp/users_backup.json'; // Temporary storage for current session

// Backup all users to a file
const backupAllUsers = async () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
      
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          console.error('❌ Error backing up users:', err);
          reject(err);
          return;
        }
        
        try {
          // Save to file
          fs.writeFileSync(BACKUP_FILE, JSON.stringify(rows, null, 2));
          console.log(`📦 Backed up ${rows.length} users to file`);
          resolve(rows);
        } catch (fileError) {
          console.error('❌ Error writing backup file:', fileError);
          reject(fileError);
        }
      });
    } catch (error) {
      console.error('❌ Error in backupAllUsers:', error);
      reject(error);
    }
  });
};

// Restore all users from backup file
const restoreAllUsers = async () => {
  try {
    // Check if backup file exists
    if (!fs.existsSync(BACKUP_FILE)) {
      console.log('ℹ️  No backup file found, starting fresh');
      return { restored: 0, skipped: 0 };
    }
    
    const backupData = fs.readFileSync(BACKUP_FILE, 'utf8');
    const users = JSON.parse(backupData);
    
    console.log(`🔄 Restoring ${users.length} users from backup...`);
    
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      let restored = 0;
      let skipped = 0;
      
      const restoreUser = (index) => {
        if (index >= users.length) {
          console.log(`✅ Restore complete: ${restored} restored, ${skipped} skipped`);
          resolve({ restored, skipped });
          return;
        }
        
        const user = users[index];
        
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
    });
    
  } catch (error) {
    console.error('❌ Error in restoreAllUsers:', error);
    return { restored: 0, skipped: 0 };
  }
};

// Auto-backup users periodically (every 5 minutes)
const startAutoBackup = () => {
  console.log('🔄 Starting automatic user backup every 5 minutes...');
  
  // Backup immediately
  backupAllUsers().catch(console.error);
  
  // Then backup every 5 minutes
  setInterval(() => {
    backupAllUsers().catch(console.error);
  }, 5 * 60 * 1000); // 5 minutes
};

module.exports = {
  backupAllUsers,
  restoreAllUsers,
  startAutoBackup
};
