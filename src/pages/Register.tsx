// VidoMove - Register Page
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';
import { translations } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Eye, EyeOff, Lock, User, Mail, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, isUsernameTaken } = useAuthStore();
  const { language } = useAppStore();
  const navigate = useNavigate();
  const t = translations[language];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.firstName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (isUsernameTaken(formData.username)) {
      toast.error(t.usernameTaken as string);
      return;
    }

    setIsLoading(true);
    const success = await register({
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      password: formData.password,
    });
    setIsLoading(false);

    if (success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error('Failed to create account');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 50%, #9CCC65 100%)' }}>
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}>
              <Video className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">{t.register as string}</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Create your account and start sharing
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700">{t.firstName as string}</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-9 h-11 border-gray-200 focus:border-[#59A52C] focus:ring-[#59A52C]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700">{t.lastName as string}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-11 border-gray-200 focus:border-[#59A52C] focus:ring-[#59A52C]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">{t.username as string}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="@username"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 h-11 border-gray-200 focus:border-[#59A52C] focus:ring-[#59A52C]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">{t.email as string}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-11 border-gray-200 focus:border-[#59A52C] focus:ring-[#59A52C]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">{t.password as string}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#59A52C] focus:ring-[#59A52C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-11 border-gray-200 focus:border-[#59A52C] focus:ring-[#59A52C]"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold text-white border-0"
              style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.register as string}...
                </span>
              ) : (
                t.register as string
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t.haveAccount as string}{' '}
              <Link 
                to="/login" 
                className="font-semibold hover:underline"
                style={{ color: '#59A52C' }}
              >
                {t.login as string}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
