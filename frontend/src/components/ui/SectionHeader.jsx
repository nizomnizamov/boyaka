const SectionHeader = ({ title, action, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <h2 className="section-title">{title}</h2>
    {action && (
      <div className="text-sm text-primary dark:text-primary-dark font-semibold cursor-pointer hover:opacity-75 transition-opacity">
        {action}
      </div>
    )}
  </div>
);

export default SectionHeader;
