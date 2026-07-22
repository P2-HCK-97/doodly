import { useEffect, useMemo, useState } from "react";
import { Clipboard, LoaderCircle, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import PlayerList from "../components/PlayerList";
import { MIN_PLAYERS_TO_START } from "../constants/gameConfig";
import { useGame } from "../contexts/GameContext";
import socket from "../services/socket";
import { showToast } from "../utils/toastify";

export default function Lobby() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { roomCode } = useParams();

  const [isStarting, setIsStarting] = useState(false);

  const activeRoomCode = roomCode || state.roomCode;

  const players = Array.isArray(state.players) ? state.players : [];

  const currentUser = useMemo(() => {
    return players.find((player) => player.socketId === socket.id) || null;
  }, [players]);

  const isHost = Boolean(
    currentUser?.isHost ||
    (state.hostSocketId && socket.id === state.hostSocketId),
  );

  const canStart = players.length >= MIN_PLAYERS_TO_START;

  useEffect(() => {
    const handlePlayersUpdate = ({ players: updatedPlayers }) => {
      dispatch({
        type: "SET_PLAYERS",
        payload: Array.isArray(updatedPlayers) ? updatedPlayers : [],
      });
    };

    const handleRoundStarted = ({
      topic,
      durationSec,
      endsAt,
      currentRound,
      maxRounds,
    }) => {
      setIsStarting(false);

      dispatch({
        type: "ROUND_STARTED",
        payload: {
          topic,
          durationSec,
          endsAt,
          currentRound,
          maxRounds,
        },
      });

      navigate(`/game/${activeRoomCode}`);
    };

    socket.on("room:playersUpdate", handlePlayersUpdate);

    socket.on("round:started", handleRoundStarted);

    return () => {
      socket.off("room:playersUpdate", handlePlayersUpdate);

      socket.off("round:started", handleRoundStarted);
    };
  }, [activeRoomCode, dispatch, navigate]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeRoomCode);

      showToast.success("Kode room berhasil disalin");
    } catch (error) {
      console.error("Gagal menyalin kode room:", error);

      showToast.error("Gagal menyalin kode room");
    }
  };

  const handleStart = () => {
    if (!isHost) {
      showToast.error("Hanya host yang bisa memulai permainan");

      return;
    }

    if (!canStart) {
      showToast.error(`Minimal ${MIN_PLAYERS_TO_START} pemain untuk memulai`);

      return;
    }

    if (!activeRoomCode) {
      showToast.error("Kode room tidak ditemukan");

      return;
    }

    if (isStarting) {
      return;
    }

    setIsStarting(true);

    socket.emit(
      "game:start",
      {
        roomCode: activeRoomCode,
      },
      (response) => {
        if (response?.error) {
          setIsStarting(false);
          showToast.error(response.error);

          return;
        }

        /*
         * Jangan navigate di callback.
         *
         * Semua pemain, termasuk host, akan
         * berpindah halaman bersama setelah
         * menerima event round:started.
         */
      },
    );
  };

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
        className="min-h-screen flex items-center justify-center p-6 font-sans text-black animate-dots"
        style={{
          backgroundColor: "#FDF8E4",
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[3px] border-black w-full max-w-sm p-8 shadow-[8px_8px_0px_0px_#000000]">
          <div className="mb-6">
            <p className="text-xs font-black uppercase text-[#EB4B98] mb-1">
              Doodly Room
            </p>

            <h1 className="text-2xl font-black uppercase tracking-tight">
              Ruang Tunggu
            </h1>

            <p className="text-xs font-semibold text-gray-600 mt-1">
              Bagikan kode room dan tunggu pemain lain bergabung.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-black mb-2 uppercase">
              Kode Room
            </label>

            <div className="flex gap-2">
              <div className="flex-1 min-w-0 border-[3px] border-black px-4 py-3 text-center text-xl tracking-[0.25em] font-black bg-[#FDF8E4]">
                {activeRoomCode || "-----"}
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!activeRoomCode}
                title="Salin kode room"
                className="border-[3px] border-black px-4 font-black text-sm uppercase bg-[#FFE600] hover:bg-[#EB4B98] disabled:opacity-40 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center"
              >
                <Clipboard className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase">Pemain</label>

              <span className="bg-[#FFE600] border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">
                {players.length} Pemain
              </span>
            </div>

            {players.length > 0 ? (
              <PlayerList players={players} />
            ) : (
              <div className="border-[3px] border-black p-5 text-center bg-gray-100">
                <LoaderCircle className="w-6 h-6 mx-auto animate-spin mb-2" />

                <p className="text-xs font-black uppercase">Memuat pemain...</p>
              </div>
            )}
          </div>

          <div className="border-[3px] border-black bg-[#FDF8E4] p-3 mb-5 text-center">
            {canStart ? (
              <p className="text-xs font-black">
                Semua siap! Host sudah bisa memulai permainan.
              </p>
            ) : (
              <p className="text-xs font-semibold">
                Menunggu pemain lain...
                <br />
                Minimal <strong>{MIN_PLAYERS_TO_START}</strong> pemain.
              </p>
            )}
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="w-full bg-[#EB4B98] hover:bg-[#FFE600] border-[3px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000000] disabled:opacity-40 disabled:cursor-not-allowed active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Memulai...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Mulai Permainan
                </>
              )}
            </button>
          ) : (
            <div className="w-full bg-gray-200 border-[3px] border-black py-3 px-4 font-black text-xs uppercase text-center shadow-[4px_4px_0px_0px_#000000]">
              Menunggu host memulai permainan
            </div>
          )}

          <p className="text-[10px] font-bold text-gray-500 text-center uppercase mt-5">
            Permainan terdiri dari {state.maxRounds || 3} ronde
          </p>
        </div>
      </div>
    </>
  );
}
