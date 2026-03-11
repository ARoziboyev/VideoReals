// VidoMove - Video Call Page
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PhoneOff, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  FlipHorizontal,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

type CallState = 'calling' | 'ringing' | 'connected' | 'ended';

export function VideoCallPage() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { users } = useAuthStore();
  
  const callType = searchParams.get('type') as 'audio' | 'video' || 'video';
  const otherUser = users.find(u => u.id === userId);
  
  const [callState, setCallState] = useState<CallState>('calling');
  const [cameraEnabled, setCameraEnabled] = useState(callType === 'video');
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Simulate call connection
    const timer = setTimeout(() => {
      setCallState('connected');
      startCallTimer();
    }, 2000);

    // Request media permissions
    if (callType === 'video' || callType === 'audio') {
      navigator.mediaDevices.getUserMedia({ 
        video: callType === 'video', 
        audio: true 
      }).then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }).catch(() => {
        toast.error('Could not access camera/microphone');
      });
    }

    return () => {
      clearTimeout(timer);
      stopCallTimer();
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [callType]);

  const startCallTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    setCallState('ended');
    stopCallTimer();
    localStream?.getTracks().forEach(track => track.stop());
    
    setTimeout(() => {
      navigate(-1);
    }, 1000);
  };

  // Calling State
  if (callState === 'calling') {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-6 ring-4 ring-[#59A52C] ring-offset-4 ring-offset-gray-900 animate-pulse">
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-2xl">
              {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-white text-2xl font-semibold mb-2">
            {otherUser?.firstName} {otherUser?.lastName}
          </h2>
          <p className="text-gray-400">Calling...</p>
        </div>

        <div className="absolute bottom-12 flex gap-6">
          <button 
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              micEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          <button 
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white"
          >
            <PhoneOff className="w-8 h-8" />
          </button>
        </div>
      </div>
    );
  }

  // Connected State
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0">
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            poster={otherUser?.avatar}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src={otherUser?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-3xl">
                  {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-white text-xl font-semibold">
                {otherUser?.firstName} {otherUser?.lastName}
              </h2>
              <p className="text-gray-400 mt-2">{formatDuration(callDuration)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Picture in Picture) */}
      {callType === 'video' && (
        <div className="absolute top-20 right-4 w-32 h-44 bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="font-semibold">{otherUser?.username}</h3>
            <p className="text-sm opacity-70">{formatDuration(callDuration)}</p>
          </div>
          <button 
            onClick={() => setSpeakerEnabled(!speakerEnabled)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            {speakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
        {callType === 'video' && (
          <button 
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              cameraEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        )}
        
        <button 
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            micEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button 
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white"
        >
          <PhoneOff className="w-8 h-8" />
        </button>

        {callType === 'video' && (
          <button 
            className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white"
          >
            <FlipHorizontal className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
