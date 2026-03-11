// VidoMove - Story Viewer (Telegram-like)
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useContentStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  X, 
  Heart, 
  Send, 
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export function StoryViewer() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const { stories, viewStory } = useContentStore();
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showViews, setShowViews] = useState(false);
  const [replyText, setReplyText] = useState('');
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const userStories = stories.filter(s => s.userId === userId && s.expiresAt > Date.now());
  const storyUser = users.find(u => u.id === userId);
  const currentStory = userStories[currentStoryIndex];

  useEffect(() => {
    if (currentStory && currentUser) {
      viewStory(currentStory.id, currentUser.id);
    }
  }, [currentStory, currentUser, viewStory]);

  useEffect(() => {
    if (!isPaused && currentStory) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPaused, currentStoryIndex, userStories.length]);

  const handleNext = () => {
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      navigate(-1);
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const handleReply = () => {
    if (!replyText.trim()) return;
    toast.success('Reply sent');
    setReplyText('');
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  if (!currentStory || !storyUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">No stories available</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {userStories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ 
                width: index < currentStoryIndex ? '100%' : 
                       index === currentStoryIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={storyUser.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
              {storyUser.firstName[0]}{storyUser.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold">{storyUser.username}</p>
            <p className="text-xs opacity-70">{formatTime(currentStory.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentStory.type === 'video' && (
            <button onClick={() => setIsMuted(!isMuted)} className="text-white">
              {isMuted ? 'Muted' : 'Sound'}
            </button>
          )}
          <button onClick={() => navigate(-1)} className="text-white">
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div 
        className="relative w-full h-full"
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentStory.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            muted={isMuted}
            loop
            playsInline
          />
        ) : (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="w-full h-full object-contain"
          />
        )}

        {/* Navigation Areas */}
        <div className="absolute inset-0 flex">
          <button 
            onClick={handlePrev}
            className="w-1/3 h-full"
          />
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="w-1/3 h-full flex items-center justify-center"
          >
            {isPaused && (
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                <span className="text-white text-2xl">▶</span>
              </div>
            )}
          </button>
          <button 
            onClick={handleNext}
            className="w-1/3 h-full"
          />
        </div>
      </div>

      {/* Views Count (for own stories) */}
      {storyUser.id === currentUser?.id && (
        <button
          onClick={() => setShowViews(true)}
          className="absolute top-20 left-4 z-20 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full"
        >
          <Eye className="w-4 h-4" />
          <span>{currentStory.views.length}</span>
        </button>
      )}

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to story..."
              className="w-full h-12 px-4 pr-12 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            />
            <button 
              onClick={handleReply}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center"
            >
              <Send className="w-4 h-4 text-[#59A52C]" />
            </button>
          </div>
          <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Views Modal */}
      {showViews && (
        <div className="absolute inset-0 bg-black/90 z-30 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h3 className="text-white font-semibold">{currentStory.views.length} views</h3>
            <button onClick={() => setShowViews(false)}>
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {currentStory.views.map(viewerId => {
              const viewer = users.find(u => u.id === viewerId);
              return (
                <div key={viewerId} className="flex items-center gap-3 py-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={viewer?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                      {viewer?.firstName?.[0]}{viewer?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white">{viewer?.username}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
