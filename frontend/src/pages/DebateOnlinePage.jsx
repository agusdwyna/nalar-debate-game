import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Copy, QrCode, Users } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../api/axios';

const fieldClassName =
  'w-full rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-slate-100 placeholder:text-slate-500 transition-all duration-300 focus:border-teal-300/40 focus:outline-none focus:ring-4 focus:ring-teal-300/12';

export default function DebateOnlinePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    topic: '',
    side: 'pro',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.topic.trim()) {
      setError('Harap isi username dan topik debat terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/debates/online', formData);
      const { debateId, roomCode, inviteLink, qrCode, sessionId } = response.data;

      localStorage.setItem(`session_${debateId}`, sessionId);
      localStorage.setItem(`username_${debateId}`, formData.username);

      setRoomData({ debateId, roomCode, inviteLink, qrCode });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gagal membuat room. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!roomData) return;
    navigator.clipboard.writeText(roomData.inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-grid-pattern px-6 py-6">
      <div className="pointer-events-none absolute bottom-0 left-0 h-[32rem] w-[32rem] -translate-x-1/4 blur-radial-cyan" />

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
          {!roomData ? (
            <>
              <div className="mb-8 flex flex-col gap-5 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="inline-flex rounded-[24px] border border-teal-200/20 bg-teal-300/8 p-4 text-teal-200">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">Mode Online</p>
                    <h2 className="text-3xl font-bold text-white">Lawan Teman</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Buat room debat, bagikan akses, lalu masuk ke arena yang sama tanpa mengubah proses permainan.</p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                  Room 1 lawan 1
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
                            ? 'border-teal-300/35 bg-teal-300/12 text-teal-100 shadow-[0_18px_40px_rgba(79,209,197,0.12)]'
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
                            ? 'border-teal-300/35 bg-teal-300/12 text-teal-100 shadow-[0_18px_40px_rgba(79,209,197,0.12)]'
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
                    placeholder="Contoh: React lebih baik dari Vue"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className={fieldClassName}
                  />
                </div>

                <div className="flex flex-col gap-4 border-t border-white/8 pt-6 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-xl text-sm leading-6 text-slate-400">
                    Setelah room dibuat, link undangan dan QR code tetap tersedia seperti sebelumnya.
                  </p>
                  <Button type="submit" variant="accent" isLoading={isLoading} className="w-full md:w-auto md:min-w-56">
                    Buat Room Debat
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-8 text-center animate-slide-up">
              <div className="mx-auto inline-flex rounded-[24px] border border-teal-200/20 bg-teal-300/10 p-4 text-teal-100">
                <Check size={28} />
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">Room Siap Digunakan</p>
                <h2 className="text-3xl font-bold text-white">Room Debat Berhasil Dibuat</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
                  Undang teman Anda menggunakan kode room, link, atau QR code di bawah ini. Alur masuk ke arena tetap sama.
                </p>
              </div>

              <div className="grid gap-6 rounded-[28px] border border-white/8 bg-white/[0.03] p-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div className="space-y-5 text-left">
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Kode Room
                    </span>
                    <span className="text-4xl font-black tracking-[0.25em] text-teal-200">
                      {roomData.roomCode}
                    </span>
                  </div>

                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Link Undangan
                    </span>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        readOnly
                        value={roomData.inviteLink}
                        className="min-w-0 flex-1 rounded-[20px] border border-white/10 bg-[#081118] px-4 py-3 text-sm text-slate-300 outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
                        title="Salin Link"
                      >
                        {isCopied ? (
                          <span className="text-teal-200">Tersalin!</span>
                        ) : (
                          <>
                            <Copy size={16} />
                            Salin
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mx-auto flex max-w-[210px] flex-col items-center rounded-[28px] border border-white/10 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  {roomData.qrCode ? (
                    <img
                      src={roomData.qrCode}
                      alt="QR Code Invite"
                      className="h-40 w-40 object-contain"
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center bg-slate-100 text-slate-400">
                      <QrCode size={40} />
                    </div>
                  )}
                  <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Scan QR Code
                  </span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => navigate(`/arena/${roomData.debateId}`)}
                  className="w-full max-w-sm"
                >
                  Masuk Ke Arena Debat
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
