import { DRAWING_COLORS, BRUSH_SIZES } from '../constants/gameConfig';

export default function ToolBar({
  activeColor,
  activeSize,
  tool,
  onColorChange,
  onSizeChange,
  onToolChange,
}) {
  return (
    <>
      <div className="w-20 shrink-0 flex flex-col gap-3 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0px_0px_#000000]">
        <div className="grid grid-cols-2 gap-2">
          {DRAWING_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                onColorChange(color);
                onToolChange('pen');
              }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === color && tool === 'pen'
                  ? 'border-black scale-110'
                  : 'border-gray-300'
                }`}
              style={{ backgroundColor: color }}
              aria-label={`Warna ${color}`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => onSizeChange(size.value)}
              className={`border-[2px] border-black py-1 text-xs font-black ${activeSize === size.value ? 'bg-[#FFE600]' : 'bg-white'
                }`}
            >
              {size.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onToolChange('eraser')}
          className={`border-[2px] border-black py-1.5 text-[10px] font-black uppercase leading-tight ${tool === 'eraser' ? 'bg-[#EB4B98] text-white' : 'bg-white'
            }`}
        >
          Hapus
        </button>
      </div>
    </>
  );
}