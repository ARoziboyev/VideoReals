// VidoMove - Profile Page
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore, useContentStore } from '@/store';
import { translations } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Grid3X3, 
  Film, 
  Bookmark, 
  Settings, 
  Edit2, 
  Camera,
  UserPlus,
  UserCheck,
  MessageCircle,
  Video,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser, users, updateUser, followUser, unfollowUser } = useAuthStore();
  const { language } = useAppStore();
  const { posts, reels, stories } = useContentStore();
  const t = translations[language];
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: currentUser?.username || '',
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    bio: currentUser?.bio || '',
  });
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine whose profile to show
  const isOwnProfile = !username || username === currentUser?.username;
  const profileUser = isOwnProfile 
    ? currentUser 
    : users.find(u => u.username === username);

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-gray-500">User not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  const userPosts = posts.filter(p => p.userId === profileUser.id);
  const userReels = reels.filter(r => r.userId === profileUser.id);
  const userStories = stories.filter(s => s.userId === profileUser.id);
  const isFollowing = currentUser?.following.includes(profileUser.id);

  const handleSaveProfile = () => {
    updateUser(editData);
    setIsEditing(false);
    toast.success('Profile updated');
  };

  const handleFollow = () => {
    if (isFollowing) {
      unfollowUser(profileUser.id);
      toast.success('Unfollowed');
    } else {
      followUser(profileUser.id);
      toast.success('Following');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateUser({ avatar: url });
      toast.success('Profile picture updated');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="bg-white p-4">
        {/* Avatar and Stats Row */}
        <div className="flex items-center gap-6 mb-4">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-full p-[3px] ${
              userStories.some(s => !s.views.includes(currentUser?.id || '')) 
                ? 'bg-gradient-to-tr from-[#59A52C] via-[#7CB342] to-[#9CCC65]' 
                : ''
            }`}>
              <Avatar className="w-full h-full">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-xl">
                  {profileUser.firstName[0]}{profileUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwnProfile && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-[#59A52C] rounded-full flex items-center justify-center text-white"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="font-bold text-lg">{formatNumber(userPosts.length)}</p>
              <p className="text-sm text-gray-500">{String(t.posts)}</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{formatNumber(profileUser.followers.length)}</p>
              <p className="text-sm text-gray-500">{String(t.followers)}</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{formatNumber(profileUser.following.length)}</p>
              <p className="text-sm text-gray-500">{String(t.following)}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {isEditing ? (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={editData.firstName}
                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                placeholder={String(t.firstName)}
              />
              <Input
                value={editData.lastName}
                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                placeholder={String(t.lastName)}
              />
            </div>
            <Input
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              placeholder={String(t.username)}
            />
            <Textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder={String(t.bio)}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveProfile}
                className="flex-1 text-white border-0"
                style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
              >
                <Check className="w-4 h-4 mr-2" />
                {String(t.save)}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                {String(t.cancel)}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h1 className="font-bold text-lg">{profileUser.firstName} {profileUser.lastName}</h1>
            <p className="text-gray-500">@{profileUser.username}</p>
            {profileUser.bio && (
              <p className="mt-2 text-gray-700">{profileUser.bio}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex gap-2">
            {isOwnProfile ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {String(t.editProfile)}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  className="px-3"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleFollow}
                  className={`flex-1 ${isFollowing ? '' : 'text-white border-0'}`}
                  variant={isFollowing ? 'outline' : 'default'}
                  style={isFollowing ? {} : { background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
                >
                  {isFollowing ? (
                    <><UserCheck className="w-4 h-4 mr-2" /> {String(t.following)}</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> {String(t.follow)}</>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/chat/${profileUser.id}`)}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                {profileUser.isLive && (
                  <Button 
                    onClick={() => navigate(`/live/${profileUser.id}`)}
                    className="px-3 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Stories Highlights */}
      {userStories.length > 0 && (
        <div className="bg-white border-t border-gray-200 py-4">
          <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">
            {userStories.map(story => (
              <button 
                key={story.id}
                onClick={() => navigate(`/story/${profileUser.id}`)}
                className="flex-shrink-0 flex flex-col items-center gap-1"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                  {story.type === 'video' ? (
                    <video src={story.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-xs text-gray-600">{String(t.storyViews)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="flex border-t border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 flex justify-center transition-colors ${
            activeTab === 'posts' 
              ? 'text-[#59A52C] border-b-2 border-[#59A52C]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex-1 py-3 flex justify-center transition-colors ${
            activeTab === 'reels' 
              ? 'text-[#59A52C] border-b-2 border-[#59A52C]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Film className="w-5 h-5" />
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 flex justify-center transition-colors ${
              activeTab === 'saved' 
                ? 'text-[#59A52C] border-b-2 border-[#59A52C]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bookmark className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content Grid */}
      <div className="p-1">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-1">
            {userPosts.length === 0 ? (
              <div className="col-span-3 py-12 text-center">
                <Camera className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">{String(t.noPosts)}</p>
              </div>
            ) : (
              userPosts.map(post => (
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
              ))
            )}
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="grid grid-cols-3 gap-1">
            {userReels.length === 0 ? (
              <div className="col-span-3 py-12 text-center">
                <Film className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No reels yet</p>
              </div>
            ) : (
              userReels.map(reel => (
                <button 
                  key={reel.id}
                  onClick={() => navigate(`/reel/${reel.id}`)}
                  className="aspect-[9/16] bg-gray-900 relative"
                >
                  <video 
                    src={reel.videoUrl}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                    <Video className="w-3 h-3" />
                    {reel.views}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="py-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No saved posts</p>
          </div>
        )}
      </div>
    </div>
  );
}
