import { TrendingUp, TrendingDown } from 'lucide-react';

const TransactionItem = ({ transaction, formatCurrency, onClick }) => {
  const { type, amount, description, category_name, category_color, category_icon, date } = transaction;
  const isIncome = type === 'income';

  const formattedDate = date
    ? new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div
      className="list-item cursor-pointer hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-2xl px-1 -mx-1 transition-colors"
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className="icon-wrap flex-shrink-0"
        style={{
          backgroundColor: category_color ? category_color + '18' : isIncome ? '#F0FDF4' : '#FEF2F2'
        }}
      >
        {category_icon ? (
          <span className="text-lg">{category_icon}</span>
        ) : isIncome ? (
          <TrendingUp size={18} className="text-income" />
        ) : (
          <TrendingDown size={18} className="text-expense" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-text-primary dark:text-dark-text-primary truncate">
          {description || category_name || (isIncome ? 'Daromad' : 'Xarajat')}
        </p>
        <p className="text-xs text-text-muted dark:text-dark-text-muted mt-0.5">
          {category_name}{category_name && formattedDate ? ' · ' : ''}{formattedDate}
        </p>
      </div>

      {/* Amount */}
      <span className={`text-[15px] font-bold num-display flex-shrink-0 ${
        isIncome ? 'text-income dark:text-income-dark' : 'text-expense dark:text-expense-dark'
      }`}>
        {isIncome ? '+' : '−'}{formatCurrency(amount)}
      </span>
    </div>
  );
};

export default TransactionItem;
