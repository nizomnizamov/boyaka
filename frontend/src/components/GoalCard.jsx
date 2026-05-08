import { Edit2, Trash2, Plus, Calendar, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';

const GoalCard = ({ goal, onEdit, onDelete, onContribute, formatCurrency, convertAmount, currentCurrency }) => {
  const { t } = useTranslation();

  const targetAmount  = convertAmount(goal.target_amount, goal.currency);
  const currentAmount = convertAmount(goal.current_amount, goal.currency);
  const progress  = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);

  const daysLeft = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;

  const progressColor = goal.is_completed
    ? 'bg-income'
    : progress >= 75 ? 'bg-primary'
    : progress >= 40 ? 'bg-amber-400'
    : 'bg-surface-2 dark:bg-dark-surface-2';

  const priorityBadge = {
    high:   'badge-expense',
    medium: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    low:    'badge-neutral',
  }[goal.priority] || 'badge-neutral';

  return (
    <div className={`card card-hover flex flex-col gap-4 ${
      goal.is_completed ? 'border-income/30 dark:border-income/20' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl flex-shrink-0">{goal.icon || '🎯'}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary truncate">{goal.name}</h3>
            {goal.category && (
              <p className="text-xs text-text-muted dark:text-dark-text-muted mt-0.5">{goal.category}</p>
            )}
          </div>
        </div>
        <span className={`badge ${priorityBadge} flex-shrink-0`}>
          {t(`goals.priority.${goal.priority}`)}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary num-display">
            {formatCurrency(currentAmount)}
          </span>
          <span className="text-sm font-bold text-text-muted dark:text-dark-text-muted num-display">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-surface-2 dark:bg-dark-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              goal.is_completed ? 'bg-income' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-text-muted dark:text-dark-text-muted">
            {remaining > 0 ? `${formatCurrency(remaining)} qoldi` : 'Bajarildi!'}
          </span>
          <span className="text-xs text-text-muted dark:text-dark-text-muted num-display">
            {formatCurrency(targetAmount)}
          </span>
        </div>
      </div>

      {/* Deadline */}
      {daysLeft !== null && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-2xl ${
          daysLeft < 0   ? 'bg-expense-light dark:bg-red-900/20 text-expense dark:text-red-400'
          : daysLeft < 30 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          : 'bg-surface-2 dark:bg-dark-surface-2 text-text-secondary dark:text-dark-text-secondary'
        }`}>
          <Calendar size={14} />
          <span className="font-medium">
            {daysLeft < 0  ? 'Muddati o\'tgan'
             : daysLeft === 0 ? 'Bugun!'
             : `${daysLeft} kun qoldi`}
          </span>
        </div>
      )}

      {/* Completed badge */}
      {goal.is_completed && (
        <div className="flex items-center justify-center gap-2 text-income dark:text-income-dark font-semibold text-sm py-2 bg-income-light dark:bg-green-900/20 rounded-2xl">
          <CheckCircle size={16} />
          {t('goals.goalCompleted')}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {!goal.is_completed && (
          <button onClick={() => onContribute(goal)}
            className="flex-1 btn btn-sm bg-income-light dark:bg-green-900/30 text-income dark:text-income-dark font-semibold hover:bg-green-100 dark:hover:bg-green-900/50 shadow-none">
            <Plus size={16} /> {t('goals.addFunds')}
          </button>
        )}
        <button onClick={() => onEdit(goal)} className="btn-icon-sm btn-secondary">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(goal.id)} className="btn-icon-sm btn-ghost text-expense">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default GoalCard;
