import { useEffect } from 'react';
import { useUIStore } from './store/useUIStore';
import { useAuthStore } from './store/useAuthStore';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';

function App() {
  const { currentView, setView, setAuthModal } = useUIStore();
  const { initialize, user } = useAuthStore();

  // Restore auth state from localStorage on first mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Route guard: redirect unauthenticated users away from dashboard
  useEffect(() => {
    if (currentView === 'dashboard' && !user) {
      setView('landing');
      setAuthModal(true, 'login');
    }
  }, [currentView, user, setView, setAuthModal]);

  return (
    <div className="min-h-screen bg-[#0b0f19]">
      {currentView === 'landing' ? <LandingPage /> : <Dashboard />}
      <AuthModal />
    </div>
  );
}

export default App;
