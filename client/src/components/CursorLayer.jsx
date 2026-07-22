export default function CursorLayer({ cursors }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {cursors.map((cursor) => (
        <div
          key={cursor.socketId}
          className="absolute transition-all duration-75 ease-linear"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <div
            className="w-3 h-3 rounded-full border-2 border-black"
            style={{ backgroundColor: cursor.color }}
          />
          <span className="ml-2 -mt-1 inline-block bg-black text-white text-[10px] font-black px-1.5 py-0.5 rounded whitespace-nowrap">
            {cursor.username}
          </span>
        </div>
      ))}
    </div>
  );
}