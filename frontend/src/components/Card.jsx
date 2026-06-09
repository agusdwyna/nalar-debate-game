/**
 * Reusable premium glassmorphism card component.
 */
export default function Card({ children, className = '', glow = false, onClick }) {
  const hoverStyles = onClick
    ? 'cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/18 hover:bg-[#12202a]/92 hover:shadow-[0_24px_60px_rgba(0,0,0,0.24)]'
    : '';
  
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(10,20,28,0.82)] p-6 backdrop-blur-2xl md:p-8 ${hoverStyles} ${glow ? 'border-amber-200/12 shadow-[0_30px_90px_rgba(0,0,0,0.28)]' : 'shadow-[0_22px_70px_rgba(0,0,0,0.18)]'} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%,transparent_65%,rgba(79,209,197,0.04))]" />
      {glow && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(244,162,97,0.18),transparent_72%)] blur-3xl" />
      )}
      {children}
    </div>
  );
}
