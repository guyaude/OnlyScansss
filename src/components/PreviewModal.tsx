import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageFile } from '@/types/image';
import { formatFileSize, calculateReduction } from '@/lib/imageProcessor';
import { ComparisonSlider } from '@/components/ComparisonSlider';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface PreviewModalProps {
  image: ImageFile | null;
  open: boolean;
  onClose: () => void;
  onDownload: (image: ImageFile) => void;
}

export const PreviewModal = ({ image, open, onClose, onDownload }: PreviewModalProps) => {
  if (!image) return null;

  const reduction = image.processedSize 
    ? calculateReduction(image.originalSize, image.processedSize) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card">
        <VisuallyHidden>
          <DialogTitle>Image Preview - {image.name}</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground truncate max-w-md">
              {image.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{formatFileSize(image.originalSize)}</span>
              {image.processedSize && (
                <>
                  <span>→</span>
                  <span className="text-foreground font-medium">
                    {formatFileSize(image.processedSize)}
                  </span>
                  {reduction > 0 && (
                    <span className="text-success">
                      ({reduction}% smaller)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {image.processedDataUrl && (
              <Button
                onClick={() => onDownload(image)}
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image Comparison */}
        <div className="p-4">
          {image.processedDataUrl ? (
            <ComparisonSlider
              originalImage={image.originalDataUrl}
              processedImage={image.processedDataUrl}
            />
          ) : (
            <div className="flex items-center justify-center bg-muted rounded-xl overflow-hidden">
              <img
                src={image.originalDataUrl}
                alt={image.name}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Optimization message */}
        {image.processedDataUrl && image.optimizationMessage && (
          <div className="flex items-center justify-center pb-4">
            <span className="text-sm text-muted-foreground">
              {image.optimizationMessage}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
