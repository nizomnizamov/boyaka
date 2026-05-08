const SegmentedControl = ({ options, value, onChange, className = '' }) => (
  <div className={`segmented ${className}`}>
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`seg-item ${value === opt.value ? 'active' : ''}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
