// VidoMove - Main Layout with Bottom Navigation
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore, useContentStore } from '@/store';
import { translations } from '@/types';
import { 
  Home, 
  Search, 
  PlusSquare, 
  MessageCircle, 
  User,
  Video,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { language, notifications } = useAppStore();
  const { liveStreams } = useContentStore();
  const t = translations[language];

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const followingLiveStreams = liveStreams.filter(s => 
    currentUser?.following.includes(s.userId)
  );

  const navItems = [
    { icon: Home, label: t.home as string, path: '/' },
    { icon: Search, label: t.search as string, path: '/search' },
    { icon: PlusSquare, label: t.create as string, path: '/create' },
    { icon: MessageCircle, label: t.messages as string, path: '/chat' },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}>
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{t.appName as string}</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Live Indicator */}
            {followingLiveStreams.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate(`/live/${followingLiveStreams[0].id}`)}
              >
                <Video className="w-5 h-5 text-red-500" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </Button>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-9 w-9">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                      {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  {t.profile as string}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t.settings as string}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.logout as string}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive(item.path) 
                  ? 'text-[#59A52C]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive(item.path) ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          
          {/* Profile Tab */}
          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive('/profile') 
                ? 'text-[#59A52C]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="text-[8px] bg-gradient-to-br from-[#59A52C] to-[#7CB342] text-white">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{t.profile as string}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
