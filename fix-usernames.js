const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Fixing usernames for existing users...');

db.serialize(() => {
  // Get all users without usernames
  db.all('SELECT id, email FROM users WHERE username IS NULL', (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }
    
    console.log(`Found ${users.length} users without usernames`);
    
    users.forEach((user, index) => {
      // Generate a username based on email or ID
      let username;
      if (user.email) {
        username = user.email.split('@')[0] + (index + 1);
      } else {
        username = `user${user.id}`;
      }
      
      // Update the user with a username
      db.run('UPDATE users SET username = ? WHERE id = ?', [username, user.id], function(err) {
        if (err) {
          console.error(`Error updating user ${user.id}:`, err);
        } else {
          console.log(`Updated user ${user.id} with username: ${username}`);
        }
      });
    });
    
    // Close database after all updates
    setTimeout(() => {
      console.log('Username updates completed!');
      db.close();
    }, 1000);
  });
});












