// Backup endpoints for user data persistence
const express = require('express');
const { backupAllUsers, saveBackupToEnv } = require('../utils/backupUsers');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get backup data (for manual copying)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await backupAllUsers();
    
    res.json({
      message: 'User backup data retrieved successfully',
      count: users.length,
      backup_data: JSON.stringify(users),
      instructions: {
        step1: 'Copy the backup_data value',
        step2: 'Go to Render dashboard > Environment',
        step3: 'Add environment variable: USER_BACKUP_DATA',
        step4: 'Paste the backup_data as the value',
        step5: 'Redeploy your service'
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Create emergency user (for when database is wiped)
router.post('/create-user', async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const bcrypt = require('bcryptjs');
    const { getDatabase } = require('../database/init');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = getDatabase();
    
    // Create user
    db.run('INSERT INTO users (email, password_hash, first_name, last_name, username, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, username, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        const userId = this.lastID;
        console.log(`✅ Emergency user created: ${email} (ID: ${userId})`);
        
        // Create basic profile to prevent onboarding redirect
        db.run('INSERT INTO user_profiles (user_id, daily_calories, daily_protein, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [userId, 2000, 150, new Date().toISOString(), new Date().toISOString()],
          function(profileErr) {
            if (profileErr) {
              console.error('Error creating profile:', profileErr);
            } else {
              console.log(`✅ Basic profile created for user ${userId}`);
            }
            
            res.json({
              success: true,
              message: 'Emergency user created successfully',
              userId: userId,
              email: email,
              note: 'You can now login and will skip onboarding. Remember to create a backup!'
            });
          });
      });
      
  } catch (error) {
    console.error('Error in create-user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Force immediate backup
router.post('/force', authenticateToken, async (req, res) => {
  try {
    const { simpleBackup } = require('../utils/realPersistence');
    const backupResult = await simpleBackup();
    
    res.json({
      success: true,
      message: 'Backup completed successfully',
      data: backupResult,
      instructions: {
        step1: 'Check your Render logs for the backup data',
        step2: 'Copy the full JSON from the logs',
        step3: 'Add it as USER_BACKUP environment variable in Render',
        step4: 'Redeploy your service'
      }
    });
  } catch (error) {
    console.error('Error forcing backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Get backup status and recent activity
router.get('/status', authenticateToken, (req, res) => {
  try {
    const { getDatabase } = require('../database/init');
    const db = getDatabase();
    
    // Get user count
    db.get('SELECT COUNT(*) as userCount FROM users', (err, userResult) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to get user count' });
      }
      
      // Get recent activity
      db.get('SELECT COUNT(*) as mealCount FROM meals WHERE meal_date >= date("now", "-7 days")', (mealErr, mealResult) => {
        if (mealErr) {
          return res.status(500).json({ error: 'Failed to get meal count' });
        }
        
        const backupData = process.env.USER_BACKUP;
        const hasBackup = !!backupData;
        let backupUserCount = 0;
        
        if (hasBackup) {
          try {
            const parsed = JSON.parse(backupData);
            backupUserCount = Array.isArray(parsed) ? parsed.length : (parsed.users?.length || 0);
          } catch (e) {
            // Invalid backup data
          }
        }
        
        res.json({
          status: 'Active',
          currentUsers: userResult.userCount,
          backupUsers: backupUserCount,
          hasBackup: hasBackup,
          recentMeals: mealResult.mealCount,
          autoBackupTriggers: [
            'User registration',
            'Profile creation (onboarding completion)', 
            'Meal addition (every 5 minutes max)'
          ],
          lastBackupCheck: new Date().toISOString(),
          recommendation: userResult.userCount > backupUserCount ? 
            'Current users exceed backup count - trigger manual backup' : 
            'Backup appears up to date'
        });
      });
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ error: 'Failed to get backup status' });
  }
});

// Display backup instructions
router.get('/instructions', (req, res) => {
  res.json({
    title: 'User Data Persistence Instructions',
    problem: 'Render free tier resets database on redeploy',
    solution: 'Backup users to environment variables',
    steps: [
      '1. After creating users, visit: /api/backup/users',
      '2. Copy the backup_data value from the response',
      '3. Go to Render dashboard > Your Service > Environment',
      '4. Add new environment variable:',
      '   Key: USER_BACKUP_DATA',
      '   Value: [paste the backup_data]',
      '5. Click Save Changes',
      '6. Redeploy your service',
      '7. Your users will be restored automatically on startup'
    ],
    automatic: 'This backup/restore happens automatically on each deployment'
  });
});

module.exports = router;
