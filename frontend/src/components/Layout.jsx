import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  User,
  LogOut,
  X,
  Menu,
  Wallet,
  PieChart,
  BookOpen,
  Building2,
  Users,
  Shield,
  Repeat,
  ChevronRight,
} from 'lucide-react';

// ─── Bottom nav items (mobile) ────────────────────────────────────────────
const BOTTOM_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/transactions', icon: ArrowLeftRight,  labelKey: 'nav.transactions' },
  { to: '/goals',        icon: Target,           labelKey: 'nav.goals' },
  { to: '/reports',      icon: BarChart3,        labelKey: 'nav.reports' },
];

// ─── Sidebar nav items (desktop) ─────────────────────────────────────────
const SIDEBAR_MAIN = [
  { to: '/dashboard',    icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/transactions', icon: ArrowLeftRight,  labelKey: 'nav.transactions' },
  { to: '/debts',        icon: BookOpen,         labelKey: 'nav.debts' },
  { to: '/goals',        icon: Target,           labelKey: 'nav.goals' },
  { to: '/budgets',      icon: Wallet,           labelKey: 'nav.budgets' },
  { to: '/strategy',     icon: PieChart,         labelKey: 'nav.strategy' },
  { to: '/reports',      icon: BarChart3,        labelKey: 'nav.reports' },
];

const SIDEBAR_OTHER = [
  { to: '/business',     icon: Building2,        labelKey: 'nav.business' },
  { to: '/family',       icon: Users,            labelKey: 'nav.family' },
  { to: '/profile',      icon: User,             labelKey: 'nav.profile' },
];

// ─── Sidebar NavLink ───────────────────────────────────────────────────────
const SideNavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl mb-0.5 transition-all duration-150 text-[14px] font-semibold ${
        isActive
          ? 'bg-primary-light dark:bg-blue-950/60 text-primary dark:text-blue-400'
          : 'text-text-secondary dark:text-dark-text-secondary hover:bg-surface-2 dark:hover:bg-dark-surface-2 hover:text-text-primary dark:hover:text-dark-text-primary'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={18} className={isActive ? 'text-primary dark:text-blue-400' : ''} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

// ─── Mobile More Modal ─────────────────────────────────────────────────────
const MoreMenu = ({ isOpen, onClose, user, logout, t }) => {
  if (!isOpen) return null;
  const moreItems = [
    { to: '/debts',    icon: BookOpen,   label: t('nav.debts') },
    { to: '/budgets',  icon: Wallet,     label: t('nav.budgets') },
    { to: '/strategy', icon: PieChart,   label: t('nav.strategy') },
    { to: '/business', icon: Building2,  label: t('nav.business') },
    { to: '/family',   icon: Users,      label: t('nav.family') },
    { to: '/profile',  icon: User,       label: t('nav.profile') },
  ];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-surface rounded-t-4xl shadow-soft-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideSheet 0.28s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-border dark:bg-dark-border rounded-full" />
        </div>

        {/* User info */}
        <div className="px-5 pt-4 pb-3 border-b border-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary dark:text-dark-text-primary truncate">{user?.full_name}</p>
              <p className="text-xs text-text-muted dark:text-dark-text-muted truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-4 py-3 grid grid-cols-2 gap-1">
          {moreItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-[14px] font-semibold transition-all ${
                  isActive
                    ? 'bg-primary-light dark:bg-blue-950/50 text-primary dark:text-blue-400'
                    : 'text-text-primary dark:text-dark-text-primary hover:bg-surface-2 dark:hover:bg-dark-surface-2'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-primary' : 'text-text-secondary dark:text-dark-text-secondary'} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <div className="px-4 pb-4 pt-1 border-t border-border dark:border-dark-border">
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-expense rounded-2xl hover:bg-expense-light dark:hover:bg-red-950/30 transition-colors font-semibold text-sm"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </div>

        <div className="pb-safe h-2" />
      </div>
    </div>
  );
};

// ─── Bottom Navigation Bar ─────────────────────────────────────────────────
const BottomNav = ({ t, onMoreClick }) => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border dark:border-dark-border">
      <div className="flex items-stretch">
        {BOTTOM_NAV.map(item => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all"
            >
              {({ isActive: navActive }) => (
                <>
                  <div className={`w-12 h-7 flex items-center justify-center rounded-full transition-all duration-150 ${
                    navActive ? 'bg-primary-light dark:bg-blue-950/60' : ''
                  }`}>
                    <item.icon
                      size={20}
                      className={navActive ? 'text-primary dark:text-blue-400' : 'text-text-muted dark:text-dark-text-muted'}
                      strokeWidth={navActive ? 2.5 : 1.75}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors ${
                    navActive ? 'text-primary dark:text-blue-400' : 'text-text-muted dark:text-dark-text-muted'
                  }`}>
                    {t(item.labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More button */}
        <button
          onClick={onMoreClick}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1"
        >
          <div className="w-12 h-7 flex items-center justify-center">
            <Menu size={20} className="text-text-muted dark:text-dark-text-muted" strokeWidth={1.75} />
          </div>
          <span className="text-[10px] font-semibold text-text-muted dark:text-dark-text-muted">{t('nav.more')}</span>
        </button>
      </div>
      <div className="pb-safe" />
    </nav>
  );
};

// ─── Layout ────────────────────────────────────────────────────────────────
const Layout = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-white dark:bg-dark-surface border-r border-border dark:border-dark-border z-30">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-border dark:border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7h2v2.5z" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-text-primary dark:text-dark-text-primary tracking-tight">
              Boyaka
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll">
          <div className="mb-4">
            <p className="text-[11px] font-bold text-text-muted dark:text-dark-text-muted uppercase tracking-wider px-3.5 mb-1.5">
              Asosiy
            </p>
            {SIDEBAR_MAIN.map(item => (
              <SideNavItem key={item.to} to={item.to} icon={item.icon} label={t(item.labelKey)} />
            ))}
          </div>
          <div>
            <p className="text-[11px] font-bold text-text-muted dark:text-dark-text-muted uppercase tracking-wider px-3.5 mb-1.5">
              Boshqa
            </p>
            {SIDEBAR_OTHER.map(item => (
              <SideNavItem key={item.to} to={item.to} icon={item.icon} label={t(item.labelKey)} />
            ))}
          </div>
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-border dark:border-dark-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors mb-1 cursor-default">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary truncate">{user?.full_name}</p>
              <p className="text-[11px] text-text-muted dark:text-dark-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-expense rounded-2xl hover:bg-expense-light dark:hover:bg-red-950/30 transition-colors text-sm font-semibold"
          >
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="lg:ml-60 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 mb-nav lg:mb-0 animate-fade-up">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <BottomNav t={t} onMoreClick={() => setMoreOpen(true)} />

      {/* ── More Menu Sheet ── */}
      <MoreMenu
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        user={user}
        logout={logout}
        t={t}
      />
    </div>
  );
};

export default Layout;
