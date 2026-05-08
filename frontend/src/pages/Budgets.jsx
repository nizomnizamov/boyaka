import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import {
  Plus, Trash2, Edit2, Wallet,
  TrendingDown, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BudgetModal from '../components/BudgetModal';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => <div className={`skeleton ${className}`} />;

const BudgetSkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="card space-y-3">
        <div className="flex items-center gap-3">
          <Sk className="w-11 h-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Sk className="h-4 w-32" />
            <Sk className="h-3 w-48" />
          </div>
          <Sk className="h-5 w-14" />
        </div>
        <Sk className="h-2 w-full rounded-full" />
      </div>
    ))}
  </div>
);

// ─── Status helper ────────────────────────────────────────────────────────────
const getBudgetStatus = (pct) => {
  if (pct >= 100) return { chip: 'chip-danger',   label: 'Oshib ketdi',     barColor: 'bg-expense', icon: AlertTriangle, iconColor: 'text-expense' };
  if (pct >= 80)  return { chip: 'chip-warning',  label: 'Yaqinlashmoqda', barColor: 'bg-warning', icon: TrendingDown,  iconColor: 'text-warning' };
  return               { chip: 'chip-success',  label: 'Yaxshi',          barColor: 'bg-income',  icon: CheckCircle,   iconColor: 'text-income'  };
};

// ─── Month navigator ──────────────────────────────────────────────────────────
const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const MonthNav = ({ month, year, onChange }) => {
  const prev = () => { month === 1 ? onChange(12, year - 1) : onChange(month - 1, year); };
  const next = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    month === 12 ? onChange(1, year + 1) : onChange(month + 1, year);
  };
  const isMax = () => {
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  };
  return (
    <div className="flex items-center gap-2">
      <button onClick={prev} className="btn-icon-sm btn-secondary" aria-label="Oldingi oy">
        <ChevronLeft size={16} />
      </button>
      <div className="px-5 py-2 rounded-2xl bg-surface-2 dark:bg-dark-surface-2 min-w-[148px] text-center">
        <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
          {MONTHS_UZ[month - 1]} {year}
        </span>
      </div>
      <button onClick={next} disabled={isMax()} className="btn-icon-sm btn-secondary disabled:opacity-40" aria-label="Keyingi oy">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ─── BudgetCard ───────────────────────────────────────────────────────────────
const BudgetCard = ({ budget, formatCurrency, onEdit, onDelete }) => {
  const amount    = parseFloat(budget.amount || 0);
  const spent     = parseFloat(budget.spent  || 0);
  const remaining = amount - spent;
  const rawPct    = amount > 0 ? (spent / amount) * 100 : 0;
  const pct       = Math.min(rawPct, 100);
  const status    = getBudgetStatus(rawPct);
  const StatusIcon = status.icon;

  return (
    <div className="card space-y-3.5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: budget.category_color || '#6B7280' }}
        >
          {budget.category_name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-text-primary dark:text-dark-text-primary truncate">
              {budget.category_name}
            </p>
            <span className={`chip ${status.chip}`}>
              <StatusIcon size={10} />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-text-muted dark:text-dark-text-muted mt-0.5 num-display">
            {formatCurrency(spent)} / {formatCurrency(amount)} sarflandi
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(budget)} className="btn-icon-sm btn-ghost" aria-label="Tahrirlash">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(budget.id)} className="btn-icon-sm btn-ghost text-expense" aria-label="O'chirish">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="h-2 rounded-full overflow-hidden bg-surface-2 dark:bg-dark-surface-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${status.barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-text-muted dark:text-dark-text-muted">{rawPct.toFixed(0)}% sarflandi</span>
          <span className={`text-xs font-semibold num-display ${
            remaining >= 0 ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'
          }`}>
            {remaining >= 0 ? `${formatCurrency(remaining)} qoldi` : `${formatCurrency(Math.abs(remaining))} oshdi`}
          </span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Budgets Page
// ═══════════════════════════════════════════════════════════════════════════════
const Budgets = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency: currentCurrency } = useCurrency();

  const [budgets, setBudgets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/budgets?month=${selectedMonth}&year=${selectedYear}&currency=${currentCurrency}`);
      setBudgets(res.data);
    } catch { toast.error(t('budgets.failedToLoad')); }
    finally { setLoading(false); }
  }, [selectedMonth, selectedYear, currentCurrency, t]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('budgets.deleteConfirm'))) return;
    try { await api.delete(`/budgets/${id}`); toast.success(t('budgets.budgetDeleted')); fetchBudgets(); }
    catch { toast.error(t('budgets.failedToDelete')); }
  };

  const handleModalClose = () => { setShowModal(false); setEditingBudget(null); fetchBudgets(); };

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpent  = budgets.reduce((s, b) => s + parseFloat(b.spent  || 0), 0);
  const totalRemain = totalBudget - totalSpent;
  const overallPct  = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overStatus  = getBudgetStatus(overallPct);

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('budgets.title')}</h1>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-0.5">
            Xarajatlaringizni nazorat qiling
          </p>
        </div>
        <button
          onClick={() => { setEditingBudget(null); setShowModal(true); }}
          className="btn btn-primary btn-sm flex-shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} /> Byudjet
        </button>
      </div>

      {/* ── Month navigator ── */}
      <div className="flex justify-center">
        <MonthNav
          month={selectedMonth}
          year={selectedYear}
          onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
        />
      </div>

      {/* ── Content ── */}
      {loading ? <BudgetSkeleton /> : budgets.length === 0 ? (

        /* Empty */
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Wallet size={22} className="text-text-muted dark:text-dark-text-muted" />
            </div>
            <p className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">
              Bu oyda byudjet yo'q
            </p>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-[220px] mb-5 leading-relaxed">
              Har bir kategoriya uchun limit belgilang va xarajatlaringizni nazorat qiling
            </p>
            <button onClick={() => { setEditingBudget(null); setShowModal(true); }} className="btn btn-primary btn-sm">
              <Plus size={16} /> Byudjet yaratish
            </button>
          </div>
        </div>

      ) : (
        <>
          {/* ── Overall summary ── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="card-label">Umumiy byudjet</p>
                <p className="section-title mt-0.5">{MONTHS_UZ[selectedMonth - 1]} {selectedYear}</p>
              </div>
              <span className={`chip ${overStatus.chip}`}>{overallPct.toFixed(0)}% sarflandi</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Limit',     value: formatCurrency(totalBudget), color: 'text-text-primary dark:text-dark-text-primary' },
                { label: 'Sarflandi', value: formatCurrency(totalSpent),  color: 'text-expense dark:text-expense-dark' },
                { label: 'Qoldi',     value: totalRemain >= 0 ? formatCurrency(totalRemain) : `−${formatCurrency(Math.abs(totalRemain))}`,
                  color: totalRemain >= 0 ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark' },
              ].map(s => (
                <div key={s.label} className="bg-surface-2 dark:bg-dark-surface-2 rounded-2xl p-3 text-center">
                  <p className="card-label mb-1">{s.label}</p>
                  <p className={`text-sm font-bold num-display ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="h-2 rounded-full overflow-hidden bg-surface-2 dark:bg-dark-surface-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${overStatus.barColor}`}
                style={{ width: `${Math.min(overallPct, 100)}%` }}
              />
            </div>
          </div>

          {/* ── Budget cards ── */}
          <div className="space-y-3">
            {budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                formatCurrency={formatCurrency}
                onEdit={(b) => { setEditingBudget(b); setShowModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {showModal && (
        <BudgetModal month={selectedMonth} year={selectedYear} budget={editingBudget} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default Budgets;
