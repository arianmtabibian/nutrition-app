const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authSupabase');
const profileRoutes = require('./routes/profile');
const mealRoutes = require('./routes/meals');
const diaryRoutes = require('./routes/diary');
const socialRoutes = require('./routes/social');
const backupRoutes = require('./routes/backup');
const favoritesRoutes = require('./routes/favorites');
const { initializeSupabaseDatabase } = require('./database/supabaseInit');

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

// BULLETPROOF CORS CONFIGURATION
const allowedOrigins = [
  'https://nutryra.com',
  'https://www.nutryra.com',
  'http://localhost:3000',
  'http://localhost:3001',
  // Add any Vercel preview domains
  /\.vercel\.app$/,
  /\.vercel-preview\.app$/
];

// Custom CORS handler for maximum compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests with no origin (like mobile apps or Postman)
  if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '3600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  next();
});

console.log('🌐 BULLETPROOF CORS: Configured for nutryra.com and development');

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
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Post creation fixes deployed successfully' 
  });
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
    await initializeSupabaseDatabase();
    console.log('✅ Supabase PostgreSQL database initialized successfully');
    
    console.log('✅ Supabase setup complete - ready to accept requests');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: Supabase PostgreSQL`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
