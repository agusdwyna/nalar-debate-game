import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../api/axios';

const fieldClassName =
  'w-full rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-slate-100 placeholder:text-slate-500 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-4 focus:ring-amber-300/12';

export default function JoinRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [debateInfo, setDebateInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await api.get(`/debates/room/${roomCode}`);
        setDebateInfo(response.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Room tidak ditemukan atau telah kedaluwarsa.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchRoomInfo();
  }, [roomCode]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Harap masukkan username Anda.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post(`/debates/${roomCode}/join`, { username });
      const { debateId, sessionId } = response.data;

      localStorage.setItem(`session_${debateId}`, sessionId);
      localStorage.setItem(`username_${debateId}`, username);

      navigate(`/arena/${debateId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gagal bergabung dengan room. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-grid-pattern px-6 py-6">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[28rem] w-[28rem] blur-radial-indigo" />

      <div className="relative z-10 mx-auto w-full max-w-2xl pb-6 pt-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Halaman Utama</span>
        </button>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <Card glow className="w-full max-w-2xl">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <svg className="h-10 w-10 animate-spin text-amber-200" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm font-medium text-slate-400">Memverifikasi kode room...</p>
            </div>
          ) : error && !debateInfo ? (
            <div className="space-y-6 py-6 text-center">
              <div className="rounded-[22px] border border-red-300/20 bg-red-400/8 p-4 text-sm font-medium text-red-100">
                {error}
              </div>
              <Button onClick={() => navigate('/')} variant="secondary" className="w-full">
                Kembali ke Halaman Utama
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-4 border-b border-white/8 pb-6">
                <div className="inline-flex rounded-[24px] border border-amber-200/20 bg-amber-200/8 p-4 text-amber-200">
                  <UserPlus size={24} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Join Room</p>
                  <h2 className="text-3xl font-bold text-white">Masuk ke Arena Debat</h2>
                  <p className="mt-2 text-sm text-slate-400">Kode Room: {roomCode}</p>
                </div>
              </div>

              <div className="mb-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                  Topik Debat
                </span>
                <p className="text-base font-medium leading-7 text-white">
                  {debateInfo?.topic}
                </p>
                {debateInfo?.participants?.length > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-300" />
                    <span>
                      Host: <strong className="font-semibold text-slate-200">{debateInfo.participants[0].username}</strong> ({debateInfo.participants[0].side.toUpperCase()})
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-6 rounded-[22px] border border-red-300/20 bg-red-400/8 p-4 text-sm font-medium text-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleJoin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200" htmlFor="guest-username">
                    Username Anda
                  </label>
                  <input
                    id="guest-username"
                    type="text"
                    placeholder="Masukkan username anda..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={fieldClassName}
                  />
                  <p className="pl-1 text-xs leading-6 text-slate-500">
                    Anda akan otomatis masuk ke pihak {debateInfo?.participants[0]?.side === 'pro' ? 'KONTRA' : 'PRO'}.
                  </p>
                </div>

                <div className="flex flex-col gap-4 border-t border-white/8 pt-6 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-xl text-sm leading-6 text-slate-400">
                    Setelah berhasil bergabung, Anda langsung diarahkan ke halaman arena yang sama.
                  </p>
                  <Button type="submit" isLoading={isLoading} className="w-full md:w-auto md:min-w-56">
                    Masuk Arena Debat
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
