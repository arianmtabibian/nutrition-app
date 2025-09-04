const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Database path:', dbPath);
console.log('Database exists:', require('fs').existsSync(dbPath));

// Function to inspect database schema
function inspectDatabase() {
  return new Promise((resolve, reject) => {
    console.log('\n=== DATABASE SCHEMA INSPECTION ===\n');
    
    // Get all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('Error getting tables:', err);
        reject(err);
        return;
      }
      
      console.log('Tables found:', tables.map(t => t.name));
      
      // Inspect each table
      let completed = 0;
      tables.forEach(table => {
        console.log(`\n--- Table: ${table.name} ---`);
        
        db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
          if (err) {
            console.error(`Error getting schema for ${table.name}:`, err);
          } else {
            console.log('Columns:');
            columns.forEach(col => {
              console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });
          }
          
          completed++;
          if (completed === tables.length) {
            resolve();
          }
        });
      });
    });
  });
}

// Function to check user data
function checkUsers() {
  return new Promise((resolve, reject) => {
    console.log('\n=== USER DATA CHECK ===\n');
    
    db.all("SELECT id, email, first_name, last_name, username FROM users", (err, users) => {
      if (err) {
        console.error('Error getting users:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}, Username: ${user.username || 'NULL'}`);
      });
      
      resolve();
    });
  });
}

// Function to check profile data
function checkProfiles() {
  return new Promise((resolve, reject) => {
    console.log('\n=== PROFILE DATA CHECK ===\n');
    
    db.all("SELECT * FROM user_profiles", (err, profiles) => {
      if (err) {
        console.error('Error getting profiles:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${profiles.length} profiles:`);
      profiles.forEach(profile => {
        console.log(`  User ID: ${profile.user_id}, Profile ID: ${profile.id}`);
      });
      
      resolve();
    });
  });
}

// Run inspection
async function runInspection() {
  try {
    await inspectDatabase();
    await checkUsers();
    await checkProfiles();
    
    console.log('\n=== INSPECTION COMPLETE ===');
    db.close();
  } catch (error) {
    console.error('Inspection failed:', error);
    db.close();
    process.exit(1);
  }
}

runInspection();





