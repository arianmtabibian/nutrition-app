const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database/init');
const { authenticateToken: auth } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Debug: Get current user from token
router.get('/debug/current-user', auth, (req, res) => {
  try {
    console.log('Debug current user request:', req.user);
    res.json({ 
      currentUser: req.user,
      message: 'Current user info from token'
    });
  } catch (error) {
    console.error('Debug current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug: Get all users from database
router.get('/debug/all-users', auth, (req, res) => {
  try {
    const db = getDatabase();
    
    db.all('SELECT id, email, first_name, last_name, username FROM users LIMIT 10', [], (err, users) => {
      if (err) {
        console.error('Database error getting all users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('All users in database:', users);
      res.json({ users, count: users.length });
    });
  } catch (error) {
    console.error('Debug all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user exists
router.get('/user/:userId/exists', auth, (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    console.log('Checking if user exists:', userId);
    
    db.get('SELECT id, email, first_name, last_name, username FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('Database error checking user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        console.log('User not found in database for ID:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('User found:', user);
      res.json({ user });
    });
  } catch (error) {
    console.error('Check user exists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile with social stats
router.get('/profile/:userId', auth, (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    console.log('Profile request:', { 
      requestedUserId: userId, 
      requestedUserIdType: typeof userId,
      authenticatedUserId: req.user.userId,
      authenticatedUserIdType: typeof req.user.userId,
      userEmail: req.user.email 
    });
    
    // Verify that the requesting user is authenticated and the userId matches
    if (parseInt(userId) !== req.user.userId) {
      console.log('Access denied: userId mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }
    
          // Get user info
      db.get('SELECT id, email, first_name, last_name, username FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          console.error('Database error getting user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          console.log('User not found in database for ID:', userId);
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Ensure user has a username, if not create one
        if (!user.username) {
          console.log('User missing username, creating default one...');
          const defaultUsername = `user${user.id}`;
          
          db.run('UPDATE users SET username = ? WHERE id = ?', [defaultUsername, userId], function(err) {
            if (err) {
              console.error('Error updating username:', err);
            } else {
              console.log('Updated user with default username:', defaultUsername);
              user.username = defaultUsername;
            }
          });
        }
      
      // Get user profile
      db.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId], (err, profile) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // If no profile exists, create a default one
        if (!profile) {
          db.run('INSERT INTO user_profiles (user_id) VALUES (?)', [userId], function(err) {
            if (err) {
              console.error('Error creating default profile:', err);
              // Continue with empty profile instead of failing
            }
          });
          profile = {
            profile_picture: null,
            bio: null,
            daily_calories: null,
            daily_protein: null,
            weight: null,
            target_weight: null,
            height: null,
            age: null,
            activity_level: null,
            gender: null
          };
        }
        
        // Get post count
        db.get('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId], (err, postCount) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Get followers count
          db.get('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?', [userId], (err, followersCount) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Get following count
            db.get('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?', [userId], (err, followingCount) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              
              // Check if current user is following this user
              db.get('SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?', [req.user.userId, userId], (err, isFollowing) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }
                
                res.json({
                  user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    username: user.username || `user${user.id}`
                  },
                  profile: profile || {
                    profile_picture: null,
                    bio: null,
                    daily_calories: null,
                    daily_protein: null,
                    weight: null,
                    target_weight: null,
                    height: null,
                    age: null,
                    activity_level: null,
                    gender: null
                  },
                  stats: {
                    posts: postCount.count,
                    followers: followersCount.count,
                    following: followingCount.count
                  },
                  isFollowing: !!isFollowing
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a post with file upload
router.post('/posts', auth, upload.single('image'), (req, res) => {
  try {
    const { content, mealData, allowComments } = req.body;
    const userId = req.user.userId;
    
    // Get image URL if file was uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/api/uploads/${req.file.filename}`;
    }
    
    if (!content && !imageUrl && !mealData) {
      return res.status(400).json({ error: 'Post must have content, image, or meal data' });
    }
    
    const db = getDatabase();
    db.run(
      'INSERT INTO posts (user_id, content, image_url, meal_data, allow_comments) VALUES (?, ?, ?, ?, ?)',
      [userId, content, imageUrl, mealData ? JSON.stringify(mealData) : null, allowComments !== 'false'],
      function(err) {
        if (err) {
          console.error('Database error creating post:', err);
          return res.status(500).json({ error: 'Failed to create post' });
        }
        
        res.status(201).json({
          message: 'Post created successfully',
          postId: this.lastID,
          imageUrl: imageUrl
        });
      }
    );
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user posts
router.get('/posts/:userId', auth, (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    db.all(`
      SELECT p.*, u.username, u.first_name, u.last_name,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.userId, userId], (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Parse meal data
      const formattedPosts = posts.map(post => ({
        ...post,
        meal_data: post.meal_data ? JSON.parse(post.meal_data) : null
      }));
      
      res.json({ posts: formattedPosts });
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/unlike a post
router.post('/posts/:postId/like', auth, (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();
    
    // Check if already liked
    db.get('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existing) {
        // Unlike
        db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to unlike post' });
          }
          
          res.json({ message: 'Post unliked', liked: false });
        });
      } else {
        // Like
        db.run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to like post' });
          }
          
          res.json({ message: 'Post liked', liked: true });
        });
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Comment on a post
router.post('/posts/:postId/comments', auth, (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const db = getDatabase();
    db.run(
      'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create comment' });
        }
        
        res.status(201).json({
          message: 'Comment created successfully',
          commentId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get post comments
router.get('/posts/:postId/comments', auth, (req, res) => {
  try {
    const { postId } = req.params;
    const db = getDatabase();
    
    db.all(`
      SELECT c.*, u.username, u.first_name, u.last_name, up.profile_picture
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId], (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Format comments with user data
      const formattedComments = comments.map(comment => ({
        ...comment,
        user: {
          id: comment.user_id,
          username: comment.username,
          first_name: comment.first_name,
          last_name: comment.last_name,
          profile_picture: comment.profile_picture
        }
      }));
      
      res.json({ comments: formattedComments });
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow/unfollow user
router.post('/follow/:userId', auth, (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;
    
    if (parseInt(userId) === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const db = getDatabase();
    
    // Check if already following
    db.get('SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?', [followerId, userId], (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existing) {
        // Unfollow
        db.run('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?', [followerId, userId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to unfollow user' });
          }
          
          res.json({ message: 'User unfollowed', following: false });
        });
      } else {
        // Follow
        db.run('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)', [followerId, userId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to follow user' });
          }
          
          res.json({ message: 'User followed', following: true });
        });
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feed (posts from followed users and own posts)
router.get('/feed', auth, (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();
    
    db.all(`
      SELECT p.*, u.username, u.first_name, u.last_name, up.profile_picture,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE p.user_id IN (
        SELECT following_id FROM user_follows WHERE follower_id = ?
        UNION
        SELECT ? as user_id
      )
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [userId, userId, userId], (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Parse meal data and format posts
      const formattedPosts = posts.map(post => ({
        ...post,
        meal_data: post.meal_data ? JSON.parse(post.meal_data) : null,
        user: {
          id: post.user_id,
          username: post.username,
          first_name: post.first_name,
          last_name: post.last_name,
          profile_picture: post.profile_picture
        }
      }));
      
      res.json({ posts: formattedPosts });
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
