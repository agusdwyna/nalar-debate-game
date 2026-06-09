import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, BarChart3, Brain, ThumbsDown, ThumbsUp } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../api/axios';

export default function ResultPage() {
  const { debateId } = useParams();
  const navigate = useNavigate();

  const [debate, setDebate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/debates/${debateId}`);
        setDebate(response.data);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat hasil debat.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [debateId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid-pattern px-6">
        <div className="flex flex-col items-center space-y-4">
          <svg className="h-12 w-12 animate-spin text-amber-200" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-slate-400">Juri AI sedang memformulasikan skor...</span>
        </div>
      </div>
    );
  }

  if (error || !debate || !debate.result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid-pattern p-6">
        <Card className="w-full max-w-md space-y-6 text-center">
          <Award size={48} className="mx-auto text-red-300" />
          <h2 className="text-xl font-bold text-white">Hasil Belum Tersedia</h2>
          <p className="text-sm text-slate-400">
            {error || 'Skor debat belum dikeluarkan oleh Juri AI Nalar.'}
          </p>
          <Button onClick={() => navigate(`/arena/${debateId}`)} className="w-full">
            Kembali ke Arena
          </Button>
        </Card>
      </div>
    );
  }

  const { result, topic, participants } = debate;
  const proParticipant = participants.find((p) => p.side === 'pro');
  const contraParticipant = participants.find((p) => p.side === 'contra');
  const totalScore = result.proTotalScore + result.contraTotalScore;
  const proPercentage = totalScore > 0 ? (result.proTotalScore / totalScore) * 100 : 50;
  const contraPercentage = 100 - proPercentage;

  const winnerUsername =
    result.winnerSide === 'pro'
      ? proParticipant?.username
      : contraParticipant?.isAI
        ? 'AI Nalar'
        : contraParticipant?.username;

  return (
    <div className="relative min-h-screen overflow-hidden bg-grid-pattern px-6 py-6 pb-16">
      <div className="pointer-events-none absolute right-0 top-0 h-[32rem] w-[32rem] translate-x-1/4 blur-radial-indigo" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[32rem] w-[32rem] -translate-x-1/4 blur-radial-cyan" />

      <div className="relative z-10 mx-auto w-full max-w-5xl pt-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Halaman Utama</span>
        </button>
      </div>

      <div className="relative z-10 mx-auto mt-6 flex max-w-5xl flex-col gap-8 animate-fade-in">
        <Card glow className="relative overflow-hidden p-8 text-center">
          <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200">
            <Brain size={12} />
            Juri AI Nalar
          </div>

          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/8 text-amber-200">
            <Award size={40} />
          </div>

          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
            Hasil Penilaian Akhir
          </span>
          <h2 className="mx-auto mt-3 max-w-3xl text-2xl font-extrabold leading-tight text-white md:text-4xl">
            {topic}
          </h2>

          <div className="mx-auto mt-8 inline-flex flex-col rounded-[28px] border border-white/10 bg-white/[0.04] px-8 py-5">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Pemenang Debat
            </span>
            <span className="mt-2 bg-gradient-to-r from-amber-100 to-teal-100 bg-clip-text text-2xl font-black uppercase tracking-[0.12em] text-transparent">
              {result.winnerSide.toUpperCase()} ({winnerUsername})
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 size={18} className="text-amber-200" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white">
              Perbandingan Skor Akhir
            </h3>
          </div>

          <div className="space-y-5">
            <div className="flex h-7 w-full overflow-hidden rounded-full border border-white/8 bg-[#081118]">
              <div
                style={{ width: `${proPercentage}%` }}
                className="flex h-full items-center bg-gradient-to-r from-amber-300 to-orange-300 pl-3 text-xs font-bold text-slate-950 transition-all duration-1000"
              >
                {result.proTotalScore}
              </div>
              <div
                style={{ width: `${contraPercentage}%` }}
                className="flex h-full items-center justify-end bg-gradient-to-r from-teal-300 to-cyan-300 pr-3 text-xs font-bold text-slate-950 transition-all duration-1000"
              >
                {result.contraTotalScore}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-amber-200/10 bg-amber-200/[0.04] p-4">
                <div className="text-sm font-bold text-amber-200">{proParticipant?.username} (PRO)</div>
                <div className="mt-1 text-xs text-slate-400">Skor: {result.proTotalScore}/100</div>
              </div>
              <div className="rounded-[22px] border border-teal-200/10 bg-teal-300/[0.04] p-4 text-left md:text-right">
                <div className="text-sm font-bold text-teal-200">
                  {contraParticipant?.isAI ? 'AI Nalar' : contraParticipant?.username} (KONTRA)
                </div>
                <div className="mt-1 text-xs text-slate-400">Skor: {result.contraTotalScore}/100</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="border-b border-white/8 pb-3 text-sm font-semibold uppercase tracking-[0.24em] text-white">
            Rangkuman Evaluasi Juri
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-8 text-slate-300 md:text-base">
            {result.summary}
          </p>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-5 p-6">
            <h3 className="border-b border-white/8 pb-3 text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">
              Evaluasi Pihak PRO ({proParticipant?.username})
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
                <ThumbsUp size={14} />
                Kekuatan Argumen
              </div>
              <p className="text-sm leading-7 text-slate-300">{result.proStrengths}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                <ThumbsDown size={14} />
                Kelemahan Argumen
              </div>
              <p className="text-sm leading-7 text-slate-300">{result.proWeaknesses}</p>
            </div>
          </Card>

          <Card className="space-y-5 p-6">
            <h3 className="border-b border-white/8 pb-3 text-sm font-semibold uppercase tracking-[0.24em] text-teal-200">
              Evaluasi Pihak KONTRA ({contraParticipant?.isAI ? 'AI Nalar' : contraParticipant?.username})
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
                <ThumbsUp size={14} />
                Kekuatan Argumen
              </div>
              <p className="text-sm leading-7 text-slate-300">{result.contraStrengths}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                <ThumbsDown size={14} />
                Kelemahan Argumen
              </div>
              <p className="text-sm leading-7 text-slate-300">{result.contraWeaknesses}</p>
            </div>
          </Card>
        </div>

        <div className="pt-2 text-center">
          <Button onClick={() => navigate('/')} variant="secondary" className="px-8">
            Kembali ke Halaman Utama
          </Button>
        </div>
      </div>
    </div>
  );
}
