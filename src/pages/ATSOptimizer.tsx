import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Upload, Zap, AlertCircle, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ATSResult {
  score: number;
  missingKeywords: string[];
  suggestions: { category: string; priority: string; suggestion: string }[];
  optimizedSummary?: string;
  optimizedBullets?: string[];
}

export default function ATSOptimizer() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText || !targetRole) {
      toast({ title: 'Missing Information', description: 'Please provide both your resume and target role.', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-ats-optimizer', {
        body: { resumeContent: resumeText, targetRole },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast({ title: 'Analysis Complete', description: `Your ATS score is ${data.score}%` });
    } catch (error: any) {
      toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => score >= 80 ? 'text-tool-habit' : score >= 60 ? 'text-tool-support' : 'text-destructive';

  return (
    <div className="min-h-screen py-12 px-8">
      <PageHeader title="ATS Resume Optimizer" description="Analyze and optimize your resume for applicant tracking systems" icon={Target} gradient="--gradient-ats" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
            <label className="block text-sm font-medium text-foreground mb-3">Target Role</label>
            <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g., Senior Software Engineer" className="input-field mb-6" />
            <label className="block text-sm font-medium text-foreground mb-3">Resume Content</label>
            <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume text here..." className="textarea-field h-64" />
          </motion.div>

          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-6 text-lg font-semibold gap-3" style={{ background: 'var(--gradient-ats)' }}>
            {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : <><Zap className="w-5 h-5" />Analyze for ATS</>}
          </Button>
        </div>

        <div className="space-y-6">
          {result ? (
            <>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">ATS Score</h3>
                  <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>{result.score}%</span>
                </div>
                <Progress value={result.score} className="h-4" />
              </motion.div>

              {result.missingKeywords?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4"><AlertCircle className="w-4 h-4 text-destructive" /><span className="font-medium">Missing Keywords</span></div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map(kw => <span key={kw} className="px-3 py-1 bg-destructive/10 text-destructive rounded-lg text-sm">{kw}</span>)}
                  </div>
                </motion.div>
              )}

              {result.suggestions?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                  <h3 className="font-semibold mb-4">Optimization Tips</h3>
                  <ul className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-tool-ats/20 text-tool-ats flex items-center justify-center shrink-0 text-xs">{i + 1}</span>
                        <span className="text-muted-foreground">{s.suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </>
          ) : (
            <div className="glass-card p-6 h-full flex flex-col items-center justify-center py-20 text-center">
              <Target className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Ready to Optimize</h3>
              <p className="text-muted-foreground text-sm">Paste your resume and target role to get ATS analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
