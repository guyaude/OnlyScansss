import { Scan } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ size = 'md' }: LogoProps) => {
  const sizes = {
    sm: { container: 'gap-2', icon: 'w-5 h-5', text: 'text-lg' },
    md: { container: 'gap-2.5', icon: 'w-6 h-6', text: 'text-xl' },
    lg: { container: 'gap-3', icon: 'w-7 h-7', text: 'text-2xl' },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.container}`}>
      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-primary">
        <Scan className={`${s.icon} text-primary-foreground`} />
      </div>
      <div className="flex flex-col">
        <span className={`${s.text} font-bold tracking-tight text-foreground`}>
          Only<span className="text-primary">Scans</span>
        </span>
      </div>
    </div>
  );
};
