import { useEffect } from 'react';
import { useUIStore, useAuthStore } from './store';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';

function App() {
  const currentView = useUIStore((state) => state.currentView);
  const setView = useUIStore((state) => state.setView);
  const setAuthModal = useUIStore((state) => state.setAuthModal);

  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);

  // Restore auth state from localStorage on first mount
  useEffect(() => {
    initialize();

    const handleAuthError = () => {
      useAuthStore.getState().logout();
      setView('landing');
      setAuthModal(true, 'login');
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, [initialize, setView, setAuthModal]);

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
