import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { UploadZone } from '@/components/UploadZone';
import { ImageCard } from '@/components/ImageCard';
import { ControlPanel } from '@/components/ControlPanel';
import { BatchActions } from '@/components/BatchActions';
import { PreviewModal } from '@/components/PreviewModal';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { useTheme } from '@/hooks/useTheme';
import { ImageFile } from '@/types/image';

interface PendingFile {
  file: File;
  dataUrl: string;
}

const Index = () => {
  const {
    images,
    options,
    isProcessing,
    processedCount,
    addImages,
    removeImage,
    clearAll,
    updateOptions,
    processAllImages,
    downloadImage,
    downloadAllAsZip,
  } = useImageProcessor();

  const { theme, toggleTheme } = useTheme();
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showCropDialog, setShowCropDialog] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    // Convert files to data URLs for the crop dialog
    const pending: PendingFile[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      pending.push({ file, dataUrl });
    }
    setPendingFiles(pending);
    setShowCropDialog(true);
  };

  const handleCropComplete = async (
    results: { file: File; croppedDataUrl: string }[]
  ) => {
    setShowCropDialog(false);
    setPendingFiles([]);

    // Convert cropped data URLs back to files and add to processor
    const croppedFiles: File[] = [];
    for (const result of results) {
      // Convert dataUrl to blob, then to file
      const response = await fetch(result.croppedDataUrl);
      const blob = await response.blob();
      const croppedFile = new File([blob], result.file.name, {
        type: result.file.type || 'image/jpeg',
      });
      croppedFiles.push(croppedFile);
    }

    addImages(croppedFiles);
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setPendingFiles([]);
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Theme-aware Background */}
      {theme === 'dark' ? (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: '#0a0a0a',
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
              radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
            `,
            backgroundSize: '10px 10px',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <div
          className="absolute inset-0 z-0 bg-[#faf9f6]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0),
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
            `,
            backgroundSize: '8px 8px, 32px 32px, 32px 32px',
          }}
        />
      )}

      {/* App Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="hidden sm:inline">100% Private</span>
              </div>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto mb-12"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Make your images{' '}
                <span className="text-gradient">smaller & better</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Compress, convert, and enhance images instantly. 
                Everything runs in your browser — completely private.
              </p>
            </motion.div>

            {/* Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-xl mx-auto"
            >
              <UploadZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {images.length > 0 && (
            <motion.section 
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pb-24"
            >
              <div className="container mx-auto px-4">
                {/* Controls - Full Width on Top */}
                <div className="max-w-xl mx-auto mb-8">
                  <ControlPanel
                    options={options}
                    onChange={updateOptions}
                    disabled={isProcessing}
                  />
                </div>

                {/* Images - Below Controls */}
                <div>
                  <BatchActions
                    imageCount={images.length}
                    processedCount={processedCount}
                    isProcessing={isProcessing}
                    onProcessAll={processAllImages}
                    onDownloadAll={downloadAllAsZip}
                    onClearAll={clearAll}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence mode="popLayout">
                      {images.map((image) => (
                        <ImageCard
                          key={image.id}
                          image={image}
                          onRemove={removeImage}
                          onPreview={setPreviewImage}
                          onDownload={downloadImage}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {images.length === 0 && (
          <section className="pb-24">
            <div className="container mx-auto px-4">
              <EmptyState />
            </div>
          </section>
        )}

        {/* Preview Modal */}
        <PreviewModal
          image={previewImage}
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          onDownload={downloadImage}
        />

        {/* Image Crop Dialog */}
        {showCropDialog && pendingFiles.length > 0 && (
          <ImageCropDialog
            pendingFiles={pendingFiles}
            onComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-border py-8 transition-colors duration-300">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Logo size="sm" />
              <p className="text-xs text-muted-foreground">
                Fast, private, and free. No account needed.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
