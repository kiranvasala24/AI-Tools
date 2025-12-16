import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  gradient?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, gradient, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div 
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
              )}
              style={gradient ? { background: `var(${gradient})` } : undefined}
            >
              <Icon className="w-6 h-6 text-background" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
