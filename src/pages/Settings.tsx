import { motion } from 'framer-motion';
import { Settings, User, Key, Bell, Palette } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  return (
    <div className="min-h-screen py-12 px-8">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
        icon={Settings}
      />

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Profile</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input type="text" placeholder="Your name" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" placeholder="your@email.com" className="input-field" />
            </div>
          </div>
        </motion.div>

        {/* API Keys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-tool-ats" />
            <h2 className="font-semibold">API Configuration</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Connect to Lovable Cloud to enable AI features with automatic API key management.
          </p>
          
          <Button variant="outline">Connect Lovable Cloud</Button>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-tool-support" />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Habit Insights</p>
                <p className="text-sm text-muted-foreground">Receive AI coaching insights at 8 PM</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Support Escalations</p>
                <p className="text-sm text-muted-foreground">Get notified when tickets are escalated</p>
              </div>
              <Switch />
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-tool-knowledge" />
            <h2 className="font-semibold">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Currently using dark theme</p>
            </div>
            <Switch defaultChecked />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button className="w-full" style={{ background: 'var(--gradient-job)' }}>
            Save Changes
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
