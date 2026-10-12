import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Video,
  BarChart3,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Meeting, Attendance } from '../../types';
import { getTodayDateStringWIB, formatWIBDateTime, getMeetingAttendanceStatus } from '../../lib/timeUtils';
import { useSettings } from '../../context/SettingsContext';

interface AdminDashboardProps {
  meetings: Meeting[];
  attendanceList: Attendance[];
  onSelectMeeting: (meetingId: string) => void;
  onNavigateTab: (tab: 'meetings' | 'attendance' | 'settings' | 'admins' | 'audit') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  meetings,
  attendanceList,
  onSelectMeeting,
  onNavigateTab,
}) => {
  const { settings, seedInitialDataIfEmpty } = useSettings();
  const [seeding, setSeeding] = useState<boolean>(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const todayStr = getTodayDateStringWIB();

  // 1. KPI: Total Meetings
  const totalMeetings = meetings.length;

  // 2. KPI: Meetings currently open
  const openMeetingsCount = meetings.filter((m) => {
    const status = getMeetingAttendanceStatus(
      m,
      settings.autoOpenMinutesBefore,
      settings.autoCloseMinutesAfter
    );
    return status.isOpen;
  }).length;

  // 3. KPI: Attendance today (WIB)
  const attendanceTodayCount = attendanceList.filter((att) => {
    if (!att.submittedAt) return false;
    let d: Date;
    if (att.submittedAt?.toDate) {
      d = att.submittedAt.toDate();
    } else {
      d = new Date(att.submittedAt);
    }
    const attDateWib = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    return attDateWib === todayStr;
  }).length;

  // 4. KPI: Total attendance
  const totalAttendanceCount = attendanceList.length;

  // Attendance by Meeting
  const attendanceByMeeting = meetings.map((m) => {
    const count = attendanceList.filter((a) => a.meetingId === m.id).length;
    return {
      meeting: m,
      count,
    };
  });

  const maxCount = Math.max(...attendanceByMeeting.map((item) => item.count), 1);

  // Recent Attendee Submissions (up to 7)
  const recentAttendance = [...attendanceList]
    .sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : new Date(a.submittedAt || 0).getTime();
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : new Date(b.submittedAt || 0).getTime();
      return timeB - timeA;
    })
    .slice(0, 7);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess(null);
    try {
      const result = await seedInitialDataIfEmpty();
      if (result) {
        setSeedSuccess('Data contoh (3 rapat & peserta) berhasil dimuat!');
      } else {
        setSeedSuccess('Database sudah memiliki data rapat.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Ringkasan Kehadiran Rapat Online
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Pemantauan presensi dan rekapitulasi waktu nyata (Zona WIB)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {meetings.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seeding ? 'Memuat Data...' : 'Muat 3 Rapat Contoh'}</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('meetings')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Rapat Baru</span>
          </button>
        </div>
      </div>

      {seedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
          {seedSuccess}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Rapat
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalMeetings}
          </div>
          <p className="text-[11px] text-slate-400">Terdaftar di sistem</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Absen Dibuka
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {openMeetingsCount}
          </div>
          <p className="text-[11px] text-slate-400">Dapat diisi peserta saat ini</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Hadir Hari Ini
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {attendanceTodayCount}
          </div>
          <p className="text-[11px] text-slate-400">Peserta tanggal {todayStr}</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Kehadiran
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalAttendanceCount}
          </div>
          <p className="text-[11px] text-slate-400">Akumulasi seluruh sesi</p>
        </div>
      </div>

      {/* Main Grid: Chart per Rapat + Live Attendance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance breakdown per meeting (Bar chart) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Statistik Kehadiran per Rapat
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Lihat Detail <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {attendanceByMeeting.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada data rapat untuk ditampilkan.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {attendanceByMeeting.map((item) => {
                const percent = Math.round((item.count / maxCount) * 100);
                const status = getMeetingAttendanceStatus(
                  item.meeting,
                  settings.autoOpenMinutesBefore,
                  settings.autoCloseMinutesAfter
                );

                return (
                  <div
                    key={item.meeting.id}
                    onClick={() => {
                      onSelectMeeting(item.meeting.id);
                      onNavigateTab('attendance');
                    }}
                    className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer space-y-2 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate max-w-[70%]">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.meeting.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.badgeClass} shrink-0`}>
                          {item.meeting.platform}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                        {item.count} Peserta
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Recent Attendance Feed */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Presensi Terbaru
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
              Live Real-time
            </span>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada peserta yang mengisi kehadiran.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((att) => {
                const meeting = meetings.find((m) => m.id === att.meetingId);
                return (
                  <div
                    key={att.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {att.fullName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                          {att.role}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 truncate">
                        {att.institution} {att.position ? `• ${att.position}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {meeting ? meeting.title : 'Rapat Online'}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono text-right shrink-0">
                      {formatWIBDateTime(att.submittedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
