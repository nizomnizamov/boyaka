const IconWrap = ({ icon: Icon, size = 'md', color = 'text-primary', bg = 'bg-primary-light dark:bg-blue-900/30', className = '' }) => {
  const sizes = {
    sm: { wrap: 'icon-wrap-sm', icon: 16 },
    md: { wrap: 'icon-wrap', icon: 20 },
    lg: { wrap: 'icon-wrap-lg', icon: 24 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className={`${s.wrap} ${bg} ${className}`}>
      <Icon size={s.icon} className={color} />
    </div>
  );
};

export default IconWrap;
