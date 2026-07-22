export default function CursorLayer({ cursors = [] }) {
  const safeCursors = Array.isArray(cursors) ? cursors : [];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      {safeCursors.map((cursor) => {
        if (
          !cursor ||
          typeof cursor.x !== "number" ||
          typeof cursor.y !== "number"
        ) {
          return null;
        }

        const username = cursor.username || "Doodly";

        const fallbackAvatarUrl = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(
          username,
        )}`;

        const avatarUrl = cursor.avatarUrl || fallbackAvatarUrl;

        return (
          <div
            key={cursor.socketId}
            className="absolute flex items-center gap-1.5 transition-all duration-75 ease-linear"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              transform: "translate(4px, 4px)",
            }}
          >
            <div
              className="w-8 h-8 shrink-0 rounded-full border-2 border-black bg-white overflow-hidden shadow-[2px_2px_0px_0px_#000000]"
              style={{
                outline: `2px solid ${cursor.color || "#EB4B98"}`,
              }}
            >
              <img
                src={avatarUrl}
                alt={`Avatar ${username}`}
                className="block w-full h-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = fallbackAvatarUrl;
                }}
              />
            </div>

            <span
              className="text-[10px] font-black uppercase text-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000000] whitespace-nowrap"
              style={{
                backgroundColor: cursor.color || "#EB4B98",
              }}
            >
              {username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
