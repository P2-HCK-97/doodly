// components/RoundTimer.jsx (revisi, useEffect reset dihapus)
import { useState, useEffect } from 'react';
import { DEFAULT_ROUND_DURATION } from '../constants/gameConfig';

export default function RoundTimer({ durationSec = DEFAULT_ROUND_DURATION, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(durationSec);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = timeLeft <= 10;

  return (
    <>
      <div className={`border-[3px] border-black px-4 py-2 font-black text-lg shadow-[3px_3px_0px_0px_#000000] ${isUrgent ? 'bg-[#EB4B98] text-white' : 'bg-white text-black'}`}>
        {formatted}
      </div>
    </>
  );
}