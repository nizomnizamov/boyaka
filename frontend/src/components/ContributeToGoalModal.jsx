import { useState } from 'react';
import { X, TrendingUp, Loader, Users } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'UZS', 'RUB', 'JPY', 'CNY', 'KRW',
  'CAD', 'AUD', 'CHF', 'INR', 'BRL', 'MXN', 'TRY', 'AED',
  'SAR', 'SGD', 'HKD', 'NZD', 'THB', 'MYR', 'IDR', 'PHP',
  'VND', 'NOK', 'SEK', 'DKK', 'PLN', 'ZAR'
];

export default function ContributeToGoalModal({ familyId, goal, show, onClose, onSuccess }) {
  const { currency, formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    currency: currency || 'USD',
    note: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error("To'g'ri miqdor kiriting");

    setLoading(true);
    try {
      const res = await api.post(`/family/${familyId}/goals/${goal.id}/contribute`, {
        amount: parseFloat(form.amount),
        currency: form.currency,
        note: form.note.trim() || null,
      });

      if (res.data.goalCompleted) {
        toast.success('🎉 Maqsad to\'liq amalga oshirildi! Tabriklaymiz!', { duration: 5000 });
      } else {
        toast.success(`Hissa qo'shildi! +${formatCurrency(parseFloat(form.amount))} ✅`);
      }

      setForm({ amount: '', currency: currency || 'USD', note: '' });
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.error || 'Xatolik yuz berdi';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!show || !goal) return null;

  const percentage = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

  const remaining = goal.target_amount - goal.current_amount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hissa qo'shish</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{goal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Goal Progress Preview */}
        <div className="px-6 pt-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Jarayon</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-2">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Yig'ilgan: {formatCurrency(goal.current_amount || 0)}</span>
              <span>Qolgan: {formatCurrency(remaining > 0 ? remaining : 0)}</span>
            </div>

            {/* Contributions list */}
            {goal.contributions && goal.contributions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-1 mb-2">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Hissadorlar</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {goal.contributions.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">{c.contributor_name}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatCurrency(c.amount)}
                      </span>
                    </div>
                  ))}
                  {goal.contributions.length > 5 && (
                    <p className="text-xs text-gray-400">+{goal.contributions.length - 5} boshqa...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                min="0.01"
                step="any"
                placeholder="0.00"
                autoFocus
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Masalan: Noyabr oyi ulushi"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-60"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              Hissa qo'shish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
