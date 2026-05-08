const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,        // { label, onClick }
  secondAction,  // { label, onClick }
  compact = false,
}) => (
  <div className={`empty-state ${compact ? 'py-10' : 'py-16'}`}>
    {Icon && (
      <div className="w-16 h-16 rounded-full bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center mb-4 mx-auto">
        <Icon size={28} className="text-text-muted dark:text-dark-text-muted" />
      </div>
    )}
    {title && (
      <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-2">{title}</h3>
    )}
    {description && (
      <p className="text-sm text-text-secondary dark:text-dark-text-secondary max-w-xs mx-auto leading-relaxed mb-6">
        {description}
      </p>
    )}
    {(action || secondAction) && (
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        {action && (
          <button onClick={action.onClick} className="btn btn-primary">
            {action.label}
          </button>
        )}
        {secondAction && (
          <button onClick={secondAction.onClick} className="btn btn-secondary">
            {secondAction.label}
          </button>
        )}
      </div>
    )}
  </div>
);

export default EmptyState;
