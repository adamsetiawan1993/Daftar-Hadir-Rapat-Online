import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool, CheckCircle, AlertCircle } from 'lucide-react';

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(Boolean(value));

  // Initialize and size canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set proper resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e293b'; // slate-800

    // If pre-existing value, draw it
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasContent(true);
      };
      img.src = value;
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    } catch (err) {
      console.warn('Canvas export error:', err);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Tanda Tangan Digital Kehadiran</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        {hasContent && (
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center space-x-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Hapus / Ulangi</span>
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:border-blue-400 transition">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 touch-none cursor-crosshair bg-slate-50/40 dark:bg-slate-900/60"
          style={{ touchAction: 'none' }}
        />

        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs select-none">
            <PenTool className="w-5 h-5 mb-1 opacity-50 text-blue-500" />
            <span className="font-medium">Bubuhkan tanda tangan Anda di sini</span>
            <span className="text-[10px] opacity-75">(Bisa menggunakan jari di layar HP / kursor di PC)</span>
          </div>
        )}

        {hasContent && (
          <div className="absolute bottom-2 right-2.5 pointer-events-none flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold backdrop-blur-xs">
            <CheckCircle className="w-3 h-3" />
            <span>Tanda tangan terisi</span>
          </div>
        )}
      </div>
    </div>
  );
};
