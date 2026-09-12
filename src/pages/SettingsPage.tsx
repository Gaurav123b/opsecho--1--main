import React, { useState, useEffect } from "react";
import { User, Bell, Mic, Blocks, Save, CheckCircle2, Monitor, Moon, Sun, Volume2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router-dom";
import { clsx } from "clsx";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab")) {
      setActiveTab(params.get("tab") || "profile");
    } else if (params.get("integration") || params.get("error")) {
      setActiveTab("integrations");
    }
  }, [location.search]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "ENGINEER",
    phone: "",
    timezone: "UTC-8 (Pacific Time)",
    department: "Engineering",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEffects: true,
  });

  const [integrations, setIntegrations] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/integrations`, {
        headers: { "x-user-id": user.id }
      })
      .then(res => res.json())
      .then(data => {
        if (data.integrations) {
          setIntegrations(data.integrations.map((i: any) => i.provider));
        }
      })
      .catch(err => console.error("Failed to fetch integrations", err));
    }
  }, [user]);

  const handleConnectIntegration = (provider: string) => {
    if (!user) return;
    window.location.href = `/api/integrations/${provider}/authorize?userId=${user.id}`;
  };

  const handleDisconnectIntegration = async (provider: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/integrations/${provider}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id }
      });
      if (res.ok) {
        setIntegrations(integrations.filter(i => i !== provider.toUpperCase()));
      }
    } catch (err) {
      console.error("Failed to disconnect integration", err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Blocks },
  ];

  return (
    <div className="max-w-5xl mx-auto py-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-text-muted text-sm">Manage your account preferences and application settings.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium border",
                  isActive
                    ? "bg-blue-600/10 text-accent dark:text-accent border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                    : "bg-bg-surface dark:bg-bg-surface/[0.02] text-text-muted dark:text-text-muted border-border-subtle dark:border-border-subtle hover:bg-bg-surface dark:hover:bg-bg-surface/5 hover:text-text-primary dark:hover:text-zinc-200"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-accent dark:text-accent" : "text-text-muted dark:text-text-muted")} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <div className="md:col-span-3">
          <div className="glass-panel rounded-2xl p-6 min-h-[500px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold mb-1 text-text-primary dark:text-text-primary">Profile Information</h2>
                    <p className="text-xs text-text-muted">Update your account's profile information and email address.</p>
                  </div>
                  
                  <form onSubmit={handleSave} className="space-y-5">
                    <div className="flex items-center gap-6 pb-4 border-b border-border-subtle dark:border-border-subtle">
                      <div className="relative group cursor-pointer">
                        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                          {profileData.name.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-bold uppercase tracking-widest text-white">Edit</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-text-primary dark:text-text-primary">{profileData.name || "User"}</h3>
                        <p className="text-text-muted text-sm uppercase tracking-widest font-semibold">{profileData.role.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted dark:text-text-muted uppercase tracking-widest">Full Name</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          className="w-full bg-bg-primary dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-text-primary dark:text-text-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted dark:text-text-muted uppercase tracking-widest">Email Address</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="w-full bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-text-muted dark:text-text-muted cursor-not-allowed"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted dark:text-text-muted uppercase tracking-widest">Phone Number (Alerts)</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="w-full bg-bg-primary dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-text-primary dark:text-text-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted dark:text-text-muted uppercase tracking-widest">Department</label>
                        <select
                          value={profileData.department}
                          onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                          className="w-full bg-bg-primary dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-text-primary dark:text-text-primary appearance-none"
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="SRE">Site Reliability (SRE)</option>
                          <option value="Product">Product</option>
                          <option value="Support">Customer Support</option>
                          <option value="Executive">Executive</option>
                        </select>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-xs font-bold text-text-muted dark:text-text-muted uppercase tracking-widest">Timezone</label>
                        <select
                          value={profileData.timezone}
                          onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                          className="w-full bg-bg-primary dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-text-primary dark:text-text-primary appearance-none"
                        >
                          <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                          <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                          <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                          <option value="UTC+1 (CET)">UTC+1 (CET)</option>
                          <option value="UTC+5:30 (IST)">UTC+5:30 (IST)</option>
                          <option value="UTC+10 (AEST)">UTC+10 (AEST)</option>
                        </select>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "preferences" && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-lg font-bold mb-1">Appearance & Notifications</h2>
                    <p className="text-xs text-text-muted">Customize how the application looks and how you are notified.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => setTheme('dark')}
                        className={clsx("p-4 rounded-xl border flex flex-col items-center gap-3 transition-all", theme === 'dark' ? "bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-accent dark:text-accent" : "bg-bg-primary dark:bg-bg-surface border-border-subtle dark:border-border-subtle text-text-muted dark:text-text-muted hover:bg-bg-surface dark:hover:bg-bg-surface/5")}
                      >
                        <Moon className="w-6 h-6" />
                        <span className="text-sm font-bold">Dark</span>
                      </button>
                      <button 
                        onClick={() => setTheme('light')}
                        className={clsx("p-4 rounded-xl border flex flex-col items-center gap-3 transition-all", theme === 'light' ? "bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-accent dark:text-accent" : "bg-bg-primary dark:bg-bg-surface border-border-subtle dark:border-border-subtle text-text-muted dark:text-text-muted hover:bg-bg-surface dark:hover:bg-bg-surface/5")}
                      >
                        <Sun className="w-6 h-6" />
                        <span className="text-sm font-bold">Light</span>
                      </button>
                      <button 
                        onClick={() => setTheme('system')}
                        className={clsx("p-4 rounded-xl border flex flex-col items-center gap-3 transition-all", theme === 'system' ? "bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-accent dark:text-accent" : "bg-bg-primary dark:bg-bg-surface border-border-subtle dark:border-border-subtle text-text-muted dark:text-text-muted hover:bg-bg-surface dark:hover:bg-bg-surface/5")}
                      >
                        <Monitor className="w-6 h-6" />
                        <span className="text-sm font-bold">System</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-text-muted dark:text-text-muted uppercase tracking-widest border-b border-border-subtle dark:border-border-subtle pb-2">Notifications</h3>
                    
                    <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                      <div>
                        <p className="font-bold text-sm">Email Notifications</p>
                        <p className="text-xs text-text-muted mt-1">Receive email alerts for critical incidents you are assigned to.</p>
                      </div>
                      <button 
                        onClick={() => setPreferences({...preferences, emailNotifications: !preferences.emailNotifications})}
                        className={clsx("w-12 h-6 rounded-full transition-colors relative", preferences.emailNotifications ? "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]" : "bg-zinc-700")}
                      >
                        <div className={clsx("w-4 h-4 rounded-full bg-bg-surface absolute top-1 transition-all", preferences.emailNotifications ? "left-7" : "left-1")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                      <div>
                        <p className="font-bold text-sm">Push Notifications</p>
                        <p className="text-xs text-text-muted mt-1">Receive browser push notifications for updates.</p>
                      </div>
                      <button 
                        onClick={() => setPreferences({...preferences, pushNotifications: !preferences.pushNotifications})}
                        className={clsx("w-12 h-6 rounded-full transition-colors relative", preferences.pushNotifications ? "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]" : "bg-zinc-700")}
                      >
                        <div className={clsx("w-4 h-4 rounded-full bg-bg-surface absolute top-1 transition-all", preferences.pushNotifications ? "left-7" : "left-1")} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}



              {activeTab === "integrations" && (
                <motion.div
                  key="integrations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold mb-1 text-text-primary dark:text-text-primary">Connected Integrations</h2>
                    <p className="text-xs text-text-muted">Connect third-party tools to sync alerts and incidents.</p>
                  </div>

                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* Slack Integration Card */}
                    <motion.div variants={itemVariants} className="group relative p-6 bg-bg-surface dark:bg-bg-surface/40 backdrop-blur-xl border border-border-subtle dark:border-border-subtle hover:border-purple-500/50 dark:hover:border-purple-500/50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700/50 flex items-center justify-center text-2xl font-black text-purple-600 dark:text-purple-400 shadow-inner">
                            S
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${integrations.includes("SLACK") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" : "bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400 border border-zinc-200 dark:border-white/10"}`}>
                            {integrations.includes("SLACK") ? "Connected" : "Disconnected"}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-text-primary dark:text-white mb-2">Slack</h3>
                          <p className="text-sm text-text-muted leading-relaxed">Instantly sync incident updates, decisions, and resolutions to your designated Slack channels.</p>
                        </div>
                      </div>
                      <div className="relative z-10 mt-8 pt-6 border-t border-border-subtle dark:border-white/5">
                        {integrations.includes("SLACK") ? (
                          <button 
                            onClick={() => handleDisconnectIntegration("slack")}
                            className="w-full py-2.5 bg-state-conflict/10 hover:bg-state-conflict/20 text-state-conflict text-sm font-bold rounded-xl transition-all border border-state-conflict/20"
                          >
                            Disconnect Slack
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleConnectIntegration("slack")}
                            className="w-full py-2.5 bg-text-primary text-bg-primary dark:bg-white dark:text-black hover:scale-[1.02] text-sm font-bold rounded-xl transition-all shadow-md"
                          >
                            Connect Slack
                          </button>
                        )}
                      </div>
                    </motion.div>

                    {/* Jira Integration Card */}
                    <motion.div variants={itemVariants} className="group relative p-6 bg-bg-surface dark:bg-bg-surface/40 backdrop-blur-xl border border-border-subtle dark:border-border-subtle hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 flex items-center justify-center text-2xl font-black text-blue-600 dark:text-blue-400 shadow-inner">
                            J
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${integrations.includes("JIRA") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" : "bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400 border border-zinc-200 dark:border-white/10"}`}>
                            {integrations.includes("JIRA") ? "Connected" : "Disconnected"}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-text-primary dark:text-white mb-2">Jira Software</h3>
                          <p className="text-sm text-text-muted leading-relaxed">Automatically generate and sync bug tickets, attaching AI-generated incident summaries directly to epics.</p>
                        </div>
                      </div>
                      <div className="relative z-10 mt-8 pt-6 border-t border-border-subtle dark:border-white/5">
                        {integrations.includes("JIRA") ? (
                          <button 
                            onClick={() => handleDisconnectIntegration("jira")}
                            className="w-full py-2.5 bg-state-conflict/10 hover:bg-state-conflict/20 text-state-conflict text-sm font-bold rounded-xl transition-all border border-state-conflict/20"
                          >
                            Disconnect Jira
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleConnectIntegration("jira")}
                            className="w-full py-2.5 bg-text-primary text-bg-primary dark:bg-white dark:text-black hover:scale-[1.02] text-sm font-bold rounded-xl transition-all shadow-md"
                          >
                            Connect Jira
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Save Action Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#121212] to-transparent pointer-events-none flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={clsx(
                  "pointer-events-auto flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg",
                  showSuccess 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                )}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-border-subtle border-t-white rounded-full animate-spin" />
                ) : showSuccess ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : showSuccess ? "Saved Successfully" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
