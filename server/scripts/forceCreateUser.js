// FORCE create specific users - runs every startup
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');

const forceCreateUser = async () => {
  try {
    const db = getDatabase();
    
    // YOUR SPECIFIC USER DATA
    const email = 'arianmtabibian@gmail.com';
    const password = 'newpassword123';
    const first_name = 'Arian';
    const last_name = 'Tabibian';
    const username = 'arianmtabibian';
    
    console.log('🔄 FORCE CREATING USER:', email);
    
    // Delete existing user if exists
    db.run('DELETE FROM users WHERE email = ?', [email], async (err) => {
      if (err) {
        console.error('Error deleting existing user:', err);
      } else {
        console.log('Deleted existing user (if any)');
      }
      
      // Create new user
      try {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        db.run('INSERT INTO users (email, password_hash, first_name, last_name, username) VALUES (?, ?, ?, ?, ?)', 
          [email, passwordHash, first_name, last_name, username], 
          function(err) {
            if (err) {
              console.error('❌ FAILED TO CREATE USER:', err);
            } else {
              console.log('✅ FORCE CREATED USER:', email, 'with ID:', this.lastID);
              console.log('   Login with:', email, '/', password);
            }
          });
      } catch (hashError) {
        console.error('❌ Password hash error:', hashError);
      }
    });
    
  } catch (error) {
    console.error('❌ Error in forceCreateUser:', error);
  }
};

module.exports = { forceCreateUser };
