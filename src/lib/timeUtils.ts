import { Meeting, MeetingStatusMode, AttendanceActiveStatus } from '../types';

/**
 * Format a Date object or timestamp into WIB (Asia/Jakarta)
 */
export function getJakartaCurrentDate(): Date {
  const now = new Date();
  // Get time string in Asia/Jakarta timezone
  const jakartaString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  return new Date(jakartaString);
}

export function formatWIBTime(dateOrTimestamp: any): string {
  if (!dateOrTimestamp) return '-';
  let d: Date;
  if (dateOrTimestamp?.toDate && typeof dateOrTimestamp.toDate === 'function') {
    d = dateOrTimestamp.toDate();
  } else if (dateOrTimestamp instanceof Date) {
    d = dateOrTimestamp;
  } else if (typeof dateOrTimestamp === 'string' || typeof dateOrTimestamp === 'number') {
    d = new Date(dateOrTimestamp);
  } else {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d) + ' WIB';
}

export function formatWIBDateTime(dateOrTimestamp: any): string {
  if (!dateOrTimestamp) return '-';
  let d: Date;
  if (dateOrTimestamp?.toDate && typeof dateOrTimestamp.toDate === 'function') {
    d = dateOrTimestamp.toDate();
  } else if (dateOrTimestamp instanceof Date) {
    d = dateOrTimestamp;
  } else if (typeof dateOrTimestamp === 'string' || typeof dateOrTimestamp === 'number') {
    d = new Date(dateOrTimestamp);
  } else {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d) + ' WIB';
}

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function getTodayDateStringWIB(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // Returns 'YYYY-MM-DD'
}

export function getNowTimeStringWIB(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * Calculate meeting status considering manual override and auto window
 */
export function getMeetingAttendanceStatus(
  meeting: Meeting,
  autoOpenMinutesBefore: number = 30,
  autoCloseMinutesAfter: number = 60
): {
  isOpen: boolean;
  code: AttendanceActiveStatus;
  label: string;
  badgeClass: string;
} {
  if (meeting.statusMode === 'manual_open') {
    return {
      isOpen: true,
      code: 'OPEN',
      label: 'Dibuka (Manual)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
    };
  }

  if (meeting.statusMode === 'manual_closed') {
    return {
      isOpen: false,
      code: 'MANUAL_CLOSED',
      label: 'Ditutup (Manual)',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
    };
  }

  // Automatic calculation based on meeting date and start/end time
  const todayWib = getTodayDateStringWIB();
  const nowWib = getJakartaCurrentDate();

  try {
    const [startH, startM] = (meeting.startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (meeting.endTime || '23:59').split(':').map(Number);

    const [year, month, day] = meeting.date.split('-').map(Number);
    
    // Construct start and end Date objects in WIB representation
    const startTimeObj = new Date(year, month - 1, day, startH, startM, 0);
    const endTimeObj = new Date(year, month - 1, day, endH, endM, 0);

    // Apply tolerances
    const openThreshold = new Date(startTimeObj.getTime() - autoOpenMinutesBefore * 60 * 1000);
    const closeThreshold = new Date(endTimeObj.getTime() + autoCloseMinutesAfter * 60 * 1000);

    // Current time in WIB timestamp
    const nowTimeObj = new Date(
      nowWib.getFullYear(),
      nowWib.getMonth(),
      nowWib.getDate(),
      nowWib.getHours(),
      nowWib.getMinutes(),
      nowWib.getSeconds()
    );

    if (nowTimeObj < openThreshold) {
      return {
        isOpen: false,
        code: 'CLOSED_NOT_STARTED',
        label: `Belum Dibuka (Buka ${autoOpenMinutesBefore} mnt sebelum mulai)`,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
      };
    } else if (nowTimeObj > closeThreshold) {
      return {
        isOpen: false,
        code: 'CLOSED_FINISHED',
        label: 'Selesai / Ditutup',
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
      };
    } else {
      return {
        isOpen: true,
        code: 'OPEN',
        label: 'Dibuka (Sesuai Jadwal)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
      };
    }
  } catch (err) {
    return {
      isOpen: false,
      code: 'CLOSED_FINISHED',
      label: 'Jadwal Tidak Valid',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }
}
