import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../api/axios';

const fieldClassName =
  'w-full rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-slate-100 placeholder:text-slate-500 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-4 focus:ring-amber-300/12';

export default function DebateAIPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    topic: '',
    side: 'pro',
    aiLevel: 'medium',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.topic.trim()) {
      setError('Harap isi username dan topik debat terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/debates/ai', formData);
      const { debateId, sessionId } = response.data;

      localStorage.setItem(`session_${debateId}`, sessionId);
      localStorage.setItem(`username_${debateId}`, formData.username);

      navigate(`/arena/${debateId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gagal memulai debat. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-grid-pattern px-6 py-6">
      <div className="pointer-events-none absolute right-0 top-10 h-[30rem] w-[30rem] translate-x-1/4 blur-radial-indigo" />

      <div className="relative z-10 mx-auto w-full max-w-3xl pb-6 pt-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <Card glow className="w-full max-w-3xl">
          <div className="mb-8 flex flex-col gap-5 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex rounded-[24px] border border-amber-200/20 bg-amber-200/8 p-4 text-amber-200">
                <Bot size={24} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Mode Solo</p>
                <h2 className="text-3xl font-bold text-white">Lawan AI Nalar</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Konfigurasi debat satu lawan satu dengan AI tanpa mengubah alur permainan yang sudah ada.</p>
              </div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              3 ronde debat
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-[22px] border border-red-300/20 bg-red-400/8 p-4 text-sm font-medium text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200" htmlFor="username">
                  Username Anda
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Masukkan username anda..."
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  Posisi Argumen Anda
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, side: 'pro' })}
                    className={`rounded-[22px] border px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
                      formData.side === 'pro'
                        ? 'border-amber-300/35 bg-amber-200/12 text-amber-100 shadow-[0_18px_40px_rgba(244,162,97,0.12)]'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    PRO
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, side: 'contra' })}
                    className={`rounded-[22px] border px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
                      formData.side === 'contra'
                        ? 'border-amber-300/35 bg-amber-200/12 text-amber-100 shadow-[0_18px_40px_rgba(244,162,97,0.12)]'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    KONTRA
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200" htmlFor="topic">
                Topik Debat
              </label>
              <input
                id="topic"
                type="text"
                placeholder="Contoh: Apakah AI akan menggantikan programmer?"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className={fieldClassName}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-200">
                Tingkat Kesulitan AI
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, aiLevel: level })}
                    className={`rounded-[22px] border px-3 py-3.5 text-sm font-semibold capitalize transition-all duration-300 ${
                      formData.aiLevel === level
                        ? 'border-amber-300/35 bg-gradient-to-r from-amber-200/12 to-orange-200/10 text-amber-100'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/8 pt-6 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl text-sm leading-6 text-slate-400">
                Setelah sesi dibuat, Anda akan langsung diarahkan ke arena debat yang sama seperti sebelumnya.
              </p>
              <Button type="submit" isLoading={isLoading} className="w-full md:w-auto md:min-w-52">
                Mulai Debat
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
