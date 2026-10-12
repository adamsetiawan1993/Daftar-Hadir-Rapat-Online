import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Mail,
  User,
  ShieldAlert,
  Loader2,
  CheckCircle,
  X,
  Shield,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { AdminUser, AdminRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatWIBDateTime } from '../../lib/timeUtils';

export const AdminUsersPanel: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<AdminRole>('operator');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete modal state
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<boolean>(false);

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setDeletingAdmin(true);
    try {
      await deleteDoc(doc(db, 'admins', adminToDelete.id));

      try {
        await addDoc(collection(db, 'auditLogs'), {
          adminEmail: currentUser?.email || 'admin',
          adminUid: currentUser?.uid || 'uid',
          action: 'HAPUS_ADMIN',
          target: adminToDelete.email,
          details: `ID: ${adminToDelete.id}`,
          timestamp: serverTimestamp(),
        });
      } catch (logErr) {
        console.warn('Audit log write error:', logErr);
      }

      setAdminToDelete(null);
    } catch (err) {
      console.error('Delete admin error:', err);
    } finally {
      setDeletingAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const list: AdminUser[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<AdminUser, 'id'>) });
        });
        setAdmins(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching admins:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) return;

    setSaving(true);
    try {
      // Document id derived from clean email or random id
      const adminId = `admin_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const newAdmin: Partial<AdminUser> = {
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split('@')[0],
        role,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'admins', adminId), newAdmin, { merge: true });

      await addDoc(collection(db, 'auditLogs'), {
        adminEmail: currentUser?.email || 'admin',
        adminUid: currentUser?.uid || 'uid',
        action: 'TAMBAH_ADMIN',
        target: email.trim(),
        details: `Peran: ${role}, Nama: ${name.trim()}`,
        timestamp: serverTimestamp(),
      });

      setIsAddModalOpen(false);
      setEmail('');
      setName('');
      setRole('operator');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'admins');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (admin: AdminUser, newRole: AdminRole) => {
    if (admin.email === 'adamsetiawanbsn@gmail.com') {
      alert('Akun Super Admin utama BSN tidak dapat diubah perannya.');
      return;
    }

    try {
      await setDoc(doc(db, 'admins', admin.id), { role: newRole }, { merge: true });

      await addDoc(collection(db, 'auditLogs'), {
        adminEmail: currentUser?.email || 'admin',
        adminUid: currentUser?.uid || 'uid',
        action: 'UBAH_PERAN_ADMIN',
        target: admin.email,
        details: `Peran diubah ke: ${newRole}`,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admins/${admin.id}`);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-8 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
          Akses Khusus Super Admin
        </h3>
        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 max-w-md mx-auto">
          Hanya pengguna dengan peran Super Admin yang memiliki hak mengelola penambahan, perubahan peran, dan penghapusan administrator sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Kelola Administrator & Peran
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Atur pengguna pengelola dengan tingkatan Super Admin dan Operator Rapat
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      {/* Role explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Super Admin</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Memiliki kendali penuh: mengelola rapat, kehadiran, pengaturan instansi, dan manajemen akun admin lainnya.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Operator</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Dapat membuat/mengubah rapat, membuka/menutup sesi absen, melihat daftar hadir, dan mencetak notulen.
          </p>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Nama & Email Admin</th>
                <th className="px-4 py-3.5">Peran Akses</th>
                <th className="px-4 py-3.5 text-center">Tanggal Dibuat</th>
                <th className="px-4 py-3.5 text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Memuat data admin...
                  </td>
                </tr>
              ) : (
                admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {adm.name}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {adm.email}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <select
                        value={adm.role}
                        disabled={adm.email === 'adamsetiawanbsn@gmail.com'}
                        onChange={(e) => handleUpdateRole(adm, e.target.value as AdminRole)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="operator">Operator</option>
                      </select>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono text-[11px] text-slate-400">
                      {adm.createdAt ? formatWIBDateTime(adm.createdAt) : '-'}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {adm.email !== 'adamsetiawanbsn@gmail.com' && (
                        <button
                          onClick={() => setAdminToDelete(adm)}
                          title="Hapus Hak Akses"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Tambah Administrator Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Admin Terdaftar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="operator@instansi.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Tampilan Admin
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Operator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Peran / Hak Akses
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="operator">Operator (Kelola Rapat & Presensi)</option>
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center space-x-1 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Admin</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3.5 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Hak Akses Admin?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Akun ini tidak akan dapat mengelola presensi lagi.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {adminToDelete.name}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                {adminToDelete.email} • Peran: {adminToDelete.role}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={deletingAdmin}
                onClick={() => setAdminToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingAdmin}
                onClick={confirmDeleteAdmin}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md flex items-center space-x-1.5 disabled:opacity-50"
              >
                {deletingAdmin ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Admin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
