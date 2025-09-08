const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting database migration...');
console.log('Database path:', dbPath);

db.serialize(() => {
  // Add new columns to meals table
  console.log('Adding new columns to meals table...');
  
  const addColumns = [
    'ALTER TABLE meals ADD COLUMN carbs REAL DEFAULT 0',
    'ALTER TABLE meals ADD COLUMN fat REAL DEFAULT 0',
    'ALTER TABLE meals ADD COLUMN fiber REAL DEFAULT 0',
    'ALTER TABLE meals ADD COLUMN sugar REAL DEFAULT 0',
    'ALTER TABLE meals ADD COLUMN sodium REAL DEFAULT 0'
  ];

  addColumns.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Error adding column ${index + 1}:`, err.message);
      } else {
        console.log(`Column ${index + 1} added successfully`);
      }
    });
  });

  // Add new columns to daily_nutrition table
  console.log('Adding new columns to daily_nutrition table...');
  
  const addDailyColumns = [
    'ALTER TABLE daily_nutrition ADD COLUMN total_carbs REAL DEFAULT 0',
    'ALTER TABLE daily_nutrition ADD COLUMN total_fat REAL DEFAULT 0',
    'ALTER TABLE daily_nutrition ADD COLUMN total_fiber REAL DEFAULT 0',
    'ALTER TABLE daily_nutrition ADD COLUMN total_sugar REAL DEFAULT 0',
    'ALTER TABLE daily_nutrition ADD COLUMN total_sodium REAL DEFAULT 0'
  ];

  addDailyColumns.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Error adding daily column ${index + 1}:`, err.message);
      } else {
        console.log(`Daily column ${index + 1} added successfully`);
      }
    });
  });

  // Update existing meals to have default values for new columns
  console.log('Updating existing meals with default values...');
  db.run(`
    UPDATE meals 
    SET carbs = 0, fat = 0, fiber = 0, sugar = 0, sodium = 0 
    WHERE carbs IS NULL OR fat IS NULL OR fiber IS NULL OR sugar IS NULL OR sodium IS NULL
  `, (err) => {
    if (err) {
      console.error('Error updating existing meals:', err.message);
    } else {
      console.log('Existing meals updated successfully');
    }
  });

  // Update existing daily_nutrition records
  console.log('Updating existing daily nutrition records...');
  db.run(`
    UPDATE daily_nutrition 
    SET total_carbs = 0, total_fat = 0, total_fiber = 0, total_sugar = 0, total_sodium = 0 
    WHERE total_carbs IS NULL OR total_fat IS NULL OR total_fiber IS NULL OR total_sugar IS NULL OR total_sodium IS NULL
  `, (err) => {
    if (err) {
      console.error('Error updating daily nutrition:', err.message);
    } else {
      console.log('Daily nutrition records updated successfully');
    }
  });

  // Verify the migration
  console.log('Verifying migration...');
  db.get("PRAGMA table_info(meals)", (err, rows) => {
    if (err) {
      console.error('Error checking meals table:', err.message);
    } else {
      console.log('Meals table columns:', rows);
    }
  });

  db.get("PRAGMA table_info(daily_nutrition)", (err, rows) => {
    if (err) {
      console.error('Error checking daily_nutrition table:', err.message);
    } else {
      console.log('Daily nutrition table columns:', rows);
    }
  });

  console.log('Migration completed!');
  console.log('You can now restart your application with the new macro tracking features.');
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed');
  }
});










