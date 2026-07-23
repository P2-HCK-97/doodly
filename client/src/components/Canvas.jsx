import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const Canvas = forwardRef(function Canvas(
  {
    onStroke,
    brushColor = "#000000",
    brushSize = 4,
    tool = "pen",
  },
  ref,
) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  /*
   * Status menggambar pemain lokal.
   * Pakai ref supaya tidak menunggu proses render React.
   */
  const isDrawingRef = useRef(false);

  /*
   * Titik terakhir milik pemain lokal.
   */
  const localLastPointRef = useRef(null);

  /*
   * Titik terakhir setiap pemain remote.
   *
   * Bentuk:
   * {
   *   socketIdUserA: { x, y },
   *   socketIdUserB: { x, y }
   * }
   */
  const remoteLastPointsRef = useRef({});

  /**
   * Menggambar satu segmen garis secara independen.
   *
   * Setiap segmen selalu menggunakan:
   * beginPath → moveTo → lineTo → stroke
   *
   * Dengan begitu path pemain lokal dan remote
   * tidak akan saling tersambung.
   */
  const drawSegment = ({
    from,
    to,
    color = "#000000",
    size = 4,
    drawingTool = "pen",
  }) => {
    const context = contextRef.current;

    if (!context || !from || !to) {
      return;
    }

    context.save();

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);

    context.strokeStyle = color;
    context.lineWidth = Number(size) || 4;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.globalCompositeOperation =
      drawingTool === "eraser"
        ? "destination-out"
        : "source-over";

    context.stroke();
    context.closePath();

    context.restore();
  };

  /**
   * Mengambil koordinat mouse relatif terhadap canvas.
   *
   * scaleX dan scaleY menjaga posisi tetap benar
   * jika ukuran CSS dan ukuran internal canvas berbeda.
   */
  const getCoordinates = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect = canvas.getBoundingClientRect();

    const scaleX =
      canvas.width / rect.width;

    const scaleY =
      canvas.height / rect.height;

    return {
      x:
        (event.clientX - rect.left) *
        scaleX,

      y:
        (event.clientY - rect.top) *
        scaleY,
    };
  };

  useImperativeHandle(ref, () => ({
    getSnapshot() {
      const canvas = canvasRef.current;

      if (!canvas) {
        return null;
      }

      return canvas.toDataURL("image/png");
    },

    /**
     * Menggambar stroke yang diterima
     * dari pemain lain melalui Socket.IO.
     */
    drawStroke(strokeData) {
      if (!strokeData) {
        return;
      }

      const {
        socketId,
        x,
        y,
        type,
        color,
        size,
        tool: strokeTool,
      } = strokeData;

      if (!socketId) {
        return;
      }

      const currentPoint = {
        x: Number(x),
        y: Number(y),
      };

      if (
        !Number.isFinite(currentPoint.x) ||
        !Number.isFinite(currentPoint.y)
      ) {
        return;
      }

      if (type === "down") {
        /*
         * Mulai path baru khusus pemain tersebut.
         */
        remoteLastPointsRef.current[
          socketId
        ] = currentPoint;

        return;
      }

      if (type === "move") {
        const previousPoint =
          remoteLastPointsRef.current[
          socketId
          ];

        if (previousPoint) {
          drawSegment({
            from: previousPoint,
            to: currentPoint,
            color,
            size,
            drawingTool:
              strokeTool || "pen",
          });
        }

        remoteLastPointsRef.current[
          socketId
        ] = currentPoint;

        return;
      }

      if (type === "up") {
        /*
         * Tidak lagi menyimpan koordinat pemain
         * setelah mouse dilepas.
         */
        delete remoteLastPointsRef.current[
          socketId
        ];
      }
    },

    clear() {
      const canvas = canvasRef.current;
      const context = contextRef.current;

      if (!canvas || !context) {
        return;
      }

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      isDrawingRef.current = false;
      localLastPointRef.current = null;
      remoteLastPointsRef.current = {};
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    /*
     * Samakan ukuran internal canvas
     * dengan ukuran yang tampil di browser.
     */
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context =
      canvas.getContext("2d");

    context.lineCap = "round";
    context.lineJoin = "round";

    contextRef.current = context;
  }, []);

  const handleMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    const point =
      getCoordinates(event);

    isDrawingRef.current = true;
    localLastPointRef.current = point;

    onStroke?.({
      x: point.x,
      y: point.y,
      type: "down",
      color: brushColor,
      size: brushSize,
      tool,
    });
  };

  const handleMouseMove = (event) => {
    if (!isDrawingRef.current) {
      return;
    }

    const previousPoint =
      localLastPointRef.current;

    const currentPoint =
      getCoordinates(event);

    if (!previousPoint) {
      localLastPointRef.current =
        currentPoint;

      return;
    }

    /*
     * Gambar segmen lokal secara independen.
     * Tidak menggunakan path yang sedang aktif
     * di context.
     */
    drawSegment({
      from: previousPoint,
      to: currentPoint,
      color: brushColor,
      size: brushSize,
      drawingTool: tool,
    });

    localLastPointRef.current =
      currentPoint;

    onStroke?.({
      x: currentPoint.x,
      y: currentPoint.y,
      type: "move",
      color: brushColor,
      size: brushSize,
      tool,
    });
  };

  const finishDrawing = () => {
    if (!isDrawingRef.current) {
      return;
    }

    const lastPoint =
      localLastPointRef.current;

    isDrawingRef.current = false;
    localLastPointRef.current = null;

    if (!lastPoint) {
      return;
    }

    onStroke?.({
      x: lastPoint.x,
      y: lastPoint.y,
      type: "up",
      color: brushColor,
      size: brushSize,
      tool,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={finishDrawing}
      onMouseLeave={finishDrawing}
      className="block w-full h-full bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] cursor-crosshair"
    />
  );
});

export default Canvas;