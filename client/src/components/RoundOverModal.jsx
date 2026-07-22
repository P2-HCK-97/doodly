import { ArrowRight, Clock3, Sparkles, Trophy } from "lucide-react";

export default function RoundOverModal({
  isOpen,
  isLoading = false,
  summaryData = null,
  isLastRound = false,
  isHost = false,
  currentRound = 1,
  maxRounds = 3,
  onNextRound,
  onSeeResults,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white border-[3px] border-black p-6 sm:p-8 text-black shadow-[8px_8px_0px_0px_#000000]">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FFE600] border-[3px] border-black px-6 py-1 font-black text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] -rotate-1 flex items-center gap-2 whitespace-nowrap">
          <Sparkles className="w-4 h-4" />
          Ronde {currentRound}/{maxRounds} Selesai!
        </div>

        {isLoading ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[4px] border-black border-t-[#EB4B98] rounded-full animate-spin" />

            <div className="space-y-1">
              <h3 className="font-black text-xl uppercase">
                AI Sedang Menilai...
              </h3>

              <p className="text-sm font-semibold text-gray-700">
                Memeriksa hasil gambar tim dan menyiapkan komentar.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-5">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Topik Ronde
              </span>

              <h3 className="font-black text-2xl uppercase text-black">
                {summaryData?.topic || "Topik Gambar"}
              </h3>
            </div>

            {summaryData?.canvasSnapshot && (
              <div className="border-[3px] border-black bg-[#FDF8E4] p-2 shadow-[4px_4px_0px_0px_#000000]">
                <img
                  src={summaryData.canvasSnapshot}
                  alt="Snapshot hasil gambar"
                  className="w-full h-48 object-contain bg-white border-[2px] border-black"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 bg-[#EB4B98] border-[3px] border-black p-3 text-center text-white shadow-[3px_3px_0px_0px_#000000]">
                <div className="text-xs font-black uppercase text-black">
                  Kemiripan AI
                </div>

                <div className="text-3xl font-black text-white mt-1">
                  {summaryData?.similarityScore ?? 0}%
                </div>
              </div>

              <div className="sm:col-span-2 bg-[#FFE600] border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_#000000] flex flex-col justify-center">
                <div className="text-xs font-black uppercase text-black mb-1 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  AI Roast & Komentar
                </div>

                <p className="text-xs font-bold leading-relaxed text-black italic">
                  “{summaryData?.roastText || "Gambar ini sangat unik!"}”
                </p>
              </div>
            </div>

            <div className="pt-2">
              {isLastRound ? (
                <button
                  type="button"
                  onClick={onSeeResults}
                  className="w-full bg-[#EB4B98] hover:bg-[#FFE600] border-[3px] border-black py-3 font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  Lihat Hasil Akhir
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : isHost ? (
                <button
                  type="button"
                  onClick={onNextRound}
                  className="w-full bg-[#FFE600] hover:bg-[#EB4B98] border-[3px] border-black py-3 font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  Mulai Ronde Berikutnya
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-full bg-[#E2E8F0] border-[3px] border-black py-3 px-4 font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center gap-2 text-center">
                  <Clock3 className="w-4 h-4 animate-pulse shrink-0" />
                  Menunggu host memulai ronde berikutnya
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
