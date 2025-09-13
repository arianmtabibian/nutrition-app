const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const pool = getSupabasePool();
    
    // Simple connection test
    const result = await pool.query('SELECT 1 as test');
    
    res.json({
      message: 'Supabase database connection is working',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Debug endpoint to check database status
router.get('/debug/users', async (req, res) => {
  try {
    const pool = getSupabasePool();
    
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, username, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );
    
    res.json({
      message: 'Supabase database is working',
      totalUsers: result.rows.length,
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.first_name || 'NULL'} ${user.last_name || 'NULL'}`,
        username: user.username,
        created_at: user.created_at,
        hasNullNames: !user.first_name || !user.last_name
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Fix existing users with NULL names - ADMIN ENDPOINT
router.post('/debug/fix-null-names', async (req, res) => {
  try {
    const pool = getSupabasePool();
    
    console.log('🔧 Starting to fix users with NULL names...');
    
    // Find users with NULL names
    const usersWithNullNames = await pool.query(
      'SELECT id, email, first_name, last_name, username FROM users WHERE first_name IS NULL OR last_name IS NULL'
    );
    
    console.log(`🔧 Found ${usersWithNullNames.rows.length} users with NULL names`);
    
    let fixedCount = 0;
    
    for (const user of usersWithNullNames.rows) {
      const defaultFirstName = user.first_name || 'User';
      const defaultLastName = user.last_name || `${user.id}`;
      
      await pool.query(
        'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
        [defaultFirstName, defaultLastName, user.id]
      );
      
      console.log(`✅ Fixed user ${user.id}: ${user.email} -> ${defaultFirstName} ${defaultLastName}`);
      fixedCount++;
    }
    
    res.json({
      message: 'Fixed users with NULL names',
      usersFound: usersWithNullNames.rows.length,
      usersFixed: fixedCount,
      fixedUsers: usersWithNullNames.rows.map(user => ({
        id: user.id,
        email: user.email,
        oldName: `${user.first_name || 'NULL'} ${user.last_name || 'NULL'}`,
        newName: `${user.first_name || 'User'} ${user.last_name || user.id}`
      }))
    });
  } catch (error) {
    console.error('Fix NULL names error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      username,
      // Also accept snake_case from frontend
      first_name,
      last_name
    } = req.body;

    // Use snake_case if camelCase not provided (for frontend compatibility)
    const finalFirstName = firstName || first_name;
    const finalLastName = lastName || last_name;

    console.log('🔧 Registration request:', { email, firstName, lastName, first_name, last_name, username });
    console.log('🔧 Final names:', { finalFirstName, finalLastName });

    // Quick validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!finalFirstName || !finalLastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const pool = getSupabasePool();

    // Check if user already exists (with timeout)
    const existingUser = await Promise.race([
      pool.query('SELECT id FROM users WHERE email = $1', [email]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
    ]);
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password (with timeout)
    const hashedPassword = await Promise.race([
      bcrypt.hash(password, 10),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Password hashing timeout')), 3000))
    ]);

    // Create user (with timeout)
    const result = await Promise.race([
      pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, username) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, username',
        [email, hashedPassword, finalFirstName, finalLastName, username]
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('User creation timeout')), 10000))
    ]);

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const endTime = Date.now();
    console.log(`✅ New user registered: ${email} with name: ${finalFirstName} ${finalLastName} in ${endTime - startTime}ms`);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username
      }
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`❌ Registration error after ${endTime - startTime}ms:`, error);
    
    if (error.message?.includes('timeout')) {
      res.status(408).json({ error: 'Registration timed out. Please try again.' });
    } else if (error.code === '23505') { // PostgreSQL unique constraint violation
      res.status(409).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pool = getSupabasePool();

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`✅ User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pool = getSupabasePool();
    
    const result = await pool.query('SELECT id, email, first_name, last_name, username FROM users WHERE id = $1', [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
