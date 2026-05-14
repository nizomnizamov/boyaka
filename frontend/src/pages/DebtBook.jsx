import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import {
  BookOpen, Plus, Trash2, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownLeft, CheckCircle, Clock,
  AlertCircle, X, CreditCard, Calendar
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CURRENCIES = ['UZS', 'USD', 'RUB', 'JPY', 'CNY', 'EUR'];

// ─── Add/Edit Debt Modal ──────────────────────────────────────────────────────
const DebtModal = ({ debt, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    type: debt?.type || 'lent',
    person_name: debt?.person_name || '',
    amount: debt?.amount || '',
    currency: debt?.currency || 'UZS',
    date: debt?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    due_date: debt?.due_date?.slice(0, 10) || '',
    description: debt?.description || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, due_date: form.due_date || null };
      if (debt) {
        await api.put(`/debts/${debt.id}`, data);
        toast.success(t('debt.updated'));
      } else {
        await api.post('/debts', data);
        toast.success(t('debt.created'));
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold dark:text-gray-100">
            {debt ? t('debt.edit') : t('debt.add')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button"
              onClick={() => setForm(f => ({ ...f, type: 'lent' }))}
              className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                form.type === 'lent'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
              <ArrowUpRight size={18} /> {t('debt.lent')}
            </button>
            <button type="button"
              onClick={() => setForm(f => ({ ...f, type: 'borrowed' }))}
              className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                form.type === 'borrowed'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
              <ArrowDownLeft size={18} /> {t('debt.borrowed')}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.personName')} *</label>
            <input type="text" value={form.person_name} required maxLength={100}
              onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))}
              className="input" placeholder={t('debt.personPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.amount')} *</label>
              <input type="number" min="0.01" step="any" value={form.amount} required
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="input" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('common.currency')}</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.date')} *</label>
              <input type="date" value={form.date} required
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.dueDate')}</label>
              <input type="date" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.description')}</label>
            <textarea value={form.description} rows={2}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input resize-none" placeholder={t('debt.descriptionPlaceholder')} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────────
const PaymentModal = ({ debt, onClose, onSaved }) => {
  const { t } = useTranslation();
  const remaining = parseFloat(debt.amount) - parseFloat(debt.paid_amount);
  const [form, setForm] = useState({
    amount: remaining.toFixed(2),
    currency: debt.currency,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/debts/${debt.id}/payments`, form);
      toast.success(t('debt.paymentAdded'));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold dark:text-gray-100">{t('debt.addPayment')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{debt.person_name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.amount')} *</label>
              <input type="number" min="0.01" step="any" value={form.amount} required
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('common.currency')}</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.date')}</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('debt.note')}</label>
            <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="input" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? t('common.saving') : t('debt.addPayment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Debt Card ────────────────────────────────────────────────────────────────
const DebtCard = ({ debt, onEdit, onDelete, onPay, onRefresh }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);

  const isLent = debt.type === 'lent';
  const total = parseFloat(debt.amount);
  const paid = parseFloat(debt.paid_amount);
  const remaining = total - paid;
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const isSettled = debt.status === 'settled';

  const isOverdue = debt.due_date && !isSettled &&
    new Date(debt.due_date) < new Date();

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/debts/${debt.id}`);
      setPayments(res.data.payments);
    } catch { /* ignore */ }
  };

  const handleExpand = () => {
    setExpanded(e => !e);
    if (!expanded) fetchPayments();
  };

  const handleDeletePayment = async (pid) => {
    if (!confirm(t('debt.deletePaymentConfirm'))) return;
    setLoadingPay(true);
    try {
      await api.delete(`/debts/${debt.id}/payments/${pid}`);
      toast.success(t('debt.paymentDeleted'));
      fetchPayments();
      onRefresh();
    } catch { toast.error(t('common.error')); }
    finally { setLoadingPay(false); }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
      isSettled ? 'border-gray-200 dark:border-gray-700 opacity-75'
      : isLent   ? 'border-green-200 dark:border-green-800'
                 : 'border-red-200 dark:border-red-800'
    }`}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isSettled ? 'bg-gray-100 dark:bg-gray-700'
              : isLent  ? 'bg-green-100 dark:bg-green-900/40'
                        : 'bg-red-100 dark:bg-red-900/40'
            }`}>
              {isSettled
                ? <CheckCircle size={20} className="text-gray-400" />
                : isLent
                  ? <ArrowUpRight size={20} className="text-green-600 dark:text-green-400" />
                  : <ArrowDownLeft size={20} className="text-red-600 dark:text-red-400" />
              }
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{debt.person_name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isSettled ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  : isLent  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {isSettled ? t('debt.settled') : isLent ? t('debt.lent') : t('debt.borrowed')}
                </span>
                {isOverdue && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {t('debt.overdue')}
                  </span>
                )}
                {debt.due_date && !isOverdue && !isSettled && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(debt.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${
              isSettled ? 'text-gray-500'
              : isLent  ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
            }`}>
              {parseFloat(debt.amount).toLocaleString()} {debt.currency}
            </p>
            {!isSettled && remaining < total && (
              <p className="text-xs text-gray-400">{t('debt.remaining')}: {remaining.toLocaleString()} {debt.currency}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isSettled && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${isLent ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${pct}%` }} />
            </div>
            {paid > 0 && (
              <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% {t('debt.paid')}</p>
            )}
          </div>
        )}

        {debt.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">"{debt.description}"</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {!isSettled && (
            <button onClick={() => onPay(debt)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                isLent ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                       : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
              }`}>
              <CreditCard size={14} />
              {isLent ? t('debt.markReceived') : t('debt.markReturned')}
            </button>
          )}
          <button onClick={() => onEdit(debt)}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            ✏️
          </button>
          <button onClick={() => onDelete(debt.id)}
            className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100">
            <Trash2 size={14} />
          </button>
          <button onClick={handleExpand}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg hover:bg-gray-200">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded: payment history */}
      {expanded && (
        <div className="border-t dark:border-gray-700 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('debt.paymentHistory')}</p>
          {payments.length === 0 ? (
            <p className="text-xs text-gray-400 italic">{t('debt.noPayments')}</p>
          ) : (
            payments.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{parseFloat(p.amount).toLocaleString()} {p.currency}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(p.date).toLocaleDateString()}</span>
                  {p.note && <span className="text-xs text-gray-400 ml-2 italic">— {p.note}</span>}
                </div>
                <button onClick={() => handleDeletePayment(p.id)} disabled={loadingPay}
                  className="text-red-400 hover:text-red-600 ml-2">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DebtBook() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const [data, setData] = useState({ debts: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active' | 'settled' | 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'lent' | 'borrowed'

  const [showAddModal, setShowAddModal] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [payDebt, setPayDebt] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await api.get('/debts', { params });
      setData(res.data);
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  }, [filter, typeFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!confirm(t('debt.deleteConfirm'))) return;
    try {
      await api.delete(`/debts/${id}`);
      toast.success(t('debt.deleted'));
      fetch();
    } catch { toast.error(t('common.error')); }
  };

  const { summary } = data;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={24} /> {t('debt.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('debt.subtitle')}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> {t('debt.add')}
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight size={16} className="text-green-600" />
              <p className="text-xs font-medium text-green-700 dark:text-green-400">{t('debt.theyOweMe')}</p>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.remainingLent)}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft size={16} className="text-red-600" />
              <p className="text-xs font-medium text-red-700 dark:text-red-400">{t('debt.iOweThem')}</p>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.remainingBorrowed)}
            </p>
          </div>
          <div className={`border rounded-xl p-4 ${
            summary.netBalance >= 0
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className={summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'} />
              <p className={`text-xs font-medium ${summary.netBalance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                {t('debt.netBalance')}
              </p>
            </div>
            <p className={`text-xl font-bold ${summary.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {summary.netBalance >= 0 ? '+' : ''}{formatCurrency(summary.netBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['active', 'settled', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}>
            {t(`debt.filter_${f}`)}
          </button>
        ))}
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
        {['all', 'lent', 'borrowed'].map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              typeFilter === f
                ? f === 'lent' ? 'bg-green-500 text-white'
                  : f === 'borrowed' ? 'bg-red-500 text-white'
                  : 'bg-gray-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}>
            {f === 'all' ? t('common.all') : f === 'lent' ? t('debt.lent') : t('debt.borrowed')}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : data.debts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('debt.empty')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('debt.emptyDesc')}</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> {t('debt.add')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.debts.map(d => (
            <DebtCard
              key={d.id} debt={d}
              onEdit={setEditDebt}
              onDelete={handleDelete}
              onPay={setPayDebt}
              onRefresh={fetch}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <DebtModal onClose={() => setShowAddModal(false)} onSaved={fetch} />
      )}
      {editDebt && (
        <DebtModal debt={editDebt} onClose={() => setEditDebt(null)} onSaved={fetch} />
      )}
      {payDebt && (
        <PaymentModal debt={payDebt} onClose={() => setPayDebt(null)} onSaved={fetch} />
      )}
    </div>
  );
}
