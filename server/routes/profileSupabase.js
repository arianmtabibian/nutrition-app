const express = require('express');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current user's profile (no userId needed)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get from JWT token
    const pool = getSupabasePool();

    // Get user basic info
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, username FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user profile details
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const profile = profileResult.rows[0] || {};

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      profile: {
        profilePicture: profile.profile_picture,
        bio: profile.bio,
        finalDailyCalories: profile.daily_calories,
        finalDailyProtein: profile.daily_protein,
        weight: profile.weight,
        finalTargetWeight: profile.target_weight,
        height: profile.height,
        age: profile.age,
        finalActivityLevel: profile.activity_level,
        gender: profile.gender
      },
      hasCompletedOnboarding: profile.daily_calories !== null && profile.daily_calories !== undefined
    });
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific user profile by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getSupabasePool();

    // Get user basic info
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, username FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user profile details
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const profile = profileResult.rows[0] || {};

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      profile: {
        profilePicture: profile.profile_picture,
        bio: profile.bio,
        finalDailyCalories: profile.daily_calories,
        finalDailyProtein: profile.daily_protein,
        weight: profile.weight,
        finalTargetWeight: profile.target_weight,
        height: profile.height,
        age: profile.age,
        finalActivityLevel: profile.activity_level,
        gender: profile.gender
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user's profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get from JWT token
    const {
      firstName,
      lastName,
      username,
      profilePicture,
      bio,
      dailyCalories,
      dailyProtein,
      weight,
      targetWeight,
      height,
      age,
      activityLevel,
      gender,
      // Also accept snake_case from onboarding
      daily_calories,
      daily_protein,
      target_weight,
      activity_level
    } = req.body;

    // Use snake_case values if camelCase not provided (for onboarding compatibility)
    const finalDailyCalories = dailyCalories || daily_calories;
    const finalDailyProtein = dailyProtein || daily_protein;
    const finalTargetWeight = targetWeight || target_weight;
    const finalActivityLevel = activityLevel || activity_level;

    const pool = getSupabasePool();

    // Update user basic info
    if (firstName || lastName || username) {
      await pool.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), username = COALESCE($3, username), updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [firstName, lastName, username, userId]
      );
    }

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      // Create new profile
      await pool.query(
        `INSERT INTO user_profiles (user_id, profile_picture, bio, daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [userId, profilePicture, bio, finalDailyCalories, finalDailyProtein, weight, finalTargetWeight, height, age, finalActivityLevel, gender]
      );
    } else {
      // Update existing profile
      await pool.query(
        `UPDATE user_profiles SET 
         profile_picture = COALESCE($1, profile_picture),
         bio = COALESCE($2, bio),
         daily_calories = COALESCE($3, daily_calories),
         daily_protein = COALESCE($4, daily_protein),
         weight = COALESCE($5, weight),
         target_weight = COALESCE($6, target_weight),
         height = COALESCE($7, height),
         age = COALESCE($8, age),
         activity_level = COALESCE($9, activity_level),
         gender = COALESCE($10, gender),
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $11`,
        [profilePicture, bio, finalDailyCalories, finalDailyProtein, weight, finalTargetWeight, height, age, finalActivityLevel, gender, userId]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update specific user profile (for admin use)
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      username,
      profilePicture,
      bio,
      finalDailyCalories,
      finalDailyProtein,
      weight,
      finalTargetWeight,
      height,
      age,
      finalActivityLevel,
      gender
    } = req.body;

    const pool = getSupabasePool();

    // Update user basic info
    if (firstName || lastName || username) {
      await pool.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), username = COALESCE($3, username), updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [firstName, lastName, username, userId]
      );
    }

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      // Create new profile
      await pool.query(
        `INSERT INTO user_profiles (user_id, profile_picture, bio, daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [userId, profilePicture, bio, finalDailyCalories, finalDailyProtein, weight, finalTargetWeight, height, age, finalActivityLevel, gender]
      );
    } else {
      // Update existing profile
      await pool.query(
        `UPDATE user_profiles SET 
         profile_picture = COALESCE($1, profile_picture),
         bio = COALESCE($2, bio),
         daily_calories = COALESCE($3, daily_calories),
         daily_protein = COALESCE($4, daily_protein),
         weight = COALESCE($5, weight),
         target_weight = COALESCE($6, target_weight),
         height = COALESCE($7, height),
         age = COALESCE($8, age),
         activity_level = COALESCE($9, activity_level),
         gender = COALESCE($10, gender),
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $11`,
        [profilePicture, bio, finalDailyCalories, finalDailyProtein, weight, finalTargetWeight, height, age, finalActivityLevel, gender, userId]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update specific user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
