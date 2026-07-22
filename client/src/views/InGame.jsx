import { useState } from 'react';
import Canvas from '../components/Canvas';
import CursorLayer from '../components/CursorLayer';
import PlayerList from '../components/PlayerList';
import RoundTimer from '../components/RoundTimer';
import ScoreBadge from '../components/ScoreBadge';
import {
  DUMMY_CURSOR_POSITIONS,
  DUMMY_PLAYERS,
  DUMMY_TOPIC,
  DEFAULT_ROUND_DURATION,
} from '../constants/gameConfig';

export default function InGame() {
  const [totalScore, setTotalScore] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  const handleStroke = (stroke) => {
    console.log('stroke:', stroke);
    // TODO: ganti socket.emit('canvas:stroke', { roomCode, ...stroke }) pas services/socket.js siap
  };

  const handleTimeUp = () => {
    console.log('Waktu habis, ronde berakhir');
    // TODO: nanti trigger canvas:snapshotSubmit (kalau host) + tunggu round:over dari server
  };

  const cursorsWithPlayerInfo = DUMMY_CURSOR_POSITIONS.map((pos) => {
    const player = DUMMY_PLAYERS.find((p) => p.socketId === pos.socketId);
    return { ...pos, username: player?.username, color: player?.color };
  });

  return (
    <div
      className="min-h-screen flex gap-4 p-4 font-sans text-black"
      style={{
        backgroundColor: '#FDF8E4',
        backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Sidebar kiri: daftar pemain */}
      <aside className="w-56 shrink-0 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000000]">
        <h2 className="text-xs font-bold uppercase mb-3">Pemain</h2>
        <PlayerList players={DUMMY_PLAYERS} />
      </aside>

      {/* Area utama: topic bar + timer + canvas */}
      <main className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white border-[3px] border-black px-4 py-2 text-center font-black text-lg shadow-[3px_3px_0px_0px_#000000]">
            {DUMMY_TOPIC}
          </div>
          <RoundTimer
            key={roundNumber}
            durationSec={DEFAULT_ROUND_DURATION}
            onTimeUp={handleTimeUp}
          />
          <ScoreBadge totalScore={totalScore} />
        </div>

        <div className="relative flex-1"> {/* wajib relative, dipakai CursorLayer */}
          <Canvas onStroke={handleStroke} />
          <CursorLayer cursors={cursorsWithPlayerInfo} />
        </div>
      </main>
    </div>
  );
}