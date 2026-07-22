import { useNavigate, useParams } from "react-router";
import Canvas from "../components/Canvas";
import CursorLayer from "../components/CursorLayer";
import PlayerList from "../components/PlayerList";
import RoundTimer from "../components/RoundTimer";
import ScoreBadge from "../components/ScoreBadge";
import ToolBar from "../components/ToolBar";
import RoundOverModal from "../components/RoundOverModal";
import { useGame } from "../contexts/GameContext";
import socket from "../services/socket";
import { CheckSquare, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DUMMY_TOPIC,
  DEFAULT_ROUND_DURATION,
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_SIZE,
} from "../constants/gameConfig";

export default function InGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  const [totalScore, setTotalScore] = useState(state.totalScore || 0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [tool, setTool] = useState("pen");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Live Socket States
  const [remoteCursors, setRemoteCursors] = useState({});
  const canvasRef = useRef(null);

  const players = Array.isArray(state.players) ? state.players : [];
  const currentUser = players.find((p) => p.socketId === socket.id) || players[0];
  const isHost = Boolean(
    currentUser?.isHost ||
      (state.hostSocketId && currentUser?.socketId === state.hostSocketId) ||
      players[0]?.socketId === socket.id
  );
  const maxRounds = 1;

  useEffect(() => {
    // 1. Listen update daftar pemain
    socket.on("room:playersUpdate", (data) => {
      dispatch({ type: "SET_PLAYERS", payload: data.players });
    });

    // 2. Listen ronde dimulai
    socket.on("round:started", ({ topic }) => {
      dispatch({ type: "ROUND_STARTED", payload: { topic } });
    });

    // 3. Listen ronde selesai dari server
    socket.on("round:over", ({ topic }) => {
      setIsModalOpen(true);
      setIsAiLoading(true);

      // Jika Host, langsung ambil snapshot canvas & submit ke server untuk dinilai AI Gemini
      if (isHost && canvasRef.current) {
        const imageBase64 = canvasRef.current.getSnapshot();
        if (imageBase64) {
          socket.emit(
            "canvas:snapshotSubmit",
            { roomCode: roomCode || state.roomCode, imageBase64 },
            (res) => {
              if (res?.error) {
                console.error("Gagal submit snapshot:", res.error);
              }
            }
          );
        }
      }
    });

    // 4. Listen hasil AI Summary dari server beneran
    socket.on("round:aiSummary", (data) => {
      setSummaryData({
        topic: data.topic || state.currentTopic || DUMMY_TOPIC,
        similarityScore: data.similarityScore ?? 0,
        roastText: data.roastText || "Karya gambar yang unik!",
        canvasSnapshot: data.canvasSnapshot || null,
      });

      setIsAiLoading(false);
      setTotalScore(data.roomTotalScore ?? 0);

      dispatch({
        type: "AI_SUMMARY_RECEIVED",
        payload: {
          roundNumber: 1,
          topic: data.topic || state.currentTopic || DUMMY_TOPIC,
          similarityScore: data.similarityScore ?? 0,
          roastText: data.roastText || "Karya gambar yang unik!",
          canvasSnapshot: data.canvasSnapshot || null,
          roomTotalScore: data.roomTotalScore ?? 0,
        },
      });
    });

    // 5. Listen pergerakan kursor pemain lain
    socket.on("canvas:cursorBroadcast", (cursorData) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [cursorData.socketId]: cursorData,
      }));
    });

    // 6. Listen coretan canvas dari pemain lain
    socket.on("canvas:strokeBroadcast", (strokeData) => {
      if (canvasRef.current && strokeData) {
        canvasRef.current.drawStroke(strokeData);
      }
    });

    // 7. Listen perintah clear canvas dari host
    socket.on("canvas:clear", () => {
      if (canvasRef.current) {
        canvasRef.current.clear();
      }
    });

    return () => {
      socket.off("room:playersUpdate");
      socket.off("round:started");
      socket.off("round:over");
      socket.off("round:aiSummary");
      socket.off("canvas:cursorBroadcast");
      socket.off("canvas:strokeBroadcast");
      socket.off("canvas:clear");
    };
  }, [dispatch, isHost, roomCode, state.currentTopic, state.roomCode]);

  const handleStroke = (stroke) => {
    socket.emit("canvas:stroke", {
      roomCode: roomCode || state.roomCode,
      ...stroke,
    });
  };

  const handleMouseMoveCanvas = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit("canvas:cursorMove", {
      roomCode: roomCode || state.roomCode,
      x,
      y,
    });
  };

  const handleTimeUp = () => {
    console.log("Waktu habis di client!");
  };

  const handleFinishEarly = () => {
    if (isHost) {
      console.log("Host mengakhiri ronde lebih awal");
      socket.emit("round:end", { roomCode: roomCode || state.roomCode }, (res) => {
        if (res?.error) {
          console.error("Gagal mengakhiri ronde:", res.error);
        }
      });
    }
  };

  const handleNextRound = () => {
    setIsModalOpen(false);
    setSummaryData(null);
    setRoundNumber((prev) => prev + 1);
  };

  const handleSeeResults = () => {
    setIsModalOpen(false);
    navigate(`/result/${roomCode || state.roomCode}`);
  };

  const handleExitGame = () => {
    if (window.confirm("Yakin ingin keluar dari room ini?")) {
      navigate("/");
    }
  };

  // Hanya tampilkan kursor pemain lain yang sedang aktif (filter kursor sendiri)
  const cursorsWithPlayerInfo = Object.values(remoteCursors).filter(
    (c) => c && c.socketId && c.socketId !== socket.id
  );

  return (
    <>
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
              onClick={handleFinishEarly}
              className="w-full bg-[#FFE600] hover:bg-[#EB4B98] border-[3px] border-black py-2.5 px-3 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <CheckSquare className="w-4 h-4" /> Selesai Lebih Awal
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
              <span className="truncate leading-tight">{state.currentTopic || DUMMY_TOPIC}</span>
            </div>
            <RoundTimer
              key={roundNumber}
              durationSec={DEFAULT_ROUND_DURATION}
              onTimeUp={handleTimeUp}
              isRunning={!isModalOpen}
            />
            <ScoreBadge totalScore={totalScore} />
            <button
              onClick={handleExitGame}
              title="Keluar Game"
              className="bg-white hover:bg-red-400 border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5 font-black text-black" />
            </button>
          </div>

          <div className="relative flex-1 min-w-0" onMouseMove={handleMouseMoveCanvas}>
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
          isLastRound={roundNumber >= maxRounds}
          onNextRound={handleNextRound}
          onSeeResults={handleSeeResults}
        />
      </div>
    </>
  );
}