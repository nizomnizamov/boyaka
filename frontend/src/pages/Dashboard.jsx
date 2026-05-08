import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useDashboardData, useForecast } from '../hooks/useTransactions';
import {
  TrendingUp, TrendingDown, Wallet, Plus, ArrowRight,
  ArrowLeftRight, Target, ChevronRight,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import TransactionModal from '../components/TransactionModal';
import { SegmentedControl, TransactionItem } from '../components/ui';

// Skeleton loading
const Skeleton = ({ className }) => (
  <div className={`skeleton ${className}`} />
);

const DashSkeleton = () => (
  <div className="space-y-5 animate-fade-up">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-xl" />
        <Skeleton className="h-8 w-48 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-32 rounded-2xl" />
    </div>
    <Skeleton className="h-36 w-full rounded-3xl" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
    </div>
    <Skeleton className="h-64 w-full rounded-3xl" />
    <Skeleton className="h-48 w-full rounded-3xl" />
  </div>
);

// Chart soft palette
const CHART_COLORS = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899'];

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('month');
  const [txModalOpen, setTxModalOpen] = useState(false);

  const getDateRange = () => {
    const today = new Date();
    switch (viewMode) {
      case 'last30': {
        const ago = new Date(today.getTime() - 30 * 86400000);
        return { start: format(ago, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') };
      }
      case 'all':
        return { start: '2020-01-01', end: format(today, 'yyyy-MM-dd') };
      default:
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
    }
  };

  const dateRange = useMemo(getDateRange, [viewMode]);

  const { data: transactions = [], isLoading, refetch } = useDashboardData(dateRange);

  const stats = useMemo(() => {
    let income = 0, expense = 0;
    const cats = {};
    transactions.forEach(tx => {
      const amt = parseFloat(tx.amount || 0);
      if (tx.type === 'income') { income += amt; }
      else if (tx.type === 'expense') {
        expense += amt;
        const k = tx.category_name || 'Boshqa';
        if (!cats[k]) cats[k] = { name: k, color: tx.category_color || '#6B7280', total: 0 };
        cats[k].total += amt;
      }
    });
    return {
      income, expense,
      balance: income - expense,
      topCats: Object.values(cats).sort((a, b) => b.total - a.total).slice(0, 6),
    };
  }, [transactions]);

  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech';
  const firstName = user?.full_name?.split(' ')[0] || '';

  const SEG_OPTIONS = [
    { value: 'month', label: 'Bu oy' },
    { value: 'last30', label: '30 kun' },
    { value: 'all',   label: 'Hammasi' },
  ];

  if (isLoading) return <DashSkeleton />;

  const savingsRate = stats.income > 0
    ? Math.round((stats.balance / stats.income) * 100)
    : 0;

  // Donut chart colors
  const chartData = stats.topCats.map((c, i) => ({
    ...c,
    fill: c.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
            {greeting}{firstName ? `, ${firstName}` : ''} 👋
          </p>
          <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary tracking-tight mt-0.5">
            Bosh sahifa
          </h1>
        </div>
        <button
          onClick={() => setTxModalOpen(true)}
          className="btn-icon bg-primary text-white shadow-primary flex-shrink-0"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Period selector ── */}
      <SegmentedControl
        options={SEG_OPTIONS}
        value={viewMode}
        onChange={setViewMode}
      />

      {/* ── Balance card ── */}
      <div className="rounded-4xl p-6 bg-primary shadow-primary text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-4 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative">
          <p className="text-sm font-medium text-white/70 mb-1">Jami balans</p>
          <p className={`text-4xl font-bold tracking-tight num-display mb-5 ${stats.balance < 0 ? 'text-red-200' : 'text-white'}`}>
            {stats.balance >= 0 ? '' : '−'}{formatCurrency(Math.abs(stats.balance))}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={14} className="text-white/70" />
                <p className="text-xs font-medium text-white/70">Daromad</p>
              </div>
              <p className="text-lg font-bold num-display">{formatCurrency(stats.income)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={14} className="text-white/70" />
                <p className="text-xs font-medium text-white/70">Xarajat</p>
              </div>
              <p className="text-lg font-bold num-display">{formatCurrency(stats.expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats row ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Savings rate */}
        <div className="card py-4">
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1">Tejamkorlik</p>
          <p className={`text-2xl font-bold tracking-tight num-display ${
            savingsRate >= 0 ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'
          }`}>
            {savingsRate}%
          </p>
          <p className="text-xs text-text-muted dark:text-dark-text-muted mt-1">Daromaddan tejaldi</p>
        </div>

        {/* Tranzaksiyalar count */}
        <div className="card py-4">
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1">Tranzaksiyalar</p>
          <p className="text-2xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary num-display">
            {transactions.length}
          </p>
          <p className="text-xs text-text-muted dark:text-dark-text-muted mt-1">Ta amal</p>
        </div>
      </div>

      {/* ── Expense breakdown ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Xarajatlar taqsimoti</h2>
        </div>

        {chartData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Donut */}
            <div className="w-full sm:w-44 flex-shrink-0" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{
                      borderRadius: 12, border: 'none',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      fontSize: 13, fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2.5">
              {chartData.map((c, i) => {
                const pct = stats.expense > 0 ? Math.round((c.total / stats.expense) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.fill }} />
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary flex-1 truncate">{c.name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-text-muted dark:text-dark-text-muted">{pct}%</span>
                      <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary num-display">{formatCurrency(c.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-3">
              <TrendingDown size={22} className="text-text-muted dark:text-dark-text-muted" />
            </div>
            <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-1">Ma'lumot yo'q</p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary max-w-[200px]">
              Xarajat kiritganingizdan so'ng taqsimot shu yerda ko'rinadi
            </p>
          </div>
        )}
      </div>

      {/* ── Recent transactions ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">So'nggi amallar</h2>
          <Link to="/transactions"
            className="flex items-center gap-1 text-sm font-semibold text-primary dark:text-primary-dark">
            Hammasi <ChevronRight size={16} />
          </Link>
        </div>

        {recent.length > 0 ? (
          <div>
            {recent.map(tx => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                formatCurrency={formatCurrency}
                onClick={() => navigate('/transactions')}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-3">
              <ArrowLeftRight size={22} className="text-text-muted dark:text-dark-text-muted" />
            </div>
            <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-1">
              Tranzaksiyalar yo'q
            </p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary max-w-[220px] mb-5">
              Birinchi daromad yoki xarajatingizni qo'shib, moliyangizni boshqarishni boshlang
            </p>
            <button onClick={() => setTxModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Tranzaksiya qo'shish
            </button>
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/goals', icon: Target, label: 'Maqsadlar', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
          { to: '/budgets', icon: Wallet, label: 'Byudjet', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
          { to: '/reports', icon: TrendingUp, label: 'Hisobotlar', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="card flex flex-col items-center gap-2 py-5 text-center card-hover cursor-pointer">
            <div className={`icon-wrap ${item.color}`}>
              <item.icon size={20} />
            </div>
            <span className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Add Transaction Modal ── */}
      {txModalOpen && (
        <TransactionModal
          onClose={() => { setTxModalOpen(false); refetch?.(); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
