import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(null); // null = tekshirilmoqda

  // URL'da error param bo'lsa (OAuth redirect xato)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'google_auth_failed') {
      setError("Google orqali kirishda xatolik yuz berdi");
    } else if (urlError === 'oauth_not_configured') {
      setError("Google kirish hozircha sozlanmagan. Email va parol bilan kirish");
    }
  }, [searchParams]);

  // Google OAuth mavjudligini tekshir
  useEffect(() => {
    const checkOAuth = async () => {
      try {
        // HEAD so'rov bilan tekshirish — agar 503 bo'lsa, yo'q
        const res = await axios.get(`${API_BASE}/auth/config`).catch(() => null);
        if (res?.data?.googleOAuth === true) {
          setGoogleEnabled(true);
        } else {
          // /config endpoint yo'q bo'lsa, google enabled deb faraz qilmaymiz
          // Lekin avval environment variable bo'yicha tekshiramiz
          setGoogleEnabled(false);
        }
      } catch {
        setGoogleEnabled(false);
      }
    };
    checkOAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Double submit oldini olish
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result === true) {
        // Muvaffaqiyatli kirish
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        navigate('/dashboard', { replace: true });
      } else if (result?.error) {
        // Xato — inline ko'rsatish
        setError(result.error);
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
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

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg px-4 py-10"
      style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-primary">
            <span className="text-white font-bold text-3xl select-none">B</span>
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
            <LogIn size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">
              {t('auth.login', 'Kirish')}
            </h2>
          </div>

          {/* Xato xabar */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-2xl bg-expense-light dark:bg-red-950/30 text-expense text-sm font-medium flex items-start gap-2"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="label">
                {t('auth.email', 'Email')}
              </label>
              <input
                id="login-email"
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

            {/* Parol */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="label mb-0">
                  {t('auth.password', 'Parol')}
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  {t('auth.forgotPassword', 'Parolni unutdingizmi?')}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-12"
                  required
                  placeholder="••••••••"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Meni eslab qol */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-text-secondary dark:text-dark-text-secondary cursor-pointer select-none">
                {t('auth.rememberMe', 'Meni eslab qolish')}
              </label>
            </div>

            {/* Kirish tugmasi */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
              id="login-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Kirish...
                </span>
              ) : t('auth.loginButton', 'Kirish')}
            </button>
          </form>

          {/* Google OAuth — faqat mavjud bo'lsa ko'rsatish */}
          {googleEnabled !== false && (
            <>
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

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleEnabled === null}
                className="btn btn-secondary w-full gap-3"
                id="google-login-btn"
              >
                {googleEnabled === null ? (
                  <span className="w-4 h-4 border-2 border-border border-t-text-muted rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {t('auth.continueWithGoogle', 'Google orqali kirish')}
              </button>
            </>
          )}

          {/* Ro'yxatdan o'tish */}
          <p className="mt-5 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
            {t('auth.dontHaveAccount', "Hisob yo'qmi?")}{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              {t('auth.registerHere', "Ro'yxatdan o'tish")}
            </Link>
          </p>

          <div className="mt-4 flex justify-center gap-4">
            <Link to="/privacy" className="text-xs text-text-muted hover:text-primary transition-colors">Maxfiylik</Link>
            <span className="text-xs text-text-muted">·</span>
            <Link to="/terms" className="text-xs text-text-muted hover:text-primary transition-colors">Shartlar</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
