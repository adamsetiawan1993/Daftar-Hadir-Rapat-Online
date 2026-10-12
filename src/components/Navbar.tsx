import React, { useState, useEffect } from 'react';
import { Video, Shield, UserCheck, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface NavbarProps {
  activeTab: 'attendee' | 'admin';
  setActiveTab: (tab: 'attendee' | 'admin') => void;
  onOpenSeedModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, isAdmin, isSuperAdmin, adminRole, logout } = useAuth();
  const { settings } = useSettings();
  const [currentWIBTime, setCurrentWIBTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());
      setCurrentWIBTime(`${now} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getThemeHeaderGradient = () => {
    switch (settings.themeColor) {
      case 'orange':
        return 'from-orange-700 via-amber-700 to-orange-900';
      case 'indigo':
        return 'from-indigo-900 via-indigo-800 to-indigo-950';
      case 'emerald':
        return 'from-emerald-900 via-emerald-800 to-emerald-950';
      case 'teal':
        return 'from-teal-900 via-teal-800 to-teal-950';
      case 'slate':
        return 'from-slate-900 via-slate-800 to-slate-950';
      case 'blue':
      default:
        return 'from-blue-900 via-blue-800 to-slate-900';
    }
  };

  return (
    <header className={`bg-gradient-to-r ${getThemeHeaderGradient()} text-white shadow-md sticky top-0 z-40 transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Institution Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Video className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  {settings.institutionName || 'Pemerintah Republik Indonesia'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Resmi
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Daftar Hadir Rapat Online
              </h1>
              {settings.institutionSub && (
                <p className="text-xs text-slate-300 line-clamp-1 hidden sm:block">
                  {settings.institutionSub}
                </p>
              )}
            </div>
          </div>

          {/* Right Controls: Live WIB Time, Mode Switcher, Admin Auth Status */}
          <div className="flex items-center space-x-3">
            {/* Live WIB Clock */}
            <div className="hidden md:flex items-center space-x-1.5 bg-black/25 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentWIBTime || 'WIB'}</span>
            </div>

            {/* Mode Switcher */}
            <div className="bg-black/30 p-1 rounded-xl border border-white/15 flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('attendee')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'attendee'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Peserta</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                  activeTab === 'admin'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin</span>
                {currentUser && isAdmin && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                )}
              </button>
            </div>

            {/* User Session Pill */}
            {currentUser && (
              <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-white/20">
                <div className="text-right">
                  <p className="text-xs font-medium text-white max-w-[130px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-mono">
                    {isSuperAdmin ? 'Super Admin' : adminRole === 'operator' ? 'Operator' : 'Admin'}
                  </p>
                </div>
                <button
                  onClick={() => logout()}
                  title="Keluar Admin"
                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
