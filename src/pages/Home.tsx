// VidoMove - Home Page with Stories and Feed
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore, useContentStore } from '@/store';
import { translations } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Plus
} from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const { language } = useAppStore();
  const { stories, posts, reels, liveStreams, likePost, unlikePost } = useContentStore();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');

  // Get stories from users the current user follows + their own
  const followingStories = stories.filter(s => 
    currentUser?.following.includes(s.userId) || s.userId === currentUser?.id
  );

  // Group stories by user
  const storiesByUser = followingStories.reduce((acc, story) => {
    if (!acc[story.userId]) acc[story.userId] = [];
    acc[story.userId].push(story);
    return acc;
  }, {} as Record<string, typeof stories>);

  // Get users with stories
  const usersWithStories = Object.keys(storiesByUser).map(userId => 
    users.find(u => u.id === userId)
  ).filter(Boolean);

  // Get live users that current user follows
  const liveUsers = users.filter(u => 
    u.isLive && (currentUser?.following.includes(u.id) || u.id === currentUser?.id)
  );

  // Get posts for feed
  const feedPosts = activeTab === 'forYou' 
    ? posts 
    : posts.filter(p => currentUser?.following.includes(p.userId) || p.userId === currentUser?.id);

  const handleLike = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post?.likes.includes(currentUser?.id || '')) {
      unlikePost(postId, currentUser?.id || '');
    } else {
      likePost(postId, currentUser?.id || '');
    }
  };

  const handleStoryClick = (userId: string) => {
    navigate(`/story/${userId}`);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="pb-4">
      {/* Stories Section */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">
          {/* Add Story Button */}
          <button 
            onClick={() => navigate('/create?type=story')}
            className="flex-shrink-0 flex flex-col items-center gap-1"
          >
            <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Plus className="w-6 h-6 text-gray-400" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}>
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-xs text-gray-600">{t.addStory as string}</span>
          </button>

          {/* Live Users */}
          {liveUsers.map(user => (
            <button 
              key={user.id}
              onClick={() => navigate(`/live/${liveStreams.find(s => s.userId === user.id)?.id}`)}
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500">
                  <Avatar className="w-full h-full border-2 border-white">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {t.live as string}
                </div>
              </div>
              <span className="text-xs text-gray-600 truncate max-w-[64px]">{user.username}</span>
            </button>
          ))}

          {/* User Stories */}
          {usersWithStories.map(user => {
            if (!user) return null;
            const userStoriesList = storiesByUser[user.id] || [];
            const hasUnviewed = userStoriesList.some(s => !s.views.includes(currentUser?.id || ''));
            return (
              <button 
                key={user.id}
                onClick={() => handleStoryClick(user.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1"
              >
                <div className={`w-16 h-16 rounded-full p-[3px] ${
                  hasUnviewed 
                    ? 'bg-gradient-to-tr from-[#59A52C] via-[#7CB342] to-[#9CCC65]' 
                    : 'bg-gray-200'
                }`}>
                  <Avatar className="w-full h-full border-2 border-white">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[64px]">{user.username}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('forYou')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'forYou' 
              ? 'text-[#59A52C] border-b-2 border-[#59A52C]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.forYou as string}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'following' 
              ? 'text-[#59A52C] border-b-2 border-[#59A52C]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.following as string}
        </button>
      </div>

      {/* Feed Posts */}
      <div className="space-y-4 mt-4 px-4">
        {feedPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Play className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">{t.noPosts as string}</p>
            <Button 
              onClick={() => navigate('/create')}
              className="mt-4"
              style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
            >
              {t.create as string}
            </Button>
          </div>
        ) : (
          feedPosts.map(post => {
            const author = users.find(u => u.id === post.userId);
            const isLiked = post.likes.includes(currentUser?.id || '');
            
            return (
              <Card key={post.id} className="overflow-hidden border-0 shadow-sm">
                {/* Post Header */}
                <div className="flex items-center justify-between p-3">
                  <button 
                    onClick={() => navigate(`/profile/${author?.username}`)}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={author?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-xs">
                        {author?.firstName?.[0]}{author?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{author?.username}</p>
                      <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
                    </div>
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </Button>
                </div>

                {/* Post Media */}
                <div className="aspect-square bg-gray-100">
                  {post.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <video 
                        src={post.mediaUrl} 
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                  ) : (
                    <img 
                      src={post.mediaUrl} 
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Post Actions */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="transition-transform active:scale-90"
                      >
                        <Heart 
                          className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
                        />
                      </button>
                      <button>
                        <MessageCircle className="w-6 h-6 text-gray-700" />
                      </button>
                      <button>
                        <Share2 className="w-6 h-6 text-gray-700" />
                      </button>
                    </div>
                    <button>
                      <Bookmark className="w-6 h-6 text-gray-700" />
                    </button>
                  </div>

                  {/* Likes Count */}
                  <p className="font-semibold text-sm mb-1">
                    {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                  </p>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-sm">
                      <span className="font-semibold">{author?.username}</span>{' '}
                      <span className="text-gray-700">{post.caption}</span>
                    </p>
                  )}

                  {/* Comments Preview */}
                  {post.comments.length > 0 && (
                    <button className="text-sm text-gray-500 mt-1">
                      View all {post.comments.length} comments
                    </button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Reels Section */}
      {reels.length > 0 && (
        <div className="mt-6 px-4">
          <h3 className="font-semibold text-lg mb-3">{t.reels as string}</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {reels.map(reel => {
              const author = users.find(u => u.id === reel.userId);
              return (
                <button 
                  key={reel.id}
                  onClick={() => navigate(`/reel/${reel.id}`)}
                  className="flex-shrink-0 w-32 aspect-[9/16] rounded-xl overflow-hidden relative bg-gray-900"
                >
                  <video 
                    src={reel.videoUrl}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center gap-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={author?.avatar} />
                        <AvatarFallback className="text-[8px] bg-[#59A52C] text-white">
                          {author?.firstName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white text-xs truncate">{author?.username}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Play className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{reel.views}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
