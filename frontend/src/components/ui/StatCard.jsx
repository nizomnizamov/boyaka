const StatCard = ({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary-light dark:bg-blue-900/30',
  trend,        // '+12%' | '-5%'
  trendUp,      // boolean
  subtitle,
  size = 'md',  // 'sm' | 'md' | 'lg'
  className = '',
}) => {
  const sizes = {
    sm: { value: 'text-xl', label: 'text-xs', icon: 16, wrap: 'w-9 h-9 rounded-xl' },
    md: { value: 'text-2xl', label: 'text-sm', icon: 20, wrap: 'w-11 h-11 rounded-2xl' },
    lg: { value: 'text-3xl', label: 'text-sm', icon: 24, wrap: 'w-14 h-14 rounded-3xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={`${s.wrap} ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={s.icon} className={iconColor} />
          </div>
        )}
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trendUp
              ? 'bg-income-light text-income dark:bg-green-900/30 dark:text-green-400'
              : 'bg-expense-light text-expense dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className={`${s.label} text-text-secondary dark:text-dark-text-secondary font-medium mb-1`}>{label}</p>
      <p className={`${s.value} font-bold text-text-primary dark:text-dark-text-primary tracking-tight num-display`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-text-muted dark:text-dark-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
