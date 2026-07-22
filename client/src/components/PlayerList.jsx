import PlayerAvatar from './PlayerAvatar';

export default function PlayerList({ players = [] }) {
  const safePlayers = Array.isArray(players) ? players : [];

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {safePlayers.map((player, idx) => (
          <div
            key={player?.socketId || player?.username || idx}
            className="flex items-center justify-between border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000000]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <PlayerAvatar seed={player?.username || 'Doodly'} size="sm" ringColor={player?.color} />
              <span className="font-bold text-xs truncate max-w-[100px]">{player?.username || 'Pemain'}</span>
            </div>
            {player?.isHost && (
              <span className="ml-1 bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 border border-black shrink-0">
                Host
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}