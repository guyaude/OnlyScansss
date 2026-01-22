import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop as CropIcon, SkipForward, Check, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PendingFile {
  file: File;
  dataUrl: string;
}

interface ImageCropDialogProps {
  pendingFiles: PendingFile[];
  onComplete: (files: { file: File; croppedDataUrl: string }[]) => void;
  onCancel: () => void;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
] as const;

const RESIZE_PRESETS = [
  { label: 'Original', width: null, height: null },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: 'Instagram', width: 1080, height: 1080 },
  { label: 'Custom', width: null, height: null },
] as const;

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const ImageCropDialog = ({
  pendingFiles,
  onComplete,
  onCancel,
}: ImageCropDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [selectedPreset, setSelectedPreset] = useState<string>('Original');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [croppingEnabled, setCroppingEnabled] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [results, setResults] = useState<{ file: File; croppedDataUrl: string }[]>([]);

  const currentFile = pendingFiles[currentIndex];

  useEffect(() => {
    // Reset state when moving to next image
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAspect(undefined);
    setSelectedPreset('Original');
    setCroppingEnabled(false);
    setCustomWidth('');
    setCustomHeight('');
  }, [currentIndex]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    },
    [aspect]
  );

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (newAspect && imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, newAspect));
    }
    if (!croppingEnabled) {
      setCroppingEnabled(true);
    }
  };

  const getCroppedImage = useCallback(async (): Promise<string> => {
    if (!imgRef.current) return currentFile.dataUrl;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return currentFile.dataUrl;

    // Determine target dimensions
    let targetWidth: number;
    let targetHeight: number;

    if (croppingEnabled && completedCrop && completedCrop.width && completedCrop.height) {
      // Crop mode
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const sourceX = completedCrop.x * scaleX;
      const sourceY = completedCrop.y * scaleY;
      const sourceWidth = completedCrop.width * scaleX;
      const sourceHeight = completedCrop.height * scaleY;

      // Apply resize preset to cropped area
      if (selectedPreset === 'Custom' && customWidth && customHeight) {
        targetWidth = parseInt(customWidth);
        targetHeight = parseInt(customHeight);
      } else if (selectedPreset !== 'Original') {
        const preset = RESIZE_PRESETS.find((p) => p.label === selectedPreset);
        if (preset?.width && preset?.height) {
          const aspectRatio = sourceWidth / sourceHeight;
          if (aspectRatio > preset.width / preset.height) {
            targetWidth = preset.width;
            targetHeight = preset.width / aspectRatio;
          } else {
            targetHeight = preset.height;
            targetWidth = preset.height * aspectRatio;
          }
        } else {
          targetWidth = sourceWidth;
          targetHeight = sourceHeight;
        }
      } else {
        targetWidth = sourceWidth;
        targetHeight = sourceHeight;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );
    } else {
      // No crop - just resize if needed
      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;

      if (selectedPreset === 'Custom' && customWidth && customHeight) {
        targetWidth = parseInt(customWidth);
        targetHeight = parseInt(customHeight);
      } else if (selectedPreset !== 'Original') {
        const preset = RESIZE_PRESETS.find((p) => p.label === selectedPreset);
        if (preset?.width && preset?.height) {
          const aspectRatio = sourceWidth / sourceHeight;
          if (aspectRatio > preset.width / preset.height) {
            targetWidth = preset.width;
            targetHeight = preset.width / aspectRatio;
          } else {
            targetHeight = preset.height;
            targetWidth = preset.height * aspectRatio;
          }
        } else {
          return currentFile.dataUrl;
        }
      } else {
        return currentFile.dataUrl;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [currentFile.dataUrl, completedCrop, croppingEnabled, selectedPreset, customWidth, customHeight]);

  const handleNext = async () => {
    const croppedDataUrl = await getCroppedImage();
    const newResults = [...results, { file: currentFile.file, croppedDataUrl }];

    if (currentIndex < pendingFiles.length - 1) {
      setResults(newResults);
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(newResults);
    }
  };

  const handleSkip = () => {
    const newResults = [...results, { file: currentFile.file, croppedDataUrl: currentFile.dataUrl }];

    if (currentIndex < pendingFiles.length - 1) {
      setResults(newResults);
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(newResults);
    }
  };

  const handleSkipAll = () => {
    const allSkipped = pendingFiles.map((f) => ({
      file: f.file,
      croppedDataUrl: f.dataUrl,
    }));
    onComplete(allSkipped);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-card rounded-2xl shadow-soft-xl border border-border overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Crop & Resize</h2>
              <p className="text-sm text-muted-foreground">
                {currentIndex + 1} of {pendingFiles.length} · {currentFile.file.name}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Image preview */}
              <div className="flex-1 flex items-center justify-center bg-secondary/30 rounded-xl p-4 min-h-[300px]">
                {croppingEnabled ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="max-h-[400px]"
                  >
                    <img
                      ref={imgRef}
                      src={currentFile.dataUrl}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      className="max-h-[400px] object-contain"
                    />
                  </ReactCrop>
                ) : (
                  <img
                    ref={imgRef}
                    src={currentFile.dataUrl}
                    alt="Preview"
                    className="max-h-[400px] object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Controls */}
              <div className="lg:w-64 space-y-6">
                {/* Crop toggle */}
                <div>
                  <Button
                    variant={croppingEnabled ? 'default' : 'outline'}
                    className="w-full gap-2"
                    onClick={() => setCroppingEnabled(!croppingEnabled)}
                  >
                    <CropIcon className="w-4 h-4" />
                    {croppingEnabled ? 'Cropping On' : 'Enable Crop'}
                  </Button>
                </div>

                {/* Aspect ratio */}
                {croppingEnabled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.label}
                          onClick={() => handleAspectChange(ratio.value)}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                            aspect === ratio.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resize preset */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    Resize
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RESIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setSelectedPreset(preset.label)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                          selectedPreset === preset.label
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  
                  {selectedPreset === 'Custom' && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        placeholder="Width"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="flex items-center text-muted-foreground">×</span>
                      <input
                        type="number"
                        placeholder="Height"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/20">
            <div className="flex gap-2">
              {pendingFiles.length > 1 && (
                <Button variant="ghost" onClick={handleSkipAll} className="text-muted-foreground">
                  Skip All
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="gap-2">
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
              <Button onClick={handleNext} className="gap-2">
                <Check className="w-4 h-4" />
                {currentIndex < pendingFiles.length - 1 ? 'Next' : 'Done'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
