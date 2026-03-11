// VidoMove - Search Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore, useContentStore } from '@/store';
import { translations } from '@/types';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  X, 
  TrendingUp, 
  Hash, 
  UserPlus,
  UserCheck,
  Video
} from 'lucide-react';
import { toast } from 'sonner';

export function SearchPage() {
  const navigate = useNavigate();
  const { users, currentUser, followUser, unfollowUser } = useAuthStore();
  const { language } = useAppStore();
  const { posts, reels, liveStreams } = useContentStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof users>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'reels' | 'live'>('all');

  // Trending searches
  const trendingSearches = ['#photography', '#travel', '#food', '#fashion', '#music', '#art'];

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(u => 
        u.username.toLowerCase().includes(query) ||
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, users]);

  const handleFollow = (userId: string) => {
    if (currentUser?.following.includes(userId)) {
      unfollowUser(userId);
      toast.success('Unfollowed');
    } else {
      followUser(userId);
      toast.success('Following');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const filteredPosts = posts.filter(p => 
    p.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReels = reels.filter(r => 
    r.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* Search Header */}
      <div className="sticky top-0 bg-gray-50 z-10 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t.searchUsers as string}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 bg-white border-gray-200 focus:border-[#59A52C] focus:ring-[#59A52C]"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        {searchQuery && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {(['all', 'users', 'posts', 'reels', 'live'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                style={activeTab === tab ? { background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' } : {}}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery ? (
        <div className="space-y-4">
          {/* Users Results */}
          {(activeTab === 'all' || activeTab === 'users') && searchResults.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-2">{t.search as string}</h3>
              <div className="space-y-2">
                {searchResults.map(user => {
                  const isFollowing = currentUser?.following.includes(user.id);
                  const isCurrentUser = user.id === currentUser?.id;
                  
                  return (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl"
                    >
                      <button 
                        onClick={() => navigate(`/profile/${user.username}`)}
                        className="flex items-center gap-3 flex-1"
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          {user.isLive && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
                              {t.live as string}
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400">
                            {user.followers.length} {t.followers as string}
                          </p>
                        </div>
                      </button>
                      {!isCurrentUser && (
                        <Button
                          variant={isFollowing ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleFollow(user.id)}
                          className={isFollowing ? '' : 'text-white border-0'}
                          style={isFollowing ? {} : { background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
                        >
                          {isFollowing ? (
                            <><UserCheck className="w-4 h-4 mr-1" /> {t.following as string}</>
                          ) : (
                            <><UserPlus className="w-4 h-4 mr-1" /> {t.follow as string}</>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-2">{t.posts as string}</h3>
              <div className="grid grid-cols-3 gap-1">
                {filteredPosts.map(post => (
                  <button 
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="aspect-square bg-gray-100 relative"
                  >
                    <img 
                      src={post.mediaUrl} 
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                    {post.type === 'video' && (
                      <div className="absolute top-2 right-2">
                        <Video className="w-4 h-4 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reels Results */}
          {(activeTab === 'all' || activeTab === 'reels') && filteredReels.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-2">{t.reels as string}</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {filteredReels.map(reel => (
                  <button 
                    key={reel.id}
                    onClick={() => navigate(`/reel/${reel.id}`)}
                    className="flex-shrink-0 w-28 aspect-[9/16] rounded-lg overflow-hidden relative bg-gray-900"
                  >
                    <video 
                      src={reel.videoUrl}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Results */}
          {(activeTab === 'all' || activeTab === 'live') && liveStreams.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-2">{t.live as string}</h3>
              <div className="space-y-2">
                {liveStreams.map(stream => {
                  const streamer = users.find(u => u.id === stream.userId);
                  return (
                    <button 
                      key={stream.id}
                      onClick={() => navigate(`/live/${stream.id}`)}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl"
                    >
                      <div className="relative">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={streamer?.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                            {streamer?.firstName[0]}{streamer?.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {t.live as string}
                        </div>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">{streamer?.username}</p>
                        <p className="text-sm text-gray-500">{stream.title}</p>
                        <p className="text-xs text-gray-400">
                          {stream.viewers.length} {t.viewers as string}
                        </p>
                      </div>
                      <Video className="w-6 h-6 text-red-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchResults.length === 0 && filteredPosts.length === 0 && filteredReels.length === 0 && liveStreams.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">{t.noResults as string}</p>
            </div>
          )}
        </div>
      ) : (
        /* Default Search View */
        <div className="space-y-6">
          {/* Trending Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-[#59A52C]" />
              <h3 className="font-semibold">{t.trending as string}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <Hash className="w-4 h-4 text-[#59A52C]" />
                  {tag.replace('#', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Users */}
          <div>
            <h3 className="font-semibold mb-3">{t.recommended as string}</h3>
            <div className="space-y-2">
              {users
                .filter(u => u.id !== currentUser?.id && !currentUser?.following.includes(u.id))
                .slice(0, 5)
                .map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl"
                  >
                    <button 
                      onClick={() => navigate(`/profile/${user.username}`)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.firstName}</p>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      onClick={() => handleFollow(user.id)}
                      className="text-white border-0 text-xs"
                      style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      {t.follow as string}
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Explore Posts Grid */}
          {posts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">{t.explore as string}</h3>
              <div className="grid grid-cols-3 gap-1">
                {posts.slice(0, 9).map(post => (
                  <button 
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="aspect-square bg-gray-100 relative"
                  >
                    <img 
                      src={post.mediaUrl} 
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                    {post.type === 'video' && (
                      <div className="absolute top-2 right-2">
                        <Video className="w-4 h-4 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
