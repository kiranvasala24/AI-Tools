import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Settings, BarChart3, Ticket, Send, Bot, User, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SupportConversation {
  id: string;
  subject: string | null;
  status: string | null;
  priority: string | null;
  customer_name: string | null;
  customer_email: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export default function CustomerSupport() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<SupportConversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(conv => ({
        ...conv,
        messages: (Array.isArray(conv.messages) ? conv.messages : []) as unknown as ChatMessage[]
      }));
      
      setConversations(typedData);
      if (typedData.length > 0 && !activeConversation) {
        setActiveConversation(typedData[0]);
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user.id,
          subject: 'New Conversation',
          status: 'open',
          priority: 'medium',
          messages: [],
        })
        .select()
        .single();

      if (error) throw error;
      
      const newConv = { ...data, messages: [] as ChatMessage[] };
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
      
      toast({
        title: 'Conversation Created',
        description: 'Start chatting with the AI support agent.',
      });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation.',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !activeConversation || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...activeConversation.messages, userMessage];
    
    // Optimistic update
    setActiveConversation({
      ...activeConversation,
      messages: updatedMessages,
    });
    setInputValue('');
    setIsSending(true);

    try {
      // Call AI for response
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-support-chat', {
        body: {
          messages: updatedMessages,
          conversationId: activeConversation.id,
        },
      });

      if (aiError) throw aiError;
      if (aiData.error) throw new Error(aiData.error);

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiData.response || 'I apologize, but I could not process your request. Please try again.',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];

      // Update subject if first message
      const newSubject = activeConversation.messages.length === 0 
        ? inputValue.slice(0, 50) + (inputValue.length > 50 ? '...' : '')
        : activeConversation.subject;

      // Save to database
      const { error: updateError } = await supabase
        .from('support_conversations')
        .update({
          messages: finalMessages as any,
          subject: newSubject,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeConversation.id);

      if (updateError) throw updateError;

      setActiveConversation({
        ...activeConversation,
        messages: finalMessages,
        subject: newSubject,
      });

      // Update conversations list
      setConversations(prev => 
        prev.map(c => c.id === activeConversation.id 
          ? { ...c, messages: finalMessages, subject: newSubject, updated_at: new Date().toISOString() }
          : c
        )
      );
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message.',
        variant: 'destructive',
      });
      // Revert optimistic update
      setActiveConversation({
        ...activeConversation,
        messages: activeConversation.messages,
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open': return 'bg-tool-job/20 text-tool-job';
      case 'resolved': return 'bg-tool-habit/20 text-tool-habit';
      case 'escalated': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-tool-support/20 text-tool-support';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const stats = [
    { label: 'Total Conversations', value: conversations.length.toString(), change: '+12%' },
    { label: 'Open Tickets', value: conversations.filter(c => c.status === 'open').length.toString(), change: '' },
    { label: 'Resolved', value: conversations.filter(c => c.status === 'resolved').length.toString(), change: '' },
    { label: 'Escalated', value: conversations.filter(c => c.status === 'escalated').length.toString(), change: '' },
  ];

  return (
    <div className="min-h-screen py-12 px-8">
      <PageHeader
        title="Customer Support Agent"
        description="AI-powered support with knowledge base and ticketing"
        icon={MessageSquare}
        gradient="--gradient-support"
      >
        <Button onClick={createNewConversation} className="gap-2" style={{ background: 'var(--gradient-support)' }}>
          <Plus className="w-4 h-4" />
          New Conversation
        </Button>
      </PageHeader>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-6 bg-secondary">
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Live Chat
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <Ticket className="w-4 h-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Conversation List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 max-h-[600px] overflow-y-auto"
            >
              <h3 className="font-semibold mb-4 text-sm">Conversations</h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet. Start a new one!
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeConversation?.id === conv.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <p className="text-sm font-medium truncate">{conv.subject || 'New Conversation'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Chat Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 glass-card flex flex-col h-[600px]"
            >
              {activeConversation ? (
                <>
                  <div className="p-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-support)' }}>
                        <Bot className="w-5 h-5 text-background" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Support Agent</h3>
                        <span className="text-xs text-tool-habit">● Online</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeConversation.messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">Start the conversation by sending a message.</p>
                      </div>
                    ) : (
                      activeConversation.messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            message.role === 'assistant' 
                              ? 'bg-tool-support/20' 
                              : 'bg-primary/20'
                          }`}>
                            {message.role === 'assistant' ? (
                              <Bot className="w-4 h-4 text-tool-support" />
                            ) : (
                              <User className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className={`max-w-[70%] p-3 rounded-2xl ${
                            message.role === 'assistant'
                              ? 'bg-secondary rounded-tl-sm'
                              : 'bg-primary text-primary-foreground rounded-tr-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    {isSending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-tool-support/20">
                          <Bot className="w-4 h-4 text-tool-support" />
                        </div>
                        <div className="bg-secondary rounded-2xl rounded-tl-sm p-3">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-border/50">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="input-field flex-1"
                        disabled={isSending}
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={isSending || !inputValue.trim()}
                        style={{ background: 'var(--gradient-support)' }}
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a conversation or start a new one</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">All Tickets</h3>
              <Button onClick={createNewConversation} variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Ticket
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No tickets yet.</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      setActiveConversation(conv);
                      const tabsList = document.querySelector('[value="chat"]') as HTMLButtonElement;
                      tabsList?.click();
                    }}
                  >
                    <div>
                      <h4 className="font-medium text-foreground">{conv.subject || 'New Conversation'}</h4>
                      <p className="text-sm text-muted-foreground">
                        #{conv.id.slice(0, 8)} • Created {new Date(conv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(conv.priority)}`}>
                        {conv.priority || 'medium'}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(conv.status)}`}>
                        {conv.status || 'open'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                  {stat.change && (
                    <span className="text-sm font-medium text-tool-habit">{stat.change}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Start conversations to see activity here.</p>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 5).map((conv) => (
                  <div key={conv.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-tool-support/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-tool-support" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{conv.subject || 'New Conversation'}</p>
                      <p className="text-xs text-muted-foreground">{conv.messages.length} messages</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(conv.status)}`}>
                      {conv.status || 'open'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
