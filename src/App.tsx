import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ClassDetail from './components/ClassDetail';
import AdminPanel from './components/AdminPanel';
import AttendancePage from './components/AttendancePage';
import SetPassword from './components/SetPassword';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'class' | 'admin' | 'attendance' | 'set-password'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [attendanceToken, setAttendanceToken] = useState<string | null>(null);
  const [passwordToken, setPasswordToken] = useState<string | null>(null);
  const [passwordType, setPasswordType] = useState<'reset' | 'invitation'>('reset');

  // Handle OAuth redirect cleanup and special links
  useEffect(() => {
    const url = new URL(window.location.href);
    
    // Check for attendance token in URL
    const attendanceMatch = window.location.pathname.match(/^\/attend\/(.+)$/);
    if (attendanceMatch) {
      setAttendanceToken(attendanceMatch[1]);
      setCurrentView('attendance');
      return;
    }
    
    // Check for password reset token in URL
    const resetMatch = window.location.pathname.match(/^\/reset-password\/(.+)$/);
    if (resetMatch) {
      setPasswordToken(resetMatch[1]);
      setPasswordType('reset');
      setCurrentView('set-password');
      return;
    }
    
    // Check for invitation token in URL
    const inviteMatch = window.location.pathname.match(/^\/invite\/(.+)$/);
    if (inviteMatch) {
      setPasswordToken(inviteMatch[1]);
      setPasswordType('invitation');
      setCurrentView('set-password');
      return;
    }
    
    if (url.hash.includes('access_token') || url.searchParams.has('access_token')) {
      // Clean up the URL after OAuth redirect
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleClassSelect = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentView('class');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedBatchId(null);
  };

  const handleAdminPanelClick = () => {
    setCurrentView('admin');
  };

  const handleBackFromAdmin = () => {
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Show attendance page if token is present
  if (currentView === 'attendance' && attendanceToken) {
    return <AttendancePage token={attendanceToken} />;
  }

  // Show set password page if token is present
  if (currentView === 'set-password' && passwordToken) {
    return <SetPassword token={passwordToken} type={passwordType} />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAdminPanelClick={user.role === 'admin' ? handleAdminPanelClick : undefined} />
      <main>
        {currentView === 'dashboard' && (
          <Dashboard onClassSelect={handleClassSelect} />
        )}
        {currentView === 'class' && selectedBatchId && (
          <ClassDetail 
            batchId={selectedBatchId} 
            onBack={handleBackToDashboard}
          />
        )}
        {currentView === 'admin' && user.role === 'admin' && (
          <AdminPanel onBack={handleBackFromAdmin} />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;