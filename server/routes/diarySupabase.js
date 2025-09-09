const express = require('express');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get diary entries (meals) for a specific date
router.get('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(
      'SELECT * FROM meals WHERE user_id = $1 AND meal_date = $2 ORDER BY created_at ASC',
      [userId, date]
    );

    const meals = result.rows.map(meal => ({
      id: meal.id,
      userId: meal.user_id,
      mealDate: meal.meal_date,
      mealType: meal.meal_type,
      title: meal.title,
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      sugar: meal.sugar,
      sodium: meal.sodium,
      createdAt: meal.created_at
    }));

    // Calculate totals for the day
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      fiber: acc.fiber + meal.fiber,
      sugar: acc.sugar + meal.sugar,
      sodium: acc.sodium + meal.sodium
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });

    // Get user's daily goals
    const profileResult = await pool.query(
      'SELECT daily_calories, daily_protein FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const profile = profileResult.rows[0] || {};

    res.json({
      date,
      meals,
      totals,
      goals: {
        calories: profile.daily_calories || 2000,
        protein: profile.daily_protein || 150
      }
    });
  } catch (error) {
    console.error('Get diary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get diary summary for a date range
router.get('/summary/:startDate/:endDate', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        meal_date,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fat) as total_fat,
        COUNT(*) as meal_count
      FROM meals 
      WHERE user_id = $1 AND meal_date >= $2 AND meal_date <= $3
      GROUP BY meal_date
      ORDER BY meal_date ASC
    `, [userId, startDate, endDate]);

    const summary = result.rows.map(day => ({
      date: day.meal_date,
      totals: {
        calories: parseInt(day.total_calories),
        protein: parseFloat(day.total_protein),
        carbs: parseFloat(day.total_carbs),
        fat: parseFloat(day.total_fat)
      },
      mealCount: parseInt(day.meal_count)
    }));

    res.json(summary);
  } catch (error) {
    console.error('Get diary summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
