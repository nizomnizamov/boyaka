import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Parol kuchini tekshirish (backend bilan mos)
function checkPasswordStrength(pwd) {
  return {
    minLength:  pwd.length >= 8,
    hasUpper:   /[A-Z]/.test(pwd),
    hasLower:   /[a-z]/.test(pwd),
    hasNumber:  /[0-9]/.test(pwd),
  };
}

const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const pwd = formData.password;
    const strength = checkPasswordStrength(pwd);
    if (!strength.minLength || !strength.hasUpper || !strength.hasLower || !strength.hasNumber) {
      setError("Parol talablarga javob bermaydi");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Parollar mos kelmaydi");
      return;
    }
    if (!formData.full_name.trim()) {
      setError("Ism familiyani kiriting");
      return;
    }

    setLoading(true);
    try {
      const success = await register(formData.email, formData.password, formData.full_name.trim());
      if (success) {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleGoogleLogin = () => {
    const backendUrl = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  // Parol kuchi ko'rsatkichi
  const pwdStrength = checkPasswordStrength(formData.password);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg px-4 py-10"
      style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-primary">
            <span className="text-white font-bold text-3xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary tracking-tight">
            Boyaka
          </h1>
          <p className="text-sm text-text-muted dark:text-dark-text-muted mt-1">
            {t('app.tagline', 'Shaxsiy moliya boshqaruvi')}
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">
              {t('auth.register', "Ro'yxatdan o'tish")}
            </h2>
          </div>

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-2xl bg-expense-light dark:bg-red-950/30 text-expense text-sm font-medium"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="reg-name" className="label">
                {t('auth.fullName', 'Ism Familiya')}
              </label>
              <input
                id="reg-name"
                type="text"
                name="full_name"
                autoComplete="name"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
                required
                placeholder="Alisher Navoiy"
                aria-required="true"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="label">
                {t('auth.email', 'Email')}
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
                placeholder="email@misol.com"
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="label">
                {t('auth.password', 'Parol')}
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-12"
                  required
                  placeholder="Kamida 8 ta belgi"
                  aria-required="true"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
                  aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Parol kuchi ko'rsatkichi */}
              {formData.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {[
                    { ok: pwdStrength.minLength, text: 'Kamida 8 ta belgi' },
                    { ok: pwdStrength.hasUpper,  text: 'Katta harf (A-Z)' },
                    { ok: pwdStrength.hasLower,  text: 'Kichik harf (a-z)' },
                    { ok: pwdStrength.hasNumber, text: 'Raqam (0-9)' },
                  ].map(item => (
                    <div key={item.text} className="flex items-center gap-1.5">
                      {item.ok
                        ? <CheckCircle2 size={13} className="text-income shrink-0" />
                        : <XCircle size={13} className="text-expense shrink-0" />}
                      <span className={`text-xs font-medium ${item.ok ? 'text-income' : 'text-expense'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="label">
                {t('auth.confirmPassword', 'Parolni tasdiqlang')}
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pr-12"
                  required
                  placeholder="Parolni qaytaring"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
                  aria-label={showConfirm ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Yaratilmoqda...
                </span>
              ) : t('auth.registerButton', "Hisob yaratish")}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white dark:bg-dark-surface text-xs text-text-muted dark:text-dark-text-muted font-medium">
                {t('auth.orContinueWith', 'Yoki')}
              </span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-secondary w-full gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.continueWithGoogle', 'Google orqali kirish')}
          </button>

          <p className="mt-5 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
            {t('auth.alreadyHaveAccount', 'Hisobingiz bormi?')}{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              {t('auth.loginHere', 'Kirish')}
            </Link>
          </p>

          <div className="mt-4 flex justify-center gap-4">
            <Link to="/privacy" className="text-xs text-text-muted hover:text-primary transition-colors">
              Maxfiylik
            </Link>
            <span className="text-xs text-text-muted">·</span>
            <Link to="/terms" className="text-xs text-text-muted hover:text-primary transition-colors">
              Shartlar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
