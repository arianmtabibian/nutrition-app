const express = require('express');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint for meals API
router.get('/health', async (req, res) => {
  try {
    console.log('🔧 MealsSupabase: Health check requested');
    console.log('🔧 MealsSupabase: Request origin:', req.headers.origin);
    
    const pool = getSupabasePool();
    
    // Simple connection test
    const result = await pool.query('SELECT 1 as test');
    
    res.json({
      message: 'Meals API is healthy',
      timestamp: new Date().toISOString(),
      origin: req.headers.origin,
      database: 'connected'
    });
  } catch (error) {
    console.error('❌ MealsSupabase: Health check error:', error);
    res.status(500).json({ 
      error: 'Meals API health check failed',
      details: error.message 
    });
  }
});

// Get all meals for a user (with optional date filter)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, limit = 50 } = req.query;
    const userId = req.user.userId;
    console.log('🔧 MealsSupabase: GET / endpoint hit by user:', userId);
    console.log('🔧 MealsSupabase: Request origin:', req.headers.origin);
    console.log('🔧 MealsSupabase: Query params:', { date, limit });
    
    const pool = getSupabasePool();

    let query = 'SELECT * FROM meals WHERE user_id = $1';
    let params = [userId];

    if (date) {
      query += ' AND meal_date = $2';
      params.push(date);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

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

    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get meals for a specific date (frontend expects this route)
router.get('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.userId;
    console.log('🔧 MealsSupabase: GET /:date endpoint hit by user:', userId);
    console.log('🔧 MealsSupabase: Date:', date);
    console.log('🔧 MealsSupabase: Request origin:', req.headers.origin);
    
    const pool = getSupabasePool();

    const result = await pool.query(
      'SELECT * FROM meals WHERE user_id = $1 AND meal_date = $2 ORDER BY created_at DESC',
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

    res.json(meals);
  } catch (error) {
    console.error('Get meals by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get meals for a date range (frontend expects this route)
router.get('/range/:startDate/:endDate', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(
      'SELECT * FROM meals WHERE user_id = $1 AND meal_date >= $2 AND meal_date <= $3 ORDER BY meal_date DESC, created_at DESC',
      [userId, startDate, endDate]
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

    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new meal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔧 MealsSupabase: POST / endpoint hit by user:', userId);
    console.log('🔧 MealsSupabase: Request origin:', req.headers.origin);
    console.log('🔧 MealsSupabase: Request body:', req.body);
    
    const {
      mealDate,
      mealType,
      title,
      description,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium
    } = req.body;

    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(
      `INSERT INTO meals (user_id, meal_date, meal_type, title, description, calories, protein, carbs, fat, fiber, sugar, sodium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [userId, mealDate, mealType, title, description, calories, protein, carbs, fat, fiber, sugar, sodium]
    );

    const meal = result.rows[0];

    res.status(201).json({
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
    });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update meal
router.put('/:mealId', authenticateToken, async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.userId;
    const {
      mealDate,
      mealType,
      title,
      description,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium
    } = req.body;

    const pool = getSupabasePool();

    const result = await pool.query(
      `UPDATE meals SET 
       meal_date = COALESCE($1, meal_date),
       meal_type = COALESCE($2, meal_type),
       title = COALESCE($3, title),
       description = COALESCE($4, description),
       calories = COALESCE($5, calories),
       protein = COALESCE($6, protein),
       carbs = COALESCE($7, carbs),
       fat = COALESCE($8, fat),
       fiber = COALESCE($9, fiber),
       sugar = COALESCE($10, sugar),
       sodium = COALESCE($11, sodium)
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [mealDate, mealType, title, description, calories, protein, carbs, fat, fiber, sugar, sodium, mealId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found or unauthorized' });
    }

    const meal = result.rows[0];

    res.json({
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
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete meal
router.delete('/:mealId', authenticateToken, async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(
      'DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id',
      [mealId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found or unauthorized' });
    }

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
