const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');
const { simpleBackup } = require('../utils/realPersistence');

const router = express.Router();

// Debug endpoint to check database status
router.get('/debug/users', (req, res) => {
  try {
    const db = getDatabase();
    
    db.all('SELECT id, email, first_name, last_name, username, created_at FROM users ORDER BY created_at DESC LIMIT 10', [], (err, users) => {
      if (err) {
        console.error('Debug users error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      res.json({
        message: 'Database is working',
        totalUsers: users.length,
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          username: user.username,
          created_at: user.created_at
        }))
      });
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, username } = req.body;
    
    console.log('Registration attempt for email:', email);
    console.log('Registration data:', { email, first_name, last_name, username });

    if (!email || !password || !first_name || !last_name || !username) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const db = getDatabase();
    
    // Check if user already exists (email or username)
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
      if (err) {
        console.log('Database error during user check:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        console.log('User already exists:', row);
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password and create user - Reduced salt rounds for better performance
      const saltRounds = 10; // Reduced from 12 to 10 for faster auth (still secure)
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      db.run('INSERT INTO users (email, password_hash, first_name, last_name, username) VALUES (?, ?, ?, ?, ?)', 
        [email, passwordHash, first_name, last_name, username], function(err) {
          if (err) {
            console.error('❌ Failed to create user in database:', err);
            console.error('❌ SQL Error details:', err.message);
            return res.status(500).json({ error: 'Failed to create user: ' + err.message });
          }
          
          const userId = this.lastID;
          console.log('✅ User created successfully with ID:', userId);
          console.log('✅ User data stored:', { id: userId, email, first_name, last_name, username });
          
          // Verify the user was actually created by querying it back
          db.get('SELECT id, email, first_name, last_name, username FROM users WHERE id = ?', [userId], (verifyErr, newUser) => {
            if (verifyErr) {
              console.error('❌ Error verifying new user:', verifyErr);
              return res.status(500).json({ error: 'User creation verification failed' });
            }
            
            if (!newUser) {
              console.error('❌ New user not found in database after creation');
              return res.status(500).json({ error: 'User creation failed - user not found' });
            }
            
            console.log('✅ User verified in database:', newUser);
            
            const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
            const token = jwt.sign(
              { userId, email, first_name, last_name, username },
              jwtSecret,
              { expiresIn: '7d' }
            );
            
            console.log('✅ JWT token generated successfully');
            console.log('✅ Registration completed for:', email);
            
            // AUTO-BACKUP: Trigger backup after new user registration (non-blocking)
            console.log('🔄 Scheduling auto-backup after user registration...');
            setTimeout(async () => {
              try {
                await simpleBackup();
                console.log('✅ Auto-backup completed after user registration');
              } catch (err) {
                console.error('❌ Auto-backup failed after registration:', err);
              }
            }, 10000);
            
            res.status(201).json({
              message: 'User created successfully',
              token,
              user: { id: userId, email, first_name, last_name, username }
            });
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
    
    console.log('🔍 Searching for user with email:', email);
    
    // First, let's check what users exist in the database
    db.all('SELECT id, email, username FROM users LIMIT 10', [], (debugErr, allUsers) => {
      if (!debugErr) {
        console.log('🔍 Current users in database:', allUsers);
      }
    });
    
    db.get('SELECT id, email, password_hash, first_name, last_name, username FROM users WHERE email = ?', 
      [email], async (err, row) => {
        if (err) {
          console.error('❌ Database error during login:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
          console.log('❌ Login failed: User not found with email:', email);
          console.log('🔍 Available users:', await new Promise(resolve => {
            db.all('SELECT email FROM users', [], (err, users) => {
              resolve(err ? 'Error fetching users' : users.map(u => u.email).join(', '));
            });
          }));
          return res.status(401).json({ error: 'Invalid credentials - User not found' });
        }

        console.log('✅ User found:', { id: row.id, email: row.email, username: row.username });

        // Verify password
        const isValidPassword = await bcrypt.compare(password, row.password_hash);
        console.log('Password validation result:', isValidPassword);
        
        if (!isValidPassword) {
          console.log('Login failed: Invalid password for user:', email);
          return res.status(401).json({ error: 'Invalid credentials - Wrong password' });
        }

        console.log('Login successful for user:', email);

        // Generate JWT token - Use consistent secret
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
