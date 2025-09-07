import { useState, useEffect } from 'react';

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  meal_data: any;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
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

const LOCAL_POSTS_KEY = 'nutritrack_local_posts';

export const usePostPersistence = () => {
  const [localPosts, setLocalPosts] = useState<Post[]>([]);

  // Load local posts on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_POSTS_KEY);
      if (stored) {
        const posts = JSON.parse(stored);
        console.log('🔄 usePostPersistence: Loaded local posts:', posts.length);
        setLocalPosts(posts);
      }
    } catch (error) {
      console.error('❌ Error loading local posts:', error);
      setLocalPosts([]);
    }
  }, []);

  // Save a new post locally
  const savePostLocally = (post: Post) => {
    try {
      console.log('💾 usePostPersistence: Saving post locally:', post.id);
      const updatedPosts = [post, ...localPosts.filter(p => p.id !== post.id)];
      setLocalPosts(updatedPosts);
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(updatedPosts));
      console.log('✅ usePostPersistence: Post saved successfully');
    } catch (error) {
      console.error('❌ Error saving post locally:', error);
    }
  };

  // Merge server posts with local posts
  const mergeWithServerPosts = (serverPosts: Post[]): Post[] => {
    try {
      console.log('🔄 usePostPersistence: Merging posts');
      console.log('💾 Local posts:', localPosts.length);
      console.log('🌐 Server posts:', serverPosts.length);

      const merged = [...localPosts];
      let addedFromServer = 0;

      serverPosts.forEach(serverPost => {
        const existsLocally = localPosts.some(localPost => {
          const idMatch = localPost.id === serverPost.id;
          const contentMatch = localPost.content === serverPost.content;
          const timeMatch = Math.abs(
            new Date(localPost.created_at).getTime() - 
            new Date(serverPost.created_at).getTime()
          ) < 15000; // 15 second window

          return idMatch || (contentMatch && timeMatch);
        });

        if (!existsLocally) {
          merged.push(serverPost);
          addedFromServer++;
        }
      });

      // Sort by creation date (newest first)
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('✅ usePostPersistence: Merged successfully:', merged.length, 'total posts');
      console.log(`   - ${localPosts.length} local posts`);
      console.log(`   - ${addedFromServer} added from server`);

      // Clean up old local posts (older than 10 minutes)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const recentLocalPosts = localPosts.filter(post => 
        new Date(post.created_at).getTime() > tenMinutesAgo
      );

      if (recentLocalPosts.length !== localPosts.length) {
        console.log('🧹 usePostPersistence: Cleaning up old local posts');
        setLocalPosts(recentLocalPosts);
        localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(recentLocalPosts));
      }

      return merged;
    } catch (error) {
      console.error('❌ Error merging posts:', error);
      return serverPosts;
    }
  };

  // Clear all local posts
  const clearLocalPosts = () => {
    try {
      console.log('🧹 usePostPersistence: Clearing all local posts');
      setLocalPosts([]);
      localStorage.removeItem(LOCAL_POSTS_KEY);
    } catch (error) {
      console.error('❌ Error clearing local posts:', error);
    }
  };

  return {
    localPosts,
    savePostLocally,
    mergeWithServerPosts,
    clearLocalPosts
  };
};
