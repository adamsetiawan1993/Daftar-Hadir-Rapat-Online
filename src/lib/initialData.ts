import { Meeting, Attendance, SystemSettings } from '../types';
import { getTodayDateStringWIB } from './timeUtils';

export const defaultSettings: SystemSettings = {
  institutionName: 'Badan Nasional Pencarian dan Pertolongan',
  institutionSub: 'Biro Kepegawaian, Organisasi, dan Tata Laksana',
  themeColor: 'blue',
  announcement: 'Selamat datang! Harap mengisi daftar hadir resmi. Waktu kehadiran tercatat secara otomatis zona WIB.',
  showPosition: true,
  requirePosition: true,
  showContact: true,
  requireContact: false,
  preventDuplicates: true,
  autoOpenMinutesBefore: 30,
  autoCloseMinutesAfter: 60,
  customFields: [
    {
      id: 'cf_nip',
      label: 'NIP / Nomor Induk Pegawai',
      type: 'number',
      placeholder: 'Contoh: 198501012010121001',
      required: false,
      enabled: true,
      helpText: 'Khusus bagi ASN / Pegawai Pemerintah (opsional bagi umum)',
    },
    {
      id: 'cf_wilayah',
      label: 'Kota / Asal Domisili',
      type: 'text',
      placeholder: 'Contoh: Jakarta Pusat, Surabaya, Denpasar',
      required: true,
      enabled: true,
    },
    {
      id: 'cf_sertifikat',
      label: 'Kebutuhan e-Sertifikat Kehadiran',
      type: 'select',
      options: ['Ya, Butuh e-Sertifikat', 'Tidak Butuh'],
      required: true,
      enabled: true,
      helpText: 'Pilih apakah Anda memerlukan e-sertifikat kehadiran rapat',
    },
  ],
};

export function getSampleMeetings(): Meeting[] {
  const today = getTodayDateStringWIB();

  return [
    {
      id: 'rapat-rakornas-2026',
      title: 'Rapat Koordinasi Nasional Penerapan Standar Mutu Layanan Publik',
      description: 'Pembahasan sinkronisasi kebijakan standardisasi nasional dan penguatan komitmen antar kementerian/lembaga.',
      date: today,
      startTime: '09:00',
      endTime: '12:00',
      platform: 'Zoom',
      meetingUrl: 'https://zoom.us/j/9876543210',
      accessCode: 'BSN2026',
      statusMode: 'manual_open', // Open for immediate test
      createdBy: 'adamsetiawanbsn@gmail.com',
    },
    {
      id: 'sosialisasi-regulasi-akreditasi',
      title: 'Sosialisasi Regulasi Penilaian Kesesuaian & Sistem Akreditasi Lembaga Inspeksi',
      description: 'Penjelasan teknis tata cara pengajuan sertifikasi laboratorium dan lembaga inspeksi terpadu.',
      date: today,
      startTime: '13:30',
      endTime: '16:00',
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/bsn-eval-2026',
      accessCode: '',
      statusMode: 'auto',
      createdBy: 'adamsetiawanbsn@gmail.com',
    },
    {
      id: 'evaluasi-kinerja-triwulan',
      title: 'Rapat Pleno Evaluasi Kinerja Organisasi dan Pelaksanaan Anggaran Triwulan IV',
      description: 'Review serapan anggaran dan capaian indikator kinerja utama seluruh unit kerja eselon I & II.',
      date: today,
      startTime: '08:00',
      endTime: '10:00',
      platform: 'Microsoft Teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/evaluasi-bsn',
      accessCode: 'PLENO99',
      statusMode: 'manual_closed',
      createdBy: 'adamsetiawanbsn@gmail.com',
    },
  ];
}

export function getSampleAttendance(todayDate: string): Attendance[] {
  return [
    {
      id: 'att-sample-1',
      meetingId: 'rapat-rakornas-2026',
      fullName: 'Dr. Ir. Bambang Prasetya, M.Sc.',
      normalizedName: 'dr. ir. bambang prasetya, m.sc.',
      institution: 'Badan Standardisasi Nasional',
      position: 'Kepala Pusat Standardisasi Mutu',
      contact: '081289123456',
      role: 'Narasumber',
      submittedAt: new Date(todayDate + 'T08:45:00+07:00'),
      customResponses: {
        cf_nip: '196204121987031001',
        cf_wilayah: 'Jakarta Pusat',
        cf_sertifikat: 'Ya, Butuh e-Sertifikat',
      },
    },
    {
      id: 'att-sample-2',
      meetingId: 'rapat-rakornas-2026',
      fullName: 'Ratna Wulandari, S.T., M.Kom.',
      normalizedName: 'ratna wulandari, s.t., m.kom.',
      institution: 'Kementerian Komunikasi dan Informatika',
      position: 'Pranata Komputer Ahli Madya',
      contact: 'ratna.w@kominfo.go.id',
      role: 'Moderator',
      submittedAt: new Date(todayDate + 'T08:50:00+07:00'),
      customResponses: {
        cf_nip: '198409152009122003',
        cf_wilayah: 'Jakarta Pusat',
        cf_sertifikat: 'Ya, Butuh e-Sertifikat',
      },
    },
    {
      id: 'att-sample-3',
      meetingId: 'rapat-rakornas-2026',
      fullName: 'Hendra Setiawan, S.E., M.Ak.',
      normalizedName: 'hendra setiawan, s.e., m.ak.',
      institution: 'Inspektorat Jenderal Kementerian Keuangan',
      position: 'Auditor Pertama',
      contact: '085711223344',
      role: 'Peserta',
      submittedAt: new Date(todayDate + 'T09:05:00+07:00'),
      customResponses: {
        cf_nip: '199211052018011002',
        cf_wilayah: 'Bogor',
        cf_sertifikat: 'Ya, Butuh e-Sertifikat',
      },
    },
    {
      id: 'att-sample-4',
      meetingId: 'rapat-rakornas-2026',
      fullName: 'Dewi Lestari, S.H.',
      normalizedName: 'dewi lestari, s.h.',
      institution: 'Biro Hukum Setda Provinsi DKI Jakarta',
      position: 'Perancang Peraturan Perundang-undangan',
      contact: 'dewi.lestari@jakarta.go.id',
      role: 'Peserta',
      submittedAt: new Date(todayDate + 'T09:12:00+07:00'),
      customResponses: {
        cf_nip: '198807202012122001',
        cf_wilayah: 'DKI Jakarta',
        cf_sertifikat: 'Ya, Butuh e-Sertifikat',
      },
    },
    {
      id: 'att-sample-5',
      meetingId: 'rapat-rakornas-2026',
      fullName: 'Drs. Agus Suryanto, M.M.',
      normalizedName: 'drs. agus suryanto, m.m.',
      institution: 'Dinas Penanaman Modal & PTSP Jawa Timur',
      position: 'Kepala Bidang Pelayanan',
      contact: '081399887766',
      role: 'Perwakilan',
      submittedAt: new Date(todayDate + 'T09:18:00+07:00'),
      customResponses: {
        cf_nip: '196805141994031004',
        cf_wilayah: 'Surabaya, Jawa Timur',
        cf_sertifikat: 'Ya, Butuh e-Sertifikat',
      },
    },
  ];
}
