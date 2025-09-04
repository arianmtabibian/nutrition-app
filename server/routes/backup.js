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
