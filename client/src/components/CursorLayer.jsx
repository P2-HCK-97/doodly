export default function CursorLayer({ cursors = [] }) {
  const safeCursors = Array.isArray(cursors) ? cursors : [];

  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {safeCursors.map((cursor) => {
          if (!cursor || typeof cursor.x !== 'number' || typeof cursor.y !== 'number') return null;
          return (
            <div
              key={cursor.socketId || Math.random()}
              className="absolute transition-all duration-75 ease-linear flex items-center gap-1 z-30"
              style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-black shadow-[1px_1px_0px_0px_#000]"
                style={{ backgroundColor: cursor.color || '#EB4B98' }}
              />
              <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
                {cursor.username || 'Pemain'}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}