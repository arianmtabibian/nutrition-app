import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, Camera, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  meal_data: any;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', imageUrl: '', mealData: null });

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async () => {
    try {
      const response = await fetch('/api/social/feed', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        // Update local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });
      if (response.ok) {
        setNewPost({ content: '', imageUrl: '', mealData: null });
        setShowCreatePost(false);
        loadFeed(); // Reload feed
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white">
      {/* Create Post Button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>Create a new post</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Post</h3>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 resize-none"
              rows={4}
            />
            <input
              type="text"
              value={newPost.imageUrl}
              onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleCreatePost}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post
              </button>
              <button
                onClick={() => setShowCreatePost(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">No posts in your feed</h3>
          <p>Follow some users to see their posts here, or create your own post!</p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create your first post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {post.user.first_name?.charAt(0) || post.user.username?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{post.user.username}</div>
                    <div className="text-sm text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="p-4">
                  <p className="text-gray-900">{post.content}</p>
                </div>
              )}

              {/* Post Image */}
              {post.image_url && (
                <div className="w-full">
                  <img 
                    src={post.image_url} 
                    alt="Post" 
                    className="w-full object-cover"
                  />
                </div>
              )}

              {/* Meal Data */}
              {post.meal_data && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Meal Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Calories:</span>
                      <span className="ml-2 font-medium">{post.meal_data.calories}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Protein:</span>
                      <span className="ml-2 font-medium">{post.meal_data.protein}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Carbs:</span>
                      <span className="ml-2 font-medium">{post.meal_data.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fat:</span>
                      <span className="ml-2 font-medium">{post.meal_data.fat}g</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likes_count}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm">{post.comments_count}</span>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Share className="w-6 h-6" />
                    </button>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;




