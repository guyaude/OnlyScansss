import { ProcessingOptions, OutputFormat } from '@/types/image';

export const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

export const applyEnhancements = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: Pick<ProcessingOptions, 'brightness' | 'contrast' | 'sharpness'>
): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const brightness = options.brightness / 100;
  const contrast = options.contrast / 100;
  const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    // Apply brightness
    data[i] = Math.min(255, Math.max(0, data[i] + brightness * 255));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness * 255));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness * 255));

    // Apply contrast
    data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply sharpness using unsharp mask
  if (options.sharpness !== 0) {
    applySharpness(ctx, canvas, options.sharpness / 100);
  }
};

const applySharpness = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  amount: number
): void => {
  if (amount === 0) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  const originalData = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += originalData[kidx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const sharpened = sum;
        data[idx + c] = Math.min(255, Math.max(0, 
          originalData[idx + c] + (sharpened - originalData[idx + c]) * amount
        ));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

export const processImage = async (
  originalDataUrl: string,
  options: ProcessingOptions
): Promise<{ dataUrl: string; size: number }> => {
  const img = await loadImage(originalDataUrl);
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0);

  // Apply enhancements if any
  if (options.brightness !== 0 || options.contrast !== 0 || options.sharpness !== 0) {
    applyEnhancements(ctx, canvas, options);
  }

  // Convert to desired format
  const mimeType = `image/${options.format}`;
  const quality = options.quality / 100;
  
  const dataUrl = canvas.toDataURL(mimeType, quality);
  
  // Calculate size from base64
  const base64Length = dataUrl.split(',')[1].length;
  const size = Math.round((base64Length * 3) / 4);

  return { dataUrl, size };
};

// Auto-optimize image to target size with best quality
export const autoOptimizeImage = async (
  originalDataUrl: string,
  targetSizeKB: number,
  format: OutputFormat = 'jpeg'
): Promise<{ dataUrl: string; size: number; quality: number; message: string }> => {
  const img = await loadImage(originalDataUrl);
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0);

  // Apply slight auto-enhancement for better quality
  const autoEnhance = { brightness: 2, contrast: 3, sharpness: 5 };
  applyEnhancements(ctx, canvas, autoEnhance);

  const targetSizeBytes = targetSizeKB * 1024;
  const mimeType = `image/${format}`;
  
  // Binary search for optimal quality
  let minQuality = 5;
  let maxQuality = 100;
  let bestDataUrl = '';
  let bestSize = 0;
  let bestQuality = 80;

  // PNG is lossless, so just return it
  if (format === 'png') {
    const dataUrl = canvas.toDataURL(mimeType);
    const base64Length = dataUrl.split(',')[1].length;
    const size = Math.round((base64Length * 3) / 4);
    return { 
      dataUrl, 
      size, 
      quality: 100,
      message: `PNG is lossless — ${formatFileSize(size)} ✨`
    };
  }

  // First check if max quality is already under target
  let maxQualityDataUrl = canvas.toDataURL(mimeType, 1.0);
  let maxQualityBase64 = maxQualityDataUrl.split(',')[1].length;
  let maxQualitySize = Math.round((maxQualityBase64 * 3) / 4);

  if (maxQualitySize <= targetSizeBytes) {
    return { 
      dataUrl: maxQualityDataUrl, 
      size: maxQualitySize, 
      quality: 100,
      message: `Max quality at ${formatFileSize(maxQualitySize)} — below target! 🎉`
    };
  }

  // Binary search to find best quality within target
  while (minQuality <= maxQuality) {
    const midQuality = Math.floor((minQuality + maxQuality) / 2);
    const dataUrl = canvas.toDataURL(mimeType, midQuality / 100);
    const base64Length = dataUrl.split(',')[1].length;
    const size = Math.round((base64Length * 3) / 4);

    if (size <= targetSizeBytes) {
      bestDataUrl = dataUrl;
      bestSize = size;
      bestQuality = midQuality;
      minQuality = midQuality + 1; // Try higher quality
    } else {
      maxQuality = midQuality - 1; // Try lower quality
    }
  }

  // If we couldn't get under target even at minimum quality
  if (!bestDataUrl) {
    const dataUrl = canvas.toDataURL(mimeType, 0.05);
    const base64Length = dataUrl.split(',')[1].length;
    const size = Math.round((base64Length * 3) / 4);
    return { 
      dataUrl, 
      size, 
      quality: 5,
      message: `Best possible: ${formatFileSize(size)} (target was ${targetSizeKB} KB) 💪`
    };
  }

  return { 
    dataUrl: bestDataUrl, 
    size: bestSize, 
    quality: bestQuality,
    message: `Optimized to ${formatFileSize(bestSize)} with best quality ✨`
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const calculateReduction = (original: number, processed: number): number => {
  if (original === 0) return 0;
  return Math.round(((original - processed) / original) * 100);
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
