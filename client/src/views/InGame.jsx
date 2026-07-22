import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CheckSquare, X } from "lucide-react";

import Canvas from "../components/Canvas";
import CursorLayer from "../components/CursorLayer";
import PlayerList from "../components/PlayerList";
import RoundOverModal from "../components/RoundOverModal";
import RoundTimer from "../components/RoundTimer";
import ScoreBadge from "../components/ScoreBadge";
import ToolBar from "../components/ToolBar";

import { useGame } from "../contexts/GameContext";
import socket from "../services/socket";
import { showToast } from "../utils/toastify";

import {
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_ROUND_DURATION,
} from "../constants/gameConfig";

const CURSOR_THROTTLE_MS = 50;
const DEFAULT_MAX_ROUNDS = 3;

export default function InGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  const activeRoomCode = roomCode || state.roomCode;

  const [totalScore, setTotalScore] = useState(state.totalScore || 0);

  const [roundNumber, setRoundNumber] = useState(1);
  const [maxRounds, setMaxRounds] = useState(DEFAULT_MAX_ROUNDS);

  const [roundDuration, setRoundDuration] = useState(DEFAULT_ROUND_DURATION);

  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);

  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);

  const [tool, setTool] = useState("pen");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isAiLoading, setIsAiLoading] = useState(false);

  const [summaryData, setSummaryData] = useState(null);

  const [isLastRound, setIsLastRound] = useState(false);

  const [remoteCursors, setRemoteCursors] = useState({});

  const canvasRef = useRef(null);
  const lastCursorEmitAtRef = useRef(0);
  const snapshotSubmittedRef = useRef(false);

  const isHostRef = useRef(false);
  const currentTopicRef = useRef(state.currentTopic);
  const roundNumberRef = useRef(roundNumber);

  const players = Array.isArray(state.players) ? state.players : [];

  const currentUser =
    players.find((player) => player.socketId === socket.id) || null;

  const isHost = Boolean(
    currentUser?.isHost || socket.id === state.hostSocketId,
  );

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    currentTopicRef.current = state.currentTopic;
  }, [state.currentTopic]);

  useEffect(() => {
    roundNumberRef.current = roundNumber;
  }, [roundNumber]);

  useEffect(() => {
    const handlePlayersUpdate = ({ players: updatedPlayers }) => {
      dispatch({
        type: "SET_PLAYERS",
        payload: updatedPlayers,
      });
    };

    const handleRoundStarted = ({
      topic,
      durationSec,
      currentRound,
      maxRounds: serverMaxRounds,
    }) => {
      const nextRound = Number(currentRound) || 1;

      const nextMaxRounds = Number(serverMaxRounds) || DEFAULT_MAX_ROUNDS;

      currentTopicRef.current = topic;
      roundNumberRef.current = nextRound;
      snapshotSubmittedRef.current = false;

      setRoundNumber(nextRound);
      setMaxRounds(nextMaxRounds);

      setRoundDuration(Number(durationSec) || DEFAULT_ROUND_DURATION);

      setIsModalOpen(false);
      setIsAiLoading(false);
      setSummaryData(null);
      setIsLastRound(false);
      setRemoteCursors({});

      canvasRef.current?.clear();

      dispatch({
        type: "ROUND_STARTED",
        payload: {
          topic,
          currentRound: nextRound,
          maxRounds: nextMaxRounds,
          durationSec,
        },
      });
    };

    const handleRoundOver = ({
      topic,
      currentRound,
      maxRounds: serverMaxRounds,
    }) => {
      const finishedRound = Number(currentRound) || roundNumberRef.current;

      const totalRounds = Number(serverMaxRounds) || maxRounds;

      roundNumberRef.current = finishedRound;

      setRoundNumber(finishedRound);
      setMaxRounds(totalRounds);
      setRemoteCursors({});

      setIsModalOpen(true);
      setIsAiLoading(true);

      dispatch({
        type: "ROUND_OVER",
        payload: {
          topic,
          currentRound: finishedRound,
          maxRounds: totalRounds,
        },
      });

      if (
        !isHostRef.current ||
        !canvasRef.current ||
        snapshotSubmittedRef.current
      ) {
        return;
      }

      const imageBase64 = canvasRef.current.getSnapshot();

      if (!imageBase64) {
        setIsAiLoading(false);

        showToast.error("Snapshot canvas gagal dibuat");

        return;
      }

      snapshotSubmittedRef.current = true;

      socket.emit(
        "canvas:snapshotSubmit",
        {
          roomCode: activeRoomCode,
          imageBase64,
        },
        (response) => {
          if (response?.error) {
            snapshotSubmittedRef.current = false;

            setIsAiLoading(false);
            showToast.error(response.error);
          }
        },
      );
    };

    const handleAiSummary = (data) => {
      const resultRoundNumber =
        Number(data.roundNumber) || roundNumberRef.current;

      const resultMaxRounds = Number(data.maxRounds) || maxRounds;

      const result = {
        roundNumber: resultRoundNumber,
        topic: data.topic || currentTopicRef.current || "Topik tidak tersedia",
        similarityScore: Number(data.similarityScore) || 0,
        roastText: data.roastText || "Karya gambar yang sangat unik!",
        canvasSnapshot: data.canvasSnapshot || null,
      };

      const finalRound = Boolean(
        data.isLastRound || resultRoundNumber >= resultMaxRounds,
      );

      setRoundNumber(resultRoundNumber);
      setMaxRounds(resultMaxRounds);
      setSummaryData(result);
      setIsAiLoading(false);
      setIsLastRound(finalRound);

      setTotalScore(Number(data.roomTotalScore) || 0);

      dispatch({
        type: "AI_SUMMARY_RECEIVED",
        payload: {
          ...result,
          roomTotalScore: Number(data.roomTotalScore) || 0,
          maxRounds: resultMaxRounds,
          isLastRound: finalRound,
          aiError: Boolean(data.aiError),
        },
      });

      if (data.aiError) {
        showToast.error("AI gagal menilai, hasil fallback digunakan");
      }
    };

    const handleCursorBroadcast = (cursorData) => {
      if (!cursorData?.socketId) {
        return;
      }

      setRemoteCursors((previousCursors) => ({
        ...previousCursors,
        [cursorData.socketId]: cursorData,
      }));
    };

    const handleStrokeBroadcast = (strokeData) => {
      canvasRef.current?.drawStroke(strokeData);
    };

    const handleCanvasClear = () => {
      canvasRef.current?.clear();
      setRemoteCursors({});
    };

    socket.on("room:playersUpdate", handlePlayersUpdate);

    socket.on("round:started", handleRoundStarted);

    socket.on("round:over", handleRoundOver);

    socket.on("round:aiSummary", handleAiSummary);

    socket.on("canvas:cursorBroadcast", handleCursorBroadcast);

    socket.on("canvas:strokeBroadcast", handleStrokeBroadcast);

    socket.on("canvas:clear", handleCanvasClear);

    return () => {
      socket.off("room:playersUpdate", handlePlayersUpdate);

      socket.off("round:started", handleRoundStarted);

      socket.off("round:over", handleRoundOver);

      socket.off("round:aiSummary", handleAiSummary);

      socket.off("canvas:cursorBroadcast", handleCursorBroadcast);

      socket.off("canvas:strokeBroadcast", handleStrokeBroadcast);

      socket.off("canvas:clear", handleCanvasClear);
    };
  }, [activeRoomCode, dispatch, maxRounds]);

  const handleStroke = (stroke) => {
    if (!activeRoomCode || isModalOpen) {
      return;
    }

    socket.emit("canvas:stroke", {
      roomCode: activeRoomCode,
      ...stroke,
    });
  };

  const handleMouseMoveCanvas = (event) => {
    if (!activeRoomCode || isModalOpen) {
      return;
    }

    const now = Date.now();

    if (now - lastCursorEmitAtRef.current < CURSOR_THROTTLE_MS) {
      return;
    }

    lastCursorEmitAtRef.current = now;

    const rect = event.currentTarget.getBoundingClientRect();

    socket.emit("canvas:cursorMove", {
      roomCode: activeRoomCode,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleTimeUp = () => {
    /*
     * Timer client hanya tampilan.
     * Server yang menentukan kapan ronde selesai
     * melalui event round:over.
     */
    console.log("Timer client habis, menunggu server");
  };

  const handleFinishEarly = () => {
    if (!isHost || !activeRoomCode) {
      return;
    }

    socket.emit(
      "round:end",
      {
        roomCode: activeRoomCode,
      },
      (response) => {
        if (response?.error) {
          showToast.error(response.error);
        }
      },
    );
  };

  const handleNextRound = () => {
    if (!isHost) {
      showToast.error("Menunggu host memulai ronde berikutnya");

      return;
    }

    if (!activeRoomCode) {
      showToast.error("Kode room tidak ditemukan");

      return;
    }

    socket.emit(
      "game:start",
      {
        roomCode: activeRoomCode,
      },
      (response) => {
        if (response?.error) {
          showToast.error(response.error);
          return;
        }

        /*
         * Modal tidak ditutup di callback ini.
         * Semua pemain akan menutup modal bersama-sama
         * saat menerima event round:started.
         */
      },
    );
  };

  const handleSeeResults = () => {
    setIsModalOpen(false);

    navigate(`/result/${activeRoomCode}`);
  };

  const handleExitGame = () => {
    const confirmed = window.confirm("Yakin ingin keluar dari room ini?");

    if (confirmed) {
      navigate("/");
    }
  };

  const cursorsWithPlayerInfo = Object.values(remoteCursors).filter(
    (cursor) => cursor?.socketId && cursor.socketId !== socket.id,
  );

  return (
    <div
      className="h-screen max-h-screen flex gap-4 p-4 font-sans text-black overflow-hidden"
      style={{
        backgroundColor: "#FDF8E4",
        backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
        backgroundSize: "32px 32px",
      }}
    >
      <aside className="w-56 shrink-0 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between mb-3 border-b-[2px] border-black pb-2">
            <h2 className="text-xs font-black uppercase">
              Pemain ({players.length})
            </h2>

            <span className="text-[10px] font-black uppercase bg-[#FFE600] px-1.5 py-0.5 border border-black">
              Ronde {roundNumber}/{maxRounds}
            </span>
          </div>

          <div className="overflow-y-auto">
            <PlayerList players={players} />
          </div>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={handleFinishEarly}
            disabled={isModalOpen}
            className="w-full bg-[#FFE600] hover:bg-[#EB4B98] disabled:opacity-50 disabled:cursor-not-allowed border-[3px] border-black py-2.5 px-3 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <CheckSquare className="w-4 h-4" />
            Selesai Lebih Awal
          </button>
        )}
      </aside>

      <ToolBar
        activeColor={brushColor}
        activeSize={brushSize}
        tool={tool}
        onColorChange={setBrushColor}
        onSizeChange={setBrushSize}
        onToolChange={setTool}
      />

      <main className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-stretch gap-3">
          <div className="flex-1 min-w-0 bg-white border-[3px] border-black px-4 py-2 text-center font-black text-sm shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2 min-h-[52px]">
            <span className="text-xs font-bold uppercase text-gray-500 shrink-0">
              Topik:
            </span>

            <span className="truncate leading-tight">
              {state.currentTopic || "Menunggu topik..."}
            </span>
          </div>

          <RoundTimer
            key={`${roundNumber}-${roundDuration}`}
            durationSec={roundDuration}
            onTimeUp={handleTimeUp}
            isRunning={!isModalOpen}
          />

          <ScoreBadge totalScore={totalScore} />

          <button
            type="button"
            onClick={handleExitGame}
            title="Keluar Game"
            className="bg-white hover:bg-red-400 border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        <div
          className="relative flex-1 min-w-0"
          onMouseMove={handleMouseMoveCanvas}
        >
          <Canvas
            ref={canvasRef}
            onStroke={handleStroke}
            brushColor={brushColor}
            brushSize={brushSize}
            tool={tool}
          />

          <CursorLayer cursors={cursorsWithPlayerInfo} />
        </div>
      </main>

      <RoundOverModal
        isOpen={isModalOpen}
        isLoading={isAiLoading}
        summaryData={summaryData}
        isLastRound={isLastRound}
        isHost={isHost}
        currentRound={roundNumber}
        maxRounds={maxRounds}
        onNextRound={handleNextRound}
        onSeeResults={handleSeeResults}
      />
    </div>
  );
}
