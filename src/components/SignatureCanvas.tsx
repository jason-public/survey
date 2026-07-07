import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, Sparkles } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  savedImage?: string;
}

export default function SignatureCanvas({ onSave, onClear, savedImage }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState('#000000'); // Black default, blue option

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI screens
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = inkColor;

    // Redraw saved image if any (for editing or previewing)
    if (savedImage) {
      const img = new Image();
      img.src = savedImage;
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
    } else {
      // Draw background helper line if empty
      drawHelperLine(ctx, rect.width, rect.height);
    }
  }, [savedImage]);

  // Adjust style when ink color changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = inkColor;
    }
  }, [inkColor]);

  const drawHelperLine = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#E5E7EB'; // Cool gray-200
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    ctx.restore();

    // Subtle helper text
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#9CA3AF'; // Gray-400
    ctx.fillText('여기에 서명해 주세요', width / 2 - 50, height - 12);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear helper guide lines on first draw
    if (!hasDrawn) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(true);
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasData();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    drawHelperLine(ctx, rect.width, rect.height);
    onClear();
  };

  const saveCanvasData = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-[#3182F6]" />
          마우스나 손가락으로 직접 서명하기
        </label>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInkColor('#000000')}
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              inkColor === '#000000' ? 'ring-2 ring-offset-2 ring-black scale-110' : 'opacity-60'
            }`}
            style={{ backgroundColor: '#000000' }}
            title="검은색 잉크"
          />
          <button
            type="button"
            onClick={() => setInkColor('#1D4ED8')}
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              inkColor === '#1D4ED8' ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'opacity-60'
            }`}
            style={{ backgroundColor: '#1D4ED8' }}
            title="블루 잉크 (법인/계약용)"
          />
        </div>
      </div>

      <div className="relative border border-gray-100 rounded-2xl bg-gray-50/50 overflow-hidden h-40 touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-gray-400">
          * 터치 화면 또는 마우스 드래그를 이용해 선명하게 그려주세요.
        </p>
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          서명 지우기
        </button>
      </div>
    </div>
  );
}
