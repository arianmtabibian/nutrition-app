const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');
const { generateMealSummary } = require('../utils/mealSummary');

const router = express.Router();

// Get all favorite meals for a user
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.userId;
    
    db.all('SELECT * FROM favorite_meals WHERE user_id = ? ORDER BY created_at DESC', 
      [userId], (err, favorites) => {
        if (err) {
          console.error('Error fetching favorite meals:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ favorites });
      });
  } catch (error) {
    console.error('Error in get favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a meal to favorites
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, meal_type, description, calories, protein, carbs, fat, fiber, sugar, sodium } = req.body;
    const userId = req.user.userId;
    
    if (!name || !meal_type || !description) {
      return res.status(400).json({ error: 'Name, meal type, and description are required' });
    }
    
    const db = getDatabase();
    
    // Check if this favorite already exists for this user
    db.get('SELECT id FROM favorite_meals WHERE user_id = ? AND name = ?', 
      [userId, name], (err, existing) => {
        if (err) {
          console.error('Error checking existing favorite:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (existing) {
          return res.status(409).json({ error: 'Favorite meal with this name already exists' });
        }
        
        // Insert new favorite meal
        db.run(`INSERT INTO favorite_meals 
          (user_id, name, meal_type, description, calories, protein, carbs, fat, fiber, sugar, sodium) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, name, meal_type, description, calories || 0, protein || 0, carbs || 0, 
           fat || 0, fiber || 0, sugar || 0, sodium || 0],
          function(err) {
            if (err) {
              console.error('Error creating favorite meal:', err);
              return res.status(500).json({ error: 'Failed to create favorite meal' });
            }
            
            const favoriteId = this.lastID;
            
            // Get the created favorite meal
            db.get('SELECT * FROM favorite_meals WHERE id = ?', [favoriteId], (err, favorite) => {
              if (err) {
                console.error('Error fetching created favorite:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              
              res.status(201).json({
                message: 'Favorite meal created successfully',
                favorite
              });
            });
          });
      });
  } catch (error) {
    console.error('Error in create favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a meal to favorites from an existing meal
router.post('/from-meal', authenticateToken, (req, res) => {
  try {
    const { mealId, customName } = req.body;
    const userId = req.user.userId;
    
    if (!mealId) {
      return res.status(400).json({ error: 'Meal ID is required' });
    }
    
    const db = getDatabase();
    
    // Get the meal data
    db.get('SELECT * FROM meals WHERE id = ? AND user_id = ?', [mealId, userId], (err, meal) => {
      if (err) {
        console.error('Error fetching meal:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!meal) {
        return res.status(404).json({ error: 'Meal not found' });
      }
      
      // Generate a name for the favorite (use custom name or generate from description)
      const favoriteName = customName || generateMealSummary(meal.description);
      
      // Check if this favorite already exists for this user
      db.get('SELECT id FROM favorite_meals WHERE user_id = ? AND name = ?', 
        [userId, favoriteName], (err, existing) => {
          if (err) {
            console.error('Error checking existing favorite:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (existing) {
            return res.status(409).json({ error: 'Favorite meal with this name already exists' });
          }
          
          // Insert new favorite meal
          db.run(`INSERT INTO favorite_meals 
            (user_id, name, meal_type, description, calories, protein, carbs, fat, fiber, sugar, sodium) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, favoriteName, meal.meal_type, meal.description, meal.calories, meal.protein, 
             meal.carbs, meal.fat, meal.fiber, meal.sugar, meal.sodium],
            function(err) {
              if (err) {
                console.error('Error creating favorite meal from existing:', err);
                return res.status(500).json({ error: 'Failed to create favorite meal' });
              }
              
              const favoriteId = this.lastID;
              
              // Get the created favorite meal
              db.get('SELECT * FROM favorite_meals WHERE id = ?', [favoriteId], (err, favorite) => {
                if (err) {
                  console.error('Error fetching created favorite:', err);
                  return res.status(500).json({ error: 'Database error' });
                }
                
                res.status(201).json({
                  message: 'Favorite meal created successfully',
                  favorite
                });
              });
            });
        });
    });
  } catch (error) {
    console.error('Error in create favorite from meal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a favorite meal
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const favoriteId = req.params.id;
    const userId = req.user.userId;
    const { name, meal_type, description, calories, protein, carbs, fat, fiber, sugar, sodium } = req.body;
    
    const db = getDatabase();
    
    // Check if favorite belongs to user
    db.get('SELECT id FROM favorite_meals WHERE id = ? AND user_id = ?', 
      [favoriteId, userId], (err, favorite) => {
        if (err) {
          console.error('Error checking favorite ownership:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!favorite) {
          return res.status(404).json({ error: 'Favorite meal not found' });
        }
        
        // Update favorite meal
        db.run(`UPDATE favorite_meals SET 
          name = ?, meal_type = ?, description = ?, calories = ?, protein = ?, 
          carbs = ?, fat = ?, fiber = ?, sugar = ?, sodium = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [name, meal_type, description, calories, protein, carbs, fat, fiber, sugar, sodium, favoriteId],
          function(err) {
            if (err) {
              console.error('Error updating favorite meal:', err);
              return res.status(500).json({ error: 'Failed to update favorite meal' });
            }
            
            // Get the updated favorite meal
            db.get('SELECT * FROM favorite_meals WHERE id = ?', [favoriteId], (err, updatedFavorite) => {
              if (err) {
                console.error('Error fetching updated favorite:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              
              res.json({
                message: 'Favorite meal updated successfully',
                favorite: updatedFavorite
              });
            });
          });
      });
  } catch (error) {
    console.error('Error in update favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a favorite meal
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const favoriteId = req.params.id;
    const userId = req.user.userId;
    
    const db = getDatabase();
    
    // Check if favorite belongs to user and delete
    db.run('DELETE FROM favorite_meals WHERE id = ? AND user_id = ?', 
      [favoriteId, userId], function(err) {
        if (err) {
          console.error('Error deleting favorite meal:', err);
          return res.status(500).json({ error: 'Failed to delete favorite meal' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Favorite meal not found' });
        }
        
        res.json({ message: 'Favorite meal deleted successfully' });
      });
  } catch (error) {
    console.error('Error in delete favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
