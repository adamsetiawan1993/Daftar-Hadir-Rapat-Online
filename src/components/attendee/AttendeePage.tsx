import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  Video,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  KeyRound,
  User,
  Building,
  Briefcase,
  Mail,
  Send,
  Loader2,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  MapPin,
  Megaphone,
  FileText,
  PenTool,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Meeting, Attendance, AttendeeRole, CustomField, WorkLocationType } from '../../types';
import { formatIndonesianDate, getMeetingAttendanceStatus } from '../../lib/timeUtils';
import { useSettings } from '../../context/SettingsContext';
import { AttendanceProof } from './AttendanceProof';
import { SignaturePad } from './SignaturePad';

export const AttendeePage: React.FC = () => {
  const { settings } = useSettings();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState<boolean>(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [role, setRole] = useState<AttendeeRole>('Peserta');
  const [workLocation, setWorkLocation] = useState<WorkLocationType>('Online (WFH)');
  const [notes, setNotes] = useState<string>('');
  const [signature, setSignature] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  // Status & Feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedAttendance, setSubmittedAttendance] = useState<Attendance | null>(null);

  // Active custom fields for selected meeting
  const activeCustomFields = React.useMemo(() => {
    if (!selectedMeeting) return [];
    if (selectedMeeting.useCustomFieldsOnly && selectedMeeting.customFields) {
      return selectedMeeting.customFields.filter((f) => f.enabled);
    }
    const meetingFields = (selectedMeeting.customFields || []).filter((f) => f.enabled);
    const globalFields = (settings.customFields || []).filter((f) => f.enabled);

    const map = new Map<string, CustomField>();
    globalFields.forEach((f) => map.set(f.id, f));
    meetingFields.forEach((f) => map.set(f.id, f));
    return Array.from(map.values());
  }, [selectedMeeting, settings.customFields]);

  // Filter / Search for meeting picker
  const [meetingSearch, setMeetingSearch] = useState<string>('');

  // Read URL params (e.g. ?rapat=ID or ?meeting=ID)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingFromUrl = urlParams.get('rapat') || urlParams.get('meeting') || urlParams.get('id');
    if (meetingFromUrl) {
      setSelectedMeetingId(meetingFromUrl);
    }
  }, []);

  // Fetch real-time active meetings
  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Meeting[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<Meeting, 'id'>) });
        });
        setMeetings(list);
        setLoadingMeetings(false);
      },
      (err) => {
        setLoadingMeetings(false);
        try {
          handleFirestoreError(err, OperationType.LIST, 'meetings');
        } catch (e) {
          console.error('Error fetching meetings:', e);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync selectedMeeting when meetings change or selectedMeetingId changes
  useEffect(() => {
    if (selectedMeetingId && meetings.length > 0) {
      const found = meetings.find((m) => m.id === selectedMeetingId);
      setSelectedMeeting(found || null);
    } else {
      setSelectedMeeting(null);
    }
  }, [selectedMeetingId, meetings]);

  const meetingStatus = selectedMeeting
    ? getMeetingAttendanceStatus(
        selectedMeeting,
        settings.autoOpenMinutesBefore,
        settings.autoCloseMinutesAfter
      )
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedMeeting) {
      setErrorMessage('Pilih agenda rapat terlebih dahulu.');
      return;
    }

    if (!meetingStatus?.isOpen) {
      setErrorMessage(`Absen rapat sedang ditutup (${meetingStatus?.label || 'Belum dibuka'}).`);
      return;
    }

    // Validation
    const cleanName = fullName.trim();
    const cleanInstitution = institution.trim();
    if (!cleanName) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!cleanInstitution) {
      setErrorMessage('Instansi / Unit kerja wajib diisi.');
      return;
    }

    if (settings.showPosition && settings.requirePosition && !position.trim()) {
      setErrorMessage('Jabatan wajib diisi sesuai ketentuan instansi.');
      return;
    }

    if (settings.showContact && settings.requireContact && !contact.trim()) {
      setErrorMessage('Email atau nomor WhatsApp wajib diisi.');
      return;
    }

    // Custom Fields Validation
    for (const field of activeCustomFields) {
      if (field.required) {
        const val = customValues[field.id];
        if (field.type === 'checkbox') {
          if (!val) {
            setErrorMessage(`Kolom "${field.label}" wajib dicentang.`);
            return;
          }
        } else if (val === undefined || val === null || String(val).trim() === '') {
          setErrorMessage(`Kolom "${field.label}" wajib diisi.`);
          return;
        }
      }
    }

    // Access Code Validation
    if (selectedMeeting.accessCode && selectedMeeting.accessCode.trim() !== '') {
      if (accessCodeInput.trim() !== selectedMeeting.accessCode.trim()) {
        setErrorMessage('Kode rapat (PIN) salah atau tidak sesuai. Silakan hubungi admin / notulis.');
        return;
      }
    }

    // Digital Signature Validation
    if (selectedMeeting.enableSignature && !signature) {
      setErrorMessage('Tanda tangan digital kehadiran wajib dibubuhkan.');
      return;
    }

    // Anti-Spam (Throttle check in localStorage: max 1 submit per 10 seconds per device)
    const lastSubmitTime = localStorage.getItem('last_attendance_timestamp');
    const now = Date.now();
    if (lastSubmitTime && now - parseInt(lastSubmitTime, 10) < 10000) {
      setErrorMessage('Harap tunggu 10 detik sebelum mengirim isian presensi kembali.');
      return;
    }

    setSubmitting(true);

    try {
      const normalizedName = cleanName.toLowerCase().replace(/\s+/g, ' ');
      
      // Determine document ID
      let attendanceDocId: string;
      if (settings.preventDuplicates) {
        // Safe key derived from meeting and normalized name
        const safeNameKey = encodeURIComponent(normalizedName.slice(0, 40)).replace(/%/g, '_');
        attendanceDocId = `att_${selectedMeeting.id}_${safeNameKey}`;
      } else {
        attendanceDocId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      // Unique device token for audit/anti-spam
      let deviceToken = localStorage.getItem('attendance_device_token');
      if (!deviceToken) {
        deviceToken = 'dev_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('attendance_device_token', deviceToken);
      }

      const attendanceData = {
        meetingId: selectedMeeting.id,
        fullName: cleanName,
        normalizedName: normalizedName,
        institution: cleanInstitution,
        position: settings.showPosition ? position.trim() : '',
        contact: settings.showContact ? contact.trim() : '',
        role: role,
        customResponses: customValues,
        clientFingerprint: deviceToken,
        signature: signature || '',
        workLocation: selectedMeeting.enableWorkLocation ? workLocation : '',
        notes: selectedMeeting.enableNotes ? notes.trim() : '',
        submittedAt: serverTimestamp(),
      };

      const docRef = doc(db, 'attendance', attendanceDocId);
      await setDoc(docRef, attendanceData);

      // Record last submit time for spam rate limiting
      localStorage.setItem('last_attendance_timestamp', Date.now().toString());

      // Show digital proof
      setSubmittedAttendance({
        id: attendanceDocId,
        meetingId: selectedMeeting.id,
        fullName: cleanName,
        normalizedName: normalizedName,
        institution: cleanInstitution,
        position: position.trim(),
        contact: contact.trim(),
        role: role,
        customResponses: customValues,
        signature: signature || undefined,
        workLocation: selectedMeeting.enableWorkLocation ? workLocation : undefined,
        notes: selectedMeeting.enableNotes ? notes.trim() : undefined,
        submittedAt: new Date(),
      });
    } catch (err: any) {
      console.error('Error submitting attendance:', err);
      if (err?.message && err.message.includes('permission')) {
        setErrorMessage('Pengiriman ditolak: Pastikan absen rapat masih dibuka dan kode akses benar.');
      } else {
        setErrorMessage('Gagal menyimpan kehadiran. Silakan periksa koneksi internet Anda dan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedAttendance(null);
    setFullName('');
    setPosition('');
    setContact('');
    setCustomValues({});
    setAccessCodeInput('');
    setErrorMessage(null);
  };

  // If user has submitted attendance, show the verified proof card!
  if (submittedAttendance && selectedMeeting) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <AttendanceProof
          attendance={submittedAttendance}
          meeting={selectedMeeting}
          onReset={handleResetForm}
        />
      </div>
    );
  }

  // Filter meetings for the meeting selection view
  const filteredMeetings = meetings.filter((m) => {
    if (!meetingSearch.trim()) return true;
    const term = meetingSearch.toLowerCase();
    return (
      m.title.toLowerCase().includes(term) ||
      m.platform.toLowerCase().includes(term) ||
      m.date.includes(term)
    );
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* If no meeting selected from URL, show meeting selection banner / cards */}
      {!selectedMeeting && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              Pilih Agenda Rapat
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Daftar Rapat Online Tersedia
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Silakan pilih agenda rapat online yang sedang Anda ikuti untuk mengisi presensi kehadiran resmi.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Cari judul rapat atau platform..."
              value={meetingSearch}
              onChange={(e) => setMeetingSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {loadingMeetings ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm">Memuat daftar rapat...</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Belum ada rapat aktif
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Saat ini belum ada agenda rapat online yang dijadwalkan oleh admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeetings.map((m) => {
                const status = getMeetingAttendanceStatus(
                  m,
                  settings.autoOpenMinutesBefore,
                  settings.autoCloseMinutesAfter
                );
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMeetingId(m.id);
                      window.history.pushState({}, '', `/?rapat=${m.id}`);
                    }}
                    className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all text-left cursor-pointer flex flex-col justify-between hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 group ${
                      status.isOpen
                        ? 'border-slate-200 dark:border-slate-800 ring-1 ring-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.badgeClass}`}>
                          {status.label}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-blue-500" />
                          {m.platform}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                        {m.title}
                      </h3>

                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatIndonesianDate(m.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{m.startTime} - {m.endTime} WIB</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      {m.accessCode ? (
                        <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                          <KeyRound className="w-3 h-3 mr-1" /> Memerlukan PIN
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Tanpa PIN</span>
                      )}

                      <span className="flex items-center font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                        Isi Absen <ChevronRight className="w-4 h-4 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* When a meeting IS selected: Show Meeting Card + Attendance Form */}
      {selectedMeeting && (
        <div className="space-y-6">
          {/* Back button & Meeting Info Banner */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedMeetingId('');
                setSelectedMeeting(null);
                window.history.pushState({}, '', '/');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 px-3 py-1.5 rounded-xl transition"
            >
              ← Ganti Rapat Lain
            </button>

            {selectedMeeting.meetingUrl && (
              <a
                href={selectedMeeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-xl transition"
              >
                <Video className="w-3.5 h-3.5 text-blue-500" />
                <span>Buka Link {selectedMeeting.platform}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Meeting Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${meetingStatus?.badgeClass}`}>
                {meetingStatus?.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Video className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Platform: {selectedMeeting.platform}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {selectedMeeting.title}
            </h2>

            {selectedMeeting.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {selectedMeeting.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{formatIndonesianDate(selectedMeeting.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{selectedMeeting.startTime} - {selectedMeeting.endTime} WIB</span>
              </div>
            </div>
          </div>

          {/* Pengumuman / Arahan Khusus Agenda Rapat Ini */}
          {selectedMeeting.broadcastNotice && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-4 sm:p-5 text-amber-900 dark:text-amber-200 flex items-start space-x-3.5 shadow-xs animate-in fade-in">
              <div className="p-2 bg-amber-200/60 dark:bg-amber-900/60 rounded-xl shrink-0 mt-0.5">
                <Megaphone className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100">
                  Arahan Khusus / Petunjuk Rapat
                </h4>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                  {selectedMeeting.broadcastNotice}
                </p>
              </div>
            </div>
          )}

          {/* Tautan Materi & Berkas Rapat */}
          {selectedMeeting.materials && selectedMeeting.materials.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Bahan Paparan & Berkas Rapat ({selectedMeeting.materials.length})</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Klik untuk membuka</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedMeeting.materials.map((mat) => (
                  <a
                    key={mat.id}
                    href={mat.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition group"
                  >
                    <div className="flex items-center space-x-2.5 truncate pr-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{mat.title}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* If meeting is NOT open: Banner notice */}
          {!meetingStatus?.isOpen && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-amber-900 dark:text-amber-200 flex items-start space-x-3.5">
              <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">
                  Absensi Saat Ini Belum / Tidak Dibuka
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  {meetingStatus?.code === 'CLOSED_NOT_STARTED'
                    ? `Formulir presensi otomatis dibuka ${settings.autoOpenMinutesBefore} menit sebelum jam rapat dimulai. Silakan refresh halaman mendekati waktu acara.`
                    : 'Pengisian daftar hadir untuk sesi rapat ini telah ditutup. Hubungi notulis atau administrator bila Anda terlambat.'}
                </p>
              </div>
            </div>
          )}

          {/* Form Kehadiran */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Formulir Daftar Hadir Peserta
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Isi data diri Anda dengan benar. Waktu kehadiran direkam server pada zona Waktu Indonesia Barat (WIB).
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Nama Lengkap <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">Beserta gelar</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dr. Ir. Budi Santoso, M.Si."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!meetingStatus?.isOpen || submitting}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Instansi / Unit Kerja */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Instansi / Unit Kerja / Lembaga <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Badan Nasional Pencarian dan Pertolongan"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    disabled={!meetingStatus?.isOpen || submitting}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Jabatan (Optional / Configurable) */}
              {settings.showPosition && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>
                      Jabatan {settings.requirePosition && <span className="text-rose-500">*</span>}
                    </span>
                    {!settings.requirePosition && (
                      <span className="text-[11px] text-slate-400 font-normal">Opsional</span>
                    )}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required={settings.requirePosition}
                      placeholder="Contoh: Kepala Biro / Analis Kebijakan Ahli Muda"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      disabled={!meetingStatus?.isOpen || submitting}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Kontak (Email / WhatsApp) */}
              {settings.showContact && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>
                      Email / Nomor WhatsApp {settings.requireContact && <span className="text-rose-500">*</span>}
                    </span>
                    {!settings.requireContact && (
                      <span className="text-[11px] text-slate-400 font-normal">Opsional</span>
                    )}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required={settings.requireContact}
                      placeholder="Contoh: 08123456789 atau nama@instansi.go.id"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      disabled={!meetingStatus?.isOpen || submitting}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Peran Dalam Rapat */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Peran Dalam Rapat <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Peserta', 'Narasumber', 'Moderator', 'Tamu Undangan', 'Perwakilan'] as AttendeeRole[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      disabled={!meetingStatus?.isOpen || submitting}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                        role === r
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status / Lokasi Kehadiran (Jika diaktifkan oleh admin) */}
              {selectedMeeting.enableWorkLocation && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Status / Lokasi Kehadiran <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Online (WFH)', 'Hadir di Lokasi (WFO)', 'Perjalanan Dinas', 'Lainnya'] as WorkLocationType[]).map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => setWorkLocation(loc)}
                        disabled={!meetingStatus?.isOpen || submitting}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                          workLocation === loc
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kolom Tambahan Kustom Dinamis */}
              {activeCustomFields.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Informasi Tambahan Rapat</span>
                  </div>

                  <div className="space-y-4">
                    {activeCustomFields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </span>
                          {!field.required && (
                            <span className="text-[11px] text-slate-400 font-normal">Opsional</span>
                          )}
                        </label>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            required={field.required}
                            disabled={!meetingStatus?.isOpen || submitting}
                            placeholder={field.placeholder || 'Tuliskan isian Anda...'}
                            value={customValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            required={field.required}
                            disabled={!meetingStatus?.isOpen || submitting}
                            placeholder={field.placeholder || 'Masukkan angka/nomor...'}
                            value={customValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            rows={3}
                            required={field.required}
                            disabled={!meetingStatus?.isOpen || submitting}
                            placeholder={field.placeholder || 'Tuliskan catatan atau keterangan tambahan...'}
                            value={customValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            required={field.required}
                            disabled={!meetingStatus?.isOpen || submitting}
                            value={customValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="">-- Pilih {field.label} --</option>
                            {field.options?.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.type === 'radio' && (
                          <div className="flex flex-wrap gap-3 pt-1">
                            {field.options?.map((opt, i) => (
                              <label
                                key={i}
                                className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100"
                              >
                                <input
                                  type="radio"
                                  name={field.id}
                                  required={field.required && !customValues[field.id]}
                                  disabled={!meetingStatus?.isOpen || submitting}
                                  value={opt}
                                  checked={customValues[field.id] === opt}
                                  onChange={(e) =>
                                    setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                                  }
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {field.type === 'checkbox' && (
                          <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 pt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              required={field.required}
                              disabled={!meetingStatus?.isOpen || submitting}
                              checked={!!customValues[field.id]}
                              onChange={(e) =>
                                setCustomValues((prev) => ({ ...prev, [field.id]: e.target.checked }))
                              }
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span>{field.placeholder || 'Ya, saya mengonfirmasi isian ini'}</span>
                          </label>
                        )}

                        {field.helpText && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{field.helpText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan / Aspirasi Peserta (Jika diaktifkan oleh admin) */}
              {selectedMeeting.enableNotes && (
                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Catatan / Pertanyaan / Saran untuk Rapat</span>
                    <span className="text-[11px] text-slate-400 font-normal">Opsional</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan catatan, pertanyaan untuk narasumber, atau masukan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!meetingStatus?.isOpen || submitting}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              )}

              {/* Tanda Tangan Digital (Jika diaktifkan oleh admin) */}
              {selectedMeeting.enableSignature && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <SignaturePad
                    value={signature}
                    onChange={setSignature}
                    required={true}
                  />
                </div>
              )}

              {/* Kode Rapat (PIN) if required */}
              {selectedMeeting.accessCode && selectedMeeting.accessCode.trim() !== '' && (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Kode Akses Rapat (PIN) <span className="text-rose-500">*</span></span>
                  </label>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Rapat ini diamankan dengan kode akses. Masukkan PIN yang diumumkan oleh moderator/tuan rumah rapat.
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan PIN Rapat..."
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    disabled={!meetingStatus?.isOpen || submitting}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-sm font-mono tracking-wider text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!meetingStatus?.isOpen || submitting}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Kehadiran...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Presensi Kehadiran</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-[11px] text-slate-400">
                  🔒 Data kehadiran Anda disimpan dengan aman dan dicatat dengan server timestamp resmi.
                </span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
