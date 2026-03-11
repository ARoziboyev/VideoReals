// VidoMove - Settings Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';
import { translations, type Language } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Globe, 
  Bell, 
  Lock, 
  Shield, 
  HelpCircle, 
  Info,
  ChevronRight,
  Check,
  Moon,
  Sun,
  LogOut,
  User,
  Key,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'uz', name: 'O\'zbek', flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

interface SettingsItem {
  icon: typeof User;
  label: string;
  action: () => void;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const t = translations[language];
  
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const privacy = 'public';

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageDialog(false);
    toast.success('Language updated');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const accountItems: SettingsItem[] = [
    {
      icon: User,
      label: 'Edit Profile',
      action: () => navigate('/profile'),
      value: currentUser?.username,
    },
    {
      icon: Globe,
      label: String(t.language),
      action: () => setShowLanguageDialog(true),
      value: languages.find(l => l.code === language)?.name,
    },
    {
      icon: Key,
      label: 'Change Password',
      action: () => toast.info('Coming soon'),
    },
  ];

  const preferenceItems: SettingsItem[] = [
    {
      icon: darkMode ? Sun : Moon,
      label: 'Dark Mode',
      action: () => setDarkMode(!darkMode),
      toggle: true,
      toggleValue: darkMode,
    },
    {
      icon: Bell,
      label: 'Notifications',
      action: () => setNotifications(!notifications),
      toggle: true,
      toggleValue: notifications,
    },
  ];

  const privacyItems: SettingsItem[] = [
    {
      icon: Lock,
      label: 'Privacy',
      action: () => toast.info('Coming soon'),
      value: privacy === 'public' ? 'Public' : 'Private',
    },
    {
      icon: Shield,
      label: 'Security',
      action: () => toast.info('Coming soon'),
    },
    {
      icon: Ban,
      label: 'Blocked Users',
      action: () => toast.info('Coming soon'),
    },
  ];

  const supportItems: SettingsItem[] = [
    {
      icon: HelpCircle,
      label: 'Help Center',
      action: () => toast.info('Coming soon'),
    },
    {
      icon: Info,
      label: 'About',
      action: () => toast.info('VidoMove v1.0.0'),
    },
  ];

  const renderSettingsGroup = (title: string, items: SettingsItem[]) => (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      <Card className="overflow-hidden">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
              index !== items.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {!item.toggle && item.value && (
                <span className="text-gray-500 text-sm">{item.value}</span>
              )}
              {item.toggle ? (
                <div className={`w-12 h-6 rounded-full transition-colors ${
                  item.toggleValue ? 'bg-[#59A52C]' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    item.toggleValue ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>
        ))}
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold">{String(t.settings)}</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img 
                src={currentUser?.avatar} 
                alt={currentUser?.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{currentUser?.firstName} {currentUser?.lastName}</h2>
              <p className="text-gray-500">@{currentUser?.username}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/profile')}
            >
              {String(t.editProfile)}
            </Button>
          </div>
        </Card>

        {/* Settings Groups */}
        {renderSettingsGroup('Account', accountItems)}
        {renderSettingsGroup('Preferences', preferenceItems)}
        {renderSettingsGroup('Privacy & Security', privacyItems)}
        {renderSettingsGroup('Support', supportItems)}

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          {String(t.logout)}
        </Button>

        {/* App Version */}
        <p className="text-center text-sm text-gray-400">
          VidoMove v1.0.0
        </p>
      </div>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{String(t.language)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  language === lang.code 
                    ? 'bg-[#59A52C10] border border-[#59A52C]' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`font-medium ${language === lang.code ? 'text-[#59A52C]' : ''}`}>
                    {lang.name}
                  </span>
                </div>
                {language === lang.code && (
                  <Check className="w-5 h-5 text-[#59A52C]" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
