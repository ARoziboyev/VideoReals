// VidoMove - Zustand Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Chat, Message, Story, Post, Reel, LiveStream, Language, PostComment } from '@/types';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  isUsernameTaken: (username: string) => boolean;
}

interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  createChat: (participantId: string) => string;
  sendMessage: (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => void;
  editMessage: (chatId: string, messageId: string, newText: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setChatBackground: (chatId: string, backgroundId: string) => void;
  clearChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  blockChat: (chatId: string, userId: string) => void;
  unblockChat: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;
}

interface ContentState {
  stories: Story[];
  posts: Post[];
  reels: Reel[];
  liveStreams: LiveStream[];
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'expiresAt' | 'views'>) => void;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
  addReel: (reel: Omit<Reel, 'id' | 'createdAt' | 'likes' | 'comments' | 'views'>) => void;
  likePost: (postId: string, userId: string) => void;
  unlikePost: (postId: string, userId: string) => void;
  addComment: (postId: string, comment: Omit<PostComment, 'id' | 'createdAt' | 'likes'>) => void;
  viewStory: (storyId: string, userId: string) => void;
  startLiveStream: (stream: Omit<LiveStream, 'id' | 'startedAt' | 'viewers'>) => string;
  endLiveStream: (streamId: string) => void;
  joinLiveStream: (streamId: string, userId: string) => void;
  leaveLiveStream: (streamId: string, userId: string) => void;
}

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'mention' | 'message';
  fromUserId: string;
  toUserId: string;
  content?: string;
  createdAt: number;
  read: boolean;
}

// Mock initial data
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    bio: 'Welcome to VidoMove!',
    followers: ['2', '3'],
    following: ['2'],
    isLive: false,
    stories: [],
    posts: [],
    reels: [],
  },
  {
    id: '2',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    bio: 'Photography enthusiast 📸',
    followers: ['1', '3'],
    following: ['1'],
    isLive: false,
    stories: [],
    posts: [],
    reels: [],
  },
  {
    id: '3',
    username: 'janedoe',
    firstName: 'Jane',
    lastName: 'Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    bio: 'Travel lover ✈️',
    followers: ['1'],
    following: ['1', '2'],
    isLive: false,
    stories: [],
    posts: [],
    reels: [],
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      users: mockUsers,

      login: async (username: string, password: string) => {
        const user = get().users.find(u => u.username === username);
        if (user && password === 'password') {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      register: async (userData) => {
        const { users } = get();
        if (users.some(u => u.username === userData.username)) {
          return false;
        }
        const newUser: User = {
          id: Date.now().toString(),
          username: userData.username!,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
          bio: '',
          followers: [],
          following: [],
          isLive: false,
          stories: [],
          posts: [],
          reels: [],
        };
        set({ users: [...users, newUser], currentUser: newUser, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...userData };
        set({
          currentUser: updatedUser,
          users: users.map(u => u.id === currentUser.id ? updatedUser : u),
        });
      },

      followUser: (userId: string) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const updatedUser = { ...currentUser, following: [...currentUser.following, userId] };
        const targetUser = users.find(u => u.id === userId);
        if (targetUser) {
          const updatedTarget = { ...targetUser, followers: [...targetUser.followers, currentUser.id] };
          set({
            currentUser: updatedUser,
            users: users.map(u => u.id === currentUser.id ? updatedUser : u.id === userId ? updatedTarget : u),
          });
        }
      },

      unfollowUser: (userId: string) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const updatedUser = { ...currentUser, following: currentUser.following.filter(id => id !== userId) };
        const targetUser = users.find(u => u.id === userId);
        if (targetUser) {
          const updatedTarget = { ...targetUser, followers: targetUser.followers.filter(id => id !== currentUser.id) };
          set({
            currentUser: updatedUser,
            users: users.map(u => u.id === currentUser.id ? updatedUser : u.id === userId ? updatedTarget : u),
          });
        }
      },

      isUsernameTaken: (username: string) => {
        return get().users.some(u => u.username.toLowerCase() === username.toLowerCase());
      },
    }),
    { name: 'auth-storage' }
  )
);

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,

      createChat: (participantId: string) => {
        const { currentUser } = useAuthStore.getState();
        if (!currentUser) return '';
        const existingChat = get().chats.find(c => 
          c.participants.includes(currentUser.id) && c.participants.includes(participantId)
        );
        if (existingChat) return existingChat.id;
        
        const newChat: Chat = {
          id: Date.now().toString(),
          participants: [currentUser.id, participantId],
          messages: [],
          background: 'default',
          isBlocked: false,
          lastMessageAt: Date.now(),
          unreadCount: {},
        };
        set({ chats: [...get().chats, newChat] });
        return newChat.id;
      },

      sendMessage: (chatId: string, message) => {
        const { chats } = get();
        const newMessage: Message = {
          ...message,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        set({
          chats: chats.map(c => c.id === chatId ? {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessageAt: Date.now(),
          } : c),
        });
      },

      editMessage: (chatId: string, messageId: string, newText: string) => {
        const { chats } = get();
        set({
          chats: chats.map(c => c.id === chatId ? {
            ...c,
            messages: c.messages.map(m => m.id === messageId ? {
              ...m,
              text: newText,
              editedAt: Date.now(),
            } : m),
          } : c),
        });
      },

      deleteMessage: (chatId: string, messageId: string) => {
        const { chats } = get();
        set({
          chats: chats.map(c => c.id === chatId ? {
            ...c,
            messages: c.messages.map(m => m.id === messageId ? { ...m, isDeleted: true, text: '' } : m),
          } : c),
        });
      },

      setChatBackground: (chatId: string, backgroundId: string) => {
        const { chats } = get();
        set({
          chats: chats.map(c => c.id === chatId ? { ...c, background: backgroundId } : c),
        });
      },

      clearChat: (chatId: string) => {
        const { chats } = get();
        set({
          chats: chats.map(c => c.id === chatId ? { ...c, messages: [] } : c),
        });
      },

      deleteChat: (chatId: string) => {
        const { chats } = get();
        set({ chats: chats.filter(c => c.id !== chatId), activeChat: null });
      },

      blockChat: (chatId: string, userId: string) => {
        const { chats } = get();
        set({
          chats: chats.map(c => c.id === chatId ? { ...c, isBlocked: true, blockedBy: userId } : c),
        });
      },

      unblockChat: (chatId: string) => {
        const { chats } = get();
        set({
          chats: chats.map(c => c.id === chatId ? { ...c, isBlocked: false, blockedBy: undefined } : c),
        });
      },

      setActiveChat: (chatId: string | null) => {
        set({ activeChat: chatId });
      },
    }),
    { name: 'chat-storage' }
  )
);

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      stories: [],
      posts: [],
      reels: [],
      liveStreams: [],

      addStory: (story) => {
        const newStory: Story = {
          ...story,
          id: Date.now().toString(),
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          views: [],
        };
        set({ stories: [...get().stories, newStory] });
      },

      addPost: (post) => {
        const newPost: Post = {
          ...post,
          id: Date.now().toString(),
          createdAt: Date.now(),
          likes: [],
          comments: [],
        };
        set({ posts: [newPost, ...get().posts] });
      },

      addReel: (reel) => {
        const newReel: Reel = {
          ...reel,
          id: Date.now().toString(),
          createdAt: Date.now(),
          likes: [],
          comments: [],
          views: 0,
        };
        set({ reels: [newReel, ...get().reels] });
      },

      likePost: (postId: string, userId: string) => {
        const { posts } = get();
        set({
          posts: posts.map(p => p.id === postId ? { ...p, likes: [...p.likes, userId] } : p),
        });
      },

      unlikePost: (postId: string, userId: string) => {
        const { posts } = get();
        set({
          posts: posts.map(p => p.id === postId ? { ...p, likes: p.likes.filter(id => id !== userId) } : p),
        });
      },

      addComment: (postId: string, comment: Omit<PostComment, 'id' | 'createdAt' | 'likes'>) => {
        const { posts } = get();
        const newComment: PostComment = {
          ...comment,
          id: Date.now().toString(),
          createdAt: Date.now(),
          likes: [],
        };
        set({
          posts: posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p),
        });
      },

      viewStory: (storyId: string, userId: string) => {
        const { stories } = get();
        set({
          stories: stories.map(s => s.id === storyId && !s.views.includes(userId) ? {
            ...s,
            views: [...s.views, userId],
          } : s),
        });
      },

      startLiveStream: (stream) => {
        const newStream: LiveStream = {
          ...stream,
          id: Date.now().toString(),
          startedAt: Date.now(),
          viewers: [],
        };
        set({ liveStreams: [...get().liveStreams, newStream] });
        return newStream.id;
      },

      endLiveStream: (streamId: string) => {
        const { liveStreams } = get();
        set({ liveStreams: liveStreams.filter(s => s.id !== streamId) });
      },

      joinLiveStream: (streamId: string, userId: string) => {
        const { liveStreams } = get();
        set({
          liveStreams: liveStreams.map(s => s.id === streamId && !s.viewers.includes(userId) ? {
            ...s,
            viewers: [...s.viewers, userId],
          } : s),
        });
      },

      leaveLiveStream: (streamId: string, userId: string) => {
        const { liveStreams } = get();
        set({
          liveStreams: liveStreams.map(s => s.id === streamId ? {
            ...s,
            viewers: s.viewers.filter(id => id !== userId),
          } : s),
        });
      },
    }),
    { name: 'content-storage' }
  )
);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang }),
      isLoading: false,
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      notifications: [],
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: Date.now().toString(),
          createdAt: Date.now(),
          read: false,
        };
        set({ notifications: [newNotification, ...get().notifications] });
      },
      markNotificationRead: (id: string) => {
        set({
          notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n),
        });
      },
      searchQuery: '',
      setSearchQuery: (query: string) => set({ searchQuery: query }),
    }),
    { name: 'app-storage' }
  )
);
