import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, PenTool, Bookmark, Image, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  meal_data: any;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  allow_comments?: boolean;
  hide_like_count?: boolean;
  created_at: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ 
    content: '', 
    imageFile: null as File | null, 
    mealData: null,
    allowComments: true,
    hideLikeCount: false
  });
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComments, setNewComments] = useState<{ [postId: number]: string }>({});
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());

  const formatPostDate = (dateString: string) => {
    const postDate = new Date(dateString);
    const today = new Date();
    const isToday = postDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today at ${postDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else {
      return formatDistanceToNow(postDate, { addSuffix: true });
    }
  };

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
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('allowComments', newPost.allowComments.toString());
      formData.append('hideLikeCount', newPost.hideLikeCount.toString());
      
      if (newPost.imageFile) {
        formData.append('image', newPost.imageFile);
      }
      
      if (newPost.mealData) {
        formData.append('mealData', JSON.stringify(newPost.mealData));
      }

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        setNewPost({ 
          content: '', 
          imageFile: null, 
          mealData: null,
          allowComments: true,
          hideLikeCount: false
        });
        setShowCreatePost(false);
        loadFeed(); // Reload feed
      } else {
        const error = await response.json();
        console.error('Failed to create post:', error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const loadComments = async (postId: number) => {
    if (loadingComments.has(postId)) return;
    
    setLoadingComments(prev => {
      const newSet = new Set(prev);
      newSet.add(postId);
      return newSet;
    });
    
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleToggleComments = (postId: number) => {
    const isExpanded = expandedComments.has(postId);
    
    if (isExpanded) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      if (!comments[postId]) {
        loadComments(postId);
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = newComments[postId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        loadComments(postId); // Reload comments
        // Update comments count in posts
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
          <PenTool className="w-5 h-5" />
          <span>Create a new post</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">Create New Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Text Input */}
              <div>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What's going on?"
                  className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={4}
                />
              </div>

              {/* Image Preview */}
              {newPost.imageFile && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(newPost.imageFile)}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setNewPost({ ...newPost, imageFile: null })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Upload Controls */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Add to your post</h4>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                    <Image className="h-4 w-4" />
                    <span className="text-sm font-medium">Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewPost({ ...newPost, imageFile: file });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-3">Privacy Settings</h4>
                <div className="space-y-3">
                  {/* Allow Comments Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Allow comments</label>
                      <p className="text-xs text-gray-500">Let people comment on your post</p>
                    </div>
                    <button
                      onClick={() => setNewPost({ ...newPost, allowComments: !newPost.allowComments })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        newPost.allowComments ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          newPost.allowComments ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Hide Like Count Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Hide like count</label>
                      <p className="text-xs text-gray-500">Only you will see the total number of likes</p>
                    </div>
                    <button
                      onClick={() => setNewPost({ ...newPost, hideLikeCount: !newPost.hideLikeCount })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        newPost.hideLikeCount ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          newPost.hideLikeCount ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Post button clicked', newPost);
                  handleCreatePost();
                }}
                disabled={!newPost.content.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
                  {post.user.profile_picture ? (
                    <img
                      src={post.user.profile_picture}
                      alt={`${post.user.first_name} ${post.user.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {post.user.first_name?.charAt(0) || post.user.username?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {post.user.first_name} {post.user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{formatPostDate(post.created_at)}</div>
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
                      {!post.hide_like_count || post.user.id === user?.id ? (
                        <span className="text-sm">{post.likes_count}</span>
                      ) : (
                        <span className="text-sm">•</span>
                      )}
                    </button>
                    {post.allow_comments !== false && (
                      <button 
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm">{post.comments_count}</span>
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Share className="w-6 h-6" />
                    </button>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {post.allow_comments !== false && expandedComments.has(post.id) && (
                <div className="border-t border-gray-200">
                  {/* Show latest comments */}
                  {loadingComments.has(post.id) ? (
                    <div className="p-4 text-center text-gray-500">Loading comments...</div>
                  ) : comments[post.id] && comments[post.id].length > 0 ? (
                    <div className="p-4">
                      <div className="space-y-3 mb-4">
                        {comments[post.id].slice(0, 3).map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            {comment.user.profile_picture ? (
                              <img
                                src={comment.user.profile_picture}
                                alt={`${comment.user.first_name} ${comment.user.last_name}`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {comment.user.first_name?.charAt(0) || comment.user.username?.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg px-3 py-2">
                                <div className="font-medium text-sm text-gray-900">
                                  {comment.user.first_name} {comment.user.last_name}
                                </div>
                                <div className="text-sm text-gray-700">{comment.content}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatPostDate(comment.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {comments[post.id].length > 3 && (
                        <button className="text-sm text-blue-600 hover:text-blue-700 mb-4">
                          View all {comments[post.id].length} comments
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No comments yet</div>
                  )}

                  {/* Add Comment */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex space-x-3">
                      {user?.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={`${user.first_name} ${user.last_name}`}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user?.first_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1 flex space-x-2">
                        <input
                          type="text"
                          value={newComments[post.id] || ''}
                          onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Write a comment..."
                          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComments[post.id]?.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;






