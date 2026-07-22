import { useEffect, useRef, useState } from "react";
import { DEFAULT_ROUND_DURATION } from "../constants/gameConfig";

export default function RoundTimer({
  durationSec = DEFAULT_ROUND_DURATION,
  onTimeUp,
  isRunning = true,
}) {
  const [timeLeft, setTimeLeft] = useState(durationSec);

  const hasFinishedRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setTimeLeft(durationSec);
    hasFinishedRef.current = false;
  }, [durationSec]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    if (timeLeft <= 0) {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        onTimeUpRef.current?.();
      }

      return;
    }

    const timeoutId = setTimeout(() => {
      setTimeLeft((previousTime) => Math.max(0, previousTime - 1));
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [timeLeft, isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;

  const isUrgent = timeLeft <= 10;

  return (
    <div
      className={`border-[3px] border-black px-4 py-2 font-black text-lg shadow-[3px_3px_0px_0px_#000000] ${
        isUrgent ? "bg-[#EB4B98] text-white" : "bg-white text-black"
      }`}
    >
      {formattedTime}
    </div>
  );
}
