/**
 * Reusable premium button component.
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  isLoading = false,
  className = '',
  icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold tracking-[0.01em] transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:pointer-events-none disabled:opacity-50';

  const sizes = 'min-h-12 px-6 py-3 text-sm md:text-base';

  const variants = {
    primary: 'border-amber-300/30 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 text-slate-950 shadow-[0_18px_45px_rgba(244,162,97,0.22)] hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(244,162,97,0.32)] focus:ring-amber-300/60',
    secondary: 'border-slate-200/10 bg-white/[0.04] text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:border-slate-200/20 hover:bg-white/[0.08] focus:ring-slate-200/20',
    accent: 'border-teal-300/30 bg-gradient-to-r from-teal-400/18 to-cyan-300/16 text-teal-100 shadow-[0_16px_40px_rgba(79,209,197,0.16)] hover:-translate-y-0.5 hover:border-teal-200/40 hover:bg-teal-300/12 focus:ring-teal-300/40',
    danger: 'border-red-300/20 bg-red-500/10 text-red-100 shadow-[0_12px_35px_rgba(127,29,29,0.16)] hover:-translate-y-0.5 hover:bg-red-500/15 focus:ring-red-300/30',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizes} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memproses...
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
