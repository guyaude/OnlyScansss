import { motion } from 'framer-motion';
import { Wand2, Trash2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BatchActionsProps {
  imageCount: number;
  processedCount: number;
  isProcessing: boolean;
  onProcessAll: () => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
}

export const BatchActions = ({
  imageCount,
  processedCount,
  isProcessing,
  onProcessAll,
  onDownloadAll,
  onClearAll,
}: BatchActionsProps) => {
  const hasImages = imageCount > 0;
  const someProcessed = processedCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 py-4"
    >
      {/* Stats */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {imageCount} image{imageCount !== 1 ? 's' : ''}
        </span>
        {someProcessed && (
          <span className="text-sm text-success font-medium">
            · {processedCount} processed
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          disabled={!hasImages || isProcessing}
          className="text-muted-foreground hover:text-destructive h-9 px-3"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {someProcessed && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadAll}
            disabled={isProcessing}
            className="h-9 gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download All</span>
          </Button>
        )}

        <Button
          size="sm"
          onClick={onProcessAll}
          disabled={!hasImages || isProcessing}
          className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary px-5"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Transform</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
