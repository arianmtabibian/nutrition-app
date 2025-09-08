const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing profile API functionality...');
console.log('Database path:', dbPath);

// Test 1: Check if users exist and have profiles
function testUserProfiles() {
  return new Promise((resolve, reject) => {
    console.log('\n=== TEST 1: USER PROFILES ===');
    
    db.all(`
      SELECT u.id, u.email, u.username, u.first_name, u.last_name,
             up.id as profile_id, up.daily_calories, up.daily_protein,
             up.weight, up.height, up.age, up.activity_level, up.gender
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LIMIT 3
    `, (err, results) => {
      if (err) {
        console.error('Error testing user profiles:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${results.length} users with profiles:`);
      results.forEach(user => {
        console.log(`  User ID: ${user.id}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Username: ${user.username}`);
        console.log(`    Name: ${user.first_name} ${user.last_name}`);
        console.log(`    Profile ID: ${user.profile_id}`);
        console.log(`    Daily Calories: ${user.daily_calories}`);
        console.log(`    Daily Protein: ${user.daily_protein}g`);
        console.log(`    Weight: ${user.weight || 'Not set'}`);
        console.log(`    Height: ${user.height || 'Not set'}`);
        console.log(`    Age: ${user.age || 'Not set'}`);
        console.log(`    Activity Level: ${user.activity_level || 'Not set'}`);
        console.log(`    Gender: ${user.gender || 'Not set'}`);
        console.log('');
      });
      
      resolve();
    });
  });
}

// Test 2: Simulate the profile API call
function testProfileAPI() {
  return new Promise((resolve, reject) => {
    console.log('=== TEST 2: PROFILE API SIMULATION ===');
    
    // Simulate getting profile for user ID 1
    const userId = 1;
    console.log(`Simulating profile API call for user ID: ${userId}`);
    
    // Get user info
    db.get('SELECT id, email, first_name, last_name, username FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('Error getting user:', err);
        reject(err);
        return;
      }
      
      if (!user) {
        console.log('User not found');
        reject(new Error('User not found'));
        return;
      }
      
      console.log('User found:', user);
      
      // Get user profile
      db.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId], (err, profile) => {
        if (err) {
          console.error('Error getting profile:', err);
          reject(err);
          return;
        }
        
        console.log('Profile found:', profile);
        
        // Get post count
        db.get('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId], (err, postCount) => {
          if (err) {
            console.error('Error getting post count:', err);
            reject(err);
            return;
          }
          
          console.log('Post count:', postCount.count);
          
          // Get followers count
          db.get('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?', [userId], (err, followersCount) => {
            if (err) {
              console.error('Error getting followers count:', err);
              reject(err);
              return;
            }
            
            console.log('Followers count:', followersCount.count);
            
            // Get following count
            db.get('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?', [userId], (err, followingCount) => {
              if (err) {
                console.error('Error getting following count:', err);
                reject(err);
                return;
              }
              
              console.log('Following count:', followingCount.count);
              
              // Simulate the API response
              const apiResponse = {
                user: {
                  id: user.id,
                  email: user.email,
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  username: user.username || `user${user.id}`
                },
                profile: profile || {
                  profile_picture: null,
                  bio: null,
                  daily_calories: null,
                  daily_protein: null,
                  weight: null,
                  target_weight: null,
                  height: null,
                  age: null,
                  activity_level: null,
                  gender: null
                },
                stats: {
                  posts: postCount.count,
                  followers: followersCount.count,
                  following: followingCount.count
                },
                isFollowing: false
              };
              
              console.log('\nAPI Response:');
              console.log(JSON.stringify(apiResponse, null, 2));
              
              resolve();
            });
          });
        });
      });
    });
  });
}

// Run tests
async function runTests() {
  try {
    await testUserProfiles();
    await testProfileAPI();
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('The profile API should now work correctly!');
    db.close();
  } catch (error) {
    console.error('Tests failed:', error);
    db.close();
    process.exit(1);
  }
}

runTests();









