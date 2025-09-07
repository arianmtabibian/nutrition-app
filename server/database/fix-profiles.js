const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Database path:', dbPath);
console.log('Database exists:', require('fs').existsSync(dbPath));

// Function to add missing columns to user_profiles table
function addMissingColumns() {
  return new Promise((resolve, reject) => {
    console.log('\n=== ADDING MISSING COLUMNS ===\n');
    
    const columnsToAdd = [
      { name: 'bio', sql: 'ALTER TABLE user_profiles ADD COLUMN bio TEXT' },
      { name: 'profile_picture', sql: 'ALTER TABLE user_profiles ADD COLUMN profile_picture TEXT' }
    ];
    
    let completed = 0;
    columnsToAdd.forEach(column => {
      console.log(`Adding column: ${column.name}`);
      
      db.run(column.sql, (err) => {
        if (err) {
          if (err.code === 'SQLITE_ERROR' && err.message.includes('duplicate column name')) {
            console.log(`Column ${column.name} already exists`);
          } else {
            console.error(`Error adding column ${column.name}:`, err);
          }
        } else {
          console.log(`Column ${column.name} added successfully`);
        }
        
        completed++;
        if (completed === columnsToAdd.length) {
          resolve();
        }
      });
    });
  });
}

// Function to ensure all users have profiles with proper data
function ensureUserProfiles() {
  return new Promise((resolve, reject) => {
    console.log('\n=== ENSURING USER PROFILES ===\n');
    
    // Get all users
    db.all("SELECT id, email, first_name, last_name, username FROM users", (err, users) => {
      if (err) {
        console.error('Error getting users:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${users.length} users`);
      
      // Check which users need profiles
      let completed = 0;
      users.forEach(user => {
        console.log(`Checking profile for user ${user.id} (${user.email})`);
        
        db.get("SELECT id FROM user_profiles WHERE user_id = ?", [user.id], (err, profile) => {
          if (err) {
            console.error(`Error checking profile for user ${user.id}:`, err);
          } else if (!profile) {
            console.log(`Creating profile for user ${user.id}`);
            
            // Create profile with default values
            db.run(`
              INSERT INTO user_profiles (
                user_id, daily_calories, daily_protein, weight, height, age, 
                activity_level, gender, target_weight, bio, profile_picture
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              user.id,           // user_id
              2000,              // daily_calories (required)
              150,               // daily_protein (required)
              null,              // weight
              null,              // height
              null,              // age
              'moderate',        // activity_level
              'male',            // gender
              null,              // target_weight
              null,              // bio
              null               // profile_picture
            ], function(err) {
              if (err) {
                console.error(`Error creating profile for user ${user.id}:`, err);
              } else {
                console.log(`Profile created for user ${user.id}`);
              }
              
              completed++;
              if (completed === users.length) {
                resolve();
              }
            });
          } else {
            console.log(`Profile already exists for user ${user.id}`);
            completed++;
            if (completed === users.length) {
              resolve();
            }
          }
        });
      });
    });
  });
}

// Function to verify the fix
function verifyFix() {
  return new Promise((resolve, reject) => {
    console.log('\n=== VERIFICATION ===\n');
    
    db.all(`
      SELECT u.id, u.email, u.username, 
             CASE WHEN up.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_profile,
             up.daily_calories, up.daily_protein
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up.user_id
    `, (err, results) => {
      if (err) {
        console.error('Error verifying fix:', err);
        reject(err);
        return;
      }
      
      console.log('Verification results:');
      console.log('ID | Email | Username | Has Profile | Daily Calories | Daily Protein');
      console.log('---|-------|----------|-------------|----------------|---------------');
      results.forEach(row => {
        console.log(`${row.id} | ${row.email} | ${row.username || 'NULL'} | ${row.has_profile} | ${row.daily_calories || 'NULL'} | ${row.daily_protein || 'NULL'}`);
      });
      
      resolve();
    });
  });
}

// Run the fix
async function runFix() {
  try {
    await addMissingColumns();
    await ensureUserProfiles();
    await verifyFix();
    
    console.log('\n=== FIX COMPLETED SUCCESSFULLY ===');
    db.close();
  } catch (error) {
    console.error('Fix failed:', error);
    db.close();
    process.exit(1);
  }
}

runFix();








