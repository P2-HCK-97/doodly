import { useEffect, useMemo, useState } from "react";
import { Home, LoaderCircle, RotateCcw, Sparkles, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate, useParams } from "react-router";

import RoundResultCard from "../components/RoundResultCard";
import { useGame } from "../contexts/GameContext";
import { getRoomHistory } from "../services/api";
import { showToast } from "../utils/toastify";

export default function Result() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { state } = useGame();

  const [history, setHistory] = useState(() =>
    Array.isArray(state.roundHistory) ? state.roundHistory : [],
  );

  const [serverTotalScore, setServerTotalScore] = useState(
    state.totalScore || 0,
  );

  const [isLoading, setIsLoading] = useState(history.length === 0);

  const [errorMessage, setErrorMessage] = useState("");

  const totalScore = useMemo(() => {
    if (typeof serverTotalScore === "number" && serverTotalScore > 0) {
      return serverTotalScore;
    }

    return history.reduce(
      (total, round) => total + (Number(round.similarityScore) || 0),
      0,
    );
  }, [history, serverTotalScore]);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      if (!roomCode) {
        setErrorMessage("Kode room tidak ditemukan");

        setIsLoading(false);
        return;
      }

      try {
        /*
         * Data context bisa langsung ditampilkan,
         * tetapi REST API tetap dipanggil supaya
         * hasil tidak hilang ketika halaman di-refresh.
         */
        const data = await getRoomHistory(roomCode);

        if (!isMounted) {
          return;
        }

        const serverHistory = Array.isArray(data.roundHistory)
          ? data.roundHistory
          : [];

        setHistory(serverHistory);

        setServerTotalScore(Number(data.totalScore) || 0);

        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        /*
         * Jika data context masih tersedia,
         * halaman tetap bisa menampilkan hasil.
         */
        if (history.length === 0) {
          setErrorMessage(error.message);
          showToast.error(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  useEffect(() => {
    if (isLoading || history.length === 0) {
      return;
    }

    const particleCount = 200;

    const defaults = {
      origin: {
        y: 0.7,
      },
    };

    const fire = (particleRatio, options) => {
      confetti({
        ...defaults,
        ...options,
        particleCount: Math.floor(particleCount * particleRatio),
      });
    };

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    return () => {
      confetti.reset();
    };
  }, [history.length, isLoading]);

  const handleBackHome = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6 font-sans text-black"
        style={{
          backgroundColor: "#FDF8E4",
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[3px] border-black px-10 py-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center gap-4">
          <LoaderCircle className="w-12 h-12 animate-spin" />

          <div className="text-center">
            <h1 className="text-xl font-black uppercase">Memuat Hasil</h1>

            <p className="text-sm font-semibold text-gray-600">
              Mengambil galeri permainan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage && history.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6 font-sans text-black"
        style={{
          backgroundColor: "#FDF8E4",
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="w-full max-w-md bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#000000] text-center">
          <div className="text-5xl mb-4">😵</div>

          <h1 className="text-2xl font-black uppercase mb-2">
            Hasil Tidak Ditemukan
          </h1>

          <p className="text-sm font-semibold text-gray-700 mb-6">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={handleBackHome}
            className="w-full bg-[#FFE600] hover:bg-[#EB4B98] border-[3px] border-black px-6 py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes moveDots {
            0% {
              background-position: 0 0;
            }

            100% {
              background-position: 32px 32px;
            }
          }

          .animate-dots {
            animation: moveDots 2s linear infinite;
          }
        `}
      </style>

      <div
        className="min-h-screen p-6 sm:p-10 font-sans text-black animate-dots flex flex-col items-center"
        style={{
          backgroundColor: "#FDF8E4",
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="w-full max-w-5xl space-y-8">
          <header className="bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#000000] text-center relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#EB4B98] text-white border-[3px] border-black px-6 py-1 font-black text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] -rotate-2 flex items-center gap-2 whitespace-nowrap">
              <Trophy className="w-4 h-4" />
              Galeri Akhir Tim
            </div>

            <h1 className="font-black text-4xl sm:text-5xl uppercase tracking-tight mt-2 mb-2">
              Hebat, Tim! 🎉
            </h1>

            <p className="text-sm font-semibold text-gray-700 max-w-lg mx-auto mb-6">
              Inilah koleksi karya kolaborasi tim beserta penilaian dan roast
              dari AI.
            </p>

            <div className="inline-flex items-center gap-3 bg-[#FFE600] border-[3px] border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000000]">
              <Sparkles className="w-6 h-6" />

              <div className="text-left">
                <div className="text-[10px] font-black uppercase">
                  Total Skor Kumulatif
                </div>

                <div className="text-3xl font-black leading-none">
                  {totalScore} Poin
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs font-black uppercase text-gray-500">
              Room: {roomCode}
            </div>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 border-b-[3px] border-black pb-2">
              <span>🖼️</span>
              Galeri Hasil Tiap Ronde ({history.length})
            </h2>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {history.map((round, index) => (
                  <RoundResultCard
                    key={round.roundNumber || `${round.topic}-${index}`}
                    roundNumber={round.roundNumber || index + 1}
                    topic={round.topic}
                    similarityScore={round.similarityScore}
                    roastText={round.roastText}
                    canvasSnapshot={round.canvasSnapshot}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border-[3px] border-black p-10 shadow-[6px_6px_0px_0px_#000000] text-center">
                <div className="text-5xl mb-4">🎨</div>

                <h3 className="font-black text-xl uppercase">
                  Belum Ada Hasil Ronde
                </h3>

                <p className="text-sm font-semibold text-gray-600 mt-1">
                  Selesaikan permainan terlebih dahulu untuk melihat galeri.
                </p>
              </div>
            )}
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleBackHome}
              className="w-full sm:w-auto bg-white hover:bg-gray-200 border-[3px] border-black px-8 py-3.5 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ke Beranda
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
