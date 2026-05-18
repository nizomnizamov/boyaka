import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Save, Eye, EyeOff, Shield, Settings2, Calendar, Hash } from 'lucide-react';
import CurrencySelector from '../components/CurrencySelector';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';

const Profile = () => {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();

  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfileData(res.data);
        const u = { ...user, created_at: res.data.created_at };
        setUser(u); localStorage.setItem('user', JSON.stringify(u));
      } catch (err) {
        if (err.response?.status !== 401) {
          toast.error(t('profile.loadError') || 'Profilni yuklab bo\'lmadi');
        }
      }
    };
    if (user) {
      setProfileForm({ full_name: user.full_name || '', email: user.email || '' });
      fetchProfile();
    }
  }, [user?.id]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await api.put('/profile', profileForm);
      const u = res.data.user;
      setUser(u); localStorage.setItem('user', JSON.stringify(u));
      toast.success(t('profile.updateSuccess') || 'Yangilandi!');
    } catch (err) {
      toast.error(err.response?.data?.error || t('profile.updateError'));
    } finally { setIsUpdatingProfile(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error(t('profile.passwordMismatch')); return; }
    if (passwordForm.newPassword.length < 6) { toast.error(t('profile.passwordTooShort')); return; }
    const isOAuth = user?.oauth_provider && user.oauth_provider !== 'local';
    if (!isOAuth && !passwordForm.currentPassword) { toast.error(t('profile.currentPasswordRequired')); return; }
    setIsChangingPassword(true);
    try {
      const res = await api.put('/profile/change-password', passwordForm);
      toast.success(res.data.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (isOAuth) { const u = { ...user, oauth_provider: 'local' }; setUser(u); localStorage.setItem('user', JSON.stringify(u)); }
    } catch (err) {
      toast.error(err.response?.data?.error || t('profile.passwordChangeError'));
    } finally { setIsChangingPassword(false); }
  };

  const isOAuth = user?.oauth_provider && user.oauth_provider !== 'local';

  return (
    <div className="space-y-5 animate-fade-up max-w-2xl mx-auto lg:max-w-none">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">{t('profile.title') || 'Profil'}</h1>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-0.5">
            {t('profile.subtitle') || 'Hisob va sozlamalarni boshqarish'}
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'mod') && (
          <Link to="/admin"
            className="btn btn-secondary btn-sm flex items-center gap-2">
            <Shield size={16} />
            {user?.role === 'admin' ? 'Admin' : 'Moderator'}
          </Link>
        )}
      </div>

      {/* ── Avatar + Info ── */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{user?.full_name}</p>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{user?.email}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-text-muted dark:text-dark-text-muted flex items-center gap-1">
              <Hash size={11} />#{user?.id}
            </span>
            {profileData?.created_at && (
              <span className="text-xs text-text-muted dark:text-dark-text-muted flex items-center gap-1">
                <Calendar size={11} />
                {new Date(profileData.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Profile Form ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="icon-wrap bg-primary-light dark:bg-blue-900/30">
              <User size={20} className="text-primary dark:text-blue-400" />
            </div>
            <h2 className="section-title">{t('profile.personalInfo') || 'Shaxsiy ma\'lumot'}</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="label">{t('profile.fullName') || 'To\'liq ism'}</label>
              <input type="text" className="input"
                value={profileForm.full_name}
                onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Ism Familiya"
                required minLength={2} maxLength={100} />
            </div>
            <div>
              <label className="label">{t('profile.email') || 'Email'}</label>
              <input type="email" className="input"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="email@example.com"
                required />
            </div>
            <button type="submit" disabled={isUpdatingProfile} className="btn btn-primary w-full">
              <Save size={18} />
              {isUpdatingProfile ? 'Saqlanmoqda...' : t('profile.updateProfile') || 'Saqlash'}
            </button>
          </form>
        </div>

        {/* ── Password Form ── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="icon-wrap bg-violet-50 dark:bg-violet-900/30">
              <Lock size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="section-title">{t('profile.changePassword') || 'Parol'}</h2>
          </div>

          {isOAuth && (
            <div className="mb-4 p-3 bg-primary-light dark:bg-blue-900/20 rounded-2xl">
              <p className="text-sm text-primary dark:text-blue-300">
                ℹ️ {t('profile.oauthPasswordInfo') || 'Google bilan kirgansiz. Parol o\'rnatishingiz mumkin.'}
              </p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {!isOAuth && (
              <div>
                <label className="label">Joriy parol</label>
                <div className="relative">
                  <input
                    type={showPwd.current ? 'text' : 'password'}
                    className="input pr-12"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                    {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="label">Yangi parol</label>
              <div className="relative">
                <input type={showPwd.new ? 'text' : 'password'}
                  className="input pr-12"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPwd.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-text-muted dark:text-dark-text-muted mt-1">Kamida 6 ta belgi</p>
            </div>
            <div>
              <label className="label">Parolni tasdiqlang</label>
              <div className="relative">
                <input type={showPwd.confirm ? 'text' : 'password'}
                  className="input pr-12"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isChangingPassword}
              className="w-full btn bg-violet-600 hover:bg-violet-700 text-white">
              <Lock size={18} />
              {isChangingPassword ? 'O\'zgartirilmoqda...' : t('profile.changePasswordBtn') || 'Parolni o\'zgartirish'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="icon-wrap bg-green-50 dark:bg-green-900/30">
            <Settings2 size={20} className="text-income dark:text-income-dark" />
          </div>
          <h2 className="section-title">{t('profile.preferences') || 'Sozlamalar'}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <p className="label">{t('common.currency') || 'Valyuta'}</p>
            <CurrencySelector />
          </div>
          <div>
            <p className="label">{t('profile.language') || 'Til'}</p>
            <LanguageSelector />
          </div>
          <div>
            <p className="label">{t('profile.theme') || 'Mavzu'}</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
