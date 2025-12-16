import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  colorClass: string;
  features: string[];
  index: number;
}

export function ToolCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  gradient, 
  colorClass,
  features,
  index 
}: ToolCardProps) {
  const getToolColor = () => {
    if (gradient.includes('job')) return 'bg-tool-job';
    if (gradient.includes('habit')) return 'bg-tool-habit';
    if (gradient.includes('ats')) return 'bg-tool-ats';
    if (gradient.includes('support')) return 'bg-tool-support';
    if (gradient.includes('knowledge')) return 'bg-tool-knowledge';
    return 'bg-primary';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={href} className="block group">
        <div className="tool-card h-full">
          {/* Gradient overlay on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl"
          />
          
          {/* Icon */}
          <div 
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110",
              getToolColor()
            )}
          >
            <Icon className="w-7 h-7 text-background" />
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            {description}
          </p>

          {/* Features */}
          <ul className="space-y-2 mb-6">
            {features.slice(0, 3).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={cn("w-1.5 h-1.5 rounded-full", getToolColor())} />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
