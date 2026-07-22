export default function PlayerAvatar({ seed, size = 'md', ringColor }) {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <>
      <div
        className={`${sizeMap[size]} rounded-full border-[3px] border-black bg-[#E2E8F0] overflow-hidden shadow-[4px_4px_0px_0px_#000000] hover:scale-105 transition-transform`}
        style={ringColor ? { borderColor: ringColor } : undefined}
      >
        <img
          src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`}
          alt={seed}
          className="w-full h-full object-cover"
        />
      </div>
    </>
  );
}