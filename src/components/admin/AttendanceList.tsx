import React, { useState } from 'react';
import {
  collection,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import {
  Users,
  Search,
  Filter,
  Trash2,
  UserPlus,
  Download,
  Printer,
  Calendar,
  Building,
  User,
  Clock,
  Video,
  X,
  Loader2,
  CheckCircle,
  Sparkles,
  Eye,
  MapPin,
  PenTool,
  MessageSquare,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Meeting, Attendance, AttendeeRole, CustomField, WorkLocationType } from '../../types';
import { formatWIBDateTime, formatWIBTime, formatIndonesianDate } from '../../lib/timeUtils';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { PrintMeetingReport } from './PrintMeetingReport';

interface AttendanceListProps {
  meetings: Meeting[];
  attendanceList: Attendance[];
  selectedMeetingId: string;
  setSelectedMeetingId: (id: string) => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  meetings,
  attendanceList,
  selectedMeetingId,
  setSelectedMeetingId,
}) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();

  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Manual Add Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualFullName, setManualFullName] = useState<string>('');
  const [manualInstitution, setManualInstitution] = useState<string>('');
  const [manualPosition, setManualPosition] = useState<string>('');
  const [manualContact, setManualContact] = useState<string>('');
  const [manualRole, setManualRole] = useState<AttendeeRole>('Peserta');
  const [manualWorkLocation, setManualWorkLocation] = useState<string>('Online (WFH)');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualCustomValues, setManualCustomValues] = useState<Record<string, any>>({});
  const [savingManual, setSavingManual] = useState<boolean>(false);

  // Inspect Attendee Details Modal
  const [inspectingAttendee, setInspectingAttendee] = useState<Attendance | null>(null);

  // Print Report Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Delete Attendance Modal
  const [attToDelete, setAttToDelete] = useState<Attendance | null>(null);
  const [deletingAtt, setDeletingAtt] = useState<boolean>(false);

  // Selected Meeting object
  const activeMeeting = meetings.find((m) => m.id === selectedMeetingId) || (meetings.length > 0 ? meetings[0] : null);

  // Relevant custom fields for active meeting
  const relevantCustomFields = React.useMemo(() => {
    if (!activeMeeting) return (settings.customFields || []).filter((f) => f.enabled);
    if (activeMeeting.useCustomFieldsOnly && activeMeeting.customFields) {
      return activeMeeting.customFields.filter((f) => f.enabled);
    }
    const meetingFields = (activeMeeting.customFields || []).filter((f) => f.enabled);
    const globalFields = (settings.customFields || []).filter((f) => f.enabled);
    const map = new Map<string, CustomField>();
    globalFields.forEach((f) => map.set(f.id, f));
    meetingFields.forEach((f) => map.set(f.id, f));
    return Array.from(map.values());
  }, [activeMeeting, settings.customFields]);

  // Filter attendance for the chosen meeting
  const currentMeetingAttendance = attendanceList.filter((a) => {
    if (!activeMeeting) return false;
    return a.meetingId === activeMeeting.id;
  });

  // Apply search & role filters
  const filteredAttendance = currentMeetingAttendance.filter((att) => {
    if (roleFilter !== 'ALL' && att.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const matchCustom = att.customResponses
      ? Object.values(att.customResponses).some((v) => String(v).toLowerCase().includes(term))
      : false;

    return (
      att.fullName.toLowerCase().includes(term) ||
      att.institution.toLowerCase().includes(term) ||
      (att.position && att.position.toLowerCase().includes(term)) ||
      (att.contact && att.contact.toLowerCase().includes(term)) ||
      matchCustom
    );
  });

  const confirmDeleteAttendance = async () => {
    if (!attToDelete) return;
    setDeletingAtt(true);
    try {
      await deleteDoc(doc(db, 'attendance', attToDelete.id));

      try {
        await addDoc(collection(db, 'auditLogs'), {
          adminEmail: currentUser?.email || 'admin',
          adminUid: currentUser?.uid || 'uid',
          action: 'HAPUS_KEHADIRAN',
          target: `${attToDelete.fullName} (${activeMeeting?.title})`,
          details: `Instansi: ${attToDelete.institution}, ID: ${attToDelete.id}`,
          timestamp: serverTimestamp(),
        });
      } catch (logErr) {
        console.warn('Audit log write error:', logErr);
      }

      setAttToDelete(null);
    } catch (err: any) {
      console.error('Delete attendance error:', err);
    } finally {
      setDeletingAtt(false);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeeting || !manualFullName.trim() || !manualInstitution.trim()) return;

    setSavingManual(true);
    try {
      const docId = `att_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanName = manualFullName.trim();
      const normalizedName = cleanName.toLowerCase().replace(/\s+/g, ' ');

      const data = {
        meetingId: activeMeeting.id,
        fullName: cleanName,
        normalizedName: normalizedName,
        institution: manualInstitution.trim(),
        position: manualPosition.trim(),
        contact: manualContact.trim(),
        role: manualRole,
        workLocation: manualWorkLocation,
        notes: manualNotes.trim(),
        customResponses: manualCustomValues,
        clientFingerprint: `admin_manual_${currentUser?.email || 'admin'}`,
        submittedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'attendance', docId), data);

      await addDoc(collection(db, 'auditLogs'), {
        adminEmail: currentUser?.email || 'admin',
        adminUid: currentUser?.uid || 'uid',
        action: 'TAMBAH_PESERTA_MANUAL',
        target: `${cleanName} (${activeMeeting.title})`,
        details: `Peran: ${manualRole}, Instansi: ${manualInstitution.trim()}`,
        timestamp: serverTimestamp(),
      });

      setIsManualModalOpen(false);
      setManualFullName('');
      setManualInstitution('');
      setManualPosition('');
      setManualContact('');
      setManualWorkLocation('Online (WFH)');
      setManualNotes('');
      setManualCustomValues({});
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'attendance');
    } finally {
      setSavingManual(false);
    }
  };

  const handleExportCSV = () => {
    if (!activeMeeting || filteredAttendance.length === 0) {
      alert('Tidak ada data kehadiran untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nama Lengkap',
      'Instansi / Unit Kerja',
      'Jabatan',
      'Kontak',
      'Peran',
      'Lokasi Kehadiran',
      'Tanda Tangan Digital',
      'Catatan Peserta',
      ...relevantCustomFields.map((f) => f.label),
      'Waktu Kehadiran (WIB)',
    ];

    const rows = filteredAttendance.map((att, idx) => [
      idx + 1,
      `"${att.fullName.replace(/"/g, '""')}"`,
      `"${att.institution.replace(/"/g, '""')}"`,
      `"${(att.position || '-').replace(/"/g, '""')}"`,
      `"${(att.contact || '-').replace(/"/g, '""')}"`,
      `"${att.role}"`,
      `"${(att.workLocation || '-').replace(/"/g, '""')}"`,
      `"${att.signature ? 'Ada (Terverifikasi)' : '-'}"`,
      `"${(att.notes || '-').replace(/"/g, '""')}"`,
      ...relevantCustomFields.map((f) => {
        const val = att.customResponses?.[f.id];
        const display =
          typeof val === 'boolean'
            ? val
              ? 'Ya'
              : 'Tidak'
            : val !== undefined && val !== null
            ? String(val)
            : '-';
        return `"${display.replace(/"/g, '""')}"`;
      }),
      `"${formatWIBDateTime(att.submittedAt)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = activeMeeting.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Daftar_Hadir_${cleanTitle}_${activeMeeting.date}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header controls: meeting picker, actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Rekap Daftar Hadir Rapat
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Daftar absensi peserta, ekspor laporan, dan cetak lampiran notulen resmi
          </p>
        </div>

        {/* Meeting selector dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Pilih Rapat:
          </label>
          <select
            value={activeMeeting?.id || ''}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Meeting Summary Header Bar */}
      {activeMeeting && (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs text-blue-300">
              <span className="font-semibold uppercase">{activeMeeting.platform}</span>
              <span>•</span>
              <span>{formatIndonesianDate(activeMeeting.date)}</span>
              <span>•</span>
              <span>{activeMeeting.startTime} - {activeMeeting.endTime} WIB</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold leading-snug">
              {activeMeeting.title}
            </h3>
            <p className="text-xs text-slate-300">
              Total Terdaftar Hadir:{' '}
              <span className="font-bold text-emerald-400 text-sm">
                {currentMeetingAttendance.length} Peserta
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Manual</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Notulen PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama atau instansi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {['ALL', 'Peserta', 'Narasumber', 'Moderator', 'Tamu Undangan', 'Perwakilan'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL' ? 'Semua Peran' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Attendees */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-4 py-3.5">Nama Lengkap & Gelar</th>
                <th className="px-4 py-3.5">Instansi / Unit Kerja</th>
                <th className="px-4 py-3.5">Jabatan</th>
                <th className="px-4 py-3.5">Kontak</th>
                <th className="px-4 py-3.5 text-center">Peran</th>
                {relevantCustomFields.length > 0 && (
                  <th className="px-4 py-3.5">Kolom Tambahan</th>
                )}
                <th className="px-4 py-3.5 text-center">Waktu Presensi (WIB)</th>
                <th className="px-4 py-3.5 text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={relevantCustomFields.length > 0 ? 9 : 8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Belum ada data kehadiran untuk kriteria filter ini.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((att, idx) => (
                  <tr
                    key={att.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span>{att.fullName}</span>
                        {att.signature && (
                          <span
                            title="Tanda Tangan Digital Terverifikasi"
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
                          >
                            <PenTool className="w-2.5 h-2.5 mr-0.5" /> Paraf
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div>
                        <p>{att.institution}</p>
                        {att.workLocation && (
                          <span className="inline-flex items-center mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <MapPin className="w-2.5 h-2.5 mr-0.5 text-blue-500" />
                            {att.workLocation}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {att.position || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {att.contact || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                        {att.role}
                      </span>
                    </td>
                    {relevantCustomFields.length > 0 && (
                      <td className="px-4 py-3">
                        {att.customResponses && Object.keys(att.customResponses).length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {Object.entries(att.customResponses).slice(0, 2).map(([key, val]) => {
                              const matched = relevantCustomFields.find((f) => f.id === key);
                              const label = matched?.label || key;
                              const strVal = typeof val === 'boolean' ? (val ? 'Ya' : 'Tidak') : String(val);
                              return (
                                <span
                                  key={key}
                                  className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[140px]"
                                  title={`${label}: ${strVal}`}
                                >
                                  <strong>{label}:</strong> {strVal}
                                </span>
                              );
                            })}
                            {Object.keys(att.customResponses).length > 2 && (
                              <span className="text-[10px] text-blue-600 font-bold self-center">
                                +{Object.keys(att.customResponses).length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      {formatWIBTime(att.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setInspectingAttendee(att)}
                          title="Lihat Detail Lengkap"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAttToDelete(att)}
                          title="Hapus Peserta"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Attendee Modal */}
      {isManualModalOpen && activeMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Tambah Kehadiran Manual
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Menambahkan peserta ke rapat: <strong>{activeMeeting.title}</strong>
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ir. Budi Hartono, M.T."
                  value={manualFullName}
                  onChange={(e) => setManualFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Instansi / Unit Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Badan Nasional Pencarian dan Pertolongan"
                  value={manualInstitution}
                  onChange={(e) => setManualInstitution(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    placeholder="Jabatan"
                    value={manualPosition}
                    onChange={(e) => setManualPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kontak / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={manualContact}
                    onChange={(e) => setManualContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Peran Peserta <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as AttendeeRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Peserta">Peserta</option>
                  <option value="Narasumber">Narasumber</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Tamu Undangan">Tamu Undangan</option>
                  <option value="Perwakilan">Perwakilan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status Lokasi
                  </label>
                  <select
                    value={manualWorkLocation}
                    onChange={(e) => setManualWorkLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Online (WFH)">Online (WFH)</option>
                    <option value="Hadir di Lokasi (WFO)">Hadir di Lokasi (WFO)</option>
                    <option value="Perjalanan Dinas">Perjalanan Dinas</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Catatan Peserta
                  </label>
                  <input
                    type="text"
                    placeholder="Catatan..."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Kolom Tambahan Khusus untuk Manual Input */}
              {relevantCustomFields.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Isian Kolom Tambahan:</span>
                  </div>

                  {relevantCustomFields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          value={manualCustomValues[field.id] || ''}
                          onChange={(e) =>
                            setManualCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Pilih {field.label} --</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={!!manualCustomValues[field.id]}
                            onChange={(e) =>
                              setManualCustomValues((prev) => ({ ...prev, [field.id]: e.target.checked }))
                            }
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span>{field.placeholder || 'Ya / Konfirmasi'}</span>
                        </label>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          placeholder={field.placeholder || 'Angka/Nomor'}
                          value={manualCustomValues[field.id] || ''}
                          onChange={(e) =>
                            setManualCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={field.placeholder || 'Isian data'}
                          value={manualCustomValues[field.id] || ''}
                          onChange={(e) =>
                            setManualCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center space-x-1 disabled:opacity-50"
                >
                  {savingManual ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Peserta</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Attendee Detail Modal */}
      {inspectingAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Detail Data Kehadiran Peserta
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ID Dokumen: <code className="font-mono text-slate-700 dark:text-slate-300">{inspectingAttendee.id}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingAttendee(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Nama Lengkap:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">
                    {inspectingAttendee.fullName}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Instansi / Unit Kerja:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                    {inspectingAttendee.institution}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Jabatan:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right">
                    {inspectingAttendee.position || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Kontak:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-right">
                    {inspectingAttendee.contact || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Peran:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {inspectingAttendee.role}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Waktu Presensi (WIB):</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatWIBDateTime(inspectingAttendee.submittedAt)}
                  </span>
                </div>
              </div>

              {/* Custom Responses Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Isian Kolom Tambahan Kustom:</span>
                </div>

                {inspectingAttendee.customResponses &&
                Object.keys(inspectingAttendee.customResponses).length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                    {Object.entries(inspectingAttendee.customResponses).map(([fieldId, val]) => {
                      const matched = relevantCustomFields.find((f) => f.id === fieldId);
                      const label = matched?.label || fieldId;
                      const display =
                        typeof val === 'boolean'
                          ? val
                            ? 'Ya, Terkonfirmasi'
                            : 'Tidak'
                          : String(val);
                      return (
                        <div key={fieldId} className="p-3 flex justify-between items-start gap-3">
                          <span className="text-slate-500 font-medium">{label}</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-right break-words">
                            {display}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic p-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    Tidak ada isian kolom tambahan untuk peserta ini.
                  </p>
                )}
              </div>

              {/* Lokasi Kehadiran */}
              {inspectingAttendee.workLocation && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Lokasi Kehadiran:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {inspectingAttendee.workLocation}
                  </span>
                </div>
              )}

              {/* Catatan Peserta */}
              {inspectingAttendee.notes && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Catatan Peserta:
                  </span>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200">
                    {inspectingAttendee.notes}
                  </p>
                </div>
              )}

              {/* Tanda Tangan Digital */}
              {inspectingAttendee.signature && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-emerald-600" /> Tanda Tangan Digital (Paraf):
                  </span>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-center">
                    <img
                      src={inspectingAttendee.signature}
                      alt="Tanda Tangan"
                      className="h-24 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingAttendee(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Attendance Confirmation Modal */}
      {attToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3.5 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Kehadiran Peserta?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data kehadiran akan dihapus dari rekapitulasi rapat ini.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {attToDelete.fullName}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {attToDelete.institution} • Peran: {attToDelete.role}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={deletingAtt}
                onClick={() => setAttToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingAtt}
                onClick={confirmDeleteAttendance}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md flex items-center space-x-1.5 disabled:opacity-50"
              >
                {deletingAtt ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Print Report Modal */}
      {activeMeeting && (
        <PrintMeetingReport
          meeting={activeMeeting}
          attendanceList={currentMeetingAttendance}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
