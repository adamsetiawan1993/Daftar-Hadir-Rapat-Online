import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import {
  History,
  Search,
  User,
  Clock,
  Tag,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { AuditLog } from '../../types';
import { formatWIBDateTime } from '../../lib/timeUtils';

export const AuditLogPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<AuditLog, 'id'>) });
        });
        setLogs(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error reading audit logs:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BUAT_RAPAT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'UPDATE_RAPAT':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300';
      case 'HAPUS_RAPAT':
      case 'HAPUS_KEHADIRAN':
      case 'HAPUS_ADMIN':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300';
      case 'BUKA_ABSEN':
        return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300';
      case 'TUTUP_ABSEN':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (log.adminEmail && log.adminEmail.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.target && log.target.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Log Audit Aktivitas Admin
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Catatan rekam jejak setiap aksi administratif (Siapa, Kapan WIB, Aksi, Target, dan Rincian)
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari email, aksi, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Memuat rekam jejak audit...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Belum ada rekam jejak audit tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Waktu (WIB)</th>
                  <th className="px-4 py-3.5">Admin Pelaksana</th>
                  <th className="px-4 py-3.5">Aksi</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatWIBDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {log.adminEmail}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {log.target}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] max-w-md">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
