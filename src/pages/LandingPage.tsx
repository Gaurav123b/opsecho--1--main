import React, { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import { Link } from "react-router-dom";
import { Shield, Zap, MessageSquare, BarChart3, Users, Activity, ArrowRight, Server, Database, Globe, Lock, Sun, Moon, CheckCircle2, Sparkles, ShieldCheck, TicketCheck, Check, Blocks } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const steps = [
  { number: "01", icon: Activity, title: "Open an incident room", text: "Create a room with a focused objective and invite responders with a shareable code." },
  { number: "02", icon: MessageSquare, title: "Talk naturally", text: "Your team uses the live voice room while OpsEcho listens for decisions, symptoms, and next actions." },
  { number: "03", icon: Sparkles, title: "Build shared state", text: "Gemini turns conversation into a structured feed of facts, hypotheses, owners, and risks." },
  { number: "04", icon: ShieldCheck, title: "Approve critical actions", text: "High-impact actions stay under human control with explicit approval and a complete audit trail." },
];

const integrations = [
  { name: "Slack", mark: "S", icon: MessageSquare, color: "purple", description: "Keep your incident channel informed with timely notifications and response updates." },
  { name: "Jira", mark: "J", icon: TicketCheck, color: "blue", description: "Turn incident follow-up into traceable Jira work without copying context by hand." },
];

export default function LandingPage() {
  const { scrollY } = useScroll();
  const { theme, setTheme } = useTheme();
  const rotateX = useTransform(scrollY, [0, 500], [15, 0]);
  const scale = useTransform(scrollY, [0, 500], [0.95, 1]);
  const translateZ = useTransform(scrollY, [0, 500], [-100, 0]);
  const y = useTransform(scrollY, [0, 500], [50, 0]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent/30 overflow-x-hidden transition-colors duration-500">
      {/* Navigation */}
      <div className="fixed top-0 w-full z-50 px-4 sm:px-6 pt-6 pointer-events-none">
        <nav className="max-w-5xl mx-auto h-14 flex items-center justify-between px-2 pr-2 sm:pr-2 pl-4 sm:pl-6 bg-bg-surface/80 border border-border-subtle backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.04)] pointer-events-auto transition-all duration-300">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="OpsEcho Logo" className="w-full h-full object-contain" />
              </div>
            <span className="text-lg font-bold tracking-tight text-text-primary">OpsEcho</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-text-muted">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">Workflow</a>
            <a href="#integrations" className="hover:text-text-primary transition-colors">Integrations</a>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login" className="hidden sm:flex items-center justify-center px-4 h-10 text-sm font-bold text-text-muted hover:text-text-primary transition-colors">Login</Link>
            <Link to="/register" className="h-10 px-5 bg-text-primary text-bg-primary text-sm font-bold rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md">
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 relative perspective-[2000px] overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Premium Backgrounds */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-bg-surface),var(--color-bg-primary))] -z-20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-subtle)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 -z-10" />

        {/* Animated Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none overflow-hidden -z-10">
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.05, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -top-40 left-[10%] w-[40rem] h-[40rem] bg-accent/20 dark:bg-accent/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" 
            />
            <motion.div 
              animate={{ rotate: -360, scale: [1, 1.1, 1] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute top-20 right-[10%] w-[35rem] h-[35rem] bg-indigo-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" 
            />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Top Badge Removed per user request */}

            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-display font-extrabold tracking-tighter mb-6 leading-[1.05] text-text-primary max-w-4xl">
              Turn Incident Chaos into <br />
              <span className="bg-gradient-to-br from-accent via-purple-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-sm">
                Coordinated Intelligence
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Real-time AI Incident Commander that listens, analyzes, and synchronizes your team's response using voice, Gemini, and LangGraph.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-b from-accent to-blue-700 text-white font-bold rounded-2xl hover:opacity-95 transition-all flex items-center justify-center gap-2 group shadow-[0_0_40px_rgba(59,130,246,0.3)] ring-1 ring-white/20 inset-ring inset-ring-white/10">
                Create First Incident
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/join" className="w-full sm:w-auto px-8 py-4 bg-bg-surface border border-border-subtle text-text-primary font-bold rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-lg shadow-black/5 backdrop-blur-md">
                Join Incident Room
              </Link>
            </div>
          </motion.div>

          {/* 3D Dashboard Showcase */}
          <div className="mt-20 relative [perspective:2000px] flex justify-center">
            <motion.div
              style={{
                rotateX,
                scale,
                y,
                z: translateZ,
                transformStyle: "preserve-3d"
              }}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl bg-bg-surface/90 border border-border-subtle rounded-2xl aspect-[16/9] overflow-hidden shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10"
            >
              {/* Window Controls */}
              <div className="absolute top-0 left-0 w-full h-10 bg-bg-surface/50 border-b border-border-subtle flex items-center px-4 gap-2 z-50 backdrop-blur-md">
                <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-sm" />
                <div className="mx-auto flex gap-2 p-1.5 bg-black/5 dark:bg-black/40 rounded-md">
                  <div className="w-32 h-3 bg-black/10 dark:bg-white/10 rounded-sm" />
                </div>
              </div>

              {/* Advanced 3D Animation Inside */}
              <div className="p-4 sm:p-8 pt-16 flex items-center justify-center h-full bg-gradient-to-br from-slate-50/50 via-bg-surface to-slate-100/50 dark:from-zinc-950 dark:via-[#0a0a0a] dark:to-zinc-900 relative">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-subtle)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
                
                <div className="relative w-full h-full flex items-center justify-center">
                    
                    {/* Status Cards */}
                    <div className="absolute top-4 left-4 z-20">
                        <motion.div 
                           initial={{ opacity: 0, x: -30 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 1, type: "spring", stiffness: 100 }}
                           className="bg-bg-surface/80 border border-border-subtle rounded-2xl p-4 w-64 backdrop-blur-xl flex items-center gap-4 shadow-xl shadow-black/5 dark:shadow-black/50"
                        >
                            <div className="w-10 h-10 rounded-full bg-state-fact/10 flex items-center justify-center">
                               <Activity className="w-5 h-5 text-state-fact" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">System Status</div>
                                <div className="text-sm font-bold text-text-primary">All Services Operational</div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                        <motion.div 
                           initial={{ opacity: 0, x: 30 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
                           className="bg-state-conflict/5 border border-state-conflict/20 rounded-2xl p-4 w-72 backdrop-blur-xl flex items-start gap-4 shadow-xl shadow-state-conflict/10"
                        >
                            <div className="w-10 h-10 rounded-full bg-state-conflict/10 flex items-center justify-center shrink-0 relative mt-1">
                               <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-state-conflict/30 rounded-full" />
                               <Zap className="w-5 h-5 text-state-conflict relative z-10" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-state-conflict uppercase tracking-wider mb-0.5">Active Incident</div>
                                <div className="text-sm font-bold text-text-primary mb-1">API Latency Spike (us-east-1)</div>
                                <div className="text-xs text-text-muted font-medium">AI Commander investigating...</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Central 3D Network Visualization */}
                    <div className="relative w-full max-w-3xl aspect-video flex items-center justify-center">
                        {/* Connecting Lines SVG */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
                            <defs>
                                <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="var(--color-state-fact)" stopOpacity="0.8" />
                                </linearGradient>
                                <linearGradient id="line-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="var(--color-state-conflict)" stopOpacity="0.8" />
                                </linearGradient>
                                <linearGradient id="line-grad-3" x1="50%" y1="0%" x2="50%" y2="100%">
                                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="var(--color-state-action)" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>
                            {/* Lines */}
                            <path d="M 400 200 L 250 120" stroke="url(#line-grad-1)" strokeWidth="3" fill="none" strokeDasharray="6 6" className="animate-[dash_20s_linear_infinite]" />
                            <path d="M 400 200 L 550 120" stroke="url(#line-grad-2)" strokeWidth="3" fill="none" strokeDasharray="6 6" className="animate-[dash_20s_linear_infinite]" />
                            <path d="M 400 200 L 400 300" stroke="url(#line-grad-3)" strokeWidth="3" fill="none" strokeDasharray="6 6" className="animate-[dash_20s_linear_infinite]" />
                            
                            {/* Animated Particles on lines */}
                            <motion.circle cx="400" cy="200" r="4" fill="var(--color-state-fact)"
                                animate={{ cx: [400, 250], cy: [200, 120], opacity: [0, 1, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.circle cx="400" cy="200" r="4" fill="var(--color-state-conflict)"
                                animate={{ cx: [400, 550], cy: [200, 120], opacity: [0, 1, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                            />
                            <motion.circle cx="400" cy="200" r="4" fill="var(--color-state-action)"
                                animate={{ cx: [400, 400], cy: [200, 300], opacity: [0, 1, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
                            />
                        </svg>

                        {/* Nodes */}
                        <motion.div 
                            animate={{ y: [-8, 8, -8] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[30%] left-[25%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-state-fact/30 flex items-center justify-center shadow-xl shadow-state-fact/10 relative group backdrop-blur-md">
                                <div className="absolute inset-0 bg-state-fact/5 rounded-2xl group-hover:bg-state-fact/10 transition-colors" />
                                <Database className="w-7 h-7 text-state-fact" />
                            </div>
                            <span className="text-xs font-bold text-text-primary bg-bg-surface/80 px-3 py-1.5 rounded-lg border border-border-subtle shadow-sm backdrop-blur-md">Primary DB</span>
                        </motion.div>

                        <motion.div 
                            animate={{ y: [8, -8, 8] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[30%] right-[25%] translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-state-conflict/30 flex items-center justify-center shadow-xl shadow-state-conflict/10 relative group backdrop-blur-md">
                                <div className="absolute inset-0 bg-state-conflict/5 rounded-2xl group-hover:bg-state-conflict/10 transition-colors" />
                                <Globe className="w-7 h-7 text-state-conflict" />
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -top-1 -right-1 w-3 h-3 bg-state-conflict rounded-full ring-2 ring-bg-surface" />
                            </div>
                            <span className="text-xs font-bold text-state-conflict bg-state-conflict/5 px-3 py-1.5 rounded-lg border border-state-conflict/20 shadow-sm backdrop-blur-md">API Gateway</span>
                        </motion.div>

                        <motion.div 
                            animate={{ y: [-6, 6, -6] }}
                            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-[15%] left-[50%] -translate-x-1/2 translate-y-1/2 z-20 flex flex-col items-center gap-3"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-state-action/30 flex items-center justify-center shadow-xl shadow-state-action/10 relative group backdrop-blur-md">
                                <div className="absolute inset-0 bg-state-action/5 rounded-2xl group-hover:bg-state-action/10 transition-colors" />
                                <Lock className="w-7 h-7 text-state-action" />
                            </div>
                            <span className="text-xs font-bold text-text-primary bg-bg-surface/80 px-3 py-1.5 rounded-lg border border-border-subtle shadow-sm backdrop-blur-md">Auth Service</span>
                        </motion.div>

                        {/* Central Hub */}
                        <motion.div 
                            animate={{ scale: [1, 1.05, 1], rotateZ: [0, 2, -2, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30"
                        >
                            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-2xl shadow-accent/40 border border-white/20 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite_linear]" />
                                <Server className="w-12 h-12 text-white relative z-10" />
                            </div>
                            <div className="absolute -inset-8 border border-accent/20 rounded-[3rem] animate-[spin_10s_linear_infinite]" />
                            <div className="absolute -inset-12 border border-purple-500/10 rounded-[4rem] animate-[spin_15s_linear_infinite_reverse]" />
                        </motion.div>

                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-slate-50 dark:bg-[#080B10] relative z-20 border-y border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Mission Control</h2>
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 text-text-primary">Built for Modern SREs</h3>
            <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">Precision tools designed for high-stress production environments, wrapped in a beautiful, distraction-free interface.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MessageSquare className="w-6 h-6 text-accent" />}
              title="Voice-to-State"
              description="Real-time Agora voice integration processed by Gemini to maintain a structured incident state."
              delay={0}
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-purple-500" />}
              title="Evidence Tracking"
              description="Differentiate between confirmed facts and hypotheses. Never lose a lead in the noise."
              delay={1}
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-state-fact" />}
              title="Auto-Timeline"
              description="Every decision, action, and update is automatically logged in a searchable incident timeline."
              delay={2}
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-orange-500" />}
              title="Action Ownership"
              description="Identify action owners directly from conversation. Track status from TODO to Resolved."
              delay={3}
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-state-conflict" />}
              title="Risk Detection"
              description="AI identifies missing information and potential risks before they escalate."
              delay={4}
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              title="Human Approval"
              description="Critical actions like rollbacks require explicit human sign-off via secure workflows."
              delay={5}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 px-6 bg-bg-primary relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-accent mb-4">The Workflow</h2>
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 text-text-primary">A calmer incident room.</h3>
            <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">
              OpsEcho gives responders one shared operational picture while the incident is still moving. Voice, AI, and accountable action tracking work together in real time.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                  className="group rounded-3xl border border-border-subtle bg-bg-surface p-8 shadow-sm hover:shadow-lg transition-all hover:border-accent/40"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-sm font-bold tracking-widest text-text-muted/50">{step.number}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary">{step.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-text-muted">{step.text}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-12 grid gap-8 rounded-3xl border border-border-subtle bg-bg-surface p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12 shadow-md">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-state-fact mb-3">The response loop</p>
              <h3 className="text-3xl font-display font-bold text-text-primary">Observe. Decide. Act. Learn.</h3>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-muted">Every message becomes useful incident context, so responders spend less time reconstructing what happened and more time moving the system forward.</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-text-muted bg-bg-primary px-6 py-4 rounded-2xl border border-border-subtle">
              <Users className="h-5 w-5 text-accent" /> One room, one source of truth
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-32 px-6 bg-slate-50 dark:bg-[#080B10] border-y border-border-subtle relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Integrations</h2>
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 text-text-primary">Bring your own tools.</h3>
            <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">
              OpsEcho connects the conversation in your incident room to the systems where teams coordinate, document, and follow through.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {integrations.map((integration, index) => {
              const Icon = integration.icon;
              const isPurple = integration.color === "purple";
              return (
                <motion.article
                  key={integration.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`group relative rounded-3xl border border-border-subtle bg-bg-surface dark:bg-bg-surface/40 backdrop-blur-xl p-8 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden flex flex-col ${isPurple ? 'hover:border-purple-500/50 hover:shadow-purple-500/10' : 'hover:border-blue-500/50 hover:shadow-blue-500/10'}`}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700 pointer-events-none ${isPurple ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}></div>
                  
                  <div className="relative z-10 flex-1">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black shadow-inner border ${isPurple ? "bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 border-purple-200 dark:border-purple-700/50 text-purple-600 dark:text-purple-400" : "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400"}`}>
                        {integration.mark}
                      </div>
                      <div className={`p-3 rounded-2xl bg-bg-primary/50 dark:bg-black/20 border border-border-subtle backdrop-blur-md`}>
                        <Icon className={`h-6 w-6 ${isPurple ? "text-purple-500" : "text-blue-500"}`} />
                      </div>
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-text-primary">{integration.name}</h3>
                    <p className="mt-3 text-base leading-relaxed text-text-muted">{integration.description}</p>
                  </div>
                  
                  <div className="relative z-10 mt-8 space-y-3 border-t border-border-subtle dark:border-white/5 pt-6 text-sm text-text-muted font-medium">
                    <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /></div> OAuth connection from Settings</div>
                    <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /></div> Incident context stays attached</div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col gap-8 rounded-3xl border border-accent/20 bg-accent/5 dark:bg-accent/10 backdrop-blur-md p-8 md:flex-row md:items-center md:justify-between md:p-12 relative overflow-hidden shadow-lg shadow-accent/5">
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent/20 blur-[80px] rounded-full pointer-events-none -translate-y-1/2"></div>
            <div className="relative z-10 flex gap-5 items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-black shadow-md text-accent border border-border-subtle">
                <Blocks className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Connect from your workspace</h3>
                <p className="mt-1 text-base text-text-muted">Manage connections and disconnect them at any time in Settings.</p>
              </div>
            </div>
            <Link to="/register" className="relative z-10 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-bold text-white transition-all hover:bg-accent/90 shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5">
              Get started <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-24 pb-12 px-6 bg-bg-primary relative z-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
        
        <div className="max-w-7xl mx-auto">
          {/* Pre-footer CTA */}
          <div className="flex flex-col items-center text-center mb-24 relative z-10">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-6">Ready to restore order?</h2>
            <p className="text-lg text-text-muted mb-8 max-w-2xl font-medium">Join top engineering teams who use OpsEcho to turn chaotic incidents into coordinated, stress-free responses.</p>
            <Link to="/register" className="px-8 py-4 bg-text-primary text-bg-primary font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-black/10 dark:shadow-black/50 flex items-center gap-2">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16 relative z-10">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/logo.png" alt="OpsEcho Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold tracking-tight text-2xl text-text-primary">OpsEcho</span>
              </div>
              <p className="text-text-muted font-medium text-sm max-w-sm leading-relaxed mb-6">
                The AI Incident Commander that gives responders one shared operational picture while the incident is still moving.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-text-primary mb-6 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-text-muted">
                <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2">Features</a></li>
                <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2">Integrations</a></li>
                <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2">Changelog <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-accent text-[10px] font-bold">NEW</span></a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-text-primary mb-6 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-4 text-sm font-medium text-text-muted">
                <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-text-primary mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-text-muted">
                <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-border-subtle relative z-10">
            <p className="text-sm font-medium text-text-muted/60">© {new Date().getFullYear()} OpsEcho Inc. All rights reserved.</p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-bg-surface dark:bg-white/5 border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-300">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-bg-surface dark:bg-white/5 border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-300">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-bg-surface dark:bg-white/5 border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-300">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-text-muted/60 pl-0 sm:pl-6 sm:border-l border-border-subtle">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> All systems operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay = 0 }: { icon: React.ReactNode, title: string, description: string, delay?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delay * 0.1, ease: "easeOut" }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="p-8 rounded-3xl bg-bg-surface border border-border-subtle hover:border-accent/30 shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all h-full flex flex-col group cursor-default"
      >
        <motion.div 
          style={{ translateZ: 50 }}
          className="w-14 h-14 rounded-2xl bg-bg-primary border border-border-subtle flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300"
        >
          {icon}
        </motion.div>
        <motion.h3 style={{ translateZ: 30 }} className="text-xl font-bold mb-3 text-text-primary">{title}</motion.h3>
        <motion.p style={{ translateZ: 20 }} className="text-text-muted leading-relaxed text-base">{description}</motion.p>
      </motion.div>
    </motion.div>
  );
}
