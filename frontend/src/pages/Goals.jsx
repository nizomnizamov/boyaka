import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { Target, Plus, Calendar, CheckCircle } from 'lucide-react';
import GoalModal from '../components/GoalModal';
import GoalCard from '../components/GoalCard';
import ContributionModal from '../components/ContributionModal';
import { SegmentedControl } from '../components/ui';

const Skeleton = ({ className }) => <div className={`skeleton ${className}`} />;

const Goals = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency: currentCurrency, convertAmount } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchGoals(); }, [filter, currentCurrency]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { is_completed: filter === 'completed' } : {};
      const res = await api.get('/goals', { params });
      setGoals(Array.isArray(res.data) ? res.data : []);
    } catch { setGoals([]); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('goals.deleteConfirm'))) return;
    try { await api.delete(`/goals/${id}`); toast.success(t('goals.deleteSuccess')); fetchGoals(); }
    catch { toast.error(t('common.error')); }
  };

  const handleModalClose = () => {
    setShowGoalModal(false);
    setShowContributionModal(false);
    setEditingGoal(null);
    setSelectedGoal(null);
    fetchGoals();
  };

  const stats = goals.reduce((acc, g) => {
    acc.totalTarget += convertAmount(parseFloat(g.target_amount), g.currency);
    acc.totalSaved  += convertAmount(parseFloat(g.current_amount), g.currency);
    if (g.is_completed) acc.completed++;
    return acc;
  }, { totalTarget: 0, totalSaved: 0, completed: 0 });

  const overallPct = stats.totalTarget > 0
    ? Math.min(100, (stats.totalSaved / stats.totalTarget) * 100)
    : 0;

  const filtered = goals.filter(g =>
    filter === 'all' ? true : filter === 'active' ? !g.is_completed : g.is_completed
  );

  const SEG = [
    { value: 'all',       label: 'Hammasi' },
    { value: 'active',    label: 'Faol' },
    { value: 'completed', label: 'Bajarilgan' },
  ];

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('goals.title')}</h1>
        <button onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
          className="btn btn-primary btn-sm">
          <Plus size={18} strokeWidth={2.5} /> {t('goals.addGoal')}
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary num-display">{goals.length}</p>
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mt-1">Jami maqsad</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-income dark:text-income-dark num-display">{stats.completed}</p>
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mt-1">Bajarilgan</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-2xl font-bold text-primary dark:text-primary-dark num-display">{overallPct.toFixed(0)}%</p>
          <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mt-1">Umumiy jarayon</p>
        </div>
      </div>

      {/* Overall progress bar */}
      {goals.length > 0 && (
        <div className="card py-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Umumiy progress</p>
            <p className="text-sm font-bold text-primary dark:text-primary-dark num-display">{overallPct.toFixed(1)}%</p>
          </div>
          <div className="h-2.5 bg-surface-2 dark:bg-dark-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-text-muted dark:text-dark-text-muted">
              {formatCurrency(stats.totalSaved)} tejaldi
            </p>
            <p className="text-xs text-text-muted dark:text-dark-text-muted">
              {formatCurrency(stats.totalTarget)} maqsad
            </p>
          </div>
        </div>
      )}

      {/* ── Filter ── */}
      <SegmentedControl options={SEG} value={filter} onChange={setFilter} />

      {/* ── Goals grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card space-y-3">
              <Skeleton className="h-5 w-32 rounded-xl" />
              <Skeleton className="h-8 w-48 rounded-xl" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-4 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={g => { setEditingGoal(g); setShowGoalModal(true); }}
              onDelete={handleDelete}
              onContribute={g => { setSelectedGoal(g); setShowContributionModal(true); }}
              formatCurrency={formatCurrency}
              convertAmount={convertAmount}
              currentCurrency={currentCurrency}
            />
          ))}
        </div>
      ) : (
        <div className="card py-14 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-4">
            <Target size={26} className="text-text-muted dark:text-dark-text-muted" />
          </div>
          <p className="font-semibold text-text-primary dark:text-dark-text-primary mb-2">
            {filter === 'all' ? 'Maqsadlar yo\'q' : 'Bu bo\'limda maqsad yo\'q'}
          </p>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-[240px] mb-6">
            Uy, avtomobil, ta'til — moliyaviy maqsadlaringizni belgilab, tejashni boshlang
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['🏠 Uy', '✈️ Ta\'til', '🚗 Avtomobil', '🛡️ Zaxira fond'].map(l => (
              <span key={l} className="badge badge-neutral">{l}</span>
            ))}
          </div>
          <button onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
            className="btn btn-primary btn-sm">
            <Plus size={16} /> Maqsad qo'shish
          </button>
        </div>
      )}

      {showGoalModal && <GoalModal goal={editingGoal} onClose={handleModalClose} />}
      {showContributionModal && selectedGoal && (
        <ContributionModal goal={selectedGoal} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default Goals;
