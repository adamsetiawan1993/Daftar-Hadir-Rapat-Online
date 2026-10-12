import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Settings as SettingsIcon,
  Building,
  Palette,
  Megaphone,
  CheckSquare,
  Clock,
  Save,
  Check,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { SystemSettings, CustomField } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { CustomFieldsManager } from './CustomFieldsManager';

export const SettingsPanel: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldsChange = (newFields: CustomField[]) => {
    setFormData((prev) => ({ ...prev, customFields: newFields }));
  };

  const handleInstantThemeChange = async (color: SystemSettings['themeColor']) => {
    setFormData((prev) => ({ ...prev, themeColor: color }));
    try {
      await updateSettings({ themeColor: color }, currentUser?.email || 'admin');
      await addDoc(collection(db, 'auditLogs'), {
        adminEmail: currentUser?.email || 'admin',
        adminUid: currentUser?.uid || 'uid',
        action: 'UPDATE_TEMA',
        target: 'Warna Tema Header',
        details: `Aksen warna langsung diubah menjadi: ${color}`,
        timestamp: serverTimestamp(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error updating theme color:', err);
    }
  };

  const themeOptions: { id: SystemSettings['themeColor']; label: string; bg: string; dot: string }[] = [
    { id: 'orange', label: 'Oranye Basarnas', bg: 'bg-orange-500', dot: 'border-orange-500' },
    { id: 'blue', label: 'Biru Resmi', bg: 'bg-blue-600', dot: 'border-blue-500' },
    { id: 'indigo', label: 'Indigo Modern', bg: 'bg-indigo-600', dot: 'border-indigo-500' },
    { id: 'emerald', label: 'Emerald Hijau', bg: 'bg-emerald-600', dot: 'border-emerald-500' },
    { id: 'teal', label: 'Teal Toska', bg: 'bg-teal-600', dot: 'border-teal-500' },
    { id: 'slate', label: 'Slate Elegan', bg: 'bg-slate-700', dot: 'border-slate-500' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateSettings(formData, currentUser?.email || 'admin');

      await addDoc(collection(db, 'auditLogs'), {
        adminEmail: currentUser?.email || 'admin',
        adminUid: currentUser?.uid || 'uid',
        action: 'UPDATE_PENGATURAN',
        target: 'Konfigurasi Sistem',
        details: `Instansi: ${formData.institutionName}, Duplikat: ${formData.preventDuplicates}, Auto Buka: ${formData.autoOpenMinutesBefore}m`,
        timestamp: serverTimestamp(),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Pengaturan Sistem & Formulir
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kustomisasi identitas instansi, teks pengumuman, aturan kolom kehadiran, dan jendela waktu otomatis
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Identitas Instansi */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Identitas Instansi & Branding
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Instansi Utama <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.institutionName}
                onChange={(e) => handleChange('institutionName', e.target.value)}
                placeholder="Contoh: Badan Nasional Pencarian dan Pertolongan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sub-Unit Kerja / Biro / Bagian Notulen
              </label>
              <input
                type="text"
                value={formData.institutionSub}
                onChange={(e) => handleChange('institutionSub', e.target.value)}
                placeholder="Contoh: Biro Hubungan Masyarakat, Kerja Sama, dan Layanan Informasi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>Aksen Warna Tema Header</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Langsung Aktif
                  </span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Klik warna untuk langsung mengganti tema
                </span>
              </div>

              {/* Instant color swatch buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {themeOptions.map((opt) => {
                  const isSelected = formData.themeColor === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleInstantThemeChange(opt.id)}
                      className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full ${opt.bg} shadow-md flex items-center justify-center text-white mb-1.5`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Pengumuman Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Teks Pengumuman Banner
            </h3>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pesan Penting untuk Peserta Rapat (Ditampilkan di bagian atas halaman presensi)
            </label>
            <textarea
              rows={2}
              value={formData.announcement || ''}
              onChange={(e) => handleChange('announcement', e.target.value)}
              placeholder="Kosongkan jika tidak ada pengumuman khusus..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 3. Konfigurasi Kolom Form & Proteksi Isian */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Aturan Kolom Formulir Presensi
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kolom Jabatan */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Kolom Jabatan Peserta
              </span>
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showPosition}
                  onChange={(e) => handleChange('showPosition', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Tampilkan kolom Jabatan di form</span>
              </label>
              {formData.showPosition && (
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pl-6">
                  <input
                    type="checkbox"
                    checked={formData.requirePosition}
                    onChange={(e) => handleChange('requirePosition', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Wajibkan pengisian Jabatan</span>
                </label>
              )}
            </div>

            {/* Kolom Kontak */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Kolom Kontak (Email / WhatsApp)
              </span>
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showContact}
                  onChange={(e) => handleChange('showContact', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Tampilkan kolom Kontak di form</span>
              </label>
              {formData.showContact && (
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pl-6">
                  <input
                    type="checkbox"
                    checked={formData.requireContact}
                    onChange={(e) => handleChange('requireContact', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Wajibkan pengisian Kontak</span>
                </label>
              )}
            </div>

            {/* Cegah Isian Ganda */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 sm:col-span-2 space-y-2">
              <label className="flex items-start space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preventDuplicates}
                  onChange={(e) => handleChange('preventDuplicates', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                />
                <div>
                  <span>Cegah Isian Ganda (Nama sama pada rapat yang sama)</span>
                  <p className="font-normal text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Jika diaktifkan, peserta yang mengirimkan nama identik pada agenda rapat yang sama akan ditolak secara otomatis guna mencegah data duplikat.
                  </p>
                </div>
              </label>
            </div>

            {/* Kolom Tambahan Kustom (Dapat Ditambahkan Manual oleh Admin) */}
            <div className="sm:col-span-2 pt-5 border-t border-slate-100 dark:border-slate-800">
              <CustomFieldsManager
                customFields={formData.customFields || []}
                onChange={handleCustomFieldsChange}
              />
            </div>
          </div>
        </div>

        {/* 4. Aturan Waktu Absen Otomatis */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Aturan Waktu Absensi Otomatis (Zona WIB)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dibuka sebelum rapat dimulai (menit)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={formData.autoOpenMinutesBefore}
                  onChange={(e) => handleChange('autoOpenMinutesBefore', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500 shrink-0">menit</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Contoh: 30 menit (absen dibuka 30 menit sebelum jam mulai rapat).
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ditutup setelah rapat selesai (menit)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={formData.autoCloseMinutesAfter}
                  onChange={(e) => handleChange('autoCloseMinutesAfter', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500 shrink-0">menit</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Contoh: 60 menit (toleransi pengisian ditutup 1 jam setelah rapat selesai).
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Seluruh Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
