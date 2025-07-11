import React from 'react';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onAdminPanelClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminPanelClick }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      instructor: 'bg-green-100 text-green-800',
      student: 'bg-blue-100 text-blue-800'
    };
    return badges[role as keyof typeof badges] || badges.student;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Admin',
      instructor: 'Mentor',
      student: 'Siswa'
    };
    return labels[role as keyof typeof labels] || 'Siswa';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="https://bucket.idejongkok.my.id/logo_kelas_otomesyen_new_1.png" 
                  alt="Kelas Otomesyen Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Kelas Otomesyen</h1>
                <p className="text-xs text-gray-500">Classroom</p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>

            {/* User Menu */}
            <div className="relative flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                {user?.avatar_url ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.avatar_url}
                    alt={user.full_name}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="hidden md:block">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user?.role || 'student')}`}>
                      {getRoleLabel(user?.role || 'student')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              {/* Admin Panel Button */}
              {user?.role === 'admin' && onAdminPanelClick && (
                <button
                  onClick={onAdminPanelClick}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                  title="Admin Panel"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;