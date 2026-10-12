import React from 'react';
import {
  CheckCircle2,
  Printer,
  UserPlus,
  ExternalLink,
  ShieldCheck,
  Video,
  Calendar,
  Clock,
  Building,
  User,
  Award,
  Sparkles,
  MapPin,
  PenTool,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Attendance, Meeting, CustomField } from '../../types';
import { formatIndonesianDate, formatWIBDateTime } from '../../lib/timeUtils';
import { useSettings } from '../../context/SettingsContext';

interface AttendanceProofProps {
  attendance: Attendance;
  meeting: Meeting;
  onReset: () => void;
}

export const AttendanceProof: React.FC<AttendanceProofProps> = ({ attendance, meeting, onReset }) => {
  const { settings } = useSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Success Alert Header */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 sm:p-5 flex items-center space-x-3.5 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200">
            Kehadiran Berhasil Dicatat!
          </h3>
          <p className="text-xs sm:text-sm text-emerald-800/80 dark:text-emerald-300/80">
            Terima kasih telah mengisi daftar hadir resmi. Simpan kartu bukti kehadiran di bawah ini sebagai konfirmasi Anda.
          </p>
        </div>
      </div>

      {/* Printable Proof Card */}
      <div
        id="printable-proof"
        className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative"
      >
        {/* Card Header with Watermark & Border */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white p-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">
                {settings.institutionName}
              </p>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                BUKTI TANDA HADIR RAPAT ONLINE
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Sistem Presensi Elektronik Terintegrasi (WIB)
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Meeting Info Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Agenda Rapat
            </span>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {meeting.title}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatIndonesianDate(meeting.date)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{meeting.startTime} - {meeting.endTime} WIB</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {meeting.platform}
                </span>
              </div>
            </div>
          </div>

          {/* Attendee Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Nama Lengkap Peserta
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {attendance.fullName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Instansi / Unit Kerja
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {attendance.institution}
              </p>
            </div>

            {attendance.position && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Jabatan
                </span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {attendance.position}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Peran Dalam Rapat
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                {attendance.role}
              </span>
            </div>

            {/* Work Location if recorded */}
            {attendance.workLocation && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Status / Lokasi Kehadiran
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {attendance.workLocation}
                </span>
              </div>
            )}

            {/* Custom Field Responses */}
            {attendance.customResponses && Object.keys(attendance.customResponses).length > 0 && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Informasi Tambahan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                  {Object.entries(attendance.customResponses).map(([fieldId, val]) => {
                    const allFields = [...(settings.customFields || []), ...(meeting.customFields || [])];
                    const matched = allFields.find((f) => f.id === fieldId);
                    const label = matched?.label || fieldId;
                    const displayValue = typeof val === 'boolean' ? (val ? 'Ya, Terkonfirmasi' : 'Tidak') : String(val);
                    return (
                      <div key={fieldId} className="space-y-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white break-words">{displayValue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes if provided */}
            {attendance.notes && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Catatan Peserta
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {attendance.notes}
                </p>
              </div>
            )}

            {/* Digital Signature */}
            {attendance.signature && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5 text-emerald-600" /> Tanda Tangan Digital Peserta
                </span>
                <div className="inline-block p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <img
                    src={attendance.signature}
                    alt="Tanda Tangan Digital"
                    className="h-16 max-w-[200px] object-contain"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Waktu Verifikasi Server (WIB)
              </span>
              <p className="text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {formatWIBDateTime(attendance.submittedAt || new Date())}
              </p>
            </div>
          </div>

          {/* Security stamp footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ID Validasi: <code className="font-mono font-semibold text-slate-700 dark:text-slate-300">{attendance.id.slice(0, 14)}</code></span>
            </div>
            <span className="italic">Data tersimpan di Cloud Database</span>
          </div>
        </div>
      </div>

      {/* Unduh Berkas / Materi Rapat jika ada */}
      {meeting.materials && meeting.materials.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 print:hidden">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Materi & Paparan Rapat Siap Unduh:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meeting.materials.map((m) => (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition"
              >
                <span className="truncate pr-2">{m.title}</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan Bukti PDF</span>
        </button>

        {meeting.meetingUrl && (
          <a
            href={meeting.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Masuk Ruang {meeting.platform}</span>
          </a>
        )}

        <button
          onClick={onReset}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Isi Untuk Peserta Lain</span>
        </button>
      </div>
    </div>
  );
};
