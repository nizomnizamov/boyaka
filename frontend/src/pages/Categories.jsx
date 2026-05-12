import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryModal from '../components/CategoryModal';
import { SegmentedControl } from '../components/ui';

const Skeleton = ({ className }) => <div className={`skeleton ${className}`} />;

const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch {
      toast.error(t('categories.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => setDeleteConfirmId(id);

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/categories/${deleteConfirmId}`);
      toast.success(t('categories.categoryDeleted'));
      fetchCategories();
    } catch {
      toast.error(t('categories.failedToDelete'));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const filteredCategories = filter === 'all'
    ? categories
    : categories.filter(cat => cat.type === filter);

  const incomeCount  = categories.filter(c => c.type === 'income').length;
  const expenseCount = categories.filter(c => c.type === 'expense').length;

  const SEG = [
    { value: 'all',     label: `Hammasi (${categories.length})` },
    { value: 'income',  label: `Daromad (${incomeCount})` },
    { value: 'expense', label: `Xarajat (${expenseCount})` },
  ];

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('categories.title')}</h1>
        <button onClick={() => { setEditingCategory(null); setShowModal(true); }} className="btn btn-primary btn-sm">
          <Plus size={18} strokeWidth={2.5} /> {t('categories.addCategory')}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary num-display">{categories.length}</p>
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mt-1">Jami</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-income dark:text-income-dark num-display">{incomeCount}</p>
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mt-1">Daromad</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-expense dark:text-expense-dark num-display">{expenseCount}</p>
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mt-1">Xarajat</p>
        </div>
      </div>

      {/* ── Filter ── */}
      <SegmentedControl options={SEG} value={filter} onChange={setFilter} />

      {/* ── Categories Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCategories.map((category) => (
            <div key={category.id} className="card flex items-center gap-3 group">
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ backgroundColor: category.color }}
              >
                {category.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text-primary dark:text-dark-text-primary truncate">
                  {category.name}
                </p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                  category.type === 'income'
                    ? 'bg-income-light text-income dark:bg-green-950/50 dark:text-green-400'
                    : 'bg-expense-light text-expense dark:bg-red-950/50 dark:text-red-400'
                }`}>
                  {category.type === 'income' ? 'Daromad' : 'Xarajat'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingCategory(category); setShowModal(true); }}
                  className="p-2 text-text-muted hover:text-primary hover:bg-primary-light dark:hover:bg-blue-950/50 rounded-xl transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-text-muted hover:text-expense hover:bg-expense-light dark:hover:bg-red-950/50 rounded-xl transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-14 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-4">
            <FolderOpen size={26} className="text-text-muted dark:text-dark-text-muted" />
          </div>
          <p className="font-semibold text-text-primary dark:text-dark-text-primary mb-1">
            {t('categories.noCategories')}
          </p>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-5">
            Tranzaksiyalaringizni tartiblashtirish uchun kategoriyalar qo'shing
          </p>
          <button onClick={() => { setEditingCategory(null); setShowModal(true); }} className="btn btn-primary btn-sm">
            <Plus size={16} /> {t('categories.addCategory')}
          </button>
        </div>
      )}

      {showModal && <CategoryModal category={editingCategory} onClose={handleModalClose} />}

      {/* ── Delete confirm ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="card relative z-10 max-w-xs w-full text-center animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-expense-light flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-expense" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary mb-1">
              Kategoriyani o'chirish
            </h3>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-5">
              Bu kategoriya o'chirilsa, unga bog'liq tranzaksiyalar kategoriyasiz qoladi. Davom etasizmi?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary flex-1">Bekor</button>
              <button onClick={confirmDelete} className="btn flex-1 bg-expense text-white hover:bg-red-600">O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
