import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ComparisonSliderProps {
  originalImage: string;
  processedImage: string;
}

export const ComparisonSlider = ({ originalImage, processedImage }: ComparisonSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Load the original image to get its natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = originalImage;
  }, [originalImage]);

  // Reset slider position when images change
  useEffect(() => {
    setSliderPosition(50);
  }, [originalImage, processedImage]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  // Calculate aspect ratio for the container
  const aspectRatio = imageDimensions 
    ? imageDimensions.width / imageDimensions.height 
    : 16 / 9;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-muted rounded-xl overflow-hidden cursor-ew-resize select-none"
      style={{ 
        aspectRatio: aspectRatio.toString(),
        maxHeight: '60vh'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Base layer: Processed image (After) - full width */}
      <img
        src={processedImage}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      
      {/* Overlay layer: Original image (Before) - clipped */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ 
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
        }}
      >
        <img
          src={originalImage}
          alt="Before"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      </div>
      
      {/* Slider Line */}
      <motion.div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none"
        style={{ 
          left: `${sliderPosition}%`, 
          transform: 'translateX(-50%)',
          boxShadow: '0 0 8px rgba(0,0,0,0.3)'
        }}
        initial={false}
        animate={{ left: `${sliderPosition}%` }}
        transition={{ type: 'tween', duration: 0 }}
      >
        {/* Handle */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white/50"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-1">
            {/* Left arrow */}
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="text-muted-foreground">
              <path d="M6 2L2 6L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {/* Divider */}
            <div className="w-px h-5 bg-muted-foreground/30" />
            {/* Right arrow */}
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="text-muted-foreground">
              <path d="M2 2L6 6L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Labels */}
      <div 
        className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold pointer-events-none transition-opacity duration-200"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          color: 'white',
          backdropFilter: 'blur(4px)',
          opacity: sliderPosition > 15 ? 1 : 0
        }}
      >
        Before
      </div>
      <div 
        className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold pointer-events-none transition-opacity duration-200"
        style={{ 
          backgroundColor: 'hsl(var(--primary))', 
          color: 'hsl(var(--primary-foreground))',
          opacity: sliderPosition < 85 ? 1 : 0
        }}
      >
        After
      </div>

      {/* Hint text (shows briefly) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs text-white/80 pointer-events-none bg-black/40 backdrop-blur-sm opacity-0 animate-[fadeIn_0.3s_ease-out_0.5s_forwards,fadeOut_0.3s_ease-out_3s_forwards]">
        Drag to compare
      </div>
    </div>
  );
};
