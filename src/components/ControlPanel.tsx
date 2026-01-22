import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OutputFormat, ProcessingOptions, ProcessingMode, TargetSize } from '@/types/image';
import { Wand2, SlidersHorizontal, Image, Zap } from 'lucide-react';

interface ControlPanelProps {
  options: ProcessingOptions;
  onChange: (options: Partial<ProcessingOptions>) => void;
  disabled?: boolean;
}

type QualityPreset = 'light' | 'balanced' | 'aggressive';
type BrightnessPreset = 'dim' | 'natural' | 'bright' | 'extra';
type ContrastPreset = 'flat' | 'natural' | 'punchy' | 'dramatic';
type SharpnessPreset = 'smooth' | 'natural' | 'crisp' | 'sharp';

const qualityToPreset = (quality: number): QualityPreset => {
  if (quality >= 75) return 'light';
  if (quality >= 50) return 'balanced';
  return 'aggressive';
};

const presetToQuality: Record<QualityPreset, number> = {
  light: 85,
  balanced: 60,
  aggressive: 35,
};

const brightnessToPreset = (brightness: number): BrightnessPreset => {
  if (brightness <= -30) return 'dim';
  if (brightness <= 15) return 'natural';
  if (brightness <= 40) return 'bright';
  return 'extra';
};

const presetToBrightness: Record<BrightnessPreset, number> = {
  dim: -40,
  natural: 0,
  bright: 30,
  extra: 60,
};

const contrastToPreset = (contrast: number): ContrastPreset => {
  if (contrast <= -20) return 'flat';
  if (contrast <= 15) return 'natural';
  if (contrast <= 40) return 'punchy';
  return 'dramatic';
};

const presetToContrast: Record<ContrastPreset, number> = {
  flat: -30,
  natural: 0,
  punchy: 30,
  dramatic: 60,
};

const sharpnessToPreset = (sharpness: number): SharpnessPreset => {
  if (sharpness <= 10) return 'smooth';
  if (sharpness <= 35) return 'natural';
  if (sharpness <= 65) return 'crisp';
  return 'sharp';
};

const presetToSharpness: Record<SharpnessPreset, number> = {
  smooth: 0,
  natural: 25,
  crisp: 50,
  sharp: 85,
};

interface PresetButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const PresetButton = ({ label, active, onClick, disabled, icon }: PresetButtonProps) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    whileTap={{ scale: 0.97 }}
    className={`
      relative flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200
      ${active 
        ? 'bg-primary text-primary-foreground shadow-primary' 
        : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span className="flex items-center justify-center gap-1.5">
      {icon}
      {label}
    </span>
  </motion.button>
);

interface ControlGroupProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const ControlGroup = ({ label, description, children }: ControlGroupProps) => (
  <div className="space-y-3">
    <div>
      <h4 className="text-sm font-semibold text-foreground">{label}</h4>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    {children}
  </div>
);

export const ControlPanel = ({ options, onChange, disabled }: ControlPanelProps) => {
  const formatOptions: { value: OutputFormat; label: string }[] = [
    { value: 'jpeg', label: 'JPG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
  ];

  const targetSizeOptions: { value: TargetSize; label: string; sub: string }[] = [
    { value: 100, label: '100KB', sub: 'Tiny' },
    { value: 200, label: '200KB', sub: 'Small' },
    { value: 500, label: '500KB', sub: 'Balanced' },
    { value: 1000, label: '1MB', sub: 'Quality' },
    { value: 2000, label: '2MB', sub: 'Max' },
  ];

  const currentQualityPreset = qualityToPreset(options.quality);
  const currentBrightnessPreset = brightnessToPreset(options.brightness);
  const currentContrastPreset = contrastToPreset(options.contrast);
  const currentSharpnessPreset = sharpnessToPreset(options.sharpness);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl shadow-soft-lg p-6"
    >
      {/* Mode Tabs */}
      <Tabs 
        value={options.mode} 
        onValueChange={(value) => onChange({ mode: value as ProcessingMode })}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-secondary/50 rounded-xl mb-8">
          <TabsTrigger 
            value="auto" 
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-foreground transition-all duration-200 text-sm font-medium"
          >
            <Wand2 className="w-4 h-4" />
            Auto
          </TabsTrigger>
          <TabsTrigger 
            value="manual" 
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-foreground transition-all duration-200 text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* Auto Mode */}
        <TabsContent value="auto" className="mt-0 space-y-6">
          <ControlGroup 
            label="Target Size" 
            description="We'll optimize quality to fit this size"
          >
            <div className="grid grid-cols-5 gap-2">
              {targetSizeOptions.map((size) => (
                <motion.button
                  key={size.value}
                  onClick={() => onChange({ targetSizeKB: size.value })}
                  disabled={disabled}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200
                    ${options.targetSizeKB === size.value 
                      ? 'bg-primary text-primary-foreground shadow-primary' 
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-sm font-semibold">{size.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{size.sub}</span>
                </motion.button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="Format">
            <div className="flex gap-2">
              {formatOptions.map((fmt) => (
                <PresetButton
                  key={fmt.value}
                  label={fmt.label}
                  active={options.format === fmt.value}
                  onClick={() => onChange({ format: fmt.value })}
                  disabled={disabled}
                  icon={<Image className="w-3.5 h-3.5" />}
                />
              ))}
            </div>
          </ControlGroup>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Upload → Pick size → Transform. That's it.</span>
            </div>
          </div>
        </TabsContent>

        {/* Manual Mode */}
        <TabsContent value="manual" className="mt-0 space-y-6">
          {/* Format */}
          <ControlGroup label="Format">
            <div className="flex gap-2">
              {formatOptions.map((fmt) => (
                <PresetButton
                  key={fmt.value}
                  label={fmt.label}
                  active={options.format === fmt.value}
                  onClick={() => onChange({ format: fmt.value })}
                  disabled={disabled}
                  icon={<Image className="w-3.5 h-3.5" />}
                />
              ))}
            </div>
          </ControlGroup>

          {/* Compression */}
          <ControlGroup 
            label="Compression" 
            description={options.format === 'png' ? 'PNG is lossless' : 'How much to slim it down'}
          >
            <div className="flex gap-2">
              {(['light', 'balanced', 'aggressive'] as QualityPreset[]).map((preset) => (
                <PresetButton
                  key={preset}
                  label={preset.charAt(0).toUpperCase() + preset.slice(1)}
                  active={currentQualityPreset === preset}
                  onClick={() => onChange({ quality: presetToQuality[preset] })}
                  disabled={disabled || options.format === 'png'}
                />
              ))}
            </div>
          </ControlGroup>

          {/* Brightness */}
          <ControlGroup label="Brightness" description="Glow it up">
            <div className="flex gap-2">
              {(['dim', 'natural', 'bright', 'extra'] as BrightnessPreset[]).map((preset) => (
                <PresetButton
                  key={preset}
                  label={preset.charAt(0).toUpperCase() + preset.slice(1)}
                  active={currentBrightnessPreset === preset}
                  onClick={() => onChange({ brightness: presetToBrightness[preset] })}
                  disabled={disabled}
                />
              ))}
            </div>
          </ControlGroup>

          {/* Contrast */}
          <ControlGroup label="Contrast" description="Make it pop">
            <div className="flex gap-2">
              {(['flat', 'natural', 'punchy', 'dramatic'] as ContrastPreset[]).map((preset) => (
                <PresetButton
                  key={preset}
                  label={preset.charAt(0).toUpperCase() + preset.slice(1)}
                  active={currentContrastPreset === preset}
                  onClick={() => onChange({ contrast: presetToContrast[preset] })}
                  disabled={disabled}
                />
              ))}
            </div>
          </ControlGroup>

          {/* Sharpness */}
          <ControlGroup label="Sharpness" description="Crispy-ness level">
            <div className="flex gap-2">
              {(['smooth', 'natural', 'crisp', 'sharp'] as SharpnessPreset[]).map((preset) => (
                <PresetButton
                  key={preset}
                  label={preset.charAt(0).toUpperCase() + preset.slice(1)}
                  active={currentSharpnessPreset === preset}
                  onClick={() => onChange({ sharpness: presetToSharpness[preset] })}
                  disabled={disabled}
                />
              ))}
            </div>
          </ControlGroup>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
