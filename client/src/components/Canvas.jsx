import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const Canvas = forwardRef(function Canvas({ onStroke, brushColor = '#000000', brushSize = 4, tool = 'pen' }, ref) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Nyimpen titik terakhir tiap pemain lain, biar bisa gambar garis
  // dari titik lama ke titik baru pas 'move' masuk (bukan cuma titik doang)
  const remoteLastPoints = useRef({});

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL('image/png');
    },

    drawStroke: (strokeData) => {
      const context = contextRef.current;
      if (!context || !strokeData) return;

      const { socketId, x, y, type, color, size, tool: strokeTool } = strokeData;

      // save/restore biar warna & ukuran milik pemain lain
      // gak "nempel" ke pengaturan brush milik kita sendiri
      context.save();
      context.strokeStyle = color || '#000000';
      context.lineWidth = size || 4;
      context.lineCap = 'round';
      context.globalCompositeOperation = strokeTool === 'eraser' ? 'destination-out' : 'source-over';

      if (type === 'down') {
        remoteLastPoints.current[socketId] = { x, y };
      } else if (type === 'move') {
        const last = remoteLastPoints.current[socketId];
        if (last) {
          context.beginPath();
          context.moveTo(last.x, last.y);
          context.lineTo(x, y);
          context.stroke();
        }
        remoteLastPoints.current[socketId] = { x, y };
      } else if (type === 'up') {
        delete remoteLastPoints.current[socketId];
      }

      context.restore();
    },

    clear: () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      remoteLastPoints.current = {};
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    contextRef.current = context;
  }, []);

  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = brushColor;
    contextRef.current.lineWidth = brushSize;
    contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  }, [brushColor, brushSize, tool]);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCoords(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    onStroke?.({ x, y, type: 'down', color: brushColor, size: brushSize, tool });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    onStroke?.({ x, y, type: 'move', color: brushColor, size: brushSize, tool });
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    setIsDrawing(false);
    onStroke?.({ x, y, type: 'up', color: brushColor, size: brushSize, tool });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full block bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] cursor-crosshair"
    />
  );
});

export default Canvas;