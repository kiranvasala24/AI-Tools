import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Plus, Sparkles, Calendar, TrendingUp, X, Check, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  color: string;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  completed: boolean;
  notes: string | null;
  logged_at: string;
}

interface Insight {
  type: string;
  message: string;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [fetchingInsights, setFetchingInsights] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchLogs();
    }
  }, [user]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
    } else {
      setHabits(data || []);
    }
    setLoading(false);
  };

  const fetchLogs = async () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('logged_at', weekAgo.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data || []);
    }
  };

  const fetchInsights = async () => {
    if (habits.length === 0) {
      toast({ title: 'Add some habits first', description: 'Track habits for a few days to get insights.' });
      return;
    }

    setFetchingInsights(true);
    try {
      const habitsWithLogs = habits.map(h => ({
        ...h,
        habit_name: h.name,
      }));

      const logsWithNames = logs.map(l => ({
        ...l,
        habit_name: habits.find(h => h.id === l.habit_id)?.name || 'Unknown',
      }));

      const { data, error } = await supabase.functions.invoke('ai-habit-insights', {
        body: { habits: habitsWithLogs, logs: logsWithNames },
      });

      if (error) throw error;

      if (data.insights) {
        setInsights(data.insights);
        toast({ title: 'Insights Updated', description: 'Fresh AI insights are ready!' });
      }
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      toast({ title: 'Error', description: 'Could not fetch insights', variant: 'destructive' });
    } finally {
      setFetchingInsights(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = logs.find(l => l.habit_id === habitId && l.logged_at === today);

    if (existingLog) {
      const { error } = await supabase
        .from('habit_logs')
        .update({ completed: !existingLog.completed })
        .eq('id', existingLog.id);

      if (error) {
        toast({ title: 'Error', description: 'Could not update habit', variant: 'destructive' });
      } else {
        setLogs(logs.map(l => l.id === existingLog.id ? { ...l, completed: !l.completed } : l));
        const habit = habits.find(h => h.id === habitId);
        if (!existingLog.completed) {
          toast({ title: `${habit?.name} completed!`, description: 'Keep up the great work!' });
        }
      }
    } else {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habitId, user_id: user?.id, completed: true, logged_at: today })
        .select()
        .single();

      if (error) {
        toast({ title: 'Error', description: 'Could not log habit', variant: 'destructive' });
      } else if (data) {
        setLogs([...logs, data]);
        const habit = habits.find(h => h.id === habitId);
        toast({ title: `${habit?.name} completed!`, description: 'Keep up the great work!' });
      }
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;

    const { data, error } = await supabase
      .from('habits')
      .insert({ name: newHabitName, user_id: user?.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Could not add habit', variant: 'destructive' });
    } else if (data) {
      setHabits([data, ...habits]);
      setNewHabitName('');
      setShowAddModal(false);
      toast({ title: 'Habit added!', description: `Start tracking "${newHabitName}" today.` });
    }
  };

  const getHabitCompletion = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const log = logs.find(l => l.habit_id === habitId && l.logged_at === today);
    return log?.completed || false;
  };

  const getWeekData = (habitId: string) => {
    const today = new Date();
    const weekData: boolean[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = logs.find(l => l.habit_id === habitId && l.logged_at === dateStr);
      weekData.push(log?.completed || false);
    }
    
    return weekData;
  };

  const getStreak = (habitId: string) => {
    const habitLogs = logs
      .filter(l => l.habit_id === habitId && l.completed)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
    
    if (habitLogs.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (habitLogs.some(l => l.logged_at === dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const completedCount = habits.filter(h => getHabitCompletion(h.id)).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-8">
      <PageHeader
        title="Habit Tracking Coach"
        description="Track your habits and receive AI-powered insights"
        icon={CheckCircle}
        gradient="--gradient-habit"
      >
        <Button
          onClick={() => setShowAddModal(true)}
          className="gap-2"
          style={{ background: 'var(--gradient-habit)' }}
        >
          <Plus className="w-4 h-4" />
          Add Habit
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-tool-habit" />
                <h2 className="text-lg font-semibold">Today's Progress</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-tool-habit">{completionRate}%</span>
                <span className="text-sm text-muted-foreground">complete</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-secondary rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-habit)' }}
              />
            </div>

            {/* Habit List */}
            {habits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No habits yet. Add your first habit to get started!</p>
                <Button onClick={() => setShowAddModal(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Habit
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit, index) => {
                  const completed = getHabitCompletion(habit.id);
                  const weekData = getWeekData(habit.id);
                  const streak = getStreak(habit.id);

                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                        completed 
                          ? 'bg-tool-habit/10 border border-tool-habit/30' 
                          : 'bg-secondary/50 border border-transparent hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            completed
                              ? 'bg-tool-habit text-background'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          {completed ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <span className="text-lg">✨</span>
                          )}
                        </button>
                        <div>
                          <h3 className={`font-medium ${completed ? 'text-tool-habit' : 'text-foreground'}`}>
                            {habit.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="w-3 h-3" />
                            <span>{streak} day streak</span>
                          </div>
                        </div>
                      </div>

                      {/* Week View */}
                      <div className="flex gap-1.5">
                        {weekData.map((dayCompleted, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                              dayCompleted 
                                ? 'bg-tool-habit/20 text-tool-habit' 
                                : 'bg-secondary text-muted-foreground'
                            }`}
                            title={weekDays[i]}
                          >
                            {weekDays[i][0]}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-habit)' }}>
                  <Sparkles className="w-4 h-4 text-background" />
                </div>
                <h2 className="font-semibold">AI Coach Insights</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchInsights}
                disabled={fetchingInsights}
              >
                {fetchingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>

            {insights.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Track your habits for a few days, then click refresh to get personalized AI insights.
                </p>
                <Button variant="outline" size="sm" onClick={fetchInsights} disabled={fetchingInsights}>
                  {fetchingInsights ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Get Insights
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`p-4 rounded-xl text-sm leading-relaxed ${
                      insight.type === 'pattern' ? 'bg-tool-job/10 border border-tool-job/20' :
                      insight.type === 'suggestion' ? 'bg-tool-ats/10 border border-tool-ats/20' :
                      'bg-tool-habit/10 border border-tool-habit/20'
                    }`}
                  >
                    {insight.message}
                  </motion.div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Insights update daily at 8 PM
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold mb-4">This Week</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-secondary/50 rounded-xl">
                <div className="text-2xl font-bold text-tool-habit">
                  {logs.filter(l => l.completed).length}
                </div>
                <div className="text-xs text-muted-foreground">Habits Done</div>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-xl">
                <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
                <div className="text-xs text-muted-foreground">Completion</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Add New Habit</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <input
                type="text"
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                placeholder="e.g., Morning meditation"
                className="input-field mb-4"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && addHabit()}
              />
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addHabit}
                  className="flex-1"
                  style={{ background: 'var(--gradient-habit)' }}
                >
                  Add Habit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
