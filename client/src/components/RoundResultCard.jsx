import { Sparkles } from 'lucide-react';

export default function RoundResultCard({ roundNumber = 1, topic = '', similarityScore = 0, roastText = '', canvasSnapshot = null }) {
  return (
    <>
      <div className="bg-white border-[3px] border-black p-5 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-2 border-b-[3px] border-black pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black">
              Ronde #{roundNumber}
            </span>
            <h3 className="font-black text-lg uppercase tracking-tight mt-1 text-black">{topic || 'Topik Gambar'}</h3>
          </div>

          <div className="bg-[#EB4B98] border-[2px] border-black px-3 py-1 text-center shadow-[2px_2px_0px_0px_#000000]">
            <div className="text-[9px] font-black text-black uppercase">Skor AI</div>
            <div className="text-xl font-black text-white leading-none">{similarityScore}%</div>
          </div>
        </div>

        <div className="border-[3px] border-black bg-[#FDF8E4] p-2 shadow-[3px_3px_0px_0px_#000000] aspect-video flex items-center justify-center overflow-hidden">
          {canvasSnapshot ? (
            <img src={canvasSnapshot} alt={`Hasil Ronde ${roundNumber}`} className="w-full h-full object-contain bg-white border border-black" />
          ) : (
            <div className="text-xs font-bold text-gray-400 uppercase italic">Tidak Ada Gambar</div>
          )}
        </div>

        <div className="bg-[#FFE600] border-[2px] border-black p-3 shadow-[2px_2px_0px_0px_#000000]">
          <div className="text-[10px] font-black uppercase text-black mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Roast
          </div>
          <p className="text-xs font-bold text-black italic leading-snug">
            "{roastText || 'Tidak ada catatan khusus dari AI.'}"
          </p>
        </div>
      </div>
    </>
  );
}