import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';
import { useGame } from '../contexts/GameContext';
import RoundResultCard from '../components/RoundResultCard';
import { Trophy, Home, RotateCcw, Sparkles } from 'lucide-react';

const MOCK_ROUND_HISTORY = [
  {
    roundNumber: 1,
    topic: 'Kucing Terbang',
    similarityScore: 88,
    roastText: 'Kreatif banget! Kucingnya lebih keliatan kayak bantal bersayap, tapi AI tetep terkesima sama usaha kolaborasi kalian.',
    canvasSnapshot: null,
  },
];

export default function Result() {
  const { state } = useGame();
  const navigate = useNavigate();

  const history = state.roundHistory && state.roundHistory.length > 0 ? state.roundHistory : MOCK_ROUND_HISTORY;
  const totalScore = history.reduce((sum, item) => sum + (item.similarityScore || 0), 0);

  useEffect(() => {
    // Jalankan efek confetti selebrasi saat halaman hasil terbuka
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes moveDots {
            0% { background-position: 0px 0px; }
            100% { background-position: 32px 32px; }
          }
          .animate-dots {
            animation: moveDots 2s linear infinite;
          }
        `}
      </style>

      <div
        className="min-h-screen p-6 sm:p-10 font-sans text-black animate-dots flex flex-col items-center"
        style={{
          backgroundColor: '#FDF8E4',
          backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="w-full max-w-4xl space-y-8">
          <div className="bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#000000] text-center relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#EB4B98] text-white border-[3px] border-black px-6 py-1 font-black text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] -rotate-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-white" /> Galeri Akhir Tim
            </div>

            <h1 className="font-black text-4xl sm:text-5xl uppercase tracking-tight text-black mt-2 mb-2">
              HEBAT, TIM! 🎉
            </h1>
            <p className="text-sm font-semibold text-gray-700 max-w-md mx-auto mb-6">
              Inilah koleksi karya kolaborasi tim kamu beserta penilaian jujur dan roast dari AI.
            </p>

            <div className="inline-flex items-center gap-3 bg-[#FFE600] border-[3px] border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000000]">
              <Sparkles className="w-6 h-6 text-black" />
              <div className="text-left">
                <div className="text-[10px] font-black uppercase text-black">Total Skor Kumulatif</div>
                <div className="text-3xl font-black text-black leading-none">{totalScore} Poin</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 border-b-[3px] border-black pb-2">
              <span>🖼️</span> Galeri Hasil Tiap Ronde ({history.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {history.map((item, idx) => (
                <RoundResultCard
                  key={idx}
                  roundNumber={item.roundNumber || idx + 1}
                  topic={item.topic}
                  similarityScore={item.similarityScore}
                  roastText={item.roastText}
                  canvasSnapshot={item.canvasSnapshot}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-[#FFE600] hover:bg-[#EB4B98] border-[3px] border-black px-8 py-3.5 font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Main Lagi
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-white hover:bg-gray-200 border-[3px] border-black px-8 py-3.5 font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Ke Beranda
            </button>
          </div>
        </div>
      </div>
    </>
  );
}