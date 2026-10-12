import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Type,
  Hash,
  ListFilter,
  CheckSquare,
  AlignLeft,
  CircleDot,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Eye,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { CustomField, CustomFieldType } from '../../types';

interface CustomFieldsManagerProps {
  customFields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  title?: string;
  description?: string;
}

const FIELD_TYPE_OPTIONS: { id: CustomFieldType; label: string; desc: string; icon: any }[] = [
  { id: 'text', label: 'Teks Singkat', desc: 'Isian teks umum satu baris', icon: Type },
  { id: 'number', label: 'Angka / NIP / NIK', desc: 'Hanya angka/nomor identitas', icon: Hash },
  { id: 'select', label: 'Menu Pilihan (Dropdown)', desc: 'Pilihan opsi tunggal dalam dropdown', icon: ListFilter },
  { id: 'radio', label: 'Pilihan Radio Tunggal', desc: 'Pilihan langsung terlihat dengan opsi radio', icon: CircleDot },
  { id: 'textarea', label: 'Teks Panjang / Catatan', desc: 'Isian paragraf beberapa baris', icon: AlignLeft },
  { id: 'checkbox', label: 'Kotak Centang (Ya / Tidak)', desc: 'Konfirmasi atau persetujuan tunggal', icon: CheckSquare },
];

const QUICK_PRESETS: { title: string; field: Omit<CustomField, 'id'> }[] = [
  {
    title: 'NIP / NIK Pegawai',
    field: {
      label: 'NIP / Nomor Induk Pegawai',
      type: 'number',
      placeholder: 'Contoh: 198501012010121001',
      required: false,
      enabled: true,
      helpText: 'Khusus bagi ASN / Pegawai Lembaga Pemerintah',
    },
  },
  {
    title: 'Unit Kerja / Sub-Bagian',
    field: {
      label: 'Unit Kerja / Biro / Bagian',
      type: 'text',
      placeholder: 'Contoh: Biro Kepegawaian & Tata Laksana',
      required: true,
      enabled: true,
    },
  },
  {
    title: 'Kota / Asal Domisili',
    field: {
      label: 'Kota / Asal Domisili',
      type: 'text',
      placeholder: 'Contoh: Jakarta Pusat, Surabaya, Denpasar',
      required: true,
      enabled: true,
    },
  },
  {
    title: 'No. Surat Tugas (SPT)',
    field: {
      label: 'Nomor Surat Perintah Tugas (SPT)',
      type: 'text',
      placeholder: 'Contoh: ST/042/KP/III/2026',
      required: false,
      enabled: true,
      helpText: 'Nomor surat tugas atau disposisi pimpinan instansi',
    },
  },
  {
    title: 'Kebutuhan e-Sertifikat',
    field: {
      label: 'Kebutuhan e-Sertifikat Kehadiran',
      type: 'select',
      options: ['Ya, Butuh e-Sertifikat', 'Tidak Butuh'],
      required: true,
      enabled: true,
      helpText: 'Pilih apakah Anda memerlukan e-sertifikat kehadiran resmi',
    },
  },
  {
    title: 'Catatan / Aspirasi',
    field: {
      label: 'Catatan / Masukan Tambahan',
      type: 'textarea',
      placeholder: 'Tuliskan catatan, kendala koneksi, atau masukan...',
      required: false,
      enabled: true,
    },
  },
];

export const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
  customFields = [],
  onChange,
  title = 'Kolom Tambahan Kustom Formulir Presensi',
  description = 'Tambahkan kolom khusus tambahan sesuai kebutuhan rapat instansi (seperti NIP, Divisi, Kota, No. SPT, dsb).',
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [label, setLabel] = useState<string>('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [placeholder, setPlaceholder] = useState<string>('');
  const [helpText, setHelpText] = useState<string>('');
  const [required, setRequired] = useState<boolean>(false);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [optionsStr, setOptionsStr] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const openAddModal = () => {
    setEditingId(null);
    setLabel('');
    setType('text');
    setPlaceholder('');
    setHelpText('');
    setRequired(false);
    setEnabled(true);
    setOptionsStr('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (field: CustomField) => {
    setEditingId(field.id);
    setLabel(field.label);
    setType(field.type);
    setPlaceholder(field.placeholder || '');
    setHelpText(field.helpText || '');
    setRequired(field.required);
    setEnabled(field.enabled);
    setOptionsStr(field.options ? field.options.join(', ') : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const applyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    const existingIndex = customFields.findIndex(
      (f) => f.label.toLowerCase() === preset.field.label.toLowerCase()
    );
    if (existingIndex >= 0) {
      alert(`Kolom "${preset.field.label}" sudah ada dalam daftar.`);
      return;
    }

    const newField: CustomField = {
      id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...preset.field,
    };
    onChange([...customFields, newField]);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setFormError('Nama / Label kolom tidak boleh kosong.');
      return;
    }

    // Process options if select or radio
    let cleanOptions: string[] | undefined = undefined;
    if (type === 'select' || type === 'radio') {
      const parsed = optionsStr
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length < 2) {
        setFormError('Kolom menu pilihan / radio wajib memiliki minimal 2 opsi pilihan (pisahkan dengan koma).');
        return;
      }
      cleanOptions = parsed;
    }

    if (editingId) {
      // Update existing
      const updated = customFields.map((f) => {
        if (f.id === editingId) {
          return {
            ...f,
            label: cleanLabel,
            type,
            placeholder: placeholder.trim() || undefined,
            helpText: helpText.trim() || undefined,
            required,
            enabled,
            options: cleanOptions,
          };
        }
        return f;
      });
      onChange(updated);
    } else {
      // Add new
      const newField: CustomField = {
        id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        label: cleanLabel,
        type,
        placeholder: placeholder.trim() || undefined,
        helpText: helpText.trim() || undefined,
        required,
        enabled,
        options: cleanOptions,
      };
      onChange([...customFields, newField]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteField = (id: string, fieldLabel: string) => {
    if (window.confirm(`Hapus kolom "${fieldLabel}" dari formulir presensi?`)) {
      onChange(customFields.filter((f) => f.id !== id));
    }
  };

  const handleToggleEnabled = (id: string) => {
    const updated = customFields.map((f) => {
      if (f.id === id) {
        return { ...f, enabled: !f.enabled };
      }
      return f;
    });
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= customFields.length) return;

    const copy = [...customFields];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onChange(copy);
  };

  const getTypeIcon = (fType: CustomFieldType) => {
    const matched = FIELD_TYPE_OPTIONS.find((t) => t.id === fType);
    const IconComp = matched?.icon || Type;
    return <IconComp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };

  const getTypeLabel = (fType: CustomFieldType) => {
    const matched = FIELD_TYPE_OPTIONS.find((t) => t.id === fType);
    return matched?.label || fType;
  };

  return (
    <div className="space-y-4">
      {/* Header & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {customFields.length} Kolom Kustom
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>

        <div className="flex items-center space-x-2">
          {customFields.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>{showPreview ? 'Sembunyikan Pratinjau' : 'Lihat Pratinjau Form'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kolom Manual</span>
          </button>
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Template Kolom Cepat (1-Klik Tambahkan):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition shadow-2xs flex items-center space-x-1"
            >
              <span>+ {preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List of Custom Fields */}
      {customFields.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Belum ada kolom kustom tambahan. Gunakan template cepat di atas atau klik tombol <strong>"Tambah Kolom Manual"</strong> untuk membuat kolom baru sesuai kebutuhan.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {customFields.map((field, index) => (
            <div
              key={field.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                field.enabled
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  {getTypeIcon(field.type)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        Wajib Diisi (*)
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {getTypeLabel(field.type)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {field.placeholder ? `Placeholder: "${field.placeholder}" • ` : ''}
                    {field.options ? `Pilihan: [${field.options.join(', ')}] • ` : ''}
                    {field.helpText ? `Bantuan: ${field.helpText}` : ''}
                  </p>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                {/* Reorder Buttons */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition"
                  title="Pindah ke Atas"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === customFields.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition"
                  title="Pindah ke Bawah"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Toggle Enabled */}
                <button
                  type="button"
                  onClick={() => handleToggleEnabled(field.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                    field.enabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <span>{field.enabled ? 'Aktif' : 'Nonaktif'}</span>
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEditModal(field)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                  title="Edit Kolom"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteField(field.id, field.label)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                  title="Hapus Kolom"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Form Preview Box */}
      {showPreview && customFields.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-900/60 space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Pratinjau Tampilan Kolom di Halaman Peserta:</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 max-w-xl">
            {customFields
              .filter((f) => f.enabled)
              .map((field) => (
                <div key={field.id} className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>{field.label}</span>
                    {field.required && <span className="text-rose-500 font-bold">*</span>}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      disabled
                      placeholder={field.placeholder || 'Tuliskan isian...'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 cursor-not-allowed"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      disabled
                      placeholder={field.placeholder || 'Isi angka/nomor...'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 cursor-not-allowed"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      rows={2}
                      disabled
                      placeholder={field.placeholder || 'Tuliskan catatan...'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 cursor-not-allowed"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 cursor-not-allowed"
                    >
                      <option>-- Pilih {field.label} --</option>
                      {field.options?.map((opt, i) => (
                        <option key={i}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'radio' && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {field.options?.map((opt, i) => (
                        <label key={i} className="flex items-center space-x-1.5 text-xs text-slate-500 cursor-not-allowed">
                          <input type="radio" disabled name={field.id} className="text-blue-600" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <label className="flex items-center space-x-2 text-xs text-slate-500 pt-1 cursor-not-allowed">
                      <input type="checkbox" disabled className="rounded text-blue-600 w-4 h-4" />
                      <span>{field.placeholder || 'Ya, saya mengonfirmasi isian ini'}</span>
                    </label>
                  )}

                  {field.helpText && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{field.helpText}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingId ? 'Edit Kolom Kustom' : 'Tambah Kolom Kustom Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi nama kolom, tipe input data, dan ketentuan pengisian
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveField} className="space-y-4 text-left">
              {/* Nama / Label Kolom */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nama / Label Kolom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Misal: NIP / NIK, Unit Kerja, Asal Kota, No. Surat Tugas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tipe Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tipe Isian Data <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPE_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = type === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-start space-x-2 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{opt.label}</p>
                          <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opsi Pilihan (Hanya jika select / radio) */}
              {(type === 'select' || type === 'radio') && (
                <div className="space-y-1 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Daftar Opsi Pilihan (Pisahkan dengan koma) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    placeholder="Contoh: Pusat, Balai Wilayah Barat, Balai Wilayah Timur"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Masukkan minimal 2 pilihan yang dapat dipilih oleh peserta.
                  </p>
                </div>
              )}

              {/* Placeholder & Bantuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contoh Isian (Placeholder)
                  </label>
                  <input
                    type="text"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="Contoh: Masukkan NIP Anda..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Teks Bantuan di Bawah Input
                  </label>
                  <input
                    type="text"
                    value={helpText}
                    onChange={(e) => setHelpText(e.target.value)}
                    placeholder="Contoh: Khusus pegawai internal..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Checkboxes: Wajib & Aktif */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Wajib diisi oleh peserta (*)</span>
                </label>

                <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Aktifkan langsung pada formulir kehadiran</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan Kolom'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
