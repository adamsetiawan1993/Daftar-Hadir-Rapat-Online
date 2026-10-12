import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings as SettingsIcon,
  ShieldCheck,
  History,
  Lock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Meeting, Attendance } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { MeetingManager } from './MeetingManager';
import { AttendanceList } from './AttendanceList';
import { SettingsPanel } from './SettingsPanel';
import { AdminUsersPanel } from './AdminUsersPanel';
import { AuditLogPanel } from './AuditLogPanel';

type AdminTab = 'dashboard' | 'meetings' | 'attendance' | 'settings' | 'admins' | 'audit';

export const AdminPortal: React.FC = () => {
  const { currentUser, isAdmin, isSuperAdmin, adminRole, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');

  // Fetch real-time meetings
  useEffect(() => {
    if (!currentUser || !isAdmin) return;

    const qMeetings = query(collection(db, 'meetings'), orderBy('date', 'desc'));
    const unsubMeetings = onSnapshot(
      qMeetings,
      (snapshot) => {
        const list: Meeting[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<Meeting, 'id'>) });
        });
        setMeetings(list);
        if (list.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(list[0].id);
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'meetings');
        } catch (e) {
          console.error(e);
        }
      }
    );

    const qAttendance = query(collection(db, 'attendance'), orderBy('submittedAt', 'desc'));
    const unsubAttendance = onSnapshot(
      qAttendance,
      (snapshot) => {
        const list: Attendance[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<Attendance, 'id'>) });
        });
        setAttendanceList(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'attendance');
        } catch (e) {
          console.error(e);
        }
      }
    );

    return () => {
      unsubMeetings();
      unsubAttendance();
    };
  }, [currentUser, isAdmin]);

  if (authLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Memeriksa status autentikasi admin...</p>
      </div>
    );
  }

  // Not signed in as admin -> Show login
  if (!currentUser || !isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'meetings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kelola Rapat</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-full text-[10px]">
              {meetings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Hadir</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-full text-[10px]">
              {attendanceList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Pengaturan</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'admins'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Kelola Admin</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Log Audit</span>
          </button>
        </div>

        {/* Quick Log out */}
        <button
          onClick={() => logout()}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition shrink-0"
          title="Keluar Akun Admin"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab View */}
      <div className="pt-2">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            meetings={meetings}
            attendanceList={attendanceList}
            onSelectMeeting={(mId) => setSelectedMeetingId(mId)}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'meetings' && (
          <MeetingManager
            meetings={meetings}
            onSelectMeetingForAttendance={(mId) => {
              setSelectedMeetingId(mId);
              setActiveTab('attendance');
            }}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceList
            meetings={meetings}
            attendanceList={attendanceList}
            selectedMeetingId={selectedMeetingId}
            setSelectedMeetingId={(mId) => setSelectedMeetingId(mId)}
          />
        )}

        {activeTab === 'settings' && <SettingsPanel />}

        {activeTab === 'admins' && <AdminUsersPanel />}

        {activeTab === 'audit' && <AuditLogPanel />}
      </div>
    </div>
  );
};
