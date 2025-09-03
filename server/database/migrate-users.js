const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'nutrition.db');
console.log('Database path:', dbPath);
console.log('Database exists:', require('fs').existsSync(dbPath));
const db = new sqlite3.Database(dbPath);

console.log('Starting user migration...');

// Function to add default usernames to existing users
function migrateUsers() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, check if username column exists
      db.get("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
          console.error('Error checking table schema:', err);
          reject(err);
          return;
        }
        
        console.log('Checking users table schema...');
        
        // Get all users without usernames
        db.all("SELECT id, email, first_name, last_name FROM users WHERE username IS NULL OR username = ''", (err, users) => {
          if (err) {
            console.error('Error getting users without usernames:', err);
            reject(err);
            return;
          }
          
          console.log(`Found ${users.length} users without usernames`);
          
          if (users.length === 0) {
            console.log('All users already have usernames');
            resolve();
            return;
          }
          
          // Update each user with a default username
          let completed = 0;
          users.forEach(user => {
            const defaultUsername = `user${user.id}`;
            console.log(`Updating user ${user.id} (${user.email}) with username: ${defaultUsername}`);
            
            db.run("UPDATE users SET username = ? WHERE id = ?", [defaultUsername, user.id], function(err) {
              if (err) {
                console.error(`Error updating user ${user.id}:`, err);
              } else {
                console.log(`Updated user ${user.id} with username: ${defaultUsername}`);
              }
              
              completed++;
              if (completed === users.length) {
                console.log('All users updated with default usernames');
                resolve();
              }
            });
          });
        });
      });
    });
  });
}

// Function to ensure all users have profiles
function ensureUserProfiles() {
  return new Promise((resolve, reject) => {
    console.log('Ensuring all users have profiles...');
    
    db.all("SELECT u.id FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.id IS NULL", (err, users) => {
      if (err) {
        console.error('Error checking for users without profiles:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${users.length} users without profiles`);
      
      if (users.length === 0) {
        console.log('All users already have profiles');
        resolve();
        return;
      }
      
      // Create profiles for users who don't have them
      let completed = 0;
      users.forEach(user => {
        console.log(`Creating profile for user ${user.id}`);
        
        db.run("INSERT INTO user_profiles (user_id) VALUES (?)", [user.id], function(err) {
          if (err) {
            console.error(`Error creating profile for user ${user.id}:`, err);
          } else {
            console.log(`Created profile for user ${user.id}`);
          }
          
          completed++;
          if (completed === users.length) {
            console.log('All user profiles created');
            resolve();
          }
        });
      });
    });
  });
}

// Function to verify the migration
function verifyMigration() {
  return new Promise((resolve, reject) => {
    console.log('Verifying migration...');
    
    db.all("SELECT u.id, u.email, u.username, CASE WHEN up.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_profile FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id", (err, users) => {
      if (err) {
        console.error('Error verifying migration:', err);
        reject(err);
        return;
      }
      
      console.log('\nMigration verification results:');
      console.log('ID | Email | Username | Has Profile');
      console.log('---|-------|----------|-------------');
      users.forEach(user => {
        console.log(`${user.id} | ${user.email} | ${user.username} | ${user.has_profile}`);
      });
      
      resolve();
    });
  });
}

// Run the migration
async function runMigration() {
  try {
    await migrateUsers();
    await ensureUserProfiles();
    await verifyMigration();
    
    console.log('\nMigration completed successfully!');
    db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

runMigration();
