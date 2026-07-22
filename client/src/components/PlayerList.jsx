import PlayerAvatar from './PlayerAvatar';

export default function PlayerList({ players }) {
  return (
    <>
      <div className="flex flex-col gap-3">
        {players.map((player) => (
          <div
            key={player.socketId}
            className="flex items-center gap-3 border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000000]"
          >
            <PlayerAvatar seed={player.username} size="sm" ringColor={player.color} />
            <span className="font-bold text-sm truncate">{player.username}</span>
            {player.isHost && (
              <span className="ml-auto bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Host
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}