import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, Search, FileText, Link, Sparkles, ChevronRight, X, Loader2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Document {
  id: string;
  title: string;
  doc_type: string | null;
  content: string | null;
  file_url: string | null;
  created_at: string;
}

interface QueryResult {
  answer: string;
  citations: { docId: string; title: string; text: string }[];
  actionItems: string[];
}

export default function KnowledgeWorkspace() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    if (documents.length === 0) {
      toast({
        title: 'No Documents',
        description: 'Please add some documents to your knowledge base first.',
        variant: 'destructive',
      });
      return;
    }

    setIsQuerying(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-knowledge-query', {
        body: {
          query: query,
          documents: documents.map(d => ({
            id: d.id,
            title: d.title,
            content: d.content,
          })),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult({
        answer: data.answer || 'No answer could be generated.',
        citations: data.citations || [],
        actionItems: data.actionItems || [],
      });

      // Save query to history
      await supabase.from('document_queries').insert({
        user_id: user?.id,
        query: query,
        response: data.answer,
        citations: data.citations,
      });
    } catch (error: any) {
      console.error('Query error:', error);
      toast({
        title: 'Query Failed',
        description: error.message || 'Failed to process your query.',
        variant: 'destructive',
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const addDocument = async () => {
    if (!user) return;
    if (!newDocTitle.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please provide a title for your document.',
        variant: 'destructive',
      });
      return;
    }

    if (!newDocContent.trim() && !newDocUrl.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please provide content or a URL for your document.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingDoc(true);

    try {
      const docType = newDocUrl.trim() ? 'link' : 'note';
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: newDocTitle.trim(),
          content: newDocContent.trim() || `URL: ${newDocUrl.trim()}`,
          doc_type: docType,
          file_url: newDocUrl.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data, ...documents]);
      setShowUploadModal(false);
      setNewDocTitle('');
      setNewDocContent('');
      setNewDocUrl('');
      
      toast({
        title: 'Document Added',
        description: 'Your document has been added to the knowledge base.',
      });
    } catch (error: any) {
      console.error('Error adding document:', error);
      toast({
        title: 'Error',
        description: 'Failed to add document.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingDoc(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      setDocuments(documents.filter(d => d.id !== docId));
      toast({
        title: 'Document Deleted',
        description: 'The document has been removed from your knowledge base.',
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'doc': return '📝';
      case 'link': return '🔗';
      case 'note': return '📌';
      default: return '📁';
    }
  };

  return (
    <div className="min-h-screen py-12 px-8">
      <PageHeader
        title="Knowledge Workspace"
        description="Your AI-powered personal knowledge base"
        icon={BookOpen}
        gradient="--gradient-knowledge"
      >
        <Button
          onClick={() => setShowUploadModal(true)}
          className="gap-2"
          style={{ background: 'var(--gradient-knowledge)' }}
        >
          <Upload className="w-4 h-4" />
          Add Document
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Query Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder="Ask anything about your documents..."
                  className="input-field pl-12"
                  disabled={isQuerying}
                />
              </div>
              <Button
                onClick={handleQuery}
                disabled={isQuerying || !query.trim()}
                style={{ background: 'var(--gradient-knowledge)' }}
              >
                {isQuerying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Answer */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-knowledge)' }}>
                      <Sparkles className="w-4 h-4 text-background" />
                    </div>
                    <h3 className="font-semibold">Answer</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {result.answer}
                  </p>
                </div>

                {/* Citations */}
                {result.citations.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4">Sources</h3>
                    <div className="space-y-3">
                      {result.citations.map((citation, index) => (
                        <div
                          key={index}
                          className="p-4 bg-secondary/50 rounded-xl border-l-2 border-tool-knowledge"
                        >
                          <p className="text-xs text-muted-foreground mb-1 font-medium">{citation.title}</p>
                          <p className="text-sm text-muted-foreground italic">
                            "{citation.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {result.actionItems.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4">Suggested Action Items</h3>
                    <ul className="space-y-2">
                      {result.actionItems.map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-tool-knowledge/20 text-tool-knowledge flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !isQuerying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Query Your Knowledge</h3>
              <p className="text-muted-foreground text-sm">
                {documents.length === 0 
                  ? 'Add documents to your knowledge base, then ask questions to get AI-powered answers.'
                  : 'Ask questions about your uploaded documents and get AI-powered answers with citations.'}
              </p>
            </motion.div>
          )}

          {isQuerying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-tool-knowledge" />
              <h3 className="font-semibold text-foreground mb-2">Analyzing Documents</h3>
              <p className="text-muted-foreground text-sm">
                Searching through your knowledge base...
              </p>
            </motion.div>
          )}
        </div>

        {/* Documents Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Documents</h3>
            <span className="text-xs text-muted-foreground">
              {documents.length} total
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No documents yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowUploadModal(true)}
              >
                Add Your First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-lg">{getTypeIcon(doc.doc_type)}</span>
                    <div className="min-w-0">
                      <span className="text-sm truncate block">{doc.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Add notes, docs, or links to build your knowledge base
            </p>
          </div>
        </motion.div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Add Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Document title..."
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Paste your document content here..."
                    className="textarea-field h-32"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL</label>
                  <input
                    type="text"
                    value={newDocUrl}
                    onChange={(e) => setNewDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="input-field"
                  />
                </div>

                <Button
                  className="w-full"
                  style={{ background: 'var(--gradient-knowledge)' }}
                  onClick={addDocument}
                  disabled={isAddingDoc}
                >
                  {isAddingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add to Knowledge Base'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
