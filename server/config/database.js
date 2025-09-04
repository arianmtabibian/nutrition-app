// Database configuration for persistent storage
const path = require('path');

// Use persistent disk storage on Render
const getDatabasePath = () => {
  if (process.env.NODE_ENV === 'production') {
    // On Render, use persistent disk storage
    return process.env.DB_PATH || '/opt/render/project/src/data/nutrition.db';
  } else {
    // Local development
    return path.join(__dirname, '../data/nutrition.db');
  }
};

module.exports = {
  getDatabasePath
};
