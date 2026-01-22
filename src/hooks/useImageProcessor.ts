import { useCallback, useMemo, useState } from 'react';
import { ImageFile, ProcessingOptions } from '@/types/image';
import { autoOptimizeImage, dataUrlToBlob, generateId, processImage } from '@/lib/imageProcessor';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type ProcessedMeta = Pick<
  ImageFile,
  | 'processedDataUrl'
  | 'processedSize'
  | 'format'
  | 'quality'
  | 'brightness'
  | 'contrast'
  | 'sharpness'
  | 'isProcessing'
  | 'error'
  | 'optimizationMessage'
>;

type OriginalImage = Pick<
  ImageFile,
  'id' | 'file' | 'originalDataUrl' | 'originalSize' | 'name'
>;

const defaultOptions: ProcessingOptions = {
  format: 'jpeg',
  quality: 80,
  brightness: 0,
  contrast: 0,
  sharpness: 0,
  mode: 'auto',
  targetSizeKB: 500,
};

export const useImageProcessor = () => {
  // CRITICAL UX: original uploads must persist forever until user removes/clears.
  const [originalImages, setOriginalImages] = useState<OriginalImage[]>([]);
  const [processedById, setProcessedById] = useState<Record<string, ProcessedMeta>>({});
  const [options, setOptions] = useState<ProcessingOptions>(defaultOptions);
  const [isProcessing, setIsProcessing] = useState(false);

  const images: ImageFile[] = useMemo(() => {
    return originalImages.map((img) => {
      const processed = processedById[img.id];

      return {
        id: img.id,
        file: img.file,
        originalDataUrl: img.originalDataUrl,
        originalSize: img.originalSize,
        name: img.name,

        processedDataUrl: processed?.processedDataUrl ?? null,
        processedSize: processed?.processedSize ?? null,

        // Keep last-used settings for display/download naming.
        format: processed?.format ?? options.format,
        quality: processed?.quality ?? options.quality,
        brightness: processed?.brightness ?? options.brightness,
        contrast: processed?.contrast ?? options.contrast,
        sharpness: processed?.sharpness ?? options.sharpness,

        isProcessing: processed?.isProcessing ?? false,
        // Derived flag (NOT used for disabling Transform)
        isProcessed: !!processed?.processedDataUrl,
        error: processed?.error ?? null,
        optimizationMessage: processed?.optimizationMessage ?? null,
      };
    });
  }, [originalImages, processedById, options]);

  const processedCount = useMemo(
    () => Object.values(processedById).filter((m) => !!m.processedDataUrl).length,
    [processedById]
  );

  const addImages = useCallback(
    async (files: File[]) => {
      const newImages: OriginalImage[] = [];

      for (const file of files) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        newImages.push({
          id: generateId(),
          file,
          originalDataUrl: dataUrl,
          originalSize: file.size,
          name: file.name,
        });
      }

      setOriginalImages((prev) => [...prev, ...newImages]);
    },
    []
  );

  const removeImage = useCallback((id: string) => {
    setOriginalImages((prev) => prev.filter((img) => img.id !== id));
    setProcessedById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setOriginalImages([]);
    setProcessedById({});
  }, []);

  const updateOptions = useCallback((newOptions: Partial<ProcessingOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  }, []);

  const processAllImages = useCallback(async () => {
    if (originalImages.length === 0) return;

    setIsProcessing(true);

    // Snapshot originals so slider changes during processing don't affect this run.
    const toProcess = [...originalImages];

    for (const image of toProcess) {
      setProcessedById((prev) => ({
        ...prev,
        [image.id]: {
          processedDataUrl: prev[image.id]?.processedDataUrl ?? null,
          processedSize: prev[image.id]?.processedSize ?? null,
          format: options.format,
          quality: options.quality,
          brightness: options.brightness,
          contrast: options.contrast,
          sharpness: options.sharpness,
          isProcessing: true,
          error: null,
          optimizationMessage: null,
        },
      }));

      try {
        let result: { dataUrl: string; size: number };
        let optimizationMessage: string | null = null;

        if (options.mode === 'auto') {
          const autoResult = await autoOptimizeImage(
            image.originalDataUrl,
            options.targetSizeKB,
            options.format
          );
          result = { dataUrl: autoResult.dataUrl, size: autoResult.size };
          optimizationMessage = autoResult.message;
        } else {
          result = await processImage(image.originalDataUrl, options);
        }

        setProcessedById((prev) => ({
          ...prev,
          [image.id]: {
            processedDataUrl: result.dataUrl,
            processedSize: result.size,
            format: options.format,
            quality: options.quality,
            brightness: options.brightness,
            contrast: options.contrast,
            sharpness: options.sharpness,
            isProcessing: false,
            error: null,
            optimizationMessage,
          },
        }));
      } catch {
        setProcessedById((prev) => ({
          ...prev,
          [image.id]: {
            processedDataUrl: prev[image.id]?.processedDataUrl ?? null,
            processedSize: prev[image.id]?.processedSize ?? null,
            format: options.format,
            quality: options.quality,
            brightness: options.brightness,
            contrast: options.contrast,
            sharpness: options.sharpness,
            isProcessing: false,
            error: 'Processing failed',
            optimizationMessage: null,
          },
        }));
      }
    }

    setIsProcessing(false);
  }, [originalImages, options]);

  const downloadImage = useCallback(async (image: ImageFile) => {
    if (!image.processedDataUrl) return;

    const blob = await dataUrlToBlob(image.processedDataUrl);
    const extension = image.format === 'jpeg' ? 'jpg' : image.format;
    const baseName = image.name.replace(/\.[^/.]+$/, '');
    saveAs(blob, `${baseName}_processed.${extension}`);
  }, []);

  const downloadAllAsZip = useCallback(async () => {
    const processedImages = images.filter((img) => img.processedDataUrl);
    if (processedImages.length === 0) return;

    const zip = new JSZip();

    for (const image of processedImages) {
      if (!image.processedDataUrl) continue;
      const blob = await dataUrlToBlob(image.processedDataUrl);
      const extension = image.format === 'jpeg' ? 'jpg' : image.format;
      const baseName = image.name.replace(/\.[^/.]+$/, '');
      zip.file(`${baseName}_processed.${extension}`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'onlyscans_processed_images.zip');
  }, [images]);

  return {
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
  };
};
