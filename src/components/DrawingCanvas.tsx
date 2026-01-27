import { useRef, useState, useEffect, useCallback } from 'react';

interface DrawingCanvasProps {
  onSubmit: (imageData: string) => void;
  disabled?: boolean;
}

type Tool = 'pen' | 'eraser';
type PenSize = 'thin' | 'medium' | 'thick';

const PEN_SIZES: Record<PenSize, number> = {
  thin: 2,
  medium: 4,
  thick: 8,
};

export const DrawingCanvas = ({ onSubmit, disabled }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [penSize, setPenSize] = useState<PenSize>('medium');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, 500);

      // Store existing content before resize (if any)
      const existingData = canvas.width > 0 && canvas.height > 0
        ? canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height)
        : null;

      canvas.width = size;
      canvas.height = size;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      // Get context with explicit settings for Safari compatibility
      // willReadFrequently helps Safari optimize for getImageData/toDataURL calls
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Set default fill
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Restore existing content if this was a resize
        if (existingData && existingData.width === size && existingData.height === size) {
          ctx.putImageData(existingData, 0, 0);
        } else {
          saveToHistory();
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), imageData]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPosRef.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx || !lastPosRef.current) return;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = PEN_SIZES[penSize];
    } else {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 20;
    }

    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPosRef.current = null;
      saveToHistory();
    }
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Safari fix: Use requestAnimationFrame to ensure canvas is fully rendered
    // before calling toDataURL. Safari can return empty/corrupt data if called
    // synchronously after drawing operations.
    requestAnimationFrame(() => {
      // Double-RAF for Safari - ensures paint is complete
      requestAnimationFrame(() => {
        try {
          const imageData = canvas.toDataURL('image/png');

          // Validate the image data isn't empty (Safari bug workaround)
          if (!imageData || imageData === 'data:,' || imageData.length < 100) {
            console.error('Canvas toDataURL returned empty data');
            // Fallback: try getting image data directly and creating blob
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.toBlob((blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = reader.result as string;
                    if (base64 && base64.length > 100) {
                      onSubmit(base64);
                    } else {
                      alert('Unable to capture drawing. Please try again.');
                    }
                  };
                  reader.readAsDataURL(blob);
                } else {
                  alert('Unable to capture drawing. Please try again.');
                }
              }, 'image/png');
            }
            return;
          }

          onSubmit(imageData);
        } catch (error) {
          console.error('Error capturing canvas:', error);
          alert('Unable to capture drawing. Please try again.');
        }
      });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="drawing-tools">
        <button
          className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => setTool('pen')}
          type="button"
        >
          Pen
        </button>
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          type="button"
        >
          Eraser
        </button>
        <div className="pen-size">
          {(['thin', 'medium', 'thick'] as PenSize[]).map((size) => (
            <div
              key={size}
              className={`pen-size-dot ${penSize === size ? 'active' : ''}`}
              onClick={() => setPenSize(size)}
              style={{ color: 'black' }}
            >
              <span
                style={{
                  width: PEN_SIZES[size] * 2,
                  height: PEN_SIZES[size] * 2,
                }}
              />
            </div>
          ))}
        </div>
        <button
          className="tool-btn"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          type="button"
        >
          Undo
        </button>
        <button className="tool-btn" onClick={handleClear} type="button">
          Clear
        </button>
      </div>

      <div
        ref={containerRef}
        className="drawing-canvas-container"
        style={{ width: '100%', maxWidth: '500px' }}
      >
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <button
        className="btn btn-primary btn-large btn-full"
        onClick={handleSubmit}
        disabled={disabled}
        type="button"
      >
        Submit Drawing
      </button>
    </div>
  );
};
