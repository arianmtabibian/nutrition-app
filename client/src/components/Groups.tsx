import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Users, 
  Trophy, 
  MessageCircle, 
  Share2, 
  UserPlus, 
  Settings, 
  // Calendar, // Unused
  Zap,
  Crown,
  Heart,
  Send
} from 'lucide-react';

interface GroupMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  streak: number;
  joined_at: string;
}

interface GroupPost {
  id: number;
  content: string;
  image_url?: string;
  meal_data?: any;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  created_at: string;
  likes_count: number;
  is_liked: boolean;
}

interface Group {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  members: GroupMember[];
  posts: GroupPost[];
  is_private: boolean;
}

const Groups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', is_private: false });
  const [newPost, setNewPost] = useState({ content: '', imageUrl: '', mealData: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]); // Added missing dependency

  const loadGroups = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockGroups: Group[] = [
        {
          id: 1,
          name: "Fitness Warriors",
          description: "Supporting each other on our fitness journey",
          created_by: user?.id || 1,
          created_at: "2024-01-15",
          is_private: false,
          members: [
            { id: 1, username: "arian", first_name: "Arian", last_name: "Tabibian", streak: 15, joined_at: "2024-01-15" },
            { id: 2, username: "john", first_name: "John", last_name: "Doe", streak: 8, joined_at: "2024-01-16" },
            { id: 3, username: "sarah", first_name: "Sarah", last_name: "Smith", streak: 22, joined_at: "2024-01-17" }
          ],
          posts: []
        },
        {
          id: 2,
          name: "Healthy Eaters",
          description: "Sharing healthy meal ideas and recipes",
          created_by: 2,
          created_at: "2024-01-10",
          is_private: true,
          members: [
            { id: 1, username: "arian", first_name: "Arian", last_name: "Tabibian", streak: 15, joined_at: "2024-01-15" },
            { id: 4, username: "emma", first_name: "Emma", last_name: "Wilson", streak: 12, joined_at: "2024-01-11" }
          ],
          posts: []
        }
      ];
      setGroups(mockGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    try {
      // Mock group creation - replace with actual API call
      const newGroupData: Group = {
        id: Date.now(),
        ...newGroup,
        created_by: user?.id || 1,
        created_at: new Date().toISOString(),
        members: [{ 
          id: user?.id || 1, 
          username: user?.username || 'user', 
          first_name: user?.first_name || 'User', 
          last_name: user?.last_name || 'Name', 
          streak: 0, 
          joined_at: new Date().toISOString() 
        }],
        posts: []
      };
      
      setGroups([...groups, newGroupData]);
      setNewGroup({ name: '', description: '', is_private: false });
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const createPost = async () => {
    if (!selectedGroup || !newPost.content.trim()) return;
    
    try {
      // Mock post creation - replace with actual API call
      const newPostData: GroupPost = {
        id: Date.now(),
        content: newPost.content,
        image_url: newPost.imageUrl || undefined,
        meal_data: newPost.mealData || undefined,
        user: {
          id: user?.id || 1,
          username: user?.username || 'user',
          first_name: user?.first_name || 'User',
          last_name: user?.last_name || 'Name'
        },
        created_at: new Date().toISOString(),
        likes_count: 0,
        is_liked: false
      };
      
      const updatedGroup = {
        ...selectedGroup,
        posts: [newPostData, ...selectedGroup.posts]
      };
      
      setSelectedGroup(updatedGroup);
      setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g));
      setNewPost({ content: '', imageUrl: '', mealData: null });
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const getTopStreaks = (members: GroupMember[]) => {
    return [...members]
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Groups
              </button>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h1>
                <p className="text-gray-600">{selectedGroup.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowInviteFriends(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Friends</span>
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Group Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedGroup.members.length}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{selectedGroup.posts.length}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...selectedGroup.members.map(m => m.streak))}
              </div>
              <div className="text-sm text-gray-600">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Top Streaks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Top Streaks
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {getTopStreaks(selectedGroup.members).map((member, index) => (
              <div key={member.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="relative mb-3">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-lg">
                    {member.first_name.charAt(0)}
                  </div>
                  {index === 0 && (
                    <Crown className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2" />
                  )}
                </div>
                <div className="font-medium text-gray-900">{member.first_name}</div>
                <div className="text-sm text-gray-600">{member.username}</div>
                <div className="flex items-center justify-center mt-2">
                  <Zap className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="font-bold text-orange-600">{member.streak} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Post */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Share with Group</h3>
          <div className="space-y-4">
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What's on your mind? Share your progress, meals, or motivation!"
              className="w-full border border-gray-300 rounded-lg p-3 resize-none"
              rows={3}
            />
            <input
              type="text"
              value={newPost.imageUrl}
              onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className="w-full border border-gray-300 rounded-lg p-3"
            />
            <div className="flex justify-end">
              <button
                onClick={createPost}
                disabled={!newPost.content.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Post to Group</span>
              </button>
            </div>
          </div>
        </div>

        {/* Group Posts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
          {selectedGroup.posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-xl font-medium mb-2">No posts yet</h4>
              <p>Be the first to share something with your group!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedGroup.posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                      {post.user.first_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {post.user.first_name} {post.user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-3">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="Post" className="w-full rounded-lg mb-3" />
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes_count}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>Comment</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Friends Modal */}
        {showInviteFriends && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Invite Friends to {selectedGroup.name}</h3>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Friend's email address"
                  className="w-full border border-gray-300 rounded-lg p-3"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowInviteFriends(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-2">Connect with friends and track your progress together</p>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            onClick={() => setSelectedGroup(group)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              {group.is_private && (
                <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  Private
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
            <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{group.members.length} members</span>
              <span>{group.posts.length} posts</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {group.members.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                  >
                    {member.first_name.charAt(0)}
                  </div>
                ))}
                {group.members.length > 3 && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                    +{group.members.length - 3}
                  </div>
                )}
              </div>
              <div className="flex items-center text-orange-500">
                <Zap className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  {Math.max(...group.members.map(m => m.streak))} days
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Group name"
                className="w-full border border-gray-300 rounded-lg p-3"
              />
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="Group description"
                className="w-full border border-gray-300 rounded-lg p-3 resize-none"
                rows={3}
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newGroup.is_private}
                  onChange={(e) => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Make group private</span>
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!newGroup.name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
