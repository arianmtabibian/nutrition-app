// Bulletproof script to ensure critical users always exist
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');

// List of users that should ALWAYS exist
const REQUIRED_USERS = [
  {
    email: 'arianmtabibian@gmail.com',
    password: 'newpassword123',
    first_name: 'Arian',
    last_name: 'Tabibian',
    username: 'arianmtabibian'
  }
];

const ensureDefaultUsers = async () => {
  try {
    const db = getDatabase();
    
    console.log('🔄 Checking for required users...');
    
    for (const userData of REQUIRED_USERS) {
      // Check if user exists
      await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE email = ?', [userData.email], async (err, row) => {
          if (err) {
            console.error(`❌ Error checking for user ${userData.email}:`, err);
            reject(err);
            return;
          }
          
          if (!row) {
            console.log(`🔄 Creating user: ${userData.email}`);
            
            try {
              const saltRounds = 10; // Reduced for better performance
              const passwordHash = await bcrypt.hash(userData.password, saltRounds);
              
              db.run('INSERT INTO users (email, password_hash, first_name, last_name, username) VALUES (?, ?, ?, ?, ?)', 
                [userData.email, passwordHash, userData.first_name, userData.last_name, userData.username], 
                function(err) {
                  if (err) {
                    console.error(`❌ Error creating user ${userData.email}:`, err);
                    reject(err);
                  } else {
                    console.log(`✅ User ${userData.email} created successfully with ID: ${this.lastID}`);
                    console.log(`   Login: ${userData.email} / ${userData.password}`);
                    resolve();
                  }
                });
            } catch (hashError) {
              console.error(`❌ Error hashing password for ${userData.email}:`, hashError);
              reject(hashError);
            }
          } else {
            console.log(`✅ User ${userData.email} already exists with ID: ${row.id}`);
            resolve();
          }
        });
      });
    }
    
    console.log('✅ All required users verified/created');
  } catch (error) {
    console.error('❌ Error in ensureDefaultUsers:', error);
  }
};

module.exports = { ensureDefaultUsers };
