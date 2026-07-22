import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useGame } from '../contexts/GameContext';
import PlayerList from '../components/PlayerList';
import { MIN_PLAYERS_TO_START } from '../constants/gameConfig';
import socket from '../services/socket';

export default function Lobby() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { roomCode } = useParams();

  useEffect(() => {
    socket.on('room:playersUpdate', (data) => {
      dispatch({ type: 'SET_PLAYERS', payload: data.players });
    });

    socket.on('round:started', ({ topic }) => {
      dispatch({ type: 'ROUND_STARTED', payload: { topic } });
      navigate(`/game/${roomCode}`);
    });

    return () => {
      socket.off('room:playersUpdate');
      socket.off('round:started');
    };
  }, [dispatch, navigate, roomCode]);

  const canStart = state.players.length >= MIN_PLAYERS_TO_START;
  const currentUser = state.players.find((p) => p.socketId === socket.id) || state.players[0];
  const isHost = Boolean(currentUser?.isHost || (state.hostSocketId && currentUser?.socketId === state.hostSocketId) || state.players[0]?.socketId === socket.id);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const  handleStart = () => {
    console.log('Emit socket game:start', roomCode);
    socket.emit('game:start', { roomCode }, (response) => {
      if (response?.error) {
        console.error('Gagal memulai game:', response.error);
      }
    });
  };

  return (
    <>
      <style>
        {`
          @keyframes moveDots {
            0% { background-position: 0px 0px; }
            100% { background-position: 32px 32px; }
          }
          .animate-dots {
            animation: moveDots 2s linear infinite;
          }
          dialog::backdrop {
            background: rgba(0, 0, 0, 0.6);
          }
        `}
      </style>

      <div
        className="min-h-screen flex items-center justify-center p-6 font-sans text-black animate-dots"
        style={{
          backgroundColor: '#FDF8E4',
          backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="bg-white border-[3px] border-black w-full max-w-sm p-8 shadow-[8px_8px_0px_0px_#000000]">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Ruang Tunggu</h2>

          <div className="mb-6">
            <label className="block text-xs font-bold mb-2 uppercase">Kode Room</label>
            <div className="flex gap-2">
              <div className="flex-1 border-[3px] border-black px-4 py-3 text-center text-xl tracking-widest font-black">
                {roomCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="border-[3px] border-black px-4 font-black text-sm uppercase bg-[#FFE600] hover:bg-[#EB4B98] shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold mb-2 uppercase">
              Pemain ({state.players.length})
            </label>
            <PlayerList players={state.players} />
          </div>

          <p className="text-xs font-semibold text-center mb-4">
            {canStart
              ? 'Semua siap! Host bisa mulai kapan aja.'
              : `Menunggu pemain lain... (minimal ${MIN_PLAYERS_TO_START})`}
          </p>

          {isHost && (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="w-full text-center bg-[#EB4B98] border-[3px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000000] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Mulai
            </button>
          )}
        </div>
      </div>
    </>
  );
}