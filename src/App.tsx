import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { Navbar } from './components/Navbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { AttendeePage } from './components/attendee/AttendeePage';
import { AdminPortal } from './components/admin/AdminPortal';
import { testConnection } from './lib/firebase';
import { Video, ShieldCheck, Heart } from 'lucide-react';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<'attendee' | 'admin'>('attendee');
  const { settings } = useSettings();

  useEffect(() => {
    // Test Firebase connection on boot
    testConnection();

    // Check URL path or parameter for /admin or ?tab=admin
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    if (path.startsWith('/admin') || search.get('tab') === 'admin' || search.get('admin') === 'true') {
      setActiveTab('admin');
    }
  }, []);

  const handleTabChange = (tab: 'attendee' | 'admin') => {
    setActiveTab(tab);
    if (tab === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
      <AnnouncementBanner />

      <main className="flex-1 pb-16">
        {activeTab === 'attendee' ? <AttendeePage /> : <AdminPortal />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-6 text-xs text-slate-500 dark:text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>{settings.institutionName || 'Sistem Presensi Rapat Online'}</strong> • Khusus Presensi Rapat Online (WIB)
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>Server Time: Asia/Jakarta (WIB)</span>
            <span>•</span>
            <span>Tersinkronisasi Firebase Cloud</span>
            <span>•</span>
            <button
              onClick={() => handleTabChange(activeTab === 'attendee' ? 'admin' : 'attendee')}
              className="text-blue-600 hover:underline font-semibold"
            >
              {activeTab === 'attendee' ? 'Panel Admin' : 'Halaman Peserta'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MainLayout />
      </SettingsProvider>
    </AuthProvider>
  );
}
