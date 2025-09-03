const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');
const { analyzeMeal } = require('../services/nutritionService');

// Function to update daily nutrition for a specific date
const updateDailyNutrition = (db, userId, date) => {
  return new Promise((resolve, reject) => {
    // Get user's daily goals from profile
    db.get('SELECT daily_calories, daily_protein FROM user_profiles WHERE user_id = ?', [userId], (err, profile) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!profile) {
        reject(new Error('User profile not found'));
        return;
      }
      
      // Get all meals for the date
      db.all('SELECT * FROM meals WHERE user_id = ? AND meal_date = ?', [userId, date], (err, meals) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Calculate totals
        const totals = meals.reduce((acc, meal) => {
          acc.calories += meal.calories || 0;
          acc.protein += meal.protein || 0;
          acc.carbs += meal.carbs || 0;
          acc.fat += meal.fat || 0;
          acc.fiber += meal.fiber || 0;
          acc.sugar += meal.sugar || 0;
          acc.sodium += meal.sodium || 0;
          return acc;
        }, {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0
        });
        
        // Determine if goals are met
        const calories_met = totals.calories <= profile.daily_calories;
        const protein_met = totals.protein >= profile.daily_protein;
        
        // Insert or update daily nutrition
        db.run(`
          INSERT OR REPLACE INTO daily_nutrition 
          (user_id, date, total_calories, total_protein, total_carbs, total_fat, total_fiber, total_sugar, total_sodium, calories_goal, protein_goal, calories_met, protein_met)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId, date, totals.calories, totals.protein, totals.carbs, totals.fat, 
          totals.fiber, totals.sugar, totals.sodium, profile.daily_calories, profile.daily_protein,
          calories_met, protein_met
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });
};

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
    ], async function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save meal' });
      }
      
      try {
        // Update daily nutrition for this date
        await updateDailyNutrition(db, req.user.userId, meal_date);
        
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
      } catch (updateError) {
        console.error('Failed to update daily nutrition:', updateError);
        // Still return success for the meal, but log the error
        res.status(201).json({
          message: 'Meal added successfully (daily nutrition update failed)',
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
      }
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
    `, values, async function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update meal' });
      }
      
      try {
        // Get the updated meal to get the meal_date
        db.get('SELECT * FROM meals WHERE id = ? AND user_id = ?', [id, req.user.userId], async (err, updatedMeal) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          try {
            // Update daily nutrition for this date
            await updateDailyNutrition(db, req.user.userId, updatedMeal.meal_date);
            
            res.json({
              message: 'Meal updated successfully',
              meal: updatedMeal
            });
          } catch (updateError) {
            console.error('Failed to update daily nutrition:', updateError);
            res.json({
              message: 'Meal updated successfully (daily nutrition update failed)',
              meal: updatedMeal
            });
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to process meal update' });
      }
    });
  });
});

// Delete a meal
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // First get the meal to get the meal_date before deleting
  db.get('SELECT meal_date FROM meals WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, meal) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    const mealDate = meal.meal_date;
    
    // Delete the meal
    db.run('DELETE FROM meals WHERE id = ? AND user_id = ?', [id, req.user.userId], async function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete meal' });
      }
      
      try {
        // Update daily nutrition for this date
        await updateDailyNutrition(db, req.user.userId, mealDate);
        
        res.json({ message: 'Meal deleted successfully' });
      } catch (updateError) {
        console.error('Failed to update daily nutrition:', updateError);
        res.json({ message: 'Meal deleted successfully (daily nutrition update failed)' });
      }
    });
  });
});

// Route to recalculate daily nutrition for a date range (useful for existing data)
router.post('/recalculate-daily-nutrition', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.body;
  const db = getDatabase();
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }
  
  try {
    // Get all dates in the range
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Update daily nutrition for each date
    for (const date of dates) {
      try {
        await updateDailyNutrition(db, req.user.userId, date);
      } catch (error) {
        console.error(`Failed to update daily nutrition for ${date}:`, error);
      }
    }
    
    res.json({ 
      message: 'Daily nutrition recalculated successfully',
      datesProcessed: dates.length
    });
  } catch (error) {
    console.error('Failed to recalculate daily nutrition:', error);
    res.status(500).json({ error: 'Failed to recalculate daily nutrition' });
  }
});

module.exports = router;
