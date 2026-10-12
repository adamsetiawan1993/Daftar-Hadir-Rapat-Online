import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink, FileText, Video, Link2, Sparkles, X, Check } from 'lucide-react';
import { MeetingMaterial } from '../../types';

interface MaterialsManagerProps {
  materials: MeetingMaterial[];
  onChange: (materials: MeetingMaterial[]) => void;
}

const PRESET_MATERIALS: { label: string; placeholder: string; type: MeetingMaterial['type'] }[] = [
  { label: 'Paparan / Bahan Tayang (PPT / PDF)', placeholder: 'https://drive.google.com/file/... atau link materi', type: 'slides' },
  { label: 'Tautan Notulensi / Ringkasan Rapat', placeholder: 'https://docs.google.com/document/...', type: 'document' },
  { label: 'Link Rekaman Rapat (Cloud Video)', placeholder: 'https://zoom.us/rec/... atau YouTube link', type: 'video' },
  { label: 'Formulir Evaluasi / Feedback Peserta', placeholder: 'https://forms.gle/...', type: 'link' },
];

export const MaterialsManager: React.FC<MaterialsManagerProps> = ({ materials = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<MeetingMaterial['type']>('slides');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const newMat: MeetingMaterial = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      url: cleanUrl,
      type: type || 'link',
    };

    onChange([...materials, newMat]);
    setTitle('');
    setUrl('');
    setType('slides');
    setIsAdding(false);
  };

  const handlePreset = (preset: typeof PRESET_MATERIALS[0]) => {
    setTitle(preset.label);
    setType(preset.type);
    setIsAdding(true);
  };

  const handleRemove = (id: string) => {
    onChange(materials.filter((m) => m.id !== id));
  };

  const getIcon = (matType?: string) => {
    switch (matType) {
      case 'slides':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Link2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Materi & Berkas Rapat untuk Peserta</span>
            <span className="text-[10px] font-normal text-slate-500">({materials.length} Tautan)</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Peserta dapat langsung mengakses dan mengunduh bahan rapat di halaman presensi.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Materi</span>
          </button>
        )}
      </div>

      {/* Preset Suggestions */}
      {!isAdding && materials.length === 0 && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pilihan Template Tautan Cepat:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_MATERIALS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePreset(p)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Materials List */}
      {materials.length > 0 && (
        <div className="space-y-1.5">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                  {getIcon(mat.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{mat.title}</p>
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-mono truncate"
                  >
                    <span className="truncate">{mat.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(mat.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                title="Hapus berkas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Inline Form */}
      {isAdding && (
        <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Tambah Tautan Materi Baru</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Judul Berkas / Materi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bahan Paparan PPT Rapat, Link Rekaman Video..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Tipe Berkas
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="slides">Paparan (Slides)</option>
                  <option value="document">Dokumen / Notula</option>
                  <option value="video">Rekaman Video</option>
                  <option value="link">Tautan Lainnya</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Tautan / URL Berkas (Google Drive / DropBox / Web)
              </label>
              <input
                type="text"
                placeholder="https://drive.google.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Materi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
