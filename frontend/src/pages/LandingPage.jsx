import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, Users } from 'lucide-react';
import Card from '../components/Card';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-grid-pattern px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-200/6 to-transparent" />
      <div className="pointer-events-none absolute left-0 top-1/4 h-96 w-96 -translate-x-1/3 blur-radial-indigo" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] translate-x-1/4 blur-radial-cyan" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 animate-fade-in">
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
            <Sparkles size={14} className="text-amber-300" />
            Arena Debat Digital
          </div>
      
          <h1 className="text-shadow-soft bg-gradient-to-r from-white via-amber-100 to-teal-100 bg-clip-text text-6xl font-black uppercase tracking-[0.18em] text-transparent md:text-8xl">
            NALAR
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-slate-300 md:text-2xl">
            "Uji argumenmu. Latih nalarmu."
          </p>
          <p className="mx-auto max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
            Pilih mode debat yang ingin kamu mainkan. Seluruh alur tetap sama, hanya tampilannya yang kini lebih tegas, fokus, dan nyaman dipakai di desktop maupun mobile.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            onClick={() => navigate('/debate-ai')}
            glow
            className="group flex flex-col items-start text-left"
          >
            <div className="mb-6 inline-flex rounded-[22px] border border-amber-200/20 bg-amber-200/8 p-4 text-amber-200 transition-all duration-300 group-hover:scale-105">
              <Bot size={32} />
            </div>
            <div className="mb-4 inline-flex rounded-full border border-amber-200/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              Mode Solo
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-amber-100 md:text-3xl">
              Lawan Nalar
            </h3>
            <p className="text-sm leading-7 text-slate-300 md:text-base">
              Berdebat langsung melawan AI Nalar yang tajam dan kritis. Pilih tingkat kesulitan untuk menguji ketangkasan argumenmu.
            </p>
            <div className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
              Mulai simulasi
            </div>
          </Card>

          <Card
            onClick={() => navigate('/debate-online')}
            className="group flex flex-col items-start text-left"
          >
            <div className="mb-6 inline-flex rounded-[22px] border border-teal-200/20 bg-teal-300/8 p-4 text-teal-200 transition-all duration-300 group-hover:scale-105">
              <Users size={32} />
            </div>
            <div className="mb-4 inline-flex rounded-full border border-teal-200/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              Mode Online
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-teal-100 md:text-3xl">
              Lawan Teman
            </h3>
            <p className="text-sm leading-7 text-slate-300 md:text-base">
              Buat room debat, bagikan link atau QR code, lalu bertanding satu lawan satu dengan temanmu secara online.
            </p>
            <div className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">
              Buka room debat
            </div>
          </Card>
        </div>

        <div className="grid gap-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-5 text-left md:grid-cols-3">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Presisi</div>
            <p className="text-sm leading-6 text-slate-400">Tampilan dibuat lebih fokus ke topik, peserta, dan aksi utama supaya debat terasa jelas.</p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Konsisten</div>
            <p className="text-sm leading-6 text-slate-400">Semua halaman menggunakan visual system yang sama tanpa mengubah jumlah halaman atau logika.</p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">Responsif</div>
            <p className="text-sm leading-6 text-slate-400">Proporsi ruang, tipografi, dan panel dibuat tetap nyaman pada layar kecil maupun besar.</p>
          </div>
        </div>

        <div className="pt-2 text-center text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
          Nalar Platform MVP v1.0 | AI-Powered Debate
        </div>
      </div>
    </div>
  );
}
