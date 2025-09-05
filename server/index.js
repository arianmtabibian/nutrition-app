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
const favoritesRoutes = require('./routes/favorites');
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

// CORS configuration - Handle both specific domains and wildcard
let corsOrigin;
if (process.env.CORS_ORIGIN === '*') {
  corsOrigin = true; // Allow all origins
  console.log('🌐 CORS: Allowing all origins (*)');
} else if (process.env.CORS_ORIGIN) {
  corsOrigin = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  console.log('🌐 CORS: Allowing specific origins:', corsOrigin);
} else {
  // Default to allow both www and non-www versions of nutryra.com
  corsOrigin = [
    'https://nutryra.com', 
    'https://www.nutryra.com',
    'http://localhost:3000', // For development
    'http://localhost:3001'  // For development
  ];
  console.log('🌐 CORS: Using default origins:', corsOrigin);
}

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
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
app.use('/api/favorites', favoritesRoutes);

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
    
    // BACKUP USERS on startup (for next deployment) - Non-blocking with longer delay
    setTimeout(async () => {
      try {
        console.log('💾 Creating backup of current user data...');
        await simpleBackup();
        console.log('✅ Backup created successfully');
      } catch (error) {
        console.error('❌ Backup failed:', error);
      }
    }, 30000); // Wait 30 seconds after startup to not block initial requests
    
    // BACKUP USERS every 4 hours to prevent data loss (reduced frequency for better performance)
    setInterval(async () => {
      try {
        console.log('🔄 Periodic backup starting...');
        await simpleBackup();
        console.log('✅ Periodic backup complete');
      } catch (error) {
        console.error('❌ Periodic backup failed:', error);
      }
    }, 4 * 60 * 60 * 1000); // Every 4 hours
    
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
