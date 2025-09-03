const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Get diary data for a specific month
router.get('/:year/:month', authenticateToken, (req, res) => {
  const { year, month } = req.params;
  const db = getDatabase();
  
  // Get the first and last day of the month
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
  
  db.all(`
    SELECT 
      dn.date,
      dn.total_calories,
      dn.total_protein,
      dn.calories_goal,
      dn.protein_goal,
      dn.calories_met,
      dn.protein_met,
      COUNT(m.id) as meal_count
    FROM daily_nutrition dn
    LEFT JOIN meals m ON dn.user_id = m.user_id AND dn.date = m.meal_date
    WHERE dn.user_id = ? AND dn.date BETWEEN ? AND ?
    GROUP BY dn.date
    ORDER BY dn.date ASC
  `, [req.user.userId, startDate, endDate], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Create a map of all days in the month
    const monthData = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= new Date(endDate)) {
      const dateStr = currentDate.toISOString().split('T')[0];
      monthData[dateStr] = {
        date: dateStr,
        total_calories: 0,
        total_protein: 0,
        calories_goal: 0,
        protein_goal: 0,
        calories_met: false,
        protein_met: false,
        meal_count: 0,
        has_data: false
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Fill in the actual data
    rows.forEach(row => {
      if (monthData[row.date]) {
        monthData[row.date] = {
          ...row,
          has_data: true
        };
      }
    });
    
    // Convert to array and sort
    const result = Object.values(monthData).sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({ 
      year: parseInt(year),
      month: parseInt(month),
      days: result
    });
  });
});

// Get diary data for a specific date
router.get('/date/:date', authenticateToken, (req, res) => {
  const { date } = req.params;
  const db = getDatabase();
  
  db.get(`
    SELECT 
      dn.*,
      up.daily_calories as profile_calories_goal,
      up.daily_protein as profile_protein_goal
    FROM daily_nutrition dn
    JOIN user_profiles up ON dn.user_id = up.user_id
    WHERE dn.user_id = ? AND dn.date = ?
  `, [req.user.userId, date], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      // Return default structure if no data exists
      db.get('SELECT daily_calories, daily_protein FROM user_profiles WHERE user_id = ?', 
        [req.user.userId], (err, profile) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({
            date,
            total_calories: 0,
            total_protein: 0,
            calories_goal: profile ? profile.daily_calories : 0,
            protein_goal: profile ? profile.daily_protein : 0,
            calories_met: false,
            protein_met: false,
            has_data: false
          });
        });
    } else {
      res.json({
        ...row,
        has_data: true
      });
    }
  });
});

// Get weekly summary
router.get('/week/:startDate', authenticateToken, (req, res) => {
  const { startDate } = req.params;
  const db = getDatabase();
  
  // Calculate end date (7 days from start)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = endDate.toISOString().split('T')[0];
  
  db.all(`
    SELECT 
      dn.date,
      dn.total_calories,
      dn.total_protein,
      dn.calories_goal,
      dn.protein_goal,
      dn.calories_met,
      dn.protein_met
    FROM daily_nutrition dn
    WHERE dn.user_id = ? AND dn.date BETWEEN ? AND ?
    ORDER BY dn.date ASC
  `, [req.user.userId, startDate, endDateStr], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Calculate weekly totals
    const weeklyTotals = rows.reduce((acc, row) => {
      acc.calories += row.total_calories;
      acc.protein += row.total_protein;
      acc.caloriesGoal += row.calories_goal;
      acc.proteinGoal += row.protein_goal;
      acc.daysMetCalories += row.calories_met ? 1 : 0;
      acc.daysMetProtein += row.protein_met ? 1 : 0;
      return acc;
    }, {
      calories: 0,
      protein: 0,
      caloriesGoal: 0,
      proteinGoal: 0,
      daysMetCalories: 0,
      daysMetProtein: 0
    });
    
    res.json({
      startDate,
      endDate: endDateStr,
      days: rows,
      weeklyTotals
    });
  });
});

// Get monthly summary
router.get('/month/:year/:month/summary', authenticateToken, (req, res) => {
  const { year, month } = req.params;
  const db = getDatabase();
  
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
  
  db.all(`
    SELECT 
      dn.total_calories,
      dn.total_protein,
      dn.calories_goal,
      dn.protein_goal,
      dn.calories_met,
      dn.protein_met
    FROM daily_nutrition dn
    WHERE dn.user_id = ? AND dn.date BETWEEN ? AND ?
  `, [req.user.userId, startDate, endDate], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (rows.length === 0) {
      return res.json({
        year: parseInt(year),
        month: parseInt(month),
        totalDays: 0,
        daysWithData: 0,
        averageCalories: 0,
        averageProtein: 0,
        daysMetCalories: 0,
        daysMetProtein: 0,
        successRate: 0
      });
    }
    
    const summary = rows.reduce((acc, row) => {
      acc.totalCalories += row.total_calories;
      acc.totalProtein += row.total_protein;
      acc.totalCaloriesGoal += row.calories_goal;
      acc.totalProteinGoal += row.protein_goal;
      acc.daysMetCalories += row.calories_met ? 1 : 0;
      acc.daysMetProtein += row.protein_met ? 1 : 0;
      return acc;
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCaloriesGoal: 0,
      totalProteinGoal: 0,
      daysMetCalories: 0,
      daysMetProtein: 0
    });
    
    const totalDays = rows.length;
    const averageCalories = Math.round(summary.totalCalories / totalDays);
    const averageProtein = Math.round((summary.totalProtein / totalDays) * 10) / 10;
    const successRate = Math.round((summary.daysMetCalories / totalDays) * 100);
    
    res.json({
      year: parseInt(year),
      month: parseInt(month),
      totalDays,
      daysWithData: totalDays,
      averageCalories,
      averageProtein,
      daysMetCalories: summary.daysMetCalories,
      daysMetProtein: summary.daysMetProtein,
      successRate
    });
  });
});

module.exports = router;

