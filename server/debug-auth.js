const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Debugging authentication issues...');
console.log('Database path:', dbPath);
console.log('Database exists:', require('fs').existsSync(dbPath));

// Check user data and password hashes
function checkUserAuthData() {
  return new Promise((resolve, reject) => {
    console.log('\n=== USER AUTHENTICATION DATA ===');
    
    db.all('SELECT id, email, username, password_hash, first_name, last_name FROM users ORDER BY id', (err, users) => {
      if (err) {
        console.error('Error getting users:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`\nUser ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  First Name: ${user.first_name}`);
        console.log(`  Last Name: ${user.last_name}`);
        console.log(`  Password Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);
        console.log(`  Hash Length: ${user.password_hash ? user.password_hash.length : 0}`);
        
        // Check if password hash looks like a valid bcrypt hash
        if (user.password_hash) {
          const isValidBcrypt = user.password_hash.startsWith('$2a$') || 
                               user.password_hash.startsWith('$2b$') || 
                               user.password_hash.startsWith('$2y$');
          console.log(`  Valid Bcrypt Format: ${isValidBcrypt ? '✅ Yes' : '❌ No'}`);
        }
      });
      
      resolve();
    });
  });
}

// Test specific user login simulation
function testUserLogin() {
  return new Promise((resolve, reject) => {
    console.log('\n=== TESTING USER LOGIN SIMULATION ===');
    
    // Test with user ID 1 (arianmtabibian@gmail.com)
    const testEmail = 'arianmtabibian@gmail.com';
    console.log(`Testing login for: ${testEmail}`);
    
    db.get('SELECT id, email, password_hash, first_name, last_name, username FROM users WHERE email = ?', 
      [testEmail], (err, user) => {
        if (err) {
          console.error('Error getting user:', err);
          reject(err);
          return;
        }
        
        if (!user) {
          console.log('❌ User not found');
          reject(new Error('User not found'));
          return;
        }
        
        console.log('✅ User found in database:');
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Password Hash: ${user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'NULL'}`);
        
        if (!user.password_hash) {
          console.log('❌ CRITICAL: No password hash stored!');
          console.log('This explains the "invalid credentials" error.');
        } else if (!user.password_hash.startsWith('$2')) {
          console.log('❌ CRITICAL: Password hash is not in bcrypt format!');
          console.log('This explains the "invalid credentials" error.');
        } else {
          console.log('✅ Password hash format looks correct');
        }
        
        resolve();
      });
  });
}

// Check if there are any users without password hashes
function checkMissingPasswords() {
  return new Promise((resolve, reject) => {
    console.log('\n=== CHECKING FOR MISSING PASSWORDS ===');
    
    db.all('SELECT id, email, username FROM users WHERE password_hash IS NULL OR password_hash = ""', (err, users) => {
      if (err) {
        console.error('Error checking for missing passwords:', err);
        reject(err);
        return;
      }
      
      if (users.length === 0) {
        console.log('✅ All users have password hashes');
      } else {
        console.log(`❌ Found ${users.length} users without password hashes:`);
        users.forEach(user => {
          console.log(`  ID: ${user.id}, Email: ${user.email}, Username: ${user.username}`);
        });
        console.log('\nThis explains the "invalid credentials" error!');
      }
      
      resolve();
    });
  });
}

// Run all checks
async function runDebugChecks() {
  try {
    await checkUserAuthData();
    await testUserLogin();
    await checkMissingPasswords();
    
    console.log('\n=== DEBUG COMPLETE ===');
    console.log('Check the output above to identify the authentication issue.');
    
    db.close();
  } catch (error) {
    console.error('Debug failed:', error);
    db.close();
    process.exit(1);
  }
}

runDebugChecks();



