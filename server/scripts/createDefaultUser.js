// Script to create a default user if none exists
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');

const createDefaultUser = async () => {
  try {
    const db = getDatabase();
    
    // Check if the specific user exists (not just any users)
    db.get('SELECT id FROM users WHERE email = ?', ['arianmtabibian@gmail.com'], async (err, row) => {
      if (err) {
        console.error('Error checking for default user:', err);
        return;
      }
      
      if (!row) {
        console.log('Default user not found, creating arianmtabibian@gmail.com...');
        
        // Create default user
        const email = 'arianmtabibian@gmail.com';
        const password = 'newpassword123';
        const first_name = 'Arian';
        const last_name = 'Tabibian';
        const username = 'arianmtabibian';
        
        const saltRounds = 10; // Reduced for better performance
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        db.run('INSERT INTO users (email, password_hash, first_name, last_name, username) VALUES (?, ?, ?, ?, ?)', 
          [email, passwordHash, first_name, last_name, username], function(err) {
            if (err) {
              console.error('Error creating default user:', err);
            } else {
              console.log('✅ Default user arianmtabibian@gmail.com created successfully with ID:', this.lastID);
              console.log('You can now login with: arianmtabibian@gmail.com / newpassword123');
            }
          });
      } else {
        console.log('✅ Default user arianmtabibian@gmail.com already exists with ID:', row.id);
      }
    });
  } catch (error) {
    console.error('Error in createDefaultUser:', error);
  }
};

module.exports = { createDefaultUser };
