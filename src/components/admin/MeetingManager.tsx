import React, { useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  Plus,
  Video,
  Calendar,
  Clock,
  KeyRound,
  Edit2,
  Trash2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Lock,
  Unlock,
  RotateCcw,
  AlertTriangle,
  Loader2,
  X,
  Search,
  Sparkles,
  Share2,
  MessageSquare,
  PenTool,
  MapPin,
  Megaphone,
  FileText,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Meeting, MeetingPlatform, MeetingStatusMode, CustomField, MeetingMaterial } from '../../types';
import {
  formatIndonesianDate,
  getTodayDateStringWIB,
  getMeetingAttendanceStatus,
} from '../../lib/timeUtils';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { QRCodeModal } from '../QRCodeModal';
import { CustomFieldsManager } from './CustomFieldsManager';
import { MaterialsManager } from './MaterialsManager';

interface MeetingManagerProps {
  meetings: Meeting[];
  onSelectMeetingForAttendance: (meetingId: string) => void;
}

export const MeetingManager: React.FC<MeetingManagerProps> = ({
  meetings,
  onSelectMeetingForAttendance,
}) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();

  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateStringWIB());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [platform, setPlatform] = useState<MeetingPlatform>('Zoom');
  const [meetingUrl, setMeetingUrl] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [statusMode, setStatusMode] = useState<MeetingStatusMode>('auto');
  const [description, setDescription] = useState<string>('');
  const [meetingCustomFields, setMeetingCustomFields] = useState<CustomField[]>([]);
  const [useCustomFieldsOnly, setUseCustomFieldsOnly] = useState<boolean>(false);
  const [materials, setMaterials] = useState<MeetingMaterial[]>([]);
  const [broadcastNotice, setBroadcastNotice] = useState<string>('');
  const [enableSignature, setEnableSignature] = useState<boolean>(false);
  const [enableWorkLocation, setEnableWorkLocation] = useState<boolean>(false);
  const [enableNotes, setEnableNotes] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // QR Modal
  const [qrMeeting, setQrMeeting] = useState<Meeting | null>(null);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Delete confirm modal state
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDeleteMeeting = async () => {
    if (!meetingToDelete) return;
    setDeletingId(meetingToDelete.id);
    setDeleteError(null);
    try {
      await deleteDoc(doc(db, 'meetings', meetingToDelete.id));

      // Clean up associated attendance records for this meeting
      try {
        const attQuery = query(collection(db, 'attendance'), where('meetingId', '==', meetingToDelete.id));
        const attDocs = await getDocs(attQuery);
        if (!attDocs.empty) {
          const batch = writeBatch(db);
          attDocs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (attErr) {
        console.warn('Attendance cleanup warning:', attErr);
      }

      try {
        await addDoc(collection(db, 'auditLogs'), {
          adminEmail: currentUser?.email || 'admin',
          adminUid: currentUser?.uid || 'uid',
          action: 'HAPUS_RAPAT',
          target: meetingToDelete.title,
          details: `ID: ${meetingToDelete.id}`,
          timestamp: serverTimestamp(),
        });
      } catch (logErr) {
        console.warn('Audit log write error:', logErr);
      }

      setMeetingToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete meeting:', err);
      setDeleteError(err.message || 'Gagal menghapus rapat dari database. Pastikan Anda memiliki akses administrator.');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingMeeting(null);
    setTitle('');
    setDate(getTodayDateStringWIB());
    setStartTime('09:00');
    setEndTime('12:00');
    setPlatform('Zoom');
    setMeetingUrl('');
    setAccessCode('');
    setStatusMode('auto');
    setDescription('');
    setMeetingCustomFields([]);
    setUseCustomFieldsOnly(false);
    setMaterials([]);
    setBroadcastNotice('');
    setEnableSignature(false);
    setEnableWorkLocation(false);
    setEnableNotes(false);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Meeting) => {
    setEditingMeeting(m);
    setTitle(m.title);
    setDate(m.date);
    setStartTime(m.startTime);
    setEndTime(m.endTime);
    setPlatform(m.platform);
    setMeetingUrl(m.meetingUrl || '');
    setAccessCode(m.accessCode || '');
    setStatusMode(m.statusMode);
    setDescription(m.description || '');
    setMeetingCustomFields(m.customFields || []);
    setUseCustomFieldsOnly(!!m.useCustomFieldsOnly);
    setMaterials(m.materials || []);
    setBroadcastNotice(m.broadcastNotice || '');
    setEnableSignature(!!m.enableSignature);
    setEnableWorkLocation(!!m.enableWorkLocation);
    setEnableNotes(!!m.enableNotes);
    setIsModalOpen(true);
  };

  const handleCopyWhatsAppInvite = (m: Meeting) => {
    const attendanceLink = `${window.location.origin}/?rapat=${m.id}`;
    let text = `📢 *UNDANGAN & DAFTAR HADIR RAPAT ONLINE*\n`;
    text += `*${settings.institutionName || 'Sistem Presensi Online'}*\n\n`;
    text += `📌 *Agenda:* ${m.title}\n`;
    text += `🗓️ *Hari/Tgl:* ${formatIndonesianDate(m.date)}\n`;
    text += `⏰ *Waktu:* ${m.startTime} - ${m.endTime} WIB\n`;
    text += `💻 *Platform:* ${m.platform}\n`;
    if (m.meetingUrl) {
      text += `🔗 *Tautan Ruang Rapat:* ${m.meetingUrl}\n`;
    }
    if (m.accessCode) {
      text += `🔑 *PIN/Kode Akses:* ${m.accessCode}\n`;
    }
    if (m.broadcastNotice) {
      text += `ℹ️ *Catatan/Arahan:* ${m.broadcastNotice}\n`;
    }
    text += `\n📝 *Tautan Presensi Kehadiran:* \n${attendanceLink}\n\n`;
    text += `_Dapat diakses di Smartphone, Tablet, maupun Laptop/PC._\n`;
    text += `_Mohon seluruh peserta mengisi daftar hadir tepat waktu. Terima kasih._`;

    navigator.clipboard.writeText(text);
    setCopiedInviteId(m.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const meetingId = editingMeeting
        ? editingMeeting.id
        : `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const meetingData: Partial<Meeting> = {
        title: title.trim(),
        date,
        startTime,
        endTime,
        platform,
        meetingUrl: meetingUrl.trim(),
        accessCode: accessCode.trim(),
        statusMode,
        description: description.trim(),
        customFields: meetingCustomFields,
        useCustomFieldsOnly,
        materials,
        broadcastNotice: broadcastNotice.trim(),
        enableSignature,
        enableWorkLocation,
        enableNotes,
        updatedAt: new Date().toISOString(),
      };

      if (!editingMeeting) {
        meetingData.createdAt = new Date().toISOString();
        meetingData.createdBy = currentUser?.email || 'admin';
      }

      const docRef = doc(db, 'meetings', meetingId);
      await setDoc(docRef, meetingData, { merge: true });

      // Audit Log (safe)
      try {
        await addDoc(collection(db, 'auditLogs'), {
          adminEmail: currentUser?.email || 'admin',
          adminUid: currentUser?.uid || 'uid',
          action: editingMeeting ? 'UPDATE_RAPAT' : 'BUAT_RAPAT',
          target: title.trim(),
          details: `Platform: ${platform}, Tanggal: ${date}, Jam: ${startTime}-${endTime} WIB, Status: ${statusMode}, Fitur: Ttd=${enableSignature}, Lokasi=${enableWorkLocation}, Materi=${materials.length}`,
          timestamp: serverTimestamp(),
        });
      } catch (logErr) {
        console.warn('Audit log write error:', logErr);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving meeting:', err);
      alert('Gagal menyimpan rapat: ' + (err.message || 'Periksa koneksi internet'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatusMode = async (meeting: Meeting, newMode: MeetingStatusMode) => {
    try {
      const docRef = doc(db, 'meetings', meeting.id);
      await setDoc(docRef, { statusMode: newMode, updatedAt: new Date().toISOString() }, { merge: true });

      try {
        await addDoc(collection(db, 'auditLogs'), {
          adminEmail: currentUser?.email || 'admin',
          adminUid: currentUser?.uid || 'uid',
          action: newMode === 'manual_open' ? 'BUKA_ABSEN' : newMode === 'manual_closed' ? 'TUTUP_ABSEN' : 'RESET_OTOMATIS',
          target: meeting.title,
          details: `Status mode diubah menjadi: ${newMode}`,
          timestamp: serverTimestamp(),
        });
      } catch (logErr) {
        console.warn('Audit log write error:', logErr);
      }
    } catch (err: any) {
      console.error('Error updating meeting status:', err);
    }
  };

  const handleCopyLink = (meetingId: string) => {
    const url = `${window.location.origin}/?rapat=${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = meetings.filter((m) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(term) ||
      m.platform.toLowerCase().includes(term) ||
      m.date.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Kelola Agenda Rapat Online
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Atur jadwal, status buka/tutup presensi, tautan platform, dan QR Code
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari rapat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rapat</span>
          </button>
        </div>
      </div>

      {/* Meetings List Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Tidak ada agenda rapat yang cocok
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Klik tombol "Tambah Rapat" untuk membuat agenda rapat online baru.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((meeting) => {
            const status = getMeetingAttendanceStatus(
              meeting,
              settings.autoOpenMinutesBefore,
              settings.autoCloseMinutesAfter
            );

            return (
              <div
                key={meeting.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Meeting Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${status.badgeClass}`}>
                        {status.label}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Video className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        {meeting.platform}
                      </span>
                      {meeting.accessCode && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <KeyRound className="w-3 h-3 mr-1" />
                          PIN: {meeting.accessCode}
                        </span>
                      )}
                      {meeting.enableSignature && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <PenTool className="w-3 h-3 mr-1" />
                          Ttd Digital
                        </span>
                      )}
                      {meeting.enableWorkLocation && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <MapPin className="w-3 h-3 mr-1" />
                          Status Lokasi
                        </span>
                      )}
                      {meeting.materials && meeting.materials.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          <FileText className="w-3 h-3 mr-1" />
                          {meeting.materials.length} Materi
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {meeting.title}
                    </h3>

                    {meeting.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {meeting.description}
                      </p>
                    )}

                    {meeting.broadcastNotice && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                        <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate"><strong>Arahan:</strong> {meeting.broadcastNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Action Icons: Edit, Delete */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => openEditModal(meeting)}
                      title="Ubah Rapat"
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setMeetingToDelete(meeting);
                      }}
                      title="Hapus Rapat"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{formatIndonesianDate(meeting.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{meeting.startTime} - {meeting.endTime} WIB</span>
                  </div>

                  {meeting.meetingUrl && (
                    <a
                      href={meeting.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <span>Ruang {meeting.platform}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {meeting.materials && meeting.materials.length > 0 && (
                    <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                      <span>•</span>
                      <span>{meeting.materials.map(m => m.title).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Status Toggle Buttons & Share Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Quick Attendance Status Override */}
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => handleUpdateStatusMode(meeting, 'manual_open')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                        meeting.statusMode === 'manual_open'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Buka Absen</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatusMode(meeting, 'manual_closed')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                        meeting.statusMode === 'manual_closed'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Tutup Absen</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatusMode(meeting, 'auto')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                        meeting.statusMode === 'auto'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Otomatis</span>
                    </button>
                  </div>

                  {/* Share & QR Code */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Copy WhatsApp Broadcast Invitation */}
                    <button
                      onClick={() => handleCopyWhatsAppInvite(meeting)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        copiedInviteId === meeting.id
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                      title="Salin teks undangan siap sebar untuk grup WhatsApp / Telegram"
                    >
                      {copiedInviteId === meeting.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Teks WA Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Salin Undangan WA</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyLink(meeting.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        copiedId === meeting.id
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {copiedId === meeting.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Tautan</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setQrMeeting(meeting);
                        setIsQrOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-300" />
                      <span>Tampilkan QR</span>
                    </button>

                    <button
                      onClick={() => onSelectMeetingForAttendance(meeting.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100 transition"
                    >
                      <span>Lihat Peserta →</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit Meeting */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-400" />
                {editingMeeting ? 'Ubah Agenda Rapat' : 'Tambah Agenda Rapat Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Judul Agenda Rapat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Koordinasi Teknis Nasional 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal (WIB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jam Mulai (WIB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jam Selesai (WIB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Platform & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Platform Rapat Online <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as MeetingPlatform)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Zoom">Zoom Meeting</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Cisco Webex">Cisco Webex</option>
                    <option value="Lainnya">Platform Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Kode Akses / PIN</span>
                    <span className="text-[10px] text-slate-400">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BSN2026 (Kosongkan bila bebas)"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Link Rapat Online */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Tautan Ruang Rapat (URL)</span>
                  <span className="text-[10px] text-slate-400">Opsional</span>
                </label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/123456789 atau https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              {/* Status Mode */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mode Pembukaan Absen
                </label>
                <select
                  value={statusMode}
                  onChange={(e) => setStatusMode(e.target.value as MeetingStatusMode)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="auto">
                    Otomatis (Buka {settings.autoOpenMinutesBefore} mnt sebelum & tutup {settings.autoCloseMinutesAfter} mnt setelahnya)
                  </option>
                  <option value="manual_open">Buka Manual Sekarang (Terbuka Terus)</option>
                  <option value="manual_closed">Tutup Manual (Terkunci)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Deskripsi / Catatan Agenda</span>
                  <span className="text-[10px] text-slate-400">Opsional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan agenda atau instruksi untuk peserta..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Arahan / Pengumuman Khusus Rapat */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                    <span>Arahan Khusus / Pengumuman di Halaman Absensi</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Opsional</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mohon gunakan pakaian dinas batik dan rename akun Zoom..."
                  value={broadcastNotice}
                  onChange={(e) => setBroadcastNotice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Fitur Tambahan Yang Dapat Diaktifkan Manual */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fitur Tambahan Form Kehadiran (Opsional):</span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSignature}
                      onChange={(e) => setEnableSignature(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold">Wajibkan Tanda Tangan Digital</span>
                      <p className="text-[10px] text-slate-500">Peserta dapat membubuhkan paraf/tanda tangan langsung dari layar HP atau mouse.</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableWorkLocation}
                      onChange={(e) => setEnableWorkLocation(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold">Pilihan Status/Lokasi Kehadiran</span>
                      <p className="text-[10px] text-slate-500">Pilihan kehadiran: Online (WFH), Hadir di Kantor (WFO), atau Perjalanan Dinas.</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableNotes}
                      onChange={(e) => setEnableNotes(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold">Kolom Catatan / Saran / Aspirasi Peserta</span>
                      <p className="text-[10px] text-slate-500">Menyediakan kolom catatan bebas untuk pertanyaan atau masukan dari peserta.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Kelola Materi & Berkas Rapat */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <MaterialsManager materials={materials} onChange={setMaterials} />
              </div>

              {/* Kolom Tambahan Kustom Khusus Rapat Ini */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <CustomFieldsManager
                  customFields={meetingCustomFields}
                  onChange={setMeetingCustomFields}
                  title="Kolom Tambahan Kustom Khusus Rapat Ini"
                  description="Tambahkan kolom kustom (NIP, Unit Kerja, No SPT, dsb) khusus agenda rapat ini."
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingMeeting ? 'Perbarui Rapat' : 'Simpan Rapat'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3.5 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Agenda Rapat?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data rapat akan dihapus permanen dari sistem.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {meetingToDelete.title}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatIndonesianDate(meetingToDelete.date)} • {meetingToDelete.startTime} - {meetingToDelete.endTime} WIB ({meetingToDelete.platform})
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={deletingId === meetingToDelete.id}
                onClick={() => {
                  setMeetingToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingId === meetingToDelete.id}
                onClick={confirmDeleteMeeting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md flex items-center space-x-1.5 disabled:opacity-50"
              >
                {deletingId === meetingToDelete.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Rapat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        meeting={qrMeeting}
        isOpen={isQrOpen}
        onClose={() => {
          setIsQrOpen(false);
          setQrMeeting(null);
        }}
      />
    </div>
  );
};
