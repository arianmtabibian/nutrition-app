const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');
// const { calculateMaintenanceCalories } = require('../services/nutritionService');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.get(`
    SELECT up.*, u.email 
    FROM user_profiles up 
    JOIN users u ON up.user_id = u.id 
    WHERE up.user_id = ?
  `, [req.user.userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.json({ 
        profile: null, 
        email: req.user.email 
      });
    }
    
    res.json({ profile: row, email: row.email });
  });
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { 
      daily_calories, 
      daily_protein, 
      weight, 
      target_weight,
      height, 
      age, 
      activity_level, 
      gender,
      bio
    } = req.body;

    if (!daily_calories || !daily_protein) {
      return res.status(400).json({ 
        error: 'Daily calories and protein goals are required' 
      });
    }

    // Set default values for optional fields if not provided
    const weightValue = weight || null;
    const targetWeightValue = target_weight || null;
    const heightValue = height || null;
    const ageValue = age || null;
    const activityLevelValue = activity_level || 'moderate';
    const genderValue = gender || 'male';

    const db = getDatabase();
    
    // Check if profile exists
    db.get('SELECT id FROM user_profiles WHERE user_id = ?', 
      [req.user.userId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (row) {
          // Update existing profile
          db.run(`
            UPDATE user_profiles 
            SET daily_calories = ?, daily_protein = ?, weight = ?, target_weight = ?, height = ?, 
                age = ?, activity_level = ?, gender = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `, [daily_calories, daily_protein, weightValue, targetWeightValue, heightValue, ageValue, activityLevelValue, genderValue, bio || null, req.user.userId], 
            function(err) {
              if (err) {
                console.error('Database update error:', err);
                return res.status(500).json({ error: 'Failed to update profile' });
              }
              res.json({ message: 'Profile updated successfully' });
            });
        } else {
          // Create new profile
          db.run(`
            INSERT INTO user_profiles 
            (user_id, daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [req.user.userId, daily_calories, daily_protein, weightValue, targetWeightValue, heightValue, ageValue, activityLevelValue, genderValue, bio || null], 
            function(err) {
              if (err) {
                console.error('Database insert error:', err);
                return res.status(500).json({ error: 'Failed to create profile' });
              }
              res.json({ message: 'Profile created successfully' });
            });
        }
      });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Calculate maintenance calories using AI
// router.post('/calculate-calories', authenticateToken, async (req, res) => {
//   try {
//     const { weight, height, age, activity_level, gender } = req.body;
//     
//     if (!weight || !height || !age || !activity_level || !gender) {
//       return res.status(400).json({ 
//         error: 'All fields are required for calculation' 
//       });
//     }

//     const result = await calculateMaintenanceCalories({
//       weight, height, age, activity_level, gender
//     });
    
//     res.json(result);
//   } catch (error) {
//     console.error('Calorie calculation error:', error);
//     res.status(500).json({ 
//       error: 'Failed to calculate calories',
//       message: error.message 
//     });
//   }
// });

module.exports = router;
