import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Eager load critical pages (auth, dashboard, transactions)
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

// Lazy load less frequently used pages (performance)
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const Recurring      = lazy(() => import('./pages/Recurring'));
const Goals          = lazy(() => import('./pages/Goals'));
const Categories     = lazy(() => import('./pages/Categories'));
const Budgets        = lazy(() => import('./pages/Budgets'));
const Reports        = lazy(() => import('./pages/Reports'));
const Family         = lazy(() => import('./pages/Family'));
const JoinFamily     = lazy(() => import('./pages/JoinFamily'));
const Profile        = lazy(() => import('./pages/Profile'));
const Admin          = lazy(() => import('./pages/Admin'));
const Strategy       = lazy(() => import('./pages/Strategy'));
const DebtBook       = lazy(() => import('./pages/DebtBook'));
const Business       = lazy(() => import('./pages/Business'));
const Privacy        = lazy(() => import('./pages/Privacy'));
const Terms          = lazy(() => import('./pages/Terms'));

// ─── Route Guards ─────────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// ─── Loading spinner ───────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">B</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Capacitor Android back button handler ─────────────────────────────────────
function CapacitorBackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let App;
    // Capacitor mavjud bo'lsa (Android native app)
    import('@capacitor/app').then(mod => {
      App = mod.App;
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          navigate(-1);
        } else {
          App.exitApp();
        }
      });
    }).catch(() => {
      // Web'da Capacitor yo'q — ignore
    });

    return () => {
      if (App) App.removeAllListeners();
    };
  }, [navigate]);

  return null;
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <Router>
              <CapacitorBackHandler />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-text)',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  },
                  success: {
                    duration: 3000,
                    style: { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
                  },
                  error: {
                    duration: 4000,
                    style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' },
                  },
                  loading: {
                    style: { background: '#eff6ff', color: '#1e40af', border: '1px solid #93c5fd' },
                  },
                }}
              />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
                  <Route path="/auth/callback"   element={<AuthCallback />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password"  element={<ResetPassword />} />
                  <Route path="/join-family"     element={<PrivateRoute><JoinFamily /></PrivateRoute>} />

                  {/* Legal pages — public, standalone layout */}
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms"   element={<Terms />} />

                  {/* Protected app routes */}
                  <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard"    element={<Dashboard />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="recurring"    element={<Recurring />} />
                    <Route path="goals"        element={<Goals />} />
                    <Route path="categories"   element={<Categories />} />
                    <Route path="budgets"      element={<Budgets />} />
                    <Route path="reports"      element={<Reports />} />
                    <Route path="family"       element={<Family />} />
                    <Route path="profile"      element={<Profile />} />
                    <Route path="admin"        element={<Admin />} />
                    <Route path="strategy"     element={<Strategy />} />
                    <Route path="debts"        element={<DebtBook />} />
                    <Route path="business"     element={<Business />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
