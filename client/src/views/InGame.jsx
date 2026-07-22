import { useNavigate, useParams } from "react-router";
import Canvas from "../components/Canvas";
import CursorLayer from "../components/CursorLayer";
import PlayerList from "../components/PlayerList";
import RoundTimer from "../components/RoundTimer";
import ScoreBadge from "../components/ScoreBadge";
import ToolBar from "../components/ToolBar";
import RoundOverModal from "../components/RoundOverModal";
import { useGame } from "../contexts/GameContext";
import { SquareCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  DUMMY_CURSOR_POSITIONS,
  DUMMY_PLAYERS,
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

  const players = state.players.length > 0 ? state.players : DUMMY_PLAYERS;
  const isHost = players[0]?.isHost ?? true;
  const maxRounds = 1;

  const handleStroke = (stroke) => {
    console.log("stroke:", stroke);
    // TODO: socket.emit('canvas:stroke', { roomCode, ...stroke })
  };

  const triggerRoundEnd = () => {
    setIsModalOpen(true);
    setIsAiLoading(true);

    // Dummy AI Summary trigger (nanti diganti listener socket 'round:aiSummary')
    setTimeout(() => {
      const mockSummary = {
        topic: DUMMY_TOPIC,
        similarityScore: Math.floor(Math.random() * 40) + 60,
        roastText:
          "Gambarnya lumayan mirip, tapi garis bukunya kayak abis kena gempa bumi! 7/10 buat usaha tim.",
        canvasSnapshot: null,
      };
      setSummaryData(mockSummary);
      setIsAiLoading(false);
      setTotalScore((prev) => prev + mockSummary.similarityScore);

      dispatch({
        type: "AI_SUMMARY_RECEIVED",
        payload: {
          roundNumber,
          ...mockSummary,
          roomTotalScore: totalScore + mockSummary.similarityScore,
        },
      });
    }, 1800);
  };

  const handleTimeUp = () => {
    console.log("Waktu habis! Menilai gambar...");
    triggerRoundEnd();
  };

  const handleFinishEarly = () => {
    console.log("Host menyelesaikan ronde lebih awal");
    triggerRoundEnd();
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

  const cursorsWithPlayerInfo = DUMMY_CURSOR_POSITIONS.map((pos) => {
    const player = players.find((p) => p.socketId === pos.socketId);
    return { ...pos, username: player?.username, color: player?.color };
  });

  return (
    <>
      <div
        className="min-h-screen flex gap-4 p-4 font-sans text-black"
        style={{
          backgroundColor: "#FDF8E4",
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      >
        <aside className="w-56 shrink-0 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b-[2px] border-black pb-2">
              <h2 className="text-xs font-black uppercase">
                Pemain ({players.length})
              </h2>
              <span className="text-[10px] font-black uppercase bg-[#FFE600] px-1.5 py-0.5 border border-black">
                Ronde {roundNumber}/{maxRounds}
              </span>
            </div>
            <PlayerList players={players} />
          </div>

          {isHost && (
            <button
              onClick={handleFinishEarly}
              className="w-full mt-4 bg-[#FFE600] hover:bg-[#EB4B98] border-[3px] border-black py-2.5 px-3 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SquareCheck className="w-4 h-4" /> Selesai Lebih Awal
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

        <main className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white border-[3px] border-black px-4 py-2 text-center font-black text-lg shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2">
              <span className="text-xs font-bold uppercase text-gray-500">
                Topik:
              </span>
              <span>{state.currentTopic || DUMMY_TOPIC}</span>
            </div>
            <RoundTimer
              key={roundNumber}
              durationSec={DEFAULT_ROUND_DURATION}
              onTimeUp={handleTimeUp}
            />
            <ScoreBadge totalScore={totalScore} />
            <button
              onClick={handleExitGame}
              title="Keluar Game"
              className="bg-white hover:bg-red-400 border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <X className="w-5 h-5 font-black text-black" />
            </button>
          </div>

          <div className="relative flex-1">
            <Canvas
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

        <RoundTimer
          key={roundNumber}
          durationSec={DEFAULT_ROUND_DURATION}
          onTimeUp={handleTimeUp}
          isRunning={!isModalOpen}
        />
      </div>
    </>
  );
}
