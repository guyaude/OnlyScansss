import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const UploadZone = ({ onFilesSelected, isProcessing }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file =>
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
    
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <motion.div
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
        ${isDragging 
          ? 'border-primary bg-primary-soft' 
          : 'border-border hover:border-primary/40 hover:bg-secondary/30'
        }
        ${isProcessing ? 'pointer-events-none opacity-60' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileTap={{ scale: isProcessing ? 1 : 0.995 }}
    >
      <label className="block py-16 px-8 cursor-pointer">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={isDragging ? 'dragging' : 'default'}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300
                ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}
              `}
            >
              {isDragging ? (
                <Plus className="w-8 h-8" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {isDragging ? "Drop to upload" : "Drop images here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse · JPG, PNG, WebP
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>100% private — images never leave your browser</span>
          </div>
        </div>
      </label>
    </motion.div>
  );
};
