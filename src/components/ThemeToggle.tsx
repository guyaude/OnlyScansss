import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className="relative w-14 h-7 rounded-full bg-secondary border border-border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5">
        <Sun className="w-3.5 h-3.5 text-warning opacity-60" />
        <Moon className="w-3.5 h-3.5 text-primary opacity-60" />
      </div>
      
      {/* Sliding thumb */}
      <motion.div
        className="absolute top-0.5 w-6 h-6 rounded-full bg-card shadow-soft flex items-center justify-center border border-border"
        animate={{ left: theme === 'light' ? 2 : 30 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.div
          initial={false}
          animate={{ rotate: theme === 'dark' ? 360 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {theme === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-warning" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-primary" />
          )}
        </motion.div>
      </motion.div>
    </button>
  );
};
