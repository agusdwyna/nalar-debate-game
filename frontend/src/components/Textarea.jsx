/**
 * Reusable premium textarea component.
 */
export default function Textarea({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  rows = 4,
  className = '',
  error = '',
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full resize-none rounded-[24px] border bg-white/[0.03] px-4 py-3.5 text-slate-100 placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:ring-4 disabled:pointer-events-none disabled:opacity-50 ${
          error
            ? 'border-red-300/40 focus:border-red-300/50 focus:ring-red-300/15'
            : 'border-white/10 focus:border-amber-300/40 focus:ring-amber-300/12'
        } ${className}`}
        {...props}
      />
      {error && <span className="pl-1 text-xs font-medium text-red-300">{error}</span>}
    </div>
  );
}
