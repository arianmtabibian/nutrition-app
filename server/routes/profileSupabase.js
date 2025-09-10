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

    const responseData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      profile: {
        profilePicture: profile.profile_picture,
        bio: profile.bio,
        daily_calories: profile.daily_calories,
        daily_protein: profile.daily_protein,
        weight: profile.weight,
        target_weight: profile.target_weight,
        height: profile.height,
        age: profile.age,
        activity_level: profile.activity_level,
        gender: profile.gender
      },
      hasCompletedOnboarding: profile.daily_calories !== null && 
        profile.daily_calories !== undefined && 
        profile.daily_calories > 0 &&
        profile.daily_protein !== null && 
        profile.daily_protein !== undefined && 
        profile.daily_protein > 0
    };

    console.log('🔧 ProfileSupabase: GET response for user', userId);
    console.log('🔧 ProfileSupabase: User name:', user.first_name, user.last_name);
    console.log('🔧 ProfileSupabase: Profile data:', profile);
    console.log('🔧 ProfileSupabase: Full response:', responseData);

    res.json(responseData);
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

// Create or update current user's profile (simplified endpoint for onboarding)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔧 ProfileSupabase: POST /create endpoint hit by user:', userId);
    
    const {
      daily_calories,
      daily_protein,
      weight,
      target_weight,
      height,
      age,
      activity_level,
      gender
    } = req.body;

    console.log('🔧 ProfileSupabase: Create profile request:', req.body);
    
    // Validate required fields
    if (!daily_calories || !daily_protein) {
      return res.status(400).json({ 
        error: 'Daily calories and daily protein are required'
      });
    }

    const pool = getSupabasePool();

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      // Create new profile
      console.log('🔧 ProfileSupabase: Creating new profile...');
      const insertResult = await pool.query(
        `INSERT INTO user_profiles (user_id, daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [userId, daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender]
      );
      console.log('✅ ProfileSupabase: New profile created:', insertResult.rows[0]);
    } else {
      // Update existing profile
      console.log('🔧 ProfileSupabase: Updating existing profile...');
      const updateResult = await pool.query(
        `UPDATE user_profiles SET 
         daily_calories = $1,
         daily_protein = $2,
         weight = $3,
         target_weight = $4,
         height = $5,
         age = $6,
         activity_level = $7,
         gender = $8,
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $9 RETURNING *`,
        [daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender, userId]
      );
      console.log('✅ ProfileSupabase: Profile updated:', updateResult.rows[0]);
    }

    res.json({ message: 'Profile created/updated successfully' });
  } catch (error) {
    console.error('❌ ProfileSupabase: Create profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update current user's profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get from JWT token
    console.log('🔧 ProfileSupabase: PUT / endpoint hit by user:', userId);
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

    console.log('🔧 ProfileSupabase: Profile update request received');
    console.log('🔧 ProfileSupabase: User ID:', userId);
    console.log('🔧 ProfileSupabase: Raw request body:', req.body);
    
    // Validate required fields for onboarding
    if (!finalDailyCalories || !finalDailyProtein) {
      console.error('❌ ProfileSupabase: Missing required fields');
      return res.status(400).json({ 
        error: 'Daily calories and daily protein are required',
        received: { finalDailyCalories, finalDailyProtein }
      });
    }

    console.log('🔧 ProfileSupabase: Final values:');
    console.log('  - finalDailyCalories:', finalDailyCalories);
    console.log('  - finalDailyProtein:', finalDailyProtein);
    console.log('  - weight:', weight);
    console.log('  - finalTargetWeight:', finalTargetWeight);
    console.log('  - height:', height);
    console.log('  - age:', age);
    console.log('  - finalActivityLevel:', finalActivityLevel);
    console.log('  - gender:', gender);

    const pool = getSupabasePool();

    // Database operations with proper error handling
    try {
      // Update user basic info if provided
      if (firstName || lastName || username) {
        console.log('🔧 ProfileSupabase: Updating user basic info...');
        await pool.query(
          'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), username = COALESCE($3, username), updated_at = CURRENT_TIMESTAMP WHERE id = $4',
          [firstName, lastName, username, userId]
        );
        console.log('✅ ProfileSupabase: User basic info updated');
      }

      // Check if profile exists
      console.log('🔧 ProfileSupabase: Checking if profile exists...');
      const existingProfile = await pool.query(
        'SELECT id FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      if (existingProfile.rows.length === 0) {
        // Create new profile with safe defaults
        console.log('🔧 ProfileSupabase: Creating new profile...');
        const insertResult = await pool.query(
          `INSERT INTO user_profiles (user_id, profile_picture, bio, daily_calories, daily_protein, weight, target_weight, height, age, activity_level, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            userId, 
            profilePicture || null, 
            bio || null, 
            finalDailyCalories, 
            finalDailyProtein, 
            weight || null, 
            finalTargetWeight || null, 
            height || null, 
            age || null, 
            finalActivityLevel || 'moderate', 
            gender || 'male'
          ]
        );
        console.log('✅ ProfileSupabase: New profile created:', insertResult.rows[0]);
      } else {
        // Update existing profile
        console.log('🔧 ProfileSupabase: Updating existing profile...');
        const updateResult = await pool.query(
          `UPDATE user_profiles SET 
           profile_picture = COALESCE($1, profile_picture),
           bio = COALESCE($2, bio),
           daily_calories = $3,
           daily_protein = $4,
           weight = COALESCE($5, weight),
           target_weight = COALESCE($6, target_weight),
           height = COALESCE($7, height),
           age = COALESCE($8, age),
           activity_level = COALESCE($9, activity_level),
           gender = COALESCE($10, gender),
           updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $11 RETURNING *`,
          [profilePicture, bio, finalDailyCalories, finalDailyProtein, weight, finalTargetWeight, height, age, finalActivityLevel, gender, userId]
        );
        console.log('✅ ProfileSupabase: Profile updated:', updateResult.rows[0]);
      }
    } catch (dbError) {
      console.error('❌ ProfileSupabase: Database operation failed:', dbError);
      console.error('❌ ProfileSupabase: Error details:', dbError.message);
      console.error('❌ ProfileSupabase: Error code:', dbError.code);
      console.error('❌ ProfileSupabase: Full error stack:', dbError.stack);
      console.error('❌ ProfileSupabase: Request body that caused error:', req.body);
      console.error('❌ ProfileSupabase: User ID:', userId);
      return res.status(500).json({ 
        error: 'Database operation failed', 
        details: dbError.message,
        code: dbError.code,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }

    console.log('✅ ProfileSupabase: Profile update completed successfully');
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('❌ ProfileSupabase: Update profile error:', error);
    console.error('❌ ProfileSupabase: Full error:', error.stack);
    console.error('❌ ProfileSupabase: Request body:', req.body);
    console.error('❌ ProfileSupabase: User from token:', req.user);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
