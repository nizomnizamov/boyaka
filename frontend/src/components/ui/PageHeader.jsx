const PageHeader = ({ title, subtitle, action, backAction }) => (
  <div className="flex items-start justify-between gap-3 mb-6">
    <div className="flex items-start gap-3">
      {backAction && (
        <button onClick={backAction}
          className="btn-icon btn-secondary mt-0.5 flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      )}
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {action && (
      <div className="flex-shrink-0">{action}</div>
    )}
  </div>
);

export default PageHeader;
