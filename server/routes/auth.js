const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, username } = req.body;

    if (!email || !password || !first_name || !last_name || !username) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const db = getDatabase();
    
    // Check if user already exists (email or username)
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password and create user
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      db.run('INSERT INTO users (email, password_hash, first_name, last_name, username) VALUES (?, ?, ?, ?, ?)', 
        [email, passwordHash, first_name, last_name, username], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          const userId = this.lastID;
          const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
          const token = jwt.sign(
            { userId, email, first_name, last_name, username },
            jwtSecret,
            { expiresIn: '7d' }
          );
          
          res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: userId, email, first_name, last_name, username }
          });
        });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify user token and get user info
router.get('/verify', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    db.get('SELECT id, email, first_name, last_name, username FROM users WHERE id = ?', 
      [req.user.userId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
          user: {
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            username: row.username
          }
        });
      });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDatabase();
    
    console.log('Searching for user with email:', email);
    
    db.get('SELECT id, email, password_hash, first_name, last_name, username FROM users WHERE email = ?', 
      [email], async (err, row) => {
        if (err) {
          console.error('Database error during login:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
          console.log('Login failed: User not found with email:', email);
          return res.status(401).json({ error: 'Invalid credentials - User not found' });
        }

        console.log('User found:', { id: row.id, email: row.email, username: row.username });

        // Verify password
        const isValidPassword = await bcrypt.compare(password, row.password_hash);
        console.log('Password validation result:', isValidPassword);
        
        if (!isValidPassword) {
          console.log('Login failed: Invalid password for user:', email);
          return res.status(401).json({ error: 'Invalid credentials - Wrong password' });
        }

        console.log('Login successful for user:', email);

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
        const token = jwt.sign(
          { userId: row.id, email: row.email, first_name: row.first_name, last_name: row.last_name, username: row.username },
          jwtSecret,
          { expiresIn: '7d' }
        );
        
        res.json({
          message: 'Login successful',
          token,
          user: { id: row.id, email: row.email, first_name: row.first_name, last_name: row.last_name, username: row.username }
        });
      });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
