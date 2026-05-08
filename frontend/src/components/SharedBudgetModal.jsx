import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, Loader } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'UZS', 'RUB', 'JPY', 'CNY', 'KRW',
  'CAD', 'AUD', 'CHF', 'INR', 'BRL', 'MXN', 'TRY', 'AED',
  'SAR', 'SGD', 'HKD', 'NZD', 'THB', 'MYR', 'IDR', 'PHP',
  'VND', 'NOK', 'SEK', 'DKK', 'PLN', 'ZAR'
];

const PERIODS = [
  { value: 'monthly', label: 'Oylik (Monthly)' },
  { value: 'weekly', label: 'Haftalik (Weekly)' },
  { value: 'yearly', label: 'Yillik (Yearly)' },
  { value: 'custom', label: "Maxsus muddat (Custom)" },
];

export default function SharedBudgetModal({ familyId, budget, show, onClose, onSuccess }) {
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    currency: currency || 'USD',
    category_id: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const isEdit = !!budget;

  // Load user's categories for the dropdown
  useEffect(() => {
    if (!show) return;
    api.get('/categories').then(res => {
      setCategories(res.data.categories || []);
    }).catch(() => {});
  }, [show]);

  // Populate form if editing
  useEffect(() => {
    if (budget) {
      setForm({
        name: budget.name || '',
        amount: budget.amount || '',
        currency: budget.currency || currency || 'USD',
        category_id: budget.category_id || '',
        period: budget.period || 'monthly',
        start_date: budget.start_date ? budget.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: budget.end_date ? budget.end_date.split('T')[0] : '',
      });
    } else {
      setForm({
        name: '',
        amount: '',
        currency: currency || 'USD',
        category_id: '',
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
    }
  }, [budget, currency]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Byudjet nomini kiriting');
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('To\'g\'ri miqdor kiriting');
    if (!form.start_date) return toast.error('Boshlanish sanasini kiriting');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        currency: form.currency,
        category_id: form.category_id || null,
        period: form.period,
        start_date: form.start_date,
        end_date: form.end_date || null,
      };

      if (isEdit) {
        await api.put(`/family/${familyId}/budgets/${budget.id}`, payload);
        toast.success('Byudjet muvaffaqiyatli yangilandi! ✅');
      } else {
        await api.post(`/family/${familyId}/budgets`, payload);
        toast.success('Umumiy byudjet yaratildi! 🎉');
      }
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.error || 'Xatolik yuz berdi';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Byudjetni tahrirlash' : 'Umumiy byudjet yaratish'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Byudjet nomi *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Masalan: Uy-ro'zg'or xarajatlari"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Miqdor *
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                min="0"
                step="any"
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valyuta
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Tag className="h-4 w-4 inline mr-1" />
              Kategoriya (ixtiyoriy)
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">-- Kategoriyasiz --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Davr
            </label>
            <select
              name="period"
              value={form.period}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              {PERIODS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Boshlanish *
              </label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tugash (ixtiyoriy)
              </label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                min={form.start_date}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-60"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Saqlash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
