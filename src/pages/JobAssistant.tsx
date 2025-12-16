import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Wand2, Copy, Check, Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function JobAssistant() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [tone, setTone] = useState<'professional' | 'conversational' | 'confident'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{
    bullets: string[];
    coverLetter: string;
    summary: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!jobDescription || !resumeText) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both job description and resume.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-assistant', {
        body: {
          resumeContent: resumeText,
          jobDescription: jobDescription,
          settings: { tone },
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResults({
        bullets: data.bullets || [],
        coverLetter: data.coverLetter || '',
        summary: data.summary || '',
      });
      
      toast({
        title: 'Generation Complete',
        description: 'Your tailored application materials are ready!',
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard.',
    });
  };

  const bulletsText = Array.isArray(results?.bullets) 
    ? results.bullets.map(b => `• ${b}`).join('\n\n')
    : '';

  return (
    <div className="min-h-screen py-12 px-8">
      <PageHeader
        title="Job Application Assistant"
        description="Generate tailored resumes and cover letters with AI"
        icon={FileText}
        gradient="--gradient-job"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <label className="block text-sm font-medium text-foreground mb-3">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="textarea-field h-48"
            />
          </motion.div>

          {/* Resume Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <label className="block text-sm font-medium text-foreground mb-3">
              Your Resume
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content or key experiences..."
              className="textarea-field h-48"
            />
            <div className="mt-4 flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload PDF
              </Button>
              <span className="text-xs text-muted-foreground">
                Or paste text directly above
              </span>
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Generation Settings</span>
            </div>
            <div className="flex gap-2">
              {(['professional', 'conversational', 'confident'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tone === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-6 text-lg font-semibold gap-3"
              style={{ background: 'var(--gradient-job)' }}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Application Materials
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <AnimatePresence mode="wait">
            {results ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Tabs defaultValue="bullets" className="w-full">
                  <TabsList className="w-full mb-6 bg-secondary">
                    <TabsTrigger value="bullets" className="flex-1">Resume Bullets</TabsTrigger>
                    <TabsTrigger value="cover" className="flex-1">Cover Letter</TabsTrigger>
                    <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="bullets" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-foreground">Tailored Bullet Points</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bulletsText, 'bullets')}
                        className="gap-2"
                      >
                        {copiedField === 'bullets' ? (
                          <Check className="w-4 h-4 text-tool-habit" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {bulletsText || 'No bullets generated'}
                    </div>
                  </TabsContent>

                  <TabsContent value="cover" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-foreground">Cover Letter</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(results.coverLetter, 'cover')}
                        className="gap-2"
                      >
                        {copiedField === 'cover' ? (
                          <Check className="w-4 h-4 text-tool-habit" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {results.coverLetter || 'No cover letter generated'}
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-foreground">Recruiter Summary</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(results.summary, 'summary')}
                        className="gap-2"
                      >
                        {copiedField === 'summary' ? (
                          <Check className="w-4 h-4 text-tool-habit" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {results.summary || 'No summary generated'}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <Wand2 className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready to Generate
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Paste a job description and your resume to create tailored application materials.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
