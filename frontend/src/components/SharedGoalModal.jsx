import { useState, useEffect } from 'react';
import { X, Target, Calendar, Loader } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'UZS', 'RUB', 'JPY', 'CNY', 'KRW',
  'CAD', 'AUD', 'CHF', 'INR', 'BRL', 'MXN', 'TRY', 'AED',
  'SAR', 'SGD', 'HKD', 'NZD', 'THB', 'MYR', 'IDR', 'PHP',
  'VND', 'NOK', 'SEK', 'DKK', 'PLN', 'ZAR'
];

export default function SharedGoalModal({ familyId, goal, show, onClose, onSuccess }) {
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    target_amount: '',
    currency: currency || 'USD',
    target_date: '',
  });

  const isEdit = !!goal;

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name || '',
        description: goal.description || '',
        target_amount: goal.target_amount || '',
        currency: goal.currency || currency || 'USD',
        target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
      });
    } else {
      setForm({
        name: '',
        description: '',
        target_amount: '',
        currency: currency || 'USD',
        target_date: '',
      });
    }
  }, [goal, currency]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Maqsad nomini kiriting');
    if (!form.target_amount || parseFloat(form.target_amount) <= 0) return toast.error("To'g'ri maqsad miqdorini kiriting");

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        target_amount: parseFloat(form.target_amount),
        currency: form.currency,
        target_date: form.target_date || null,
      };

      if (isEdit) {
        await api.put(`/family/${familyId}/goals/${goal.id}`, payload);
        toast.success('Maqsad muvaffaqiyatli yangilandi! ✅');
      } else {
        await api.post(`/family/${familyId}/goals`, payload);
        toast.success("Umumiy maqsad yaratildi! 🎯");
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
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? "Maqsadni tahrirlash" : "Umumiy maqsad yaratish"}
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
              Maqsad nomi *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Masalan: Ta'til sayohati"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tavsif (ixtiyoriy)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Bu maqsad haqida qo'shimcha ma'lumot..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Target Amount & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maqsad miqdori *
              </label>
              <input
                type="number"
                name="target_amount"
                value={form.target_amount}
                onChange={handleChange}
                required
                min="0"
                step="any"
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Muddati (ixtiyoriy)
            </label>
            <input
              type="date"
              name="target_date"
              value={form.target_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition disabled:opacity-60"
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
