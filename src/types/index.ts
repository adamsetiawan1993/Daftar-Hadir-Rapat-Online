export type MeetingPlatform = 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Cisco Webex' | 'Lainnya';

export type MeetingStatusMode = 'auto' | 'manual_open' | 'manual_closed';

export type AttendeeRole = 'Peserta' | 'Narasumber' | 'Moderator' | 'Tamu Undangan' | 'Perwakilan';

export type CustomFieldType = 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  placeholder?: string;
  options?: string[]; // for select or radio
  required: boolean;
  enabled: boolean;
  helpText?: string;
}

export interface MeetingMaterial {
  id: string;
  title: string;
  url: string;
  type?: 'slides' | 'document' | 'video' | 'link';
}

export type WorkLocationType = 'Online (WFH)' | 'Hadir di Lokasi (WFO)' | 'Perjalanan Dinas' | 'Lainnya';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  platform: MeetingPlatform;
  meetingUrl?: string;
  accessCode?: string; // Optional meeting passcode
  statusMode: MeetingStatusMode;
  customFields?: CustomField[]; // Optional per-meeting specific custom fields
  useCustomFieldsOnly?: boolean; // If true, overrides global custom fields
  // Fitur tambahan manual yang diatur oleh admin sesuai kebutuhan:
  materials?: MeetingMaterial[]; // Tautan bahan / materi / notulensi rapat
  broadcastNotice?: string; // Pengumuman khusus / arahan penting rapat
  enableSignature?: boolean; // Tanda tangan digital peserta
  enableWorkLocation?: boolean; // Pilihan WFH/WFO/Dinas
  enableNotes?: boolean; // Kolom catatan/aspirasi peserta
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Attendance {
  id: string;
  meetingId: string;
  fullName: string;
  normalizedName: string;
  institution: string;
  position?: string;
  contact?: string; // Email or WhatsApp
  role: AttendeeRole;
  clientFingerprint?: string;
  submittedAt?: any; // Firestore Timestamp or ISO string
  customResponses?: Record<string, string | boolean | number>; // Dynamic answers to custom fields
  signature?: string; // Base64 digital signature (PNG)
  workLocation?: string; // Lokasi kerja / status kehadiran
  notes?: string; // Catatan / masukan peserta
}

export interface SystemSettings {
  institutionName: string;
  institutionSub: string;
  logoUrl?: string;
  themeColor: 'orange' | 'blue' | 'indigo' | 'emerald' | 'teal' | 'slate';
  announcement?: string;
  showPosition: boolean;
  requirePosition: boolean;
  showContact: boolean;
  requireContact: boolean;
  preventDuplicates: boolean;
  autoOpenMinutesBefore: number;
  autoCloseMinutesAfter: number;
  customFields?: CustomField[]; // Admin-configured custom fields for attendance form
  updatedAt?: string;
  updatedBy?: string;
}

export type AdminRole = 'super_admin' | 'operator';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  adminUid: string;
  action: string;
  target: string;
  details: string;
  timestamp: any;
}

export type AttendanceActiveStatus = 'OPEN' | 'CLOSED_NOT_STARTED' | 'CLOSED_FINISHED' | 'MANUAL_CLOSED';
