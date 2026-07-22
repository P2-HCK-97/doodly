import { useRef, useEffect, useState } from 'react';
import { DEFAULT_BRUSH_COLOR, DEFAULT_BRUSH_SIZE } from '../constants/gameConfig';

export default function Canvas({ onStroke }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = DEFAULT_BRUSH_COLOR;
    context.lineWidth = DEFAULT_BRUSH_SIZE;
    contextRef.current = context;
  }, []);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCoords(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    onStroke?.({ x, y, type: 'down' });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    onStroke?.({ x, y, type: 'move' });
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    setIsDrawing(false);
    onStroke?.({ x, y, type: 'up' });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full bg-white border-[3px] border-black cursor-crosshair"
    />
  );
}