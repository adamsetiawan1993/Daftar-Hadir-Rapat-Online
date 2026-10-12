import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { Meeting, Attendance, CustomField } from '../../types';
import { formatIndonesianDate, formatWIBDateTime, formatWIBTime } from '../../lib/timeUtils';
import { useSettings } from '../../context/SettingsContext';

interface PrintMeetingReportProps {
  meeting: Meeting;
  attendanceList: Attendance[];
  isOpen: boolean;
  onClose: () => void;
}

export const PrintMeetingReport: React.FC<PrintMeetingReportProps> = ({
  meeting,
  attendanceList,
  isOpen,
  onClose,
}) => {
  const { settings } = useSettings();

  const relevantCustomFields = React.useMemo(() => {
    if (!meeting) return (settings.customFields || []).filter((f) => f.enabled);
    if (meeting.useCustomFieldsOnly && meeting.customFields) {
      return meeting.customFields.filter((f) => f.enabled);
    }
    const meetingFields = (meeting.customFields || []).filter((f) => f.enabled);
    const globalFields = (settings.customFields || []).filter((f) => f.enabled);
    const map = new Map<string, CustomField>();
    globalFields.forEach((f) => map.set(f.id, f));
    meetingFields.forEach((f) => map.set(f.id, f));
    return Array.from(map.values());
  }, [meeting, settings.customFields]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 print:p-0 print:bg-white print:fixed-none">
      {/* Floating control bar (hidden in print) */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Pratinjau Cetak / Ekspor PDF Lampiran Notulen</span>
          <span className="text-slate-400">({attendanceList.length} Peserta)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sheet Container */}
      <div className="max-w-4xl mx-auto bg-white text-black p-8 sm:p-12 rounded-3xl shadow-2xl print:shadow-none print:p-0 print:rounded-none min-h-[29.7cm] text-slate-900 border border-slate-200 print:border-none">
        {/* KOP SURAT RESMI */}
        <div className="border-b-4 border-double border-black pb-4 text-center space-y-1 mb-6">
          <h2 className="text-sm font-bold tracking-widest uppercase">
            {settings.institutionName || 'PEMERINTAH REPUBLIK INDONESIA'}
          </h2>
          <h1 className="text-lg font-black tracking-wide uppercase">
            {settings.institutionSub || 'BIRO HUBUNGAN MASYARAKAT, KERJA SAMA, DAN LAYANAN INFORMASI'}
          </h1>
          <p className="text-[11px] text-slate-600">
            Gedung Kantor Pusat • Layanan Informasi Telepon (021) 3927422 • Situs Resmi: bsn.go.id
          </p>
        </div>

        {/* Title of Document */}
        <div className="text-center space-y-1 mb-6">
          <h3 className="text-base font-extrabold uppercase underline underline-offset-4 tracking-wide">
            DAFTAR HADIR PESERTA RAPAT ONLINE
          </h3>
          <p className="text-xs text-slate-600">
            Nomor Dokumen: BSN/DH/{meeting.id.toUpperCase().slice(0, 10)}/{new Date().getFullYear()}
          </p>
        </div>

        {/* Meeting Metadata Table */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-6 text-xs space-y-1.5">
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 font-bold text-slate-700">Agenda Rapat</span>
            <span className="col-span-9 font-bold text-slate-900">: {meeting.title}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 font-bold text-slate-700">Hari / Tanggal</span>
            <span className="col-span-9">: {formatIndonesianDate(meeting.date)}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 font-bold text-slate-700">Waktu Pelaksanaan</span>
            <span className="col-span-9">: {meeting.startTime} s.d. {meeting.endTime} WIB</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 font-bold text-slate-700">Media Platform</span>
            <span className="col-span-9">: {meeting.platform} Online Conference</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 font-bold text-slate-700">Jumlah Peserta Hadir</span>
            <span className="col-span-9">: {attendanceList.length} Orang Terverifikasi</span>
          </div>
        </div>

        {/* Attendance Table */}
        <table className="w-full text-left text-xs border-collapse border border-black mb-8">
          <thead>
            <tr className="bg-slate-100 text-slate-900 border-b border-black">
              <th className="border border-black px-2 py-2 text-center w-10">No</th>
              <th className="border border-black px-3 py-2">Nama Lengkap & Gelar</th>
              <th className="border border-black px-3 py-2">Instansi / Unit Kerja</th>
              <th className="border border-black px-3 py-2">Jabatan</th>
              <th className="border border-black px-2 py-2 text-center">Peran</th>
              {relevantCustomFields.slice(0, 2).map((f) => (
                <th key={f.id} className="border border-black px-2 py-2 text-center">
                  {f.label}
                </th>
              ))}
              <th className="border border-black px-2 py-2 text-center">Waktu (WIB)</th>
              <th className="border border-black px-2 py-2 text-center w-24">Paraf / Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {attendanceList.length === 0 ? (
              <tr>
                <td
                  colSpan={7 + Math.min(relevantCustomFields.length, 2)}
                  className="border border-black p-4 text-center text-slate-500 italic"
                >
                  Belum ada peserta yang tercatat hadir pada rapat ini.
                </td>
              </tr>
            ) : (
              attendanceList.map((att, idx) => (
                <tr key={att.id} className="border-b border-black/70 hover:bg-slate-50">
                  <td className="border border-black px-2 py-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-black px-3 py-2 font-bold text-slate-900">
                    {att.fullName}
                  </td>
                  <td className="border border-black px-3 py-2 text-slate-800">
                    <div>
                      <span>{att.institution}</span>
                      {att.workLocation && (
                        <span className="block text-[10px] text-slate-500 font-medium">
                          ({att.workLocation})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-black px-3 py-2 text-slate-700">
                    {att.position || '-'}
                  </td>
                  <td className="border border-black px-2 py-2 text-center font-semibold">
                    {att.role}
                  </td>
                  {relevantCustomFields.slice(0, 2).map((f) => {
                    const val = att.customResponses?.[f.id];
                    const display =
                      typeof val === 'boolean'
                        ? val
                          ? 'Ya'
                          : 'Tidak'
                        : val !== undefined && val !== null
                        ? String(val)
                        : '-';
                    return (
                      <td
                        key={f.id}
                        className="border border-black px-2 py-2 text-center text-[11px] text-slate-800"
                      >
                        {display}
                      </td>
                    );
                  })}
                  <td className="border border-black px-2 py-2 text-center font-mono text-[11px]">
                    {formatWIBTime(att.submittedAt)}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {att.signature ? (
                      <div className="flex flex-col items-center justify-center">
                        <img
                          src={att.signature}
                          alt="Paraf"
                          className="h-8 max-w-[80px] object-contain mx-auto"
                        />
                        <span className="text-[9px] text-emerald-800 font-mono font-bold">TERVERIFIKASI</span>
                      </div>
                    ) : (
                      <span className="inline-block text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                        VERIFIKASI
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Signature Titimangsa WIB Section */}
        <div className="grid grid-cols-2 gap-8 text-xs text-center pt-4 break-inside-avoid">
          <div className="space-y-16">
            <p>Mengetahui,<br /><span className="font-bold">Pimpinan Rapat</span></p>
            <div>
              <p className="font-bold underline uppercase">( .................................................... )</p>
              <p className="text-[11px] text-slate-500">NIP. ....................................................</p>
            </div>
          </div>

          <div className="space-y-16">
            <p>
              Jakarta, {formatIndonesianDate(meeting.date)}<br />
              <span className="font-bold">Notulis / Pengelola Presensi</span>
            </p>
            <div>
              <p className="font-bold underline uppercase">( .................................................... )</p>
              <p className="text-[11px] text-slate-500">NIP. ....................................................</p>
            </div>
          </div>
        </div>

        {/* Footer print watermark */}
        <div className="mt-12 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
          <span>Dicetak secara elektronik melalui Sistem Daftar Hadir Rapat Online ({settings.institutionName})</span>
          <span>Dicetak pada: {formatWIBDateTime(new Date())}</span>
        </div>
      </div>
    </div>
  );
};
