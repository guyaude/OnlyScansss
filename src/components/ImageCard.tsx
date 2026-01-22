import { motion } from 'framer-motion';
import { Download, Trash2, Eye, Loader2, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { ImageFile } from '@/types/image';
import { formatFileSize, calculateReduction } from '@/lib/imageProcessor';
import { Button } from '@/components/ui/button';

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  onPreview: (image: ImageFile) => void;
  onDownload: (image: ImageFile) => void;
}

export const ImageCard = ({ image, onRemove, onPreview, onDownload }: ImageCardProps) => {
  const reduction = image.processedSize 
    ? calculateReduction(image.originalSize, image.processedSize)
    : 0;

  const isReduced = reduction > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={image.processedDataUrl || image.originalDataUrl}
          alt={image.name}
          className="w-full h-full object-cover"
        />
        
        {/* Processing Overlay */}
        {image.isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </motion.div>
        )}

        {/* Success Badge */}
        {image.processedDataUrl && !image.error && !image.isProcessing && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center"
          >
            <Check className="w-3.5 h-3.5 text-success-foreground" />
          </motion.div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          {image.processedDataUrl && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full bg-background/90 hover:bg-background"
                onClick={() => onPreview(image)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
                onClick={() => onDownload(image)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            size="icon"
            variant="destructive"
            className="h-9 w-9 rounded-full"
            onClick={() => onRemove(image.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium text-foreground truncate" title={image.name}>
          {image.name}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(image.originalSize)}</span>
          {image.processedSize && (
            <>
              <span>→</span>
              <span className="text-foreground font-medium">
                {formatFileSize(image.processedSize)}
              </span>
            </>
          )}
        </div>

        {image.processedDataUrl && image.processedSize && (
          <div className={`
            inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
            ${isReduced 
              ? 'bg-success/10 text-success' 
              : 'bg-muted text-muted-foreground'
            }
          `}>
            {isReduced ? (
              <>
                <TrendingDown className="w-3 h-3" />
                {reduction}% smaller
              </>
            ) : (
              <>
                <TrendingUp className="w-3 h-3" />
                {Math.abs(reduction)}% larger
              </>
            )}
          </div>
        )}

        {image.optimizationMessage && (
          <p className="text-xs text-primary">
            {image.optimizationMessage}
          </p>
        )}
      </div>
    </motion.div>
  );
};
