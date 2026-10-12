import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, ExternalLink, QrCode as QrIcon } from 'lucide-react';
import { Meeting } from '../types';
import { formatIndonesianDate } from '../lib/timeUtils';

interface QRCodeModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ meeting, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const attendanceUrl = meeting
    ? `${window.location.origin}/?rapat=${meeting.id}`
    : '';

  useEffect(() => {
    if (meeting && isOpen) {
      QRCode.toDataURL(attendanceUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR Code:', err));
    }
  }, [meeting, isOpen, attendanceUrl]);

  if (!isOpen || !meeting) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(attendanceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_Absen_${meeting.title.slice(0, 25).replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-blue-300">
                Pindai Untuk Absensi Rapat
              </span>
              <h3 className="text-base font-bold text-white line-clamp-1">
                {meeting.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>{formatIndonesianDate(meeting.date)}</span> •{' '}
            <span>{meeting.startTime} - {meeting.endTime} WIB</span> •{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {meeting.platform}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="inline-block p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100 dark:border-slate-800">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code Presensi ${meeting.title}`}
                className="w-64 h-64 mx-auto object-contain"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                Membuat QR Code...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Arahkan kamera smartphone atau scanner QR peserta ke kode di atas untuk membuka formulir kehadiran resmi.
          </p>

          {/* URL box */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 border border-slate-200 dark:border-slate-700 text-left">
            <input
              type="text"
              readOnly
              value={attendanceUrl}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 flex-1 px-2 focus:outline-none truncate font-mono"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Gambar QR</span>
            </button>

            {meeting.meetingUrl && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Ruang {meeting.platform}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
