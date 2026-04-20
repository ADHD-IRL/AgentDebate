export default function WrButton({ children, onClick, variant = 'amber', size = 'md', disabled, className = '', type = 'button' }) {
  const variants = {
    amber: 'bg-amber-500 hover:bg-amber-400 text-black font-semibold',
    ghost: 'hover:bg-white/5 text-secondary border border-transparent hover:border-white/10',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    outline: 'border border-amber-500/40 text-amber-500 hover:bg-amber-500/10',
    secondary: 'border text-sm font-medium hover:bg-white/5',
  };
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm',
  };
  const style = variants[variant] || variants.amber;
  const sz = sizes[size] || sizes.md;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded inline-flex items-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${style} ${sz} ${className}`}
      style={variant === 'secondary' ? { borderColor: 'var(--wr-border)', color: 'var(--wr-text-secondary)' } : undefined}
    >
      {children}
    </button>
  );
}