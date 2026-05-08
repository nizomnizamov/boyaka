import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useTransactions';
import {
  TrendingUp, TrendingDown, Plus, ArrowLeftRight,
  Target, Wallet, BarChart3, ChevronRight, Percent,
  Hash, PieChart as PieIcon,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import TransactionModal from '../components/TransactionModal';
import { SegmentedControl } from '../components/ui';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => <div className={`skeleton ${className}`} />;

const DashSkeleton = () => (
  <div className="space-y-4 animate-fade-up px-0">
    {/* header */}
    <div className="flex justify-between items-start pt-1">
      <div className="space-y-2">
        <Sk className="h-4 w-36 rounded-xl" />
        <Sk className="h-7 w-28 rounded-xl" />
      </div>
    </div>
    {/* segmented */}
    <Sk className="h-10 w-full rounded-2xl" />
    {/* hero card */}
    <Sk className="h-48 w-full rounded-4xl" />
    {/* quick stats */}
    <div className="grid grid-cols-2 gap-3">
      <Sk className="h-24 rounded-3xl" />
      <Sk className="h-24 rounded-3xl" />
    </div>
    {/* chart */}
    <Sk className="h-52 w-full rounded-3xl" />
    {/* txs */}
    <Sk className="h-48 w-full rounded-3xl" />
  </div>
);

// ─── Chart colors ──────────────────────────────────────────────────────────────
const CHART_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#8B5CF6',
  '#EF4444','#06B6D4','#EC4899','#14B8A6',
];

// ─── FloatingAddButton ─────────────────────────────────────────────────────────
const FloatingAddButton = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Tranzaksiya qo'shish"
    className="lg:hidden fixed z-30 right-5 flex items-center justify-center
               w-14 h-14 rounded-full bg-primary text-white
               shadow-[0_4px_20px_rgba(37,99,235,0.40)]
               active:scale-95 transition-transform duration-150"
    style={{ bottom: 'calc(68px + env(safe-area-inset-bottom) + 16px)' }}
  >
    <Plus size={24} strokeWidth={2.5} />
  </button>
);

// ─── BalanceHeroCard ───────────────────────────────────────────────────────────
const BalanceHeroCard = ({ balance, income, expense, formatCurrency }) => {
  const isNegative = balance < 0;
  return (
    <div
      className="rounded-4xl overflow-hidden"
      style={{
        background: 'linear-gradient(150deg, #1e40af 0%, #2563eb 55%, #3b82f6 100%)',
        boxShadow: '0 8px 32px rgba(37,99,235,0.28)',
      }}
    >
      {/* Top: balance */}
      <div className="px-6 pt-7 pb-5">
        <p className="text-[13px] font-medium text-blue-200/80 mb-2 tracking-wide uppercase">
          Jami balans
        </p>
        <p className={`text-[2.6rem] font-bold tracking-tight num-display leading-none ${
          isNegative ? 'text-red-300' : 'text-white'
        }`}>
          {isNegative ? '−' : ''}{formatCurrency(Math.abs(balance))}
        </p>
      </div>

      {/* Bottom: income / expense sub-cards */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        {/* Income */}
        <div
          className="rounded-3xl px-4 py-3.5"
          style={{ background: 'rgba(255,255,255,0.10)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-emerald-400/25 flex items-center justify-center">
              <TrendingUp size={11} className="text-emerald-300" strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-semibold text-blue-100/70 uppercase tracking-wider">
              Daromad
            </p>
          </div>
          <p className="text-[1.15rem] font-bold text-white num-display leading-tight">
            {formatCurrency(income)}
          </p>
        </div>

        {/* Expense */}
        <div
          className="rounded-3xl px-4 py-3.5"
          style={{ background: 'rgba(255,255,255,0.10)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-red-400/25 flex items-center justify-center">
              <TrendingDown size={11} className="text-red-300" strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-semibold text-blue-100/70 uppercase tracking-wider">
              Xarajat
            </p>
          </div>
          <p className="text-[1.15rem] font-bold text-white num-display leading-tight">
            {formatCurrency(expense)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, valueColor, sub }) => (
  <div className="card py-4 px-4 flex flex-col gap-1">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 ${iconBg}`}>
      <Icon size={15} className={iconColor} strokeWidth={2.5} />
    </div>
    <p className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wide">
      {label}
    </p>
    <p className={`text-2xl font-bold tracking-tight num-display leading-none ${valueColor}`}>
      {value}
    </p>
    <p className="text-[11px] text-text-muted dark:text-dark-text-muted mt-0.5">{sub}</p>
  </div>
);

// ─── SectionCard ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, action, children }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyBlock = ({ icon: Icon, title, desc, cta }) => (
  <div className="flex flex-col items-center text-center py-9">
    <div className="w-12 h-12 rounded-2xl bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-3">
      <Icon size={20} className="text-text-muted dark:text-dark-text-muted" />
    </div>
    <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-1">{title}</p>
    <p className="text-xs text-text-secondary dark:text-dark-text-secondary max-w-[200px] leading-relaxed mb-4">
      {desc}
    </p>
    {cta}
  </div>
);

// ─── RecentTxItem ─────────────────────────────────────────────────────────────
const RecentTxItem = ({ tx, formatCurrency, onClick }) => {
  const isIncome = tx.type === 'income';
  const dateStr = tx.transaction_date
    ? new Date(tx.transaction_date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
    : '';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 hover:bg-surface-2 dark:hover:bg-dark-surface-2
                 rounded-2xl px-2 -mx-2 transition-colors duration-150 text-left"
    >
      {/* Category dot indicator */}
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: tx.category_color
            ? tx.category_color + '18'
            : isIncome ? '#F0FDF4' : '#FEF2F2',
        }}
      >
        {isIncome
          ? <TrendingUp size={16} className="text-income" />
          : <TrendingDown size={16} className="text-expense" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-primary dark:text-dark-text-primary truncate leading-tight">
          {tx.description || tx.category_name || (isIncome ? 'Daromad' : 'Xarajat')}
        </p>
        <p className="text-[11px] text-text-muted dark:text-dark-text-muted mt-0.5">
          {[tx.category_name, dateStr].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Amount */}
      <span className={`text-[14px] font-bold num-display flex-shrink-0 ${
        isIncome ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'
      }`}>
        {isIncome ? '+' : '−'}{formatCurrency(tx.amount)}
      </span>
    </button>
  );
};

// ─── Quick links ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { to: '/goals',   icon: Target,   label: 'Maqsadlar', bg: 'bg-violet-50 dark:bg-violet-900/20', color: 'text-violet-600 dark:text-violet-400' },
  { to: '/budgets', icon: Wallet,   label: 'Byudjet',   bg: 'bg-amber-50 dark:bg-amber-900/20',   color: 'text-amber-600 dark:text-amber-400'  },
  { to: '/reports', icon: BarChart3,label: 'Hisobot',   bg: 'bg-blue-50 dark:bg-blue-900/20',     color: 'text-blue-600 dark:text-blue-400'    },
];

// ─── Donut tooltip ────────────────────────────────────────────────────────────
const DonutTooltip = ({ active, payload, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border
                    rounded-2xl shadow-soft-lg px-4 py-2.5 text-sm font-semibold">
      <p className="text-text-secondary dark:text-dark-text-secondary text-xs mb-0.5">{d.name}</p>
      <p className="text-text-primary dark:text-dark-text-primary">{formatCurrency(d.value)}</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('month');
  const [txModalOpen, setTxModalOpen] = useState(false);

  // ── Date range ──
  const dateRange = useMemo(() => {
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
          end:   format(endOfMonth(today),   'yyyy-MM-dd'),
        };
    }
  }, [viewMode]);

  const { data: transactions = [], isLoading, refetch } = useDashboardData(dateRange);

  // ── Stats ──
  const stats = useMemo(() => {
    let income = 0, expense = 0;
    const cats = {};
    transactions.forEach(tx => {
      const amt = parseFloat(tx.amount || 0);
      if (tx.type === 'income') {
        income += amt;
      } else if (tx.type === 'expense') {
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

  const recent   = useMemo(() => transactions.slice(0, 5), [transactions]);
  const chartData = stats.topCats.map((c, i) => ({ ...c, fill: c.color || CHART_COLORS[i % CHART_COLORS.length] }));
  const savingsRate = stats.income > 0 ? Math.round((stats.balance / stats.income) * 100) : 0;

  // ── Greeting ──
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech';
  const firstName = user?.full_name?.split(' ')[0] || '';

  const SEG_OPTIONS = [
    { value: 'month',  label: 'Bu oy'   },
    { value: 'last30', label: '30 kun'  },
    { value: 'all',    label: 'Hammasi' },
  ];

  if (isLoading) return <DashSkeleton />;

  return (
    <div className="space-y-4 animate-fade-up">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-[13px] font-medium text-text-muted dark:text-dark-text-muted">
            {greeting}{firstName ? `, ${firstName}` : ''} 👋
          </p>
          <h1 className="text-[1.6rem] font-bold text-text-primary dark:text-dark-text-primary tracking-tight mt-0.5 leading-tight">
            Bosh sahifa
          </h1>
        </div>

        {/* Desktop + button */}
        <button
          onClick={() => setTxModalOpen(true)}
          className="hidden lg:flex items-center gap-2 btn btn-primary btn-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          Qo'shish
        </button>
      </div>

      {/* ── Period selector ─────────────────────────────────────────────── */}
      <SegmentedControl options={SEG_OPTIONS} value={viewMode} onChange={setViewMode} />

      {/* ── Balance Hero Card ────────────────────────────────────────────── */}
      <BalanceHeroCard
        balance={stats.balance}
        income={stats.income}
        expense={stats.expense}
        formatCurrency={formatCurrency}
      />

      {/* ── Quick Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Percent}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-income dark:text-income-dark"
          label="Tejamkorlik"
          value={`${savingsRate}%`}
          valueColor={savingsRate >= 0 ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'}
          sub="Daromaddan tejaldi"
        />
        <StatCard
          icon={Hash}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-primary dark:text-blue-400"
          label="Tranzaksiyalar"
          value={transactions.length}
          valueColor="text-text-primary dark:text-dark-text-primary"
          sub="Ta amal"
        />
      </div>

      {/* ── Expense Distribution ─────────────────────────────────────────── */}
      <SectionCard title="Xarajatlar taqsimoti">
        {chartData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Donut */}
            <div className="w-full sm:w-44 flex-shrink-0" style={{ height: 176 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78}
                    paddingAngle={2}
                    startAngle={90} endAngle={-270}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip formatCurrency={formatCurrency} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2">
              {chartData.map((c, i) => {
                const pct = stats.expense > 0 ? Math.round((c.total / stats.expense) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.fill }} />
                    <p className="text-[13px] font-medium text-text-primary dark:text-dark-text-primary flex-1 truncate">
                      {c.name}
                    </p>
                    <span className="text-[11px] font-semibold text-text-muted dark:text-dark-text-muted w-8 text-right">
                      {pct}%
                    </span>
                    <span className="text-[13px] font-bold text-text-primary dark:text-dark-text-primary num-display w-24 text-right">
                      {formatCurrency(c.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyBlock
            icon={PieIcon}
            title="Xarajatlar hali yo'q"
            desc="Xarajat qo'shganingizdan so'ng taqsimot shu yerda chiqadi"
            cta={
              <button
                onClick={() => setTxModalOpen(true)}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> Xarajat qo'shish
              </button>
            }
          />
        )}
      </SectionCard>

      {/* ── Recent Transactions ──────────────────────────────────────────── */}
      <SectionCard
        title="So'nggi amallar"
        action={
          <Link
            to="/transactions"
            className="flex items-center gap-0.5 text-[13px] font-semibold text-primary dark:text-blue-400"
          >
            Hammasi <ChevronRight size={15} />
          </Link>
        }
      >
        {recent.length > 0 ? (
          <div className="divide-y divide-border/50 dark:divide-dark-border/50 -mt-1">
            {recent.map(tx => (
              <RecentTxItem
                key={tx.id}
                tx={tx}
                formatCurrency={formatCurrency}
                onClick={() => navigate('/transactions')}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock
            icon={ArrowLeftRight}
            title="Tranzaksiyalar yo'q"
            desc="Birinchi daromad yoki xarajatingizni qo'shib, moliyangizni boshqarishni boshlang"
            cta={
              <button onClick={() => setTxModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={14} /> Qo'shish
              </button>
            }
          />
        )}
      </SectionCard>

      {/* ── Quick Links ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_LINKS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="card flex flex-col items-center gap-2.5 py-5 text-center card-hover cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.bg}`}>
              <item.icon size={19} className={item.color} />
            </div>
            <span className="text-[12px] font-semibold text-text-primary dark:text-dark-text-primary">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Floating Action Button (mobile) ─────────────────────────────── */}
      <FloatingAddButton onClick={() => setTxModalOpen(true)} />

      {/* ── Transaction Modal ────────────────────────────────────────────── */}
      {txModalOpen && (
        <TransactionModal
          onClose={() => { setTxModalOpen(false); refetch?.(); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
