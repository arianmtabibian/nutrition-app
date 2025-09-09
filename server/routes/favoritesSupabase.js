const express = require('express');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's favorite meals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        m.*,
        f.created_at as favorited_at
      FROM favorites f
      JOIN meals m ON f.meal_id = m.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    const favorites = result.rows.map(meal => ({
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
      createdAt: meal.created_at,
      favoritedAt: meal.favorited_at
    }));

    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add meal to favorites
router.post('/:mealId', authenticateToken, async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    // Check if meal exists and belongs to user or is public
    const mealResult = await pool.query('SELECT id FROM meals WHERE id = $1', [mealId]);
    
    if (mealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Check if already favorited
    const existingFavorite = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND meal_id = $2',
      [userId, mealId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(400).json({ error: 'Meal already in favorites' });
    }

    // Add to favorites
    await pool.query(
      'INSERT INTO favorites (user_id, meal_id) VALUES ($1, $2)',
      [userId, mealId]
    );

    res.status(201).json({ message: 'Meal added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove meal from favorites
router.delete('/:mealId', authenticateToken, async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND meal_id = $2 RETURNING id',
      [userId, mealId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Meal removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
