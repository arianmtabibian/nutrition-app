const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');
const { analyzeMeal } = require('../services/nutritionService');

const router = express.Router();

// Add a new meal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { meal_date, meal_type, description } = req.body;

    if (!meal_date || !meal_type || !description) {
      return res.status(400).json({ 
        error: 'Meal date, type, and description are required' 
      });
    }

    // Check if manual macros are provided
    const { calories, protein, carbs, fat, fiber, sugar, sodium } = req.body;
    
    let nutritionInfo;
    
    // If manual macros are provided, use them instead of AI analysis
    if (calories !== undefined && protein !== undefined && carbs !== undefined && 
        fat !== undefined && fiber !== undefined && sugar !== undefined && sodium !== undefined) {
      console.log('Using manual macro values:', { calories, protein, carbs, fat, fiber, sugar, sodium });
      nutritionInfo = {
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        sodium: parseFloat(sodium) || 0,
        notes: 'Manually entered values'
      };
    } else {
      // Analyze meal using AI
      try {
        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
          throw new Error('OpenAI API key not configured');
        }
        
        nutritionInfo = await analyzeMeal(description);
        console.log('AI nutrition analysis completed:', nutritionInfo);
      } catch (error) {
        console.error('AI analysis failed, using fallback values:', error.message);
        
        // Provide specific error messages based on the failure reason
        let errorNote = 'AI analysis failed';
        if (error.message === 'OpenAI API key not configured') {
          errorNote = 'OpenAI API key not configured - please add your API key to .env file';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorNote = 'OpenAI API key invalid - please check your API key';
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
          errorNote = 'OpenAI API rate limit exceeded - please try again later';
        } else {
          errorNote = 'AI analysis failed - please check your OpenAI API key and internet connection';
        }
        
        // Fallback to default values if AI analysis fails
        nutritionInfo = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          notes: errorNote
        };
      }
    }
    
    const db = getDatabase();
    
    // Insert meal
    db.run(`
      INSERT INTO meals (user_id, meal_date, meal_type, description, calories, protein, carbs, fat, fiber, sugar, sodium)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.userId, 
      meal_date, 
      meal_type, 
      description, 
      nutritionInfo.calories, 
      nutritionInfo.protein,
      nutritionInfo.carbs,
      nutritionInfo.fat,
      nutritionInfo.fiber,
      nutritionInfo.sugar,
      nutritionInfo.sodium
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save meal' });
      }
      
      res.status(201).json({
        message: 'Meal added successfully',
        meal: {
          id: this.lastID,
          meal_date,
          meal_type,
          description,
          calories: nutritionInfo.calories,
          protein: nutritionInfo.protein,
          carbs: nutritionInfo.carbs,
          fat: nutritionInfo.fat,
          fiber: nutritionInfo.fiber,
          sugar: nutritionInfo.sugar,
          sodium: nutritionInfo.sodium,
          notes: nutritionInfo.notes
        }
      });
    });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({ 
      error: 'Failed to add meal',
      message: error.message 
    });
  }
});

// Get meals for a specific date
router.get('/:date', authenticateToken, (req, res) => {
  const { date } = req.params;
  const db = getDatabase();
  
  db.all(`
    SELECT * FROM meals 
    WHERE user_id = ? AND meal_date = ?
    ORDER BY created_at ASC
  `, [req.user.userId, date], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ meals: rows });
  });
});

// Get meals for a date range
router.get('/range/:startDate/:endDate', authenticateToken, (req, res) => {
  const { startDate, endDate } = req.params;
  const db = getDatabase();
  
  db.all(`
    SELECT * FROM meals 
    WHERE user_id = ? AND meal_date BETWEEN ? AND ?
    ORDER BY meal_date DESC, created_at ASC
  `, [req.user.userId, startDate, endDate], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ meals: rows });
  });
});

// Edit a meal
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { calories, protein, carbs, fat, fiber, sugar, sodium } = req.body;
  
  if (!calories && !protein && !carbs && !fat && !fiber && !sugar && !sodium) {
    return res.status(400).json({ 
      error: 'At least one nutrition value must be provided' 
    });
  }
  
  const db = getDatabase();
  
  // First get the current meal to calculate differences
  db.get('SELECT * FROM meals WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, meal) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    // Build update query dynamically based on what's provided
    const updates = [];
    const values = [];
    
    if (calories !== undefined) {
      updates.push('calories = ?');
      values.push(calories);
    }
    if (protein !== undefined) {
      updates.push('protein = ?');
      values.push(protein);
    }
    if (carbs !== undefined) {
      updates.push('carbs = ?');
      values.push(carbs);
    }
    if (fat !== undefined) {
      updates.push('fat = ?');
      values.push(fat);
    }
    if (fiber !== undefined) {
      updates.push('fiber = ?');
      values.push(fiber);
    }
    if (sugar !== undefined) {
      updates.push('sugar = ?');
      values.push(sugar);
    }
    if (sodium !== undefined) {
      updates.push('sodium = ?');
      values.push(sodium);
    }
    
    // Add meal_id and user_id to values array
    values.push(id, req.user.userId);
    
    // Update the meal
    db.run(`
      UPDATE meals 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `, values, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update meal' });
      }
      
      // Get the updated meal
      db.get('SELECT * FROM meals WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, updatedMeal) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
          message: 'Meal updated successfully',
          meal: updatedMeal
        });
      });
    });
  });
});

// Delete a meal
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.run('DELETE FROM meals WHERE id = ? AND user_id = ?', [id, req.user.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete meal' });
    }
    
    res.json({ message: 'Meal deleted successfully' });
  });
});

module.exports = router;
