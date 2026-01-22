export interface ImageFile {
  id: string;
  file: File;
  originalDataUrl: string;
  processedDataUrl: string | null;
  originalSize: number;
  processedSize: number | null;
  name: string;
  format: OutputFormat;
  quality: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  isProcessing: boolean;
  isProcessed: boolean;
  error: string | null;
  optimizationMessage?: string | null;
}

export type OutputFormat = 'jpeg' | 'png' | 'webp';

export type ProcessingMode = 'auto' | 'manual';

export type TargetSize = 100 | 200 | 500 | 1000 | 2000; // KB

export interface ProcessingOptions {
  format: OutputFormat;
  quality: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  mode: ProcessingMode;
  targetSizeKB: TargetSize;
}
