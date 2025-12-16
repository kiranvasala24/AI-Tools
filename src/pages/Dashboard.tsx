import { motion } from 'framer-motion';
import { 
  FileText, 
  Target, 
  CheckCircle, 
  MessageSquare, 
  BookOpen,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';
import { ToolCard } from '@/components/dashboard/ToolCard';

const tools = [
  {
    id: 'job-assistant',
    title: 'Job Application Assistant',
    description: 'Generate tailored resumes, cover letters, and recruiter summaries from any job description.',
    icon: FileText,
    href: '/job-assistant',
    gradient: '--gradient-job',
    colorClass: 'bg-tool-job',
    features: [
      'AI-tailored resume bullets',
      'Custom cover letters',
      'Recruiter-ready summaries',
      'Personal RAG memory',
    ],
  },
  {
    id: 'habit-tracker',
    title: 'Habit Tracking Coach',
    description: 'Track your habits and receive personalized AI insights to optimize your routines.',
    icon: CheckCircle,
    href: '/habits',
    gradient: '--gradient-habit',
    colorClass: 'bg-tool-habit',
    features: [
      'Daily habit logging',
      'Pattern recognition',
      'Personalized suggestions',
      'Automated coaching',
    ],
  },
  {
    id: 'ats-optimizer',
    title: 'ATS Resume Optimizer',
    description: 'Parse, analyze, and optimize your resume to pass applicant tracking systems.',
    icon: Target,
    href: '/ats-optimizer',
    gradient: '--gradient-ats',
    colorClass: 'bg-tool-ats',
    features: [
      'Resume parsing',
      'Keyword analysis',
      'ATS score calculation',
      'Optimization suggestions',
    ],
  },
  {
    id: 'customer-support',
    title: 'Customer Support Agent',
    description: 'AI-powered support chatbot with knowledge base, ticketing, and escalation.',
    icon: MessageSquare,
    href: '/support',
    gradient: '--gradient-support',
    colorClass: 'bg-tool-support',
    features: [
      'Embeddable chat widget',
      'RAG-powered answers',
      'Ticket management',
      'Performance dashboard',
    ],
  },
  {
    id: 'knowledge-workspace',
    title: 'Knowledge Workspace',
    description: 'Upload documents and query your personal AI-indexed knowledge base.',
    icon: BookOpen,
    href: '/knowledge',
    gradient: '--gradient-knowledge',
    colorClass: 'bg-tool-knowledge',
    features: [
      'Multi-format uploads',
      'Smart indexing',
      'Cited responses',
      'Action item generation',
    ],
  },
];

const stats = [
  { label: 'AI Models', value: '5+', icon: Sparkles },
  { label: 'Productivity Boost', value: '10x', icon: Zap },
  { label: 'Success Rate', value: '95%', icon: TrendingUp },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen py-12 px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Powered by Advanced AI</span>
          </motion.div>
          
          <h1 className="text-5xl font-bold text-foreground mb-4 leading-tight">
            Your Complete{' '}
            <span className="gradient-text">AI Productivity</span>
            {' '}Suite
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Five powerful AI tools designed to supercharge your job search, 
            habits, customer support, and knowledge management.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-10">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <ToolCard key={tool.id} {...tool} index={index} />
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 text-center"
      >
        <p className="text-muted-foreground">
          More tools coming soon • Built with cutting-edge AI models
        </p>
      </motion.div>
    </div>
  );
}
