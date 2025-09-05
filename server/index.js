const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const mealRoutes = require('./routes/meals');
const diaryRoutes = require('./routes/diary');
const socialRoutes = require('./routes/social');
const backupRoutes = require('./routes/backup');
const { initializeDatabase } = require('./database/init');
const { restoreFromEnv, simpleBackup } = require('./utils/realPersistence');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration - Restrict to specific domain(s)
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['https://nutryra.com', 'https://www.nutryra.com'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/backup', backupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // CRITICAL: Always restore users on startup to prevent onboarding redirects
    console.log('🔄 Restoring user data from environment backup...');
    await restoreFromEnv();
    console.log('✅ User data restoration complete');
    
    // BACKUP USERS on startup (for next deployment)
    setTimeout(async () => {
      try {
        console.log('💾 Creating backup of current user data...');
        await simpleBackup();
        console.log('✅ Backup created successfully');
      } catch (error) {
        console.error('❌ Backup failed:', error);
      }
    }, 5000); // Wait 5 seconds after startup
    
    // BACKUP USERS every hour to prevent data loss
    setInterval(async () => {
      try {
        console.log('🔄 Hourly backup starting...');
        await simpleBackup();
        console.log('✅ Hourly backup complete');
      } catch (error) {
        console.error('❌ Hourly backup failed:', error);
      }
    }, 60 * 60 * 1000); // Every hour
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Database path: ${process.env.DB_PATH || 'default'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
