// Script to create a default user if none exists
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');

const createDefaultUser = async () => {
  try {
    const db = getDatabase();
    
    // Check if any users exist
    db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
      if (err) {
        console.error('Error checking users:', err);
        return;
      }
      
      if (row.count === 0) {
        console.log('No users found, creating default user...');
        
        // Create default user
        const email = 'arianmtabibian@gmail.com';
        const password = 'newpassword123';
        const first_name = 'Arian';
        const last_name = 'Tabibian';
        const username = 'arianmtabibian';
        
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        db.run('INSERT INTO users (email, password_hash, first_name, last_name, username) VALUES (?, ?, ?, ?, ?)', 
          [email, passwordHash, first_name, last_name, username], function(err) {
            if (err) {
              console.error('Error creating default user:', err);
            } else {
              console.log('Default user created successfully with ID:', this.lastID);
            }
          });
      } else {
        console.log('Users already exist, skipping default user creation');
      }
    });
  } catch (error) {
    console.error('Error in createDefaultUser:', error);
  }
};

module.exports = { createDefaultUser };
