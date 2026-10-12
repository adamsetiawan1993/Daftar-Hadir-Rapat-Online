import React from 'react';
import { Megaphone, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const AnnouncementBanner: React.FC = () => {
  const { settings } = useSettings();

  if (!settings.announcement || settings.announcement.trim() === '') {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <span className="font-semibold text-amber-800 dark:text-amber-300 shrink-0">
            Pengumuman:
          </span>
          <span className="text-amber-900/90 dark:text-amber-200/90 font-normal">
            {settings.announcement}
          </span>
        </div>
      </div>
    </div>
  );
};
