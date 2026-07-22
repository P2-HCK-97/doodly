import { useState, useEffect, useRef } from 'react';

export default function ScoreBadge({ totalScore = 0 }) {
  const [showDelta, setShowDelta] = useState(false);
  const [delta, setDelta] = useState(0);
  const prevScoreRef = useRef(totalScore);

  useEffect(() => {
    const diff = totalScore - prevScoreRef.current;

    if (diff > 0) {
      setDelta(diff);
      setShowDelta(true);

      const timeoutId = setTimeout(() => {
        setShowDelta(false);
      }, 2000);

      prevScoreRef.current = totalScore;
      return () => clearTimeout(timeoutId);
    }

    prevScoreRef.current = totalScore;
  }, [totalScore]);

  return (
    <div className="flex items-center gap-3 border-[3px] border-black bg-white px-4 py-2 shadow-[3px_3px_0px_0px_#000000]">
      <span className="text-xs font-bold uppercase">Skor</span>
      <span className="text-lg font-black">{totalScore}</span>

      {showDelta && (
        <span className="bg-[#4BEB98] text-black text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
          +{delta}
        </span>
      )}
    </div>
  );
}