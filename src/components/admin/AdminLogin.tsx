import React, { useState } from 'react';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Jendela login ditutup sebelum proses selesai. Silakan klik tombol Masuk kembali.');
        console.warn('Google login popup closed by user');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Jendela pop-up diblokir oleh browser. Harap izinkan pop-up pada peramban Anda lalu coba lagi.');
        console.warn('Google login popup was blocked by browser');
      } else if (code === 'auth/cancelled-popup-request') {
        setErrorMessage('Permintaan login sebelumnya masih berlangsung. Harap tunggu sebentar.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(`Domain (${window.location.hostname}) sedang didaftarkan pada Firebase. Silakan segarkan halaman dalam beberapa saat.`);
        console.error('Google login unauthorized domain error:', code, err?.message);
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.');
        console.warn('Google login network request failed');
      } else {
        const message = err?.message || 'Gagal masuk dengan Google. Silakan coba kembali.';
        setErrorMessage(message);
        console.error('Google login error detail:', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        {/* Header Icon & Title */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-9 h-9" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Masuk Panel Admin
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Khusus Pengelola, Operator, & Notulis Rapat
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Google Sign-in Button Only */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-sm transition shadow-sm hover:shadow flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Menghubungkan Akun Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk Dengan Akun Google</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Gunakan akun Google yang berwenang untuk mengakses panel pengelolaan presensi rapat.
        </p>
      </div>
    </div>
  );
};
