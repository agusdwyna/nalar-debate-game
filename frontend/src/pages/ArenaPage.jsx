import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, MessageSquare, Send, ShieldAlert, Timer, Users } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import api from '../api/axios';

const DEFAULT_ROUND_RULES = {
  opening: { durationMs: 90_000, maxChars: 500 },
  rebuttal: { durationMs: 120_000, maxChars: 100 },
  closing: { durationMs: 60_000, maxChars: 300 },
};

const ROUND_LABELS = {
  opening: 'Opening',
  rebuttal: 'Rebuttal',
  closing: 'Closing',
};

export default function ArenaPage() {
  const { debateId } = useParams();
  const navigate = useNavigate();

  const [debate, setDebate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [argumentText, setArgumentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUpdatingReady, setIsUpdatingReady] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(0);

  const pollingRef = useRef(null);
  const timerRef = useRef(null);
  const deadlineRef = useRef(null);

  const sessionId = localStorage.getItem(`session_${debateId}`);
  const username = localStorage.getItem(`username_${debateId}`);

  const fetchDebateData = useCallback(async () => {
    try {
      const response = await api.get(`/debates/${debateId}`, {
        params: {
          sessionId,
        },
      });

      const debateData = response.data;
      setDebate(debateData);

      if (username) {
        const participant = debateData.participants.find((item) => item.username === username);
        if (participant) {
          setCurrentUser({
            username: participant.username,
            side: participant.side,
            sessionId,
          });
        }
      } else if (debateData.mode === 'ONLINE' && debateData.status === 'waiting') {
        navigate(`/join/${debateData.roomCode}`);
      }
    } catch (err) {
      console.error('Error loading debate details:', err);
      setError('Gagal memuat data debat. Pastikan server aktif.');
    } finally {
      setIsLoading(false);
      setNow(Date.now());
    }
  }, [debateId, navigate, sessionId, username]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchDebateData();
    });

    pollingRef.current = setInterval(() => {
      void fetchDebateData();
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [debateId, fetchDebateData]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);

      if (deadlineRef.current && nextNow >= deadlineRef.current) {
        deadlineRef.current = null;
        void fetchDebateData();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchDebateData]);

  useEffect(() => {
    if (debate && debate.mode === 'ONLINE' && !currentUser && !isLoading) {
      navigate(`/join/${debate.roomCode}`);
    }
  }, [debate, currentUser, isLoading, navigate]);

  useEffect(() => {
    deadlineRef.current = debate?.currentRoundDeadline ? new Date(debate.currentRoundDeadline).getTime() : null;
  }, [debate?.currentRoundDeadline]);

  const handleSubmitArgument = async (e) => {
    e.preventDefault();
    if (!argumentText.trim()) return;
    if (!currentUser) {
      setError('Sesi Anda tidak valid. Silakan masuk kembali.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const currentRoundNum = debate.currentRound;
      const response = await api.post(`/debates/${debateId}/rounds/${currentRoundNum}/submit`, {
        sessionId: currentUser.sessionId,
        argument: argumentText,
      });

      setArgumentText('');
      setDebate(response.data.debate);
      await fetchDebateData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gagal mengirimkan argumen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    setError('');

    try {
      await api.post(`/debates/${debateId}/finalize`);
      navigate(`/result/${debateId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gagal menilai debat dengan AI.');
      setIsFinalizing(false);
    }
  };

  const handleCopyLink = () => {
    if (!debate) return;
    const frontendUrl = window.location.origin;
    navigator.clipboard.writeText(`${frontendUrl}/join/${debate.roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentRound = debate?.rounds.find((round) => round.roundNumber === debate.currentRound);
  const roundRules = debate?.roundRules || DEFAULT_ROUND_RULES;
  const activeRule = currentRound ? roundRules[currentRound.roundType] || DEFAULT_ROUND_RULES[currentRound.roundType] : null;
  const maxChars = activeRule?.maxChars || 300;
  const deadlineMs = debate?.currentRoundDeadline ? new Date(debate.currentRoundDeadline).getTime() : null;
  const remainingMs = deadlineMs ? Math.max(0, deadlineMs - now) : 0;
  const elapsedRatio = activeRule ? Math.min(1, 1 - remainingMs / activeRule.durationMs) : 0;
  const timeExpired = Boolean(activeRule && remainingMs <= 0);
  const readyCountdownMs = debate?.readyCountdownDeadline ? Math.max(0, new Date(debate.readyCountdownDeadline).getTime() - now) : 0;

  const proParticipant = debate?.participants.find((item) => item.side === 'pro');
  const contraParticipant = debate?.participants.find((item) => item.side === 'contra');
  const isWaitingRoom = debate?.status === 'waiting' && debate?.mode === 'ONLINE';
  const isCountdownRoom = debate?.status === 'countdown' && debate?.mode === 'ONLINE';
  const isDebateArgumentsFinished = debate?.rounds.every((round) => round.proArgument && round.contraArgument);
  const hasUserSubmitted = currentUser && currentRound && (
    (currentUser.side === 'pro' && currentRound.proArgument) ||
    (currentUser.side === 'contra' && currentRound.contraArgument)
  );
  const currentParticipant = debate?.participants.find((item) => item.username === currentUser?.username && item.side === currentUser?.side);
  const allHumanParticipantsReady = [proParticipant, contraParticipant]
    .filter((participant) => participant && !participant.isAI)
    .every((participant) => participant?.isReady);
  const hasBothOnlineParticipants = debate?.mode === 'ONLINE' && proParticipant && contraParticipant;

  const characterCount = argumentText.length;
  const characterProgress = Math.min(100, (characterCount / maxChars) * 100);

  const timerLabel = useMemo(() => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [remainingMs]);

  const readyCountdownLabel = useMemo(() => {
    const totalSeconds = Math.ceil(readyCountdownMs / 1000);
    return String(Math.max(0, totalSeconds));
  }, [readyCountdownMs]);

  const roundTypeInfo = {
    opening: 'Ronde 1: Opening. Paparkan argumen pembuka Anda secara jelas.',
    rebuttal: 'Ronde 2: Rebuttal. Sanggah inti argumen lawan secara singkat dan tepat.',
    closing: 'Ronde 3: Closing. Tutup debat dengan kesimpulan paling kuat.',
  };

  const handleReadyToggle = async () => {
    if (!currentUser || !debate) {
      return;
    }

    setIsUpdatingReady(true);
    setError('');

    try {
      const response = await api.post(`/debates/${debate.id}/ready`, {
        sessionId: currentUser.sessionId,
        ready: !currentParticipant?.isReady,
      });

      setDebate(response.data.debate);
      await fetchDebateData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gagal memperbarui status ready.');
    } finally {
      setIsUpdatingReady(false);
    }
  };

  const renderArgumentContent = (round, side) => {
    const isCurrentRound = round.roundNumber === debate.currentRound;
    const ownSide = currentUser?.side;
    const argument = side === 'pro' ? round.proArgument : round.contraArgument;
    const isOwnArgument = ownSide === side;
    const roundComplete = Boolean(round.proArgument && round.contraArgument);

    if (argument) {
      return argument;
    }

    if (isCurrentRound && !roundComplete) {
      if (isOwnArgument) {
        return <em className="text-xs text-slate-500">Anda belum mengirim argumen.</em>;
      }

      return <em className="text-xs text-slate-500">Argumen lawan disembunyikan sampai ronde selesai.</em>;
    }

    return <em className="text-xs text-slate-500">Belum ada argumen.</em>;
  };

  if (isLoading && !debate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid-pattern px-6">
        <div className="flex flex-col items-center space-y-4">
          <svg className="h-12 w-12 animate-spin text-amber-200" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-slate-400">Menyiapkan Arena Debat...</span>
        </div>
      </div>
    );
  }

  if (error && !debate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid-pattern p-6">
        <Card className="w-full max-w-md space-y-6 text-center">
          <ShieldAlert size={48} className="mx-auto text-red-300" />
          <h2 className="text-xl font-bold text-white">Terjadi Error</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Kembali
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-grid-pattern pb-12">
      <div className="pointer-events-none absolute left-0 top-0 h-[32rem] w-[32rem] -translate-x-1/4 blur-radial-indigo" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[32rem] w-[32rem] translate-x-1/4 blur-radial-cyan" />

      <header className="sticky top-0 z-10 border-b border-white/8 bg-[rgba(8,17,24,0.72)] px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] ${
              debate.mode === 'AI'
                ? 'border border-amber-200/15 bg-amber-200/8 text-amber-200'
                : 'border border-teal-200/15 bg-teal-300/8 text-teal-200'
            }`}>
              {debate.mode === 'AI' ? 'Mode Lawan AI' : 'Mode Lawan Teman'}
            </span>
            <h1 className="max-w-3xl text-lg font-bold leading-7 text-white md:text-2xl">
              {debate.topic}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {debate.mode === 'ONLINE' && (
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">
                Room {debate.roomCode}
              </div>
            )}
            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              Keluar Arena
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-4">
        <div className="space-y-6 md:col-span-1">
          <Card glow className="space-y-4 p-4">
            <h3 className="border-b border-white/8 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Peserta Arena
            </h3>

            <div className={`rounded-[22px] border p-4 ${currentUser?.side === 'pro' ? 'border-amber-300/25 bg-amber-200/10' : 'border-white/8 bg-white/[0.02]'}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-full border border-amber-200/15 bg-amber-200/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                  PRO
                </span>
                {currentUser?.side === 'pro' && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200">Anda</span>
                )}
              </div>
              <span className="text-sm font-bold text-white">{proParticipant ? proParticipant.username : 'Menunggu...'}</span>
            </div>

            <div className={`rounded-[22px] border p-4 ${currentUser?.side === 'contra' ? 'border-teal-300/25 bg-teal-300/10' : 'border-white/8 bg-white/[0.02]'}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-full border border-teal-200/15 bg-teal-300/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200">
                  KONTRA
                </span>
                {currentUser?.side === 'contra' && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200">Anda</span>
                )}
              </div>
              <span className="text-sm font-bold text-white">
                {contraParticipant ? (contraParticipant.isAI ? 'AI Nalar (Lawan)' : contraParticipant.username) : 'Menunggu...'}
              </span>
            </div>
          </Card>

          {currentUser && (
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-400">
              Anda berdebat sebagai <strong className="text-slate-100">{currentUser.username}</strong> di pihak{' '}
              <strong className={currentUser.side === 'pro' ? 'text-amber-200' : 'text-teal-200'}>
                {currentUser.side.toUpperCase()}
              </strong>.
            </div>
          )}
        </div>

        <div className="space-y-6 md:col-span-3">
          {isWaitingRoom || isCountdownRoom ? (
            <Card glow className="mx-auto max-w-xl space-y-6 px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-teal-200/20 bg-teal-300/10 text-teal-200">
                <Users size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  {isCountdownRoom ? 'Debat Akan Dimulai...' : 'Lobby Room Debat'}
                </h2>
                <p className="mx-auto max-w-md text-sm leading-7 text-slate-400">
                  {hasBothOnlineParticipants
                    ? 'Kedua pemain sudah masuk. Tekan ready, dan debat akan otomatis dimulai 5 detik setelah semua siap.'
                    : 'Berikan kode room atau salin link undangan di bawah ini agar lawan dapat masuk ke arena debat Anda.'}
                </p>
              </div>

              <div className="mx-auto max-w-sm space-y-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Kode Room</span>
                  <span className="text-4xl font-black tracking-[0.24em] text-teal-200">{debate.roomCode}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  {copied ? <span className="text-teal-200">Tersalin ke Clipboard!</span> : <><Copy size={14} /><span>Salin Link Undangan</span></>}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[proParticipant, contraParticipant].map((participant) => (
                  <div
                    key={participant?.id || participant?.side}
                    className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-left"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                        participant?.side === 'pro'
                          ? 'border border-amber-200/20 bg-amber-200/10 text-amber-200'
                          : 'border border-teal-200/20 bg-teal-300/10 text-teal-200'
                      }`}>
                        {participant?.side?.toUpperCase() || 'MENUNGGU'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        participant?.isReady ? 'text-teal-200' : 'text-slate-500'
                      }`}>
                        <CheckCircle2 size={14} />
                        {participant?.isReady ? 'Ready' : 'Belum ready'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      {participant?.username || 'Menunggu pemain...'}
                    </div>
                  </div>
                ))}
              </div>

              {hasBothOnlineParticipants && currentParticipant && (
                <div className="space-y-4">
                  {isCountdownRoom ? (
                    <div className="rounded-[24px] border border-teal-200/20 bg-teal-300/10 px-6 py-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">
                        Countdown Mulai
                      </p>
                      <p className="mt-3 text-5xl font-black text-white">{readyCountdownLabel}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        Semua pemain sudah ready. Debat akan dimulai otomatis.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-5">
                      <p className="text-sm leading-7 text-slate-300">
                        Status Anda saat ini: <strong className={currentParticipant.isReady ? 'text-teal-200' : 'text-amber-200'}>
                          {currentParticipant.isReady ? 'READY' : 'BELUM READY'}
                        </strong>
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleReadyToggle}
                    isLoading={isUpdatingReady}
                    variant={currentParticipant.isReady ? 'secondary' : 'accent'}
                    className="mx-auto w-full max-w-sm"
                  >
                    {currentParticipant.isReady ? 'Batalkan Ready' : 'Saya Siap'}
                  </Button>
                </div>
              )}

              {hasBothOnlineParticipants && !allHumanParticipantsReady && (
                <p className="text-sm leading-7 text-slate-400">
                  Debat belum akan dimulai sampai kedua pemain menekan tombol ready.
                </p>
              )}
            </Card>
          ) : (
            <>
              <Card className="px-6 py-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {debate.rounds.map((round) => {
                    const isActive = debate.currentRound === round.roundNumber;
                    const isCompleted = round.proArgument && round.contraArgument;

                    return (
                      <div
                        key={round.id}
                        className={`rounded-[22px] border px-4 py-3 ${
                          isActive
                            ? 'border-amber-300/25 bg-amber-200/10 text-amber-100'
                            : isCompleted
                              ? 'border-teal-300/20 bg-teal-300/10 text-teal-100'
                              : 'border-white/8 bg-white/[0.02] text-slate-400'
                        }`}
                      >
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em]">Ronde {round.roundNumber}</div>
                        <div className="text-sm font-semibold">{ROUND_LABELS[round.roundType]}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div className="space-y-6">
                {debate.rounds
                  .filter((round) => round.proArgument || round.contraArgument)
                  .map((round) => (
                    <Card key={round.id} className="bg-white/[0.025] p-5">
                      <div className="mb-4 flex flex-col gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          Ronde {round.roundNumber}: {ROUND_LABELS[round.roundType]}
                        </span>
                        {round.proArgument && round.contraArgument && (
                          <span className="rounded-full border border-teal-300/15 bg-teal-300/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200">
                            Ronde Selesai
                          </span>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[22px] border border-amber-200/10 bg-amber-200/[0.04] p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-300" />
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                              PRO ({proParticipant?.username})
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                            {renderArgumentContent(round, 'pro')}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-teal-200/10 bg-teal-300/[0.04] p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-teal-300" />
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
                              KONTRA ({contraParticipant ? (contraParticipant.isAI ? 'AI Nalar' : contraParticipant.username) : 'Lawan'})
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                            {renderArgumentContent(round, 'contra')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>

              {!isDebateArgumentsFinished ? (
                <Card glow className="space-y-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Ronde Aktif</p>
                      <h3 className="text-lg font-bold text-white">
                        {roundTypeInfo[currentRound?.roundType] || 'Tulis Argumen Ronde Aktif'}
                      </h3>
                    </div>

                    {activeRule && (
                      <div className="min-w-[220px] rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                          <span className="inline-flex items-center gap-2">
                            <Timer size={14} />
                            Waktu
                          </span>
                          <span className={timeExpired ? 'text-red-200' : 'text-amber-200'}>{timerLabel}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${timeExpired ? 'bg-red-300' : 'bg-gradient-to-r from-amber-300 to-teal-300'}`}
                            style={{ width: `${Math.max(0, 100 - elapsedRatio * 100)}%` }}
                          />
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                          {ROUND_LABELS[currentRound?.roundType]} | Maks. {maxChars} karakter
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-[22px] border border-red-300/20 bg-red-400/8 p-3 text-xs font-semibold text-red-100">
                      {error}
                    </div>
                  )}

                  {hasUserSubmitted ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-10 text-center">
                      <svg className="h-8 w-8 animate-spin text-amber-200" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="max-w-lg text-sm leading-7 text-slate-400">
                        Argumen Anda berhasil dikirim. Jawaban lawan akan muncul setelah ronde ini selesai.
                      </p>
                    </div>
                  ) : timeExpired ? (
                    <div className="rounded-[24px] border border-red-300/20 bg-red-400/8 px-6 py-5 text-sm text-red-100">
                      Waktu ronde habis. Sistem sedang memperbarui status debat.
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitArgument} className="space-y-4">
                      <Textarea
                        value={argumentText}
                        onChange={(e) => setArgumentText(e.target.value.slice(0, maxChars))}
                        placeholder={`Tulis argumen ${currentUser?.side.toUpperCase()} Anda di sini...`}
                        disabled={isSubmitting}
                        rows={5}
                        maxLength={maxChars}
                      />

                      <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                          <span>Batas Karakter</span>
                          <span className={characterCount >= maxChars ? 'text-red-200' : 'text-amber-200'}>
                            {characterCount}/{maxChars}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className={`h-full rounded-full ${characterCount >= maxChars ? 'bg-red-300' : 'bg-gradient-to-r from-amber-300 to-teal-300'}`}
                            style={{ width: `${characterProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          isLoading={isSubmitting}
                          disabled={!argumentText.trim() || characterCount > maxChars || timeExpired}
                          icon={<Send size={16} />}
                          className="px-6"
                        >
                          Kirim Argumen
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              ) : (
                <Card glow className="space-y-6 py-8 text-center">
                  <div className="mx-auto inline-flex rounded-[24px] border border-teal-200/20 bg-teal-300/10 p-4 text-teal-100">
                    <MessageSquare size={28} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Debat Selesai</h2>
                    <p className="mx-auto max-w-md text-sm leading-7 text-slate-400">
                      Semua ronde argumen telah selesai. Saatnya memanggil AI Nalar untuk memberikan penilaian juri.
                    </p>
                  </div>

                  {error && (
                    <div className="mx-auto max-w-md rounded-[22px] border border-red-300/20 bg-red-400/8 p-3 text-xs font-semibold text-red-100">
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    {debate.result ? (
                      <Button
                        onClick={() => navigate(`/result/${debateId}`)}
                        className="mx-auto w-full max-w-sm bg-gradient-to-r from-teal-300 to-cyan-300 text-slate-950 shadow-[0_20px_50px_rgba(79,209,197,0.22)] hover:shadow-[0_24px_55px_rgba(79,209,197,0.3)]"
                      >
                        Lihat Hasil Akhir
                      </Button>
                    ) : (
                      <Button
                        onClick={handleFinalize}
                        isLoading={isFinalizing}
                        className="mx-auto w-full max-w-sm"
                      >
                        Mulai Penilaian Juri AI
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
