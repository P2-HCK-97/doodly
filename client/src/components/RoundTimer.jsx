import { useEffect, useRef, useState } from "react";
import { DEFAULT_ROUND_DURATION } from "../constants/gameConfig";

export default function RoundTimer({
  durationSec = DEFAULT_ROUND_DURATION,
  endsAt = null,
  onTimeUp,
  isRunning = true,
}) {
  const [timeLeft, setTimeLeft] = useState(
    Number(durationSec) || DEFAULT_ROUND_DURATION,
  );

  const targetTimeRef = useRef(null);
  const hasFinishedRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);

  /*
   * Menyimpan callback terbaru tanpa harus membuat
   * interval timer ulang setiap render.
   */
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  /*
   * Reset timer ketika ronde baru dimulai.
   *
   * Jika server mengirim endsAt, gunakan timestamp server.
   * Jika tidak ada, gunakan durationSec sebagai fallback.
   */
  useEffect(() => {
    const serverEndsAt = Number(endsAt);
    const safeDuration =
      Number(durationSec) || DEFAULT_ROUND_DURATION;

    targetTimeRef.current =
      Number.isFinite(serverEndsAt) && serverEndsAt > 0
        ? serverEndsAt
        : Date.now() + safeDuration * 1000;

    const initialRemaining = Math.max(
      0,
      Math.ceil(
        (targetTimeRef.current - Date.now()) / 1000,
      ),
    );

    setTimeLeft(initialRemaining);
    hasFinishedRef.current = false;
  }, [durationSec, endsAt]);

  /*
   * Timer tampilan client.
   *
   * Interval dibuat lebih cepat dari satu detik supaya
   * angka tetap akurat terhadap timestamp endsAt server.
   */
  useEffect(() => {
    if (!isRunning || !targetTimeRef.current) {
      return undefined;
    }

    const updateTimer = () => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil(
          (targetTimeRef.current - Date.now()) / 1000,
        ),
      );

      setTimeLeft(remainingSeconds);

      if (
        remainingSeconds <= 0 &&
        !hasFinishedRef.current
      ) {
        hasFinishedRef.current = true;
        onTimeUpRef.current?.();
      }
    };

    updateTimer();

    const intervalId = window.setInterval(
      updateTimer,
      250,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, durationSec, endsAt]);

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
        isUrgent
          ? "bg-[#EB4B98] text-white animate-pulse"
          : "bg-white text-black"
      }`}
    >
      {formattedTime}
    </div>
  );
}