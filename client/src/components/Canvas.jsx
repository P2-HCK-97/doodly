import { useRef, useEffect, useState } from 'react';

export default function Canvas({ onStroke, brushColor = '#000000', brushSize = 4, tool = 'pen' }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    contextRef.current = context;
  }, []);

  // Update setting brush tiap kali warna/size/tool berubah dari ToolBar
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
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full bg-white border-[3px] border-black cursor-crosshair"
      />
    </>
  );
}