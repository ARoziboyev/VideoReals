// VidoMove - Chat Page (Telegram-like)
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useChatStore, useAppStore } from '@/store';
import { translations, chatBackgrounds } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Paperclip,
  Smile,
  Trash2,
  Edit2,
  Reply,
  Check,
  CheckCheck,
  X,
  Palette,
  Ban,
  Eraser,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

export function ChatPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const { 
    chats, 
    activeChat, 
    createChat, 
    sendMessage, 
    editMessage, 
    deleteMessage,
    setChatBackground,
    clearChat,
    deleteChat,
    blockChat,
    unblockChat,
    setActiveChat
  } = useChatStore();
  const { language } = useAppStore();
  const t = translations[language];
  
  const [messageText, setMessageText] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create chat
  useEffect(() => {
    if (userId) {
      const chatId = createChat(userId);
      setActiveChat(chatId);
    }
    return () => setActiveChat(null);
  }, [userId, createChat, setActiveChat]);

  const chat = chats.find(c => c.id === activeChat);
  const otherUser = chat?.participants.find(id => id !== currentUser?.id);
  const otherUserData = users.find(u => u.id === otherUser);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !chat || !currentUser) return;

    if (chat.isBlocked) {
      toast.error('Chat is blocked');
      return;
    }

    if (editingMessage) {
      editMessage(chat.id, editingMessage, messageText);
      setEditingMessage(null);
    } else {
      sendMessage(chat.id, {
        chatId: chat.id,
        senderId: currentUser.id,
        text: messageText,
        isDeleted: false,
        type: 'text',
        replyTo: replyingTo || undefined,
      });
      setReplyingTo(null);
    }
    setMessageText('');
  };

  const handleEdit = (messageId: string, text: string) => {
    setEditingMessage(messageId);
    setMessageText(text);
  };

  const handleDelete = (messageId: string) => {
    if (!chat) return;
    deleteMessage(chat.id, messageId);
    toast.success('Message deleted');
  };

  const handleClearChat = () => {
    if (!chat) return;
    clearChat(chat.id);
    setShowClearDialog(false);
    toast.success('Chat cleared');
  };

  const handleDeleteChat = () => {
    if (!chat) return;
    deleteChat(chat.id);
    setShowDeleteDialog(false);
    navigate('/chat');
    toast.success('Chat deleted');
  };

  const handleBlock = () => {
    if (!chat || !currentUser) return;
    if (chat.isBlocked) {
      unblockChat(chat.id);
      toast.success('User unblocked');
    } else {
      blockChat(chat.id, currentUser.id);
      toast.success('User blocked');
    }
    setShowBlockDialog(false);
  };

  const handleBackgroundChange = (backgroundId: string) => {
    if (!chat) return;
    setChatBackground(chat.id, backgroundId);
    setShowBackgroundDialog(false);
    toast.success('Background updated');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBackgroundStyle = () => {
    const bg = chatBackgrounds.find(b => b.id === chat?.background);
    return bg?.gradient || chatBackgrounds[0].gradient;
  };

  // Chat List View (when no userId)
  if (!userId) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold">{t.messages as string}</h1>
        </div>
        
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #59A52C20 0%, #7CB34220 100%)' }}>
              <Send className="w-10 h-10 text-[#59A52C]" />
            </div>
            <p className="text-gray-500 text-center">{t.noMessages as string}</p>
            <p className="text-sm text-gray-400 mt-2">Start a conversation from search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map(chatItem => {
              const otherParticipantId = chatItem.participants.find(id => id !== currentUser?.id);
              const otherParticipant = users.find(u => u.id === otherParticipantId);
              const lastMessage = chatItem.messages[chatItem.messages.length - 1];
              
              return (
                <button
                  key={chatItem.id}
                  onClick={() => navigate(`/chat/${otherParticipantId}`)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={otherParticipant?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                        {otherParticipant?.firstName?.[0]}{otherParticipant?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {otherParticipant?.isLive && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
                        LIVE
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{otherParticipant?.username}</p>
                      {lastMessage && (
                        <span className="text-xs text-gray-400">
                          {formatTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {lastMessage?.isDeleted 
                        ? 'Message deleted' 
                        : lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                  {chatItem.unreadCount && chatItem.unreadCount[currentUser?.id || ''] > 0 && (
                    <span className="w-5 h-5 bg-[#59A52C] text-white text-xs rounded-full flex items-center justify-center">
                      {chatItem.unreadCount[currentUser?.id || '']}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Individual Chat View
  if (!otherUserData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/chat')}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button 
            onClick={() => navigate(`/profile/${otherUserData.username}`)}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUserData.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-sm">
                  {otherUserData.firstName[0]}{otherUserData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {otherUserData.isLive && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
                  LIVE
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold">{otherUserData.username}</p>
              <p className="text-xs text-gray-500">
                {otherUserData.isLive ? 'Live now' : 'Last seen recently'}
              </p>
            </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/call/${otherUserData.id}?type=audio`)}>
            <Phone className="w-5 h-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/call/${otherUserData.id}?type=video`)}>
            <Video className="w-5 h-5 text-gray-600" />
          </Button>
          
          {/* 3-dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowBackgroundDialog(true)}>
                <Palette className="w-4 h-4 mr-2" />
                {String(t.chatBackground)}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                <Eraser className="w-4 h-4 mr-2" />
                {String(t.clearChat)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                {String(t.deleteChat)}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className={chat?.isBlocked ? 'text-green-600' : 'text-red-600'}>
                <Ban className="w-4 h-4 mr-2" />
                {chat?.isBlocked ? String(t.unblockUser) : String(t.blockUser)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ background: getBackgroundStyle() }}
      >
        {chat?.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/70">
            <Send className="w-12 h-12 mb-4 opacity-50" />
            <p>Start a conversation</p>
          </div>
        ) : (
          chat?.messages.map((message, index) => {
            const isOwn = message.senderId === currentUser?.id;
            const showAvatar = !isOwn && (index === 0 || chat.messages[index - 1]?.senderId !== message.senderId);
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && showAvatar ? (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={otherUserData.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white text-xs">
                        {otherUserData.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                  ) : !isOwn && <div className="w-8 flex-shrink-0" />}
                  
                  <div className={`relative group/message ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Reply Preview */}
                    {message.replyTo && (
                      <div className={`text-xs text-gray-500 mb-1 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                        Replying to message
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl relative ${
                        isOwn 
                          ? 'bg-[#59A52C] text-white rounded-br-md' 
                          : 'bg-white text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {message.isDeleted ? (
                        <span className="italic opacity-60">Message deleted</span>
                      ) : (
                        <p>{message.text}</p>
                      )}
                      
                      {/* Message Actions */}
                      {!message.isDeleted && isOwn && (
                        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/message:opacity-100 transition-opacity ${
                          isOwn ? '-left-20' : '-right-20'
                        } flex gap-1`}>
                          <button 
                            onClick={() => handleEdit(message.id, message.text)}
                            className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                          >
                            <Edit2 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button 
                            onClick={() => handleDelete(message.id)}
                            className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      )}
                      
                      {!message.isDeleted && !isOwn && (
                        <button 
                          onClick={() => setReplyingTo(message.id)}
                          className={`absolute top-1/2 -translate-y-1/2 -right-8 opacity-0 group-hover/message:opacity-100 transition-opacity p-1 bg-white rounded-full shadow-md hover:bg-gray-100`}
                        >
                          <Reply className="w-3 h-3 text-gray-600" />
                        </button>
                      )}
                    </div>
                    
                    {/* Time & Status */}
                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOwn ? 'text-white/70 justify-end' : 'text-gray-500'}`}>
                      <span>{formatTime(message.createdAt)}</span>
                      {message.editedAt && <span>(edited)</span>}
                      {isOwn && (
                        message.isDeleted ? <Check className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-200">
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-t-lg mb-2">
            <span className="text-sm text-gray-600">Replying to message</span>
            <button onClick={() => setReplyingTo(null)}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
        
        {editingMessage && (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-t-lg mb-2">
            <span className="text-sm text-gray-600">Editing message</span>
            <button onClick={() => { setEditingMessage(null); setMessageText(''); }}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {chat?.isBlocked ? (
          <div className="text-center py-3 text-gray-500">
            {chat.blockedBy === currentUser?.id ? 'You blocked this user' : 'You are blocked'}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={String(t.typeMessage)}
                className="pr-10 rounded-full border-gray-300 focus:border-[#59A52C] focus:ring-[#59A52C]"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <Smile className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              size="icon"
              className="flex-shrink-0 rounded-full text-white border-0"
              style={{ background: messageText.trim() ? 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' : '#E5E7EB' }}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Background Dialog */}
      <Dialog open={showBackgroundDialog} onOpenChange={setShowBackgroundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{String(t.chatBackground)}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {chatBackgrounds.map(bg => (
              <button
                key={bg.id}
                onClick={() => handleBackgroundChange(bg.id)}
                className={`p-3 rounded-xl text-white font-medium transition-transform hover:scale-105 ${
                  chat?.background === bg.id ? 'ring-2 ring-offset-2 ring-[#59A52C]' : ''
                }`}
                style={{ background: bg.gradient }}
              >
                {bg.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Chat Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{String(t.clearChat)}</DialogTitle>
            <DialogDescription>{String(t.areYouSure)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              {String(t.cancel)}
            </Button>
            <Button onClick={handleClearChat} variant="destructive">
              {String(t.clearChat)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{String(t.deleteChat)}</DialogTitle>
            <DialogDescription>{String(t.actionCannotBeUndone)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {String(t.cancel)}
            </Button>
            <Button onClick={handleDeleteChat} variant="destructive">
              {String(t.delete)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{chat?.isBlocked ? String(t.unblockUser) : String(t.blockUser)}</DialogTitle>
            <DialogDescription>
              {chat?.isBlocked 
                ? 'This user will be able to message you again' 
                : 'This user will not be able to message you'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              {String(t.cancel)}
            </Button>
            <Button onClick={handleBlock} variant={chat?.isBlocked ? 'default' : 'destructive'}>
              {chat?.isBlocked ? String(t.unblockUser) : String(t.blockUser)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
