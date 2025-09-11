const express = require('express');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get diary entries (meals) for a specific date
router.get('/date/:date', authenticateToken, async (req, res) => {
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
        protein: parseInt(day.total_protein),
        carbs: parseInt(day.total_carbs),
        fat: parseInt(day.total_fat)
      },
      mealCount: parseInt(day.meal_count)
    }));

    res.json(summary);
  } catch (error) {
    console.error('Get diary summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get diary for a specific month (frontend expects this)
router.get('/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    // Get first and last day of the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

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

    const monthData = result.rows.map(day => ({
      date: day.meal_date,
      totals: {
        calories: parseInt(day.total_calories),
        protein: parseInt(day.total_protein),
        carbs: parseInt(day.total_carbs),
        fat: parseInt(day.total_fat)
      },
      mealCount: parseInt(day.meal_count)
    }));

    res.json(monthData);
  } catch (error) {
    console.error('Get month diary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get week summary (frontend expects this)
router.get('/week/:startDate', authenticateToken, async (req, res) => {
  try {
    const { startDate } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    // Calculate end date (6 days after start date)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endDate = end.toISOString().split('T')[0];

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

    const weekData = result.rows.map(day => ({
      date: day.meal_date,
      totals: {
        calories: parseInt(day.total_calories),
        protein: parseInt(day.total_protein),
        carbs: parseInt(day.total_carbs),
        fat: parseInt(day.total_fat)
      },
      mealCount: parseInt(day.meal_count)
    }));

    res.json(weekData);
  } catch (error) {
    console.error('Get week diary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get month summary (frontend expects this)
router.get('/month/:year/:month/summary', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    // Get first and last day of the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    const result = await pool.query(`
      SELECT 
        AVG(calories) as avg_calories,
        AVG(protein) as avg_protein,
        AVG(carbs) as avg_carbs,
        AVG(fat) as avg_fat,
        SUM(calories) as total_calories,
        COUNT(DISTINCT meal_date) as days_logged
      FROM meals 
      WHERE user_id = $1 AND meal_date >= $2 AND meal_date <= $3
    `, [userId, startDate, endDate]);

    const summary = result.rows[0];

    res.json({
      month: parseInt(month),
      year: parseInt(year),
      averages: {
        calories: Math.round(parseFloat(summary.avg_calories) || 0),
        protein: Math.round(parseFloat(summary.avg_protein) || 0),
        carbs: Math.round(parseFloat(summary.avg_carbs) || 0),
        fat: Math.round(parseFloat(summary.avg_fat) || 0)
      },
      totals: {
        calories: parseInt(summary.total_calories) || 0
      },
      daysLogged: parseInt(summary.days_logged) || 0
    });
  } catch (error) {
    console.error('Get month summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
