import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import {
  Plus, Pencil, Trash2, Filter, Download, Search,
  TrendingUp, TrendingDown, X, ChevronLeft, ChevronRight,
  ArrowLeftRight, Repeat, Calendar, SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import TransactionModal from '../components/TransactionModal';
import { SegmentedControl } from '../components/ui';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => <div className={`skeleton ${className}`} />;
const TxSkeleton = () => (
  <div className="space-y-1">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3.5 px-1">
        <Sk className="w-11 h-11 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Sk className="h-4 w-40 rounded-xl" />
          <Sk className="h-3 w-24 rounded-xl" />
        </div>
        <Sk className="h-5 w-20 rounded-xl" />
      </div>
    ))}
  </div>
);

// ─── TxItem ───────────────────────────────────────────────────────────────────
const TxItem = ({ tx, formatCurrency, onEdit, onDelete }) => {
  const isIncome = tx.type === 'income';
  const dateStr  = tx.transaction_date
    ? format(new Date(tx.transaction_date), 'dd MMM, yyyy')
    : '';
  return (
    <div className="flex items-center gap-3 py-3.5 group rounded-2xl px-2 -mx-2
                    hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors duration-150">
      <div
        className="icon-wrap flex-shrink-0"
        style={{ backgroundColor: (tx.category_color || (isIncome ? '#16A34A' : '#EF4444')) + '18' }}
      >
        {isIncome
          ? <TrendingUp  size={18} className="text-income" />
          : <TrendingDown size={18} className="text-expense" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-text-primary dark:text-dark-text-primary truncate leading-tight">
          {tx.description || tx.category_name || (isIncome ? 'Daromad' : 'Xarajat')}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {tx.category_name && <span className="text-xs text-text-muted dark:text-dark-text-muted">{tx.category_name}</span>}
          {tx.category_name && dateStr && <span className="text-text-muted text-xs">·</span>}
          <span className="text-xs text-text-muted dark:text-dark-text-muted">{dateStr}</span>
          {tx.is_recurring && <span className="badge badge-primary"><Repeat size={9} /> Takroriy</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`text-[15px] font-bold num-display ${
          isIncome ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'
        }`}>
          {isIncome ? '+' : '−'}{formatCurrency(tx.amount)}
        </span>
        <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(tx)} className="btn-icon-xs btn-ghost" aria-label="Tahrirlash">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(tx.id)} className="btn-icon-xs btn-ghost text-expense" aria-label="O'chirish">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Summary card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color }) => (
  <div className="card p-3 text-center min-w-0 min-h-[80px] flex flex-col justify-center">
    <p className="card-label mb-1.5 text-[10px] sm:text-xs truncate">{label}</p>
    <p className={`text-xs sm:text-sm lg:text-base font-bold num-display break-all leading-tight ${color}`}>{value}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Transactions Page
// ═══════════════════════════════════════════════════════════════════════════════
const Transactions = () => {
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const { formatCurrency, formatAmount, currency } = useCurrency();

  const [viewMode, setViewMode]           = useState('transactions');
  const [transactions, setTransactions]   = useState([]);
  const [recurringList, setRecurringList] = useState([]);
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editingTx, setEditingTx]         = useState(null);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const ITEMS = 15;

  const [filters, setFilters] = useState({ type: '', category_id: '', start_date: '', end_date: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    setCurrentPage(1);
    fetchTransactions();
    fetchCategories();
    if (viewMode === 'recurring') fetchRecurring();
  }, [filters, currency, viewMode]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      params.append('display_currency', currency);
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions || res.data || []);
    } catch { toast.error(t('transactions.failedToLoad')); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await api.get('/categories'); setCategories(res.data); } catch {}
  };

  const fetchRecurring = async () => {
    try { setLoading(true); const res = await api.get('/recurring'); setRecurringList(Array.isArray(res.data) ? res.data : []); }
    catch { setRecurringList([]); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('transactions.deleteConfirm'))) return;
    try { await api.delete(`/transactions/${id}`); toast.success(t('transactions.transactionDeleted')); fetchTransactions(); }
    catch { toast.error(t('transactions.failedToDelete')); }
  };

  const handleModalClose = () => { setShowModal(false); setEditingTx(null); fetchTransactions(); };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get(`/reports/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.setAttribute('download', `transactions-${Date.now()}.csv`);
      document.body.appendChild(a); a.click(); a.remove();
      toast.success('Eksport qilindi');
    } catch { toast.error('Eksport qilishda xatolik'); }
  };

  const totalPages = Math.ceil(transactions.length / ITEMS);
  const paginated  = transactions.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);
  const income  = transactions.filter(t => t.type === 'income' ).reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const net = income - expense;

  const SEG = [
    { value: 'transactions', label: 'Tranzaksiyalar' },
    { value: 'recurring',    label: 'Takroriy' },
  ];

  const freqLabels = { daily: 'Kunlik', weekly: 'Haftalik', monthly: 'Oylik', yearly: 'Yillik' };

  return (
    <div className="space-y-4 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Tranzaksiyalar</h1>
        <div className="flex items-center gap-2">
          {viewMode === 'transactions' && (
            <>
              <button
                onClick={() => setFilterOpen(f => !f)}
                aria-label="Filter"
                className={`btn-icon ${hasFilters ? 'bg-primary text-white border-primary shadow-primary' : 'btn-secondary'}`}
              >
                <SlidersHorizontal size={18} />
              </button>
              <button onClick={handleExport} className="btn-icon btn-secondary" aria-label="Eksport">
                <Download size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => viewMode === 'transactions'
              ? (setEditingTx(null), setShowModal(true))
              : navigate('/recurring')
            }
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Qo'shish
          </button>
        </div>
      </div>

      {/* ── Segment ── */}
      <SegmentedControl options={SEG} value={viewMode} onChange={setViewMode} />

      {/* ─── TRANSACTIONS TAB ─── */}
      {viewMode === 'transactions' && (
        <>
          {!loading && transactions.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard label="Daromad" value={formatCurrency(income)}  color="text-income dark:text-income-dark" />
              <SummaryCard label="Xarajat" value={formatCurrency(expense)} color="text-expense dark:text-expense-dark" />
              <SummaryCard label="Balans"  value={formatCurrency(Math.abs(net))}
                color={net >= 0 ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'} />
            </div>
          )}

          {/* Filter panel */}
          {filterOpen && (
            <div className="card space-y-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <p className="font-bold text-text-primary dark:text-dark-text-primary">Filterlar</p>
                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button onClick={() => setFilters({ type: '', category_id: '', start_date: '', end_date: '' })}
                      className="text-sm text-primary font-semibold">
                      Tozalash
                    </button>
                  )}
                  <button onClick={() => setFilterOpen(false)} className="btn-icon-sm btn-ghost">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tur</label>
                  <select className="input" value={filters.type}
                    onChange={e => setFilters({ ...filters, type: e.target.value })}>
                    <option value="">Hammasi</option>
                    <option value="income">Daromad</option>
                    <option value="expense">Xarajat</option>
                  </select>
                </div>
                <div>
                  <label className="label">Kategoriya</label>
                  <select className="input" value={filters.category_id}
                    onChange={e => setFilters({ ...filters, category_id: e.target.value })}>
                    <option value="">Hammasi</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Boshlanish</label>
                  <input type="date" className="input" value={filters.start_date}
                    onChange={e => setFilters({ ...filters, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Tugash</label>
                  <input type="date" className="input" value={filters.end_date}
                    onChange={e => setFilters({ ...filters, end_date: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* List */}
          <div className="card">
            {loading ? <TxSkeleton /> : paginated.length > 0 ? (
              <>
                <div>
                  {paginated.map(tx => (
                    <TxItem key={tx.id} tx={tx} formatCurrency={formatCurrency}
                      onEdit={t => { setEditingTx(t); setShowModal(true); }}
                      onDelete={handleDelete} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border dark:border-dark-border">
                    <p className="text-sm text-text-muted dark:text-dark-text-muted">
                      {(currentPage - 1) * ITEMS + 1}–{Math.min(currentPage * ITEMS, transactions.length)} / {transactions.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1} className="btn-icon-sm btn-secondary disabled:opacity-40">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary w-12 text-center">
                        {currentPage} / {totalPages}
                      </span>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages} className="btn-icon-sm btn-secondary disabled:opacity-40">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <ArrowLeftRight size={20} className="text-text-muted dark:text-dark-text-muted" />
                </div>
                <p className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                  {hasFilters ? 'Natija topilmadi' : 'Tranzaksiyalar yo\'q'}
                </p>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-[220px] mb-5 leading-relaxed">
                  {hasFilters
                    ? 'Boshqa filter parametrlarini sinab ko\'ring'
                    : 'Birinchi daromad yoki xarajatingizni qo\'shib moliyangizni boshqarishni boshlang'}
                </p>
                {!hasFilters && (
                  <button onClick={() => { setEditingTx(null); setShowModal(true); }} className="btn btn-primary btn-sm">
                    <Plus size={16} /> Tranzaksiya qo'shish
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── RECURRING TAB ─── */}
      {viewMode === 'recurring' && (
        <div className="space-y-3">
          {loading ? (
            <div className="card"><TxSkeleton /></div>
          ) : recurringList.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Repeat size={20} className="text-text-muted dark:text-dark-text-muted" />
                </div>
                <p className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                  Takroriy tranzaksiyalar yo'q
                </p>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-[220px] mb-5 leading-relaxed">
                  Oylik to'lovlar, abonementlar va muntazam xarajatlarni qo'shing
                </p>
                <button onClick={() => navigate('/recurring')} className="btn btn-primary btn-sm">
                  <Plus size={16} /> Qo'shish
                </button>
              </div>
            </div>
          ) : recurringList.map(rec => {
            const isIncome = rec.type === 'income';
            return (
              <div key={rec.id} className="card">
                <div className="flex items-start gap-3">
                  <div className={`icon-wrap flex-shrink-0 ${
                    isIncome ? 'bg-income-muted dark:bg-income/10' : 'bg-expense-muted dark:bg-expense/10'
                  }`}>
                    {isIncome
                      ? <TrendingUp  size={18} className="text-income" />
                      : <TrendingDown size={18} className="text-expense" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                        {isIncome ? 'Daromad' : 'Xarajat'}
                      </span>
                      <span className="badge badge-primary">{freqLabels[rec.frequency] || rec.frequency}</span>
                      <span className={`badge ${rec.is_active ? 'badge-income' : 'badge-neutral'}`}>
                        {rec.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary num-display">
                      {formatAmount(rec.amount, rec.currency)}
                    </p>
                    {rec.category_name && (
                      <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-0.5">{rec.category_name}</p>
                    )}
                    {rec.description && (
                      <p className="text-sm text-text-muted dark:text-dark-text-muted">{rec.description}</p>
                    )}
                    <p className="text-xs text-text-muted dark:text-dark-text-muted mt-2 flex items-center gap-1">
                      <Calendar size={11} />
                      Keyingisi: {new Date(rec.next_occurrence).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => navigate(`/recurring?edit=${rec.id}`)} className="btn-icon-sm btn-secondary">
                      <Pencil size={14} />
                    </button>
                    <button onClick={async () => {
                      try { await api.patch(`/recurring/${rec.id}/toggle`); fetchRecurring(); } catch { toast.error('Xatolik'); }
                    }} className="btn-icon-sm btn-secondary">
                      {rec.is_active ? '🟢' : '⚪'}
                    </button>
                    <button onClick={async () => {
                      if (!confirm('O\'chirilsinmi?')) return;
                      try { await api.delete(`/recurring/${rec.id}`); fetchRecurring(); } catch { toast.error('Xatolik'); }
                    }} className="btn-icon-sm btn-ghost text-expense">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TransactionModal transaction={editingTx} categories={categories} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default Transactions;
