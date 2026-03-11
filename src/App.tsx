// VidoMove - Main App Component
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { MainLayout } from '@/layouts/MainLayout';
import { HomePage } from '@/pages/Home';
import { SearchPage } from '@/pages/Search';
import { CreatePage } from '@/pages/Create';
import { ChatPage } from '@/pages/Chat';
import { ProfilePage } from '@/pages/Profile';
import { StoryViewer } from '@/pages/StoryViewer';
import { LiveStreamPage } from '@/pages/LiveStream';
import { SettingsPage } from '@/pages/Settings';
import { VideoCallPage } from '@/pages/VideoCall';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:userId" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:username" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        {/* Special Routes */}
        <Route 
          path="/story/:userId" 
          element={isAuthenticated ? <StoryViewer /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/live" 
          element={isAuthenticated ? <LiveStreamPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/live/:streamId" 
          element={isAuthenticated ? <LiveStreamPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/call/:userId" 
          element={isAuthenticated ? <VideoCallPage /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
