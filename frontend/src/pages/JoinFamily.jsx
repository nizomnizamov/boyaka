import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export default function JoinFamily() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyInfo, setFamilyInfo] = useState(null);

  const handleJoin = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/families/join', { code: code.trim().toUpperCase() });
      setFamilyInfo(response.data.family);
      toast.success(response.data.message || "Oilaga muvaffaqiyatli qo'shildingiz!");
      setTimeout(() => navigate('/family'), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Oilaga qo'shilishda xatolik";
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Autentifikatsiya xatosi. Iltimos, tizimga qayta kiring.");
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(errorMsg);
      }
      toast.error(errorMsg);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError("URL da taklif kodi topilmadi");
      setLoading(false);
      return;
    }
    handleJoin(code);
  }, [searchParams, handleJoin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg">
        <div className="text-center">
          <Loader2 className="h-14 w-14 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-1">
            Oilaga qo'shilmoqda...
          </h2>
          <p className="text-text-muted dark:text-dark-text-muted text-sm">
            Iltimos, kuting
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg px-4">
        <div className="card max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-expense-light flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-expense" />
          </div>
          <h2 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">
            Xatolik yuz berdi
          </h2>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-5">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { const code = searchParams.get('code'); if (code) handleJoin(code); }}
              className="btn btn-primary flex-1"
            >
              Qayta urinish
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary flex-1">
              Bosh sahifa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg px-4">
      <div className="card max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-income-light flex items-center justify-center mx-auto mb-4">
          <Check className="h-7 w-7 text-income" />
        </div>
        <h2 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">
          Muvaffaqiyatli qo'shildingiz!
        </h2>
        {familyInfo && (
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
            <span className="font-semibold">{familyInfo.name}</span> oilasiga xush kelibsiz
          </p>
        )}
        <p className="text-xs text-text-muted dark:text-dark-text-muted mb-5">
          Oila sahifasiga yo'naltirilmoqda...
        </p>
        <button onClick={() => navigate('/family')} className="btn btn-primary w-full">
          Oila sahifasiga o'tish
        </button>
      </div>
    </div>
  );
}
