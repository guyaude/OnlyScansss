import { motion } from 'framer-motion';
import { Zap, Lock, Package } from 'lucide-react';

export const EmptyState = () => {
  const features = [
    {
      icon: Zap,
      title: 'Instant processing',
      description: 'Everything runs locally in your browser',
    },
    {
      icon: Lock,
      title: 'Completely private',
      description: 'Your images never leave your device',
    },
    {
      icon: Package,
      title: 'Batch support',
      description: 'Process multiple images at once',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="max-w-2xl mx-auto"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="p-5 bg-card rounded-xl shadow-soft"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center mb-3">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
