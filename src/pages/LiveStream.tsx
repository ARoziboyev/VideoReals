// VidoMove - Live Stream Page
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useContentStore, useAppStore } from '@/store';
import { translations } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  X, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  Users,
  Radio,
  Tag,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export function LiveStreamPage() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const { liveStreams, startLiveStream, endLiveStream, joinLiveStream, leaveLiveStream } = useContentStore();
  const { language } = useAppStore();
  const t = translations[language];
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; text: string; time: number }>>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const existingStream = liveStreams.find(s => s.id === streamId);
  const isHost = !streamId || existingStream?.userId === currentUser?.id;
  const streamer = existingStream ? users.find(u => u.id === existingStream.userId) : currentUser;

  // Request camera permission
  useEffect(() => {
    if (isHost && !streamId) {
      requestPermissions();
    }
  }, [isHost, streamId]);

  // Join stream as viewer
  useEffect(() => {
    if (existingStream && currentUser && !isHost) {
      joinLiveStream(existingStream.id, currentUser.id);
      setViewerCount(existingStream.viewers.length);
      
      return () => {
        leaveLiveStream(existingStream.id, currentUser.id);
      };
    }
  }, [existingStream, currentUser, isHost, joinLiveStream, leaveLiveStream]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch {
      setHasPermission(false);
      toast.error('Camera and microphone permission required');
    }
  };

  const startStream = () => {
    if (!streamTitle.trim()) {
      toast.error('Please enter a stream title');
      return;
    }
    if (!streamRef.current) {
      toast.error('Camera access required');
      return;
    }
    
    startLiveStream({
      userId: currentUser!.id,
      title: streamTitle,
    });
    
    setIsStreaming(true);
    toast.success('Live stream started!');
  };

  const endStream = () => {
    if (existingStream) {
      endLiveStream(existingStream.id);
    }
    
    // Stop all tracks
    streamRef.current?.getTracks().forEach(track => track.stop());
    
    setIsStreaming(false);
    toast.success('Live stream ended');
    navigate('/');
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages(prev => [...prev, { 
      user: currentUser?.username || 'Anonymous', 
      text: chatMessage,
      time: Date.now()
    }]);
    setChatMessage('');
  };

  // Setup screen (host before starting)
  if (isHost && !isStreaming && !existingStream) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="text-white">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">{String(t.goLive)}</h1>
          <div className="w-6" />
        </div>

        {/* Permission Request */}
        {hasPermission === null && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Camera Access Required</h2>
            <p className="text-white/70 text-center mb-6">
              We need access to your camera and microphone to start a live stream
            </p>
            <Button 
              onClick={requestPermissions}
              className="text-white border-0 px-8"
              style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
            >
              {String(t.allow)}
            </Button>
          </div>
        )}

        {hasPermission === false && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <VideoOff className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Permission Denied</h2>
            <p className="text-white/70 text-center mb-6">
              Please enable camera and microphone permissions in your browser settings
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
              className="text-white border-white/30"
            >
              {String(t.back)}
            </Button>
          </div>
        )}

        {hasPermission === true && (
          <div className="flex-1 flex flex-col p-4">
            {/* Camera Preview */}
            <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden mb-4 relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                PREVIEW
              </div>
            </div>

            {/* Stream Title Input */}
            <div className="mb-4">
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder={String(t.streamTitle)}
                className="w-full h-12 px-4 rounded-xl bg-white/10 text-white placeholder-white/50 border-0 focus:outline-none focus:ring-2 focus:ring-[#59A52C]"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  cameraEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  micEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>

            {/* Start Button */}
            <Button
              onClick={startStream}
              disabled={!streamTitle.trim()}
              className="w-full h-14 text-lg font-semibold text-white border-0 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
            >
              <Radio className="w-5 h-5 mr-2" />
              {String(t.startStreaming)}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Live Stream View (host or viewer)
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={streamer?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
              {streamer?.firstName?.[0]}{streamer?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold">{streamer?.username}</p>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                {String(t.live)}
              </span>
              <span className="text-xs opacity-70 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {viewerCount}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChat(!showChat)} className="text-white p-2">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button onClick={() => navigate(-1)} className="text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          {isHost ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={streamer?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-2xl">
                    {streamer?.firstName?.[0]}{streamer?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-lg">{streamer?.username} is live</p>
                <p className="text-white/60">{existingStream?.title}</p>
              </div>
            </div>
          )}

          {/* Stream Title Overlay */}
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-lg font-semibold drop-shadow-lg">
              {existingStream?.title || streamTitle}
            </p>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-black/80 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/20">
              <span className="text-white font-semibold">Live Chat</span>
              <button onClick={() => setShowChat(false)}>
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <span className="text-[#59A52C] font-semibold">{msg.user}</span>
                  <span className="text-white ml-2">{msg.text}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Say something..."
                  className="flex-1 h-10 px-3 rounded-full bg-white/20 text-white placeholder-white/50 border-0 focus:outline-none focus:ring-2 focus:ring-[#59A52C]"
                />
                <button 
                  onClick={sendChatMessage}
                  className="w-10 h-10 rounded-full bg-[#59A52C] flex items-center justify-center"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        {isHost ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                cameraEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                micEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={endStream}
              className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white"
            >
              <Tag className="w-6 h-6" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Heart className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Heart className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
