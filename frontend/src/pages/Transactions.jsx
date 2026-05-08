import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import {
  Plus, Pencil, Trash2, Filter, Download, Search,
  TrendingUp, TrendingDown, X, ChevronLeft, ChevronRight,
  ArrowLeftRight, Repeat, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import TransactionModal from '../components/TransactionModal';
import { SegmentedControl } from '../components/ui';

const Skeleton = ({ className }) => <div className={`skeleton ${className}`} />;

const TxSkeleton = () => (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <Skeleton className="w-11 h-11 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

const Transactions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency, formatAmount, currency } = useCurrency();

  const [viewMode, setViewMode] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [recurringList, setRecurringList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 15;

  const [filters, setFilters] = useState({
    type: '', category_id: '', start_date: '', end_date: '',
  });

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
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch {}
  };

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recurring');
      setRecurringList(Array.isArray(res.data) ? res.data : []);
    } catch { setRecurringList([]); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('transactions.deleteConfirm'))) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success(t('transactions.transactionDeleted'));
      fetchTransactions();
    } catch { toast.error(t('transactions.failedToDelete')); }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get(`/reports/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.setAttribute('download', `transactions-${Date.now()}.csv`);
      document.body.appendChild(a); a.click(); a.remove();
      toast.success('Eksport qilindi');
    } catch { toast.error('Eksport qilishda xatolik'); }
  };

  // Pagination
  const totalPages = Math.ceil(transactions.length / ITEMS);
  const paginated = transactions.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);

  // Summary
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  const SEG = [
    { value: 'transactions', label: 'Tranzaksiyalar' },
    { value: 'recurring', label: 'Takroriy' },
  ];

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Tranzaksiyalar</h1>
        <div className="flex items-center gap-2">
          {viewMode === 'transactions' && (
            <>
              <button onClick={() => setFilterOpen(f => !f)}
                className={`btn-icon ${hasFilters ? 'bg-primary text-white' : 'btn-secondary'}`}>
                <Filter size={18} />
              </button>
              <button onClick={handleExport} className="btn-icon btn-secondary">
                <Download size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => viewMode === 'transactions'
              ? (setEditingTransaction(null), setShowModal(true))
              : navigate('/recurring')
            }
            className="btn btn-primary btn-sm">
            <Plus size={18} strokeWidth={2.5} />
            Qo'shish
          </button>
        </div>
      </div>

      {/* ── Segment ── */}
      <SegmentedControl options={SEG} value={viewMode} onChange={setViewMode} />

      {/* ── Summary cards (transactions tab) ── */}
      {viewMode === 'transactions' && !loading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card py-3 text-center">
            <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1">Daromad</p>
            <p className="text-base font-bold text-income dark:text-income-dark num-display">{formatCurrency(income)}</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1">Xarajat</p>
            <p className="text-base font-bold text-expense dark:text-expense-dark num-display">{formatCurrency(expense)}</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1">Jami</p>
            <p className={`text-base font-bold num-display ${income - expense >= 0 ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'}`}>
              {formatCurrency(Math.abs(income - expense))}
            </p>
          </div>
        </div>
      )}

      {/* ── Filter panel ── */}
      {filterOpen && viewMode === 'transactions' && (
        <div className="card space-y-3 animate-fade-up">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">Filter</h3>
            {hasFilters && (
              <button onClick={() => setFilters({ type: '', category_id: '', start_date: '', end_date: '' })}
                className="text-sm text-primary dark:text-primary-dark font-semibold">
                Tozalash
              </button>
            )}
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
              <label className="label">Boshlanish sanasi</label>
              <input type="date" className="input" value={filters.start_date}
                onChange={e => setFilters({ ...filters, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Tugash sanasi</label>
              <input type="date" className="input" value={filters.end_date}
                onChange={e => setFilters({ ...filters, end_date: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* ── Transactions list ── */}
      {viewMode === 'transactions' && (
        <div className="card">
          {loading ? <TxSkeleton /> : paginated.length > 0 ? (
            <>
              <div className="divide-y divide-border dark:divide-dark-border">
                {paginated.map(tx => {
                  const isIncome = tx.type === 'income';
                  const dateStr = tx.transaction_date
                    ? format(new Date(tx.transaction_date), 'dd MMM, yyyy')
                    : '';
                  return (
                    <div key={tx.id}
                      className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 group">
                      {/* Icon */}
                      <div className="icon-wrap flex-shrink-0"
                        style={{ backgroundColor: (tx.category_color || '#6B7280') + '18' }}>
                        {tx.category_icon
                          ? <span className="text-lg">{tx.category_icon}</span>
                          : isIncome
                            ? <TrendingUp size={18} className="text-income" />
                            : <TrendingDown size={18} className="text-expense" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-text-primary dark:text-dark-text-primary truncate">
                          {tx.description || tx.category_name || (isIncome ? 'Daromad' : 'Xarajat')}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tx.category_name && (
                            <span className="text-xs font-medium text-text-muted dark:text-dark-text-muted">
                              {tx.category_name}
                            </span>
                          )}
                          {tx.category_name && dateStr && <span className="text-text-muted dark:text-dark-text-muted text-xs">·</span>}
                          <span className="text-xs text-text-muted dark:text-dark-text-muted">{dateStr}</span>
                          {tx.is_recurring && (
                            <span className="badge badge-primary text-[10px]"><Repeat size={10} /> Takroriy</span>
                          )}
                        </div>
                      </div>

                      {/* Amount + Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[15px] font-bold num-display ${
                          isIncome ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'
                        }`}>
                          {isIncome ? '+' : '−'}{formatCurrency(tx.amount)}
                        </span>
                        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTransaction(tx); setShowModal(true); }}
                            className="btn-icon-sm btn-ghost">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(tx.id)}
                            className="btn-icon-sm btn-ghost text-expense">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {/* Mobile always visible */}
                        <div className="flex sm:hidden items-center gap-1">
                          <button onClick={() => { setEditingTransaction(tx); setShowModal(true); }}
                            className="btn-icon-sm btn-ghost">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(tx.id)}
                            className="btn-icon-sm btn-ghost text-expense">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border dark:border-dark-border">
                  <p className="text-sm text-text-muted dark:text-dark-text-muted">
                    {(currentPage - 1) * ITEMS + 1}–{Math.min(currentPage * ITEMS, transactions.length)} / {transactions.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn-icon-sm btn-secondary disabled:opacity-40">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary w-12 text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="btn-icon-sm btn-secondary disabled:opacity-40">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-4">
                <ArrowLeftRight size={24} className="text-text-muted dark:text-dark-text-muted" />
              </div>
              <p className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                {hasFilters ? 'Filter bo\'yicha natija yo\'q' : 'Tranzaksiyalar yo\'q'}
              </p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-[220px] mb-5">
                {hasFilters
                  ? 'Boshqa filter parametrlarini sinab ko\'ring'
                  : 'Birinchi daromad yoki xarajatingizni qo\'shing'}
              </p>
              {!hasFilters && (
                <button onClick={() => { setEditingTransaction(null); setShowModal(true); }}
                  className="btn btn-primary btn-sm">
                  <Plus size={16} /> Tranzaksiya qo'shish
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Recurring list ── */}
      {viewMode === 'recurring' && (
        <div className="space-y-3">
          {loading ? (
            <div className="card"><TxSkeleton /></div>
          ) : recurringList.length === 0 ? (
            <div className="card py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-4">
                <Repeat size={24} className="text-text-muted dark:text-dark-text-muted" />
              </div>
              <p className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">Takroriy tranzaksiyalar yo'q</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-[220px] mb-5">
                Tranzaksiya qo'shishda "Takroriy qilish" belgilang
              </p>
              <button onClick={() => navigate('/recurring')} className="btn btn-primary btn-sm">
                <Plus size={16} /> Qo'shish
              </button>
            </div>
          ) : (
            recurringList.map(rec => (
              <div key={rec.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className={`badge ${rec.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {rec.type === 'income' ? 'Daromad' : 'Xarajat'}
                      </span>
                      <span className="badge badge-primary">{rec.frequency}</span>
                      <span className={`badge ${rec.is_active ? 'badge-income' : 'badge-neutral'}`}>
                        {rec.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary num-display mb-1">
                      {formatAmount(rec.amount, rec.currency)}
                    </p>
                    {rec.category_name && (
                      <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{rec.category_name}</p>
                    )}
                    {rec.description && (
                      <p className="text-sm text-text-muted dark:text-dark-text-muted">{rec.description}</p>
                    )}
                    <p className="text-xs text-text-muted dark:text-dark-text-muted mt-2 flex items-center gap-1">
                      <Calendar size={12} />
                      Keyingisi: {new Date(rec.next_occurrence).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => navigate(`/recurring?edit=${rec.id}`)}
                      className="btn-icon-sm btn-secondary">
                      <Pencil size={14} />
                    </button>
                    <button onClick={async () => {
                      try { await api.patch(`/recurring/${rec.id}/toggle`); fetchRecurring(); }
                      catch { toast.error('Xatolik'); }
                    }} className="btn-icon-sm btn-secondary">
                      {rec.is_active ? '🟢' : '⚪'}
                    </button>
                    <button onClick={async () => {
                      if (!confirm('O\'chirilsinmi?')) return;
                      try { await api.delete(`/recurring/${rec.id}`); fetchRecurring(); }
                      catch { toast.error('Xatolik'); }
                    }} className="btn-icon-sm btn-ghost text-expense">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          categories={categories}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Transactions;
