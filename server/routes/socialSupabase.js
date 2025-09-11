const express = require('express');
const { getSupabasePool } = require('../database/supabaseInit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint for social API
router.get('/health', async (req, res) => {
  try {
    console.log('🔧 SocialSupabase: Health check requested');
    console.log('🔧 SocialSupabase: Request origin:', req.headers.origin);
    
    const pool = getSupabasePool();
    
    // Simple connection test
    const result = await pool.query('SELECT 1 as test');
    
    // Test posts table access
    const tableTest = await pool.query('SELECT COUNT(*) as count FROM posts LIMIT 1');
    
    res.json({
      message: 'Social API is healthy',
      timestamp: new Date().toISOString(),
      origin: req.headers.origin,
      database: 'connected',
      postsTable: 'accessible',
      postCount: tableTest.rows[0].count
    });
  } catch (error) {
    console.error('❌ SocialSupabase: Health check error:', error);
    res.status(500).json({ 
      error: 'Social API health check failed',
      details: error.message 
    });
  }
});

// Get all posts (feed) - both /posts and /feed should work
router.get('/posts', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username,
        up.profile_picture,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $3) as is_liked,
        EXISTS(SELECT 1 FROM post_bookmarks WHERE post_id = p.id AND user_id = $3) as is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON p.user_id = up.user_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset), userId]);

    const posts = result.rows.map(post => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      image_url: post.image_url,
      meal_id: post.meal_id,
      likes_count: parseInt(post.likes_count) || 0,
      comments_count: parseInt(post.comments_count) || 0,
      is_liked: post.is_liked || false,
      is_bookmarked: post.is_bookmarked || false,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user: {
        id: post.user_id,
        first_name: post.first_name,
        last_name: post.last_name,
        username: post.username,
        profile_picture: post.profile_picture
      }
    }));

    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feed (alias for /posts - frontend expects this)
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username,
        up.profile_picture
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON p.user_id = up.user_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    const posts = result.rows.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      imageUrl: post.image_url,
      mealId: post.meal_id,
      allowComments: post.allow_comments,
      hideLikeCount: post.hide_like_count,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      user: {
        id: post.user_id,
        first_name: post.first_name,
        last_name: post.last_name,
        username: post.username,
        profile_picture: post.profile_picture
      }
    }));

    res.json(posts);
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🔧 SocialSupabase: Creating post for user:', userId);
    console.log('🔧 SocialSupabase: Request body:', req.body);
    console.log('🔧 SocialSupabase: Request origin:', req.headers.origin);
    
    // Handle both JSON and FormData
    let content, imageUrl, mealId, allowComments, hideLikeCount;
    
    if (req.body.content) {
      // JSON request
      ({ content, imageUrl, mealId } = req.body);
    } else {
      // FormData request
      content = req.body.content;
      imageUrl = req.body.imageUrl;
      mealId = req.body.mealId;
      allowComments = req.body.allowComments === 'true';
      hideLikeCount = req.body.hideLikeCount === 'true';
    }
    
    // Validate required fields
    if (!content || !content.trim()) {
      console.error('❌ SocialSupabase: Missing content');
      return res.status(400).json({ 
        error: 'Content is required',
        details: 'Post content cannot be empty'
      });
    }
    
    const pool = getSupabasePool();

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url, meal_id, allow_comments, hide_like_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, content.trim(), imageUrl, mealId, allowComments, hideLikeCount]
    );

    const post = result.rows[0];
    console.log('✅ SocialSupabase: Post created successfully:', post.id);

    // Update user's post count in user_profiles table
    await pool.query(
      'UPDATE user_profiles SET posts_count = COALESCE(posts_count, 0) + 1 WHERE user_id = $1',
      [userId]
    );

    // Get user information for the response
    const userResult = await pool.query(
      'SELECT u.first_name, u.last_name, u.username, up.profile_picture FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    res.status(201).json({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      imageUrl: post.image_url,
      mealId: post.meal_id,
      allowComments: post.allow_comments,
      hideLikeCount: post.hide_like_count,
      likesCount: post.likes_count || 0,
      commentsCount: post.comments_count || 0,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      user: {
        id: userId,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('❌ SocialSupabase: Create post error:', error);
    console.error('❌ SocialSupabase: Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Post already exists' });
    } else if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid user or meal data' });
    } else if (error.code === '23502') { // Not null violation
      res.status(400).json({ error: 'Missing required fields' });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create post'
      });
    }
  }
});

// Like/unlike post
router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    // Check if already liked
    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      await pool.query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [postId]);
      res.json({ liked: false, message: 'Post unliked' });
    } else {
      // Like
      await pool.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
      res.json({ liked: true, message: 'Post liked' });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bookmark/favorite post
router.post('/posts/:postId/favorite', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    console.log('🔖 Bookmark request:', { postId, userId });

    // Check if already bookmarked
    const existingBookmark = await pool.query(
      'SELECT id FROM post_bookmarks WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (existingBookmark.rows.length > 0) {
      // Remove bookmark
      await pool.query('DELETE FROM post_bookmarks WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      console.log('✅ Post unbookmarked:', postId);
      res.json({ bookmarked: false, message: 'Post unbookmarked' });
    } else {
      // Add bookmark
      await pool.query('INSERT INTO post_bookmarks (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
      console.log('✅ Post bookmarked:', postId);
      res.json({ bookmarked: true, message: 'Post bookmarked' });
    }
  } catch (error) {
    console.error('❌ Bookmark post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a post
router.get('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        up.profile_picture
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON c.user_id = up.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);

    const comments = result.rows.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      postId: comment.post_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        firstName: comment.first_name,
        lastName: comment.last_name,
        username: comment.username,
        profilePicture: comment.profile_picture
      }
    }));

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to post
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    const result = await pool.query(
      `INSERT INTO comments (user_id, post_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, postId, content]
    );

    // Update comments count
    await pool.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [postId]);

    const comment = result.rows[0];

    res.status(201).json({
      id: comment.id,
      userId: comment.user_id,
      postId: comment.post_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow/unfollow user
router.post('/users/:targetUserId/follow', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user.userId;
    const pool = getSupabasePool();

    if (userId === parseInt(targetUserId)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [userId, targetUserId]
    );

    if (existingFollow.rows.length > 0) {
      // Unfollow
      await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [userId, targetUserId]);
      res.json({ following: false, message: 'User unfollowed' });
    } else {
      // Follow
      await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [userId, targetUserId]);
      res.json({ following: true, message: 'User followed' });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile for social features
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getSupabasePool();

    // Get user basic info
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, username, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user profile data
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const profile = profileResult.rows[0] || {};

    // Get post count
    const postCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = $1',
      [userId]
    );
    const postCount = parseInt(postCountResult.rows[0].count) || 0;

    // Get followers count
    const followersResult = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [userId]
    );
    const followersCount = parseInt(followersResult.rows[0].count) || 0;

    // Get following count
    const followingResult = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [userId]
    );
    const followingCount = parseInt(followingResult.rows[0].count) || 0;

    // Check if current user is following this user
    const currentUserId = req.user.userId;
    const isFollowingResult = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [currentUserId, userId]
    );
    const isFollowing = isFollowingResult.rows.length > 0;

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username
      },
      profile: {
        profilePicture: profile.profile_picture,
        bio: profile.bio,
        daily_calories: profile.daily_calories,
        daily_protein: profile.daily_protein,
        weight: profile.weight,
        target_weight: profile.target_weight,
        height: profile.height,
        age: profile.age,
        activity_level: profile.activity_level,
        gender: profile.gender,
        posts_count: postCount,
        followers_count: followersCount,
        following_count: followingCount
      },
      stats: {
        posts: postCount,
        followers: followersCount,
        following: followingCount
      },
      isFollowing: isFollowing
    };

    console.log('🔧 SocialSupabase: GET profile response for user', userId);
    console.log('🔧 SocialSupabase: Profile data:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's posts
router.get('/posts/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username,
        up.profile_picture
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON p.user_id = up.user_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);

    const posts = result.rows.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      imageUrl: post.image_url,
      mealId: post.meal_id,
      allowComments: post.allow_comments,
      hideLikeCount: post.hide_like_count,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      is_liked: false, // Will be updated by frontend
      is_bookmarked: false, // Will be updated by frontend
      user: {
        id: post.user_id,
        first_name: post.first_name,
        last_name: post.last_name,
        username: post.username,
        profile_picture: post.profile_picture
      }
    }));

    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's liked posts
router.get('/profile/:userId/liked-posts', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username,
        up.profile_picture
      FROM posts p
      JOIN likes l ON p.id = l.post_id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON p.user_id = up.user_id
      WHERE l.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);

    const posts = result.rows.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      imageUrl: post.image_url,
      mealId: post.meal_id,
      allowComments: post.allow_comments,
      hideLikeCount: post.hide_like_count,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      is_liked: true, // User liked this post
      is_bookmarked: false, // Will be updated by frontend
      user: {
        id: post.user_id,
        first_name: post.first_name,
        last_name: post.last_name,
        username: post.username,
        profile_picture: post.profile_picture
      }
    }));

    res.json(posts);
  } catch (error) {
    console.error('Get liked posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bookmarked posts
router.get('/profile/:userId/favorited-posts', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getSupabasePool();

    const result = await pool.query(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username,
        up.profile_picture
      FROM posts p
      JOIN post_bookmarks b ON p.id = b.post_id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON p.user_id = up.user_id
      WHERE b.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);

    const posts = result.rows.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      imageUrl: post.image_url,
      mealId: post.meal_id,
      allowComments: post.allow_comments,
      hideLikeCount: post.hide_like_count,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      is_liked: false, // Will be updated by frontend
      is_bookmarked: true, // User bookmarked this post
      user: {
        id: post.user_id,
        first_name: post.first_name,
        last_name: post.last_name,
        username: post.username,
        profile_picture: post.profile_picture
      }
    }));

    res.json(posts);
  } catch (error) {
    console.error('Get bookmarked posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
