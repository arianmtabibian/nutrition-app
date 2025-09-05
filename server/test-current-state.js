const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing current database state...');
console.log('Database path:', dbPath);
console.log('Database exists:', require('fs').existsSync(dbPath));

// Test 1: Check database connection and basic queries
function testDatabaseConnection() {
  return new Promise((resolve, reject) => {
    console.log('\n=== TEST 1: DATABASE CONNECTION ===');
    
    // Test basic query
    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
      if (err) {
        console.error('Database connection test failed:', err);
        reject(err);
        return;
      }
      
      console.log(`Database connection successful. Found ${result.count} users.`);
      resolve();
    });
  });
}

// Test 2: Check specific user (ID 1)
function testSpecificUser() {
  return new Promise((resolve, reject) => {
    console.log('\n=== TEST 2: SPECIFIC USER TEST ===');
    
    const userId = 1;
    console.log(`Testing user ID: ${userId}`);
    
    // Get user
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('Error getting user:', err);
        reject(err);
        return;
      }
      
      if (!user) {
        console.log('❌ User not found in database');
        reject(new Error('User not found'));
        return;
      }
      
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      });
      
      // Get profile
      db.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId], (err, profile) => {
        if (err) {
          console.error('Error getting profile:', err);
          reject(err);
          return;
        }
        
        if (!profile) {
          console.log('❌ Profile not found for user');
          reject(new Error('Profile not found'));
          return;
        }
        
        console.log('✅ Profile found:', {
          id: profile.id,
          user_id: profile.user_id,
          daily_calories: profile.daily_calories,
          daily_protein: profile.daily_protein,
          weight: profile.weight,
          height: profile.height,
          age: profile.age
        });
        
        resolve();
      });
    });
  });
}

// Test 3: Simulate the exact query from the social profile route
function testSocialProfileQuery() {
  return new Promise((resolve, reject) => {
    console.log('\n=== TEST 3: SOCIAL PROFILE QUERY SIMULATION ===');
    
    const userId = 1;
    console.log(`Simulating social profile query for user ID: ${userId}`);
    
    // This is the exact query from the social profile route
    db.get('SELECT id, email, first_name, last_name, username FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('❌ Social profile query failed:', err);
        reject(err);
        return;
      }
      
      if (!user) {
        console.log('❌ User not found in social profile query');
        reject(new Error('User not found in social profile query'));
        return;
      }
      
      console.log('✅ Social profile query successful:', user);
      
      // Now get the profile
      db.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId], (err, profile) => {
        if (err) {
          console.error('❌ Profile query failed:', err);
          reject(err);
          return;
        }
        
        if (!profile) {
          console.log('❌ Profile not found in social profile query');
          reject(new Error('Profile not found in social profile query'));
          return;
        }
        
        console.log('✅ Profile query successful:', {
          id: profile.id,
          user_id: profile.user_id,
          daily_calories: profile.daily_calories,
          daily_protein: profile.daily_protein
        });
        
        resolve();
      });
    });
  });
}

// Test 4: Check all users and their profiles
function checkAllUsers() {
  return new Promise((resolve, reject) => {
    console.log('\n=== TEST 4: ALL USERS AND PROFILES ===');
    
    db.all(`
      SELECT u.id, u.email, u.username, u.first_name, u.last_name,
             up.id as profile_id, up.daily_calories, up.daily_protein
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.id
    `, (err, results) => {
      if (err) {
        console.error('Error getting all users:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${results.length} users:`);
      results.forEach(row => {
        const status = row.profile_id ? '✅' : '❌';
        console.log(`${status} ID: ${row.id}, Email: ${row.email}, Username: ${row.username}, Profile: ${row.profile_id ? 'Yes' : 'No'}`);
      });
      
      resolve();
    });
  });
}

// Run all tests
async function runAllTests() {
  try {
    await testDatabaseConnection();
    await testSpecificUser();
    await testSocialProfileQuery();
    await checkAllUsers();
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('The database and profile queries are working correctly!');
    console.log('If you\'re still getting "profile not found", the issue might be:');
    console.log('1. Authentication token mismatch');
    console.log('2. User ID in token doesn\'t match database');
    console.log('3. Frontend calling wrong API endpoint');
    
    db.close();
  } catch (error) {
    console.error('\n❌ TESTS FAILED:', error.message);
    console.log('\nThis explains why the profile page shows "User not found"');
    db.close();
    process.exit(1);
  }
}

runAllTests();






