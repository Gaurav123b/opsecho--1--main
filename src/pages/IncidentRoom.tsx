import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Users, MessageSquare, ShieldAlert, Zap, 
  Mic, MicOff, PhoneOff, AlertCircle, 
  Clock, Share2, ChevronRight, Activity,
  CheckCircle2, HelpCircle, TriangleAlert, 
  FileText, History, Layout, AlertTriangle, XCircle, Volume2, Pencil, Save, Trash2, Check, X
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useAgoraRoom } from "../hooks/useAgoraRoom";
import { useGeminiSTT } from "../hooks/useGeminiSTT";
import AudioVisualizer from "../components/AudioVisualizer";
import { useAIAudioParticipant } from "../hooks/useAIAudioParticipant";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { IncidentStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import BackButton from "../components/BackButton";
import DebugPanel from "../components/DebugPanel";
import ExportPDFButton from "../components/ExportPDFButton";
import { Settings as SettingsIcon } from "lucide-react";

const WaveBars = ({ active = true }: { active?: boolean }) => {
  const bars = Array.from({ length: 28 });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 30, justifyContent: "center" }}>
      {bars.map((_, i) => (
        <div key={i} className={active ? "wave-bar" : ""} style={{ width: 3, height: active ? `${8 + (i % 5) * 5}px` : "4px", background: i % 3 === 0 ? "#3B66E0" : "#EBF0FE", borderRadius: 2, animationDelay: `${(i % 7) * 0.09}s`, opacity: active ? 1 : 0.4 }} />
      ))}
    </div>
  );
};

const TYPE_META: Record<string, { label: string, color: string, bgClass: string }> = {
  transcript: { label: "Transcript", color: "#6B7280", bgClass: "bg-[#F3F4F6] dark:bg-[#6B7280]/10" },
  fact: { label: "Fact", color: "#3B66E0", bgClass: "bg-[#EBF0FE] dark:bg-[#3B66E0]/15" },
  hypothesis: { label: "Hypothesis", color: "#C9860F", bgClass: "bg-[#FBF1DE] dark:bg-[#C9860F]/15" },
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function IncidentRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Post-Mortem Editing State
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  const socket = useSocket();
  const [incident, setIncident] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Sync editedSummary when entering edit mode or when summary changes
  useEffect(() => {
    if (incident?.summary && !isEditingSummary) {
      setEditedSummary(incident.summary);
    }
  }, [incident?.summary, isEditingSummary]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatText, setEditChatText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uptime, setUptime] = useState("00:00:00");
  // Critical actions pending human confirmation
  const [pendingCriticalActions, setPendingCriticalActions] = useState<any[]>([]);
  // Track last seen AI transcript count so we can fire TTS on new ones
  const lastAITranscriptCountRef = useRef(0);
  const spokenTranscriptIdsRef = useRef<Set<string>>(new Set());
  const [activePartials, setActivePartials] = useState<Record<string, { userName: string, text: string, timestamp: number }>>({});
  


  // Critical Action Item Toast State
  const [activeToasts, setActiveToasts] = useState<any[]>([]);
  const prevActionsLengthRef = useRef(incident?.actions?.length || 0);

  useEffect(() => {
    const currentLen = incident?.actions?.length || 0;
    if (currentLen > prevActionsLengthRef.current) {
      // Find the new action (assuming newest might be at [0] or somewhere, we just take the first critical TODO)
      const newAction = incident.actions.find((a: any) => a.isCritical);
      if (newAction && !activeToasts.find(t => t.id === newAction.id)) {
        setActiveToasts(prev => [...prev, newAction]);
        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== newAction.id));
        }, 5000);
      }
    }
    prevActionsLengthRef.current = currentLen;
  }, [incident?.actions]);

  const aiPredictionFeed = React.useMemo(() => {
    if (!incident) return [];

    const facts = (incident.facts || []).map((f: any) => ({
      id: f.id,
      type: 'fact',
      text: f.description,
      speaker: f.source || 'AI Observer',
      timestamp: f.timestamp
    }));
    
    const hypotheses = (incident.hypotheses || []).map((h: any) => ({
      id: h.id,
      type: 'hypothesis',
      text: h.description,
      speaker: h.proposer || 'AI Observer',
      timestamp: h.timestamp
    }));
    
    return [...facts, ...hypotheses].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [incident]);
  
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const liveTranscriptEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    liveTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiPredictionFeed.length]);

  // REST-based chat — works on Vercel without persistent WebSocket
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !id || isSending) return;
    const text = chatInput.trim();
    setChatInput("");
    setIsSending(true);
    try {
      const res = await client.post(`/incidents/${id}/chat`, { text });
      // Optimistically append the new message immediately
      setIncident((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          transcripts: [res.data, ...(prev.transcripts || [])]
        };
      });
      // Silent refresh for AI updates
      await fetchIncidentSilent();
    } catch (err) {
      console.error("Failed to send chat", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleEditChat = async (chatId: string) => {
    if (!editChatText.trim() || !id) return;
    const textToSet = editChatText.trim();
    try {
      // Optimistic UI update
      setIncident((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          transcripts: (prev.transcripts || []).map((t: any) => 
            t.id === chatId ? { ...t, text: textToSet } : t
          )
        };
      });
      setEditingChatId(null);
      
      await client.put(`/incidents/${id}/chat/${chatId}`, { text: textToSet });
      await fetchIncidentSilent();
    } catch (err) {
      console.error("Failed to edit chat", err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      // Optimistic UI update
      setIncident((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          transcripts: (prev.transcripts || []).filter((t: any) => t.id !== chatId)
        };
      });
      
      await client.delete(`/incidents/${id}/chat/${chatId}`);
      await fetchIncidentSilent();
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Silent refresh (no loading state) used after sending chat messages
  const fetchIncidentSilent = useCallback(async () => {
    try {
      const res = await client.get(`/incidents/${id}?slim=true`);
      const updated = res.data;
      
      setIncident((prev: any) => {
        if (!prev) return updated;
        return {
          ...updated,
          // Preserve full arrays that aren't loaded in slim mode
          timeline: prev.timeline || [],
          transcripts: prev.transcripts || [],
        };
      });

      // ── Critical Action Confirmation (Gap 3) ─────────────────────────────────
      // Surface any newly-detected critical actions that haven't been acknowledged
      const criticals = (updated.actions || []).filter((a: any) => a.isCritical && a.status === 'TODO');
      setPendingCriticalActions(criticals);
    } catch { /* ignore */ }
  }, [id]);


  const { 
    isConnected: isVoiceConnected, 
    isMuted, 
    isJoining,
    remoteUsers,
    localVolume,
    remoteVolumes,
    localMediaTrack,
    error: voiceError,
    permissionDenied,
    joinChannel, 
    leaveChannel, 
    toggleMute 
  } = useAgoraRoom(id);

  // Pass Agora's AEC-processed track to Gemini STT — eliminates echo
  const { isListening: isSTTActive, transcript: localTranscript } = useGeminiSTT(
    id,
    isVoiceConnected && !isMuted,
    localMediaTrack,
    socket,
    fetchIncidentSilent
  );
  const isSpeaking = localVolume > 5;
  
  // Build a MediaStream from the Agora track for the audio visualizer
  const vizStream = React.useMemo(() => {
    if (!localMediaTrack) return null;
    try { return new MediaStream([localMediaTrack]); } catch { return null; }
  }, [localMediaTrack]);
  
  // AI Voice Participant (Listens for AI_SPEAK and publishes to Agora)
  const { isAISpeaking } = useAIAudioParticipant(id, isSpeaking);

  // Fetch incident data — used on load and by the polling loop
  const fetchIncident = useCallback(async () => {
    try {
      const res = await client.get(`/incidents/${id}`);
      setIncident(res.data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        navigate("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  // Initial load
  useEffect(() => {
    if (id) fetchIncident();
  }, [id, fetchIncident]);



  // When leaving the channel, just leave the Agora channel
  const handleHangUp = useCallback(() => {
    leaveChannel();
  }, [leaveChannel]);

  // Real-time Uptime Calculation
  useEffect(() => {
    if (!incident?.createdAt) return;

    // If incident is resolved, freeze at the duration from createdAt to updatedAt
    if (incident.status === 'RESOLVED') {
      const start = new Date(incident.createdAt).getTime();
      const end = incident.updatedAt ? new Date(incident.updatedAt).getTime() : Date.now();
      const diff = end - start;
      if (diff >= 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setUptime(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
      return; // No interval needed — resolved incidents show a frozen time
    }



    // Run once immediately so it doesn't wait 1s for the first tick
    const updateTimer = () => {
      const start = new Date(incident.createdAt).getTime();
      const diff = Date.now() - start;
      if (diff < 0) return;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setUptime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    
    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [incident?.createdAt, incident?.status, incident?.updatedAt]);

  // Socket setup for real-time chat and updates
  useEffect(() => {
    if (!socket || !id) return;
    
    // Join the incident room
    socket.emit("join-incident", id);
    
    const handleNewTranscript = (newTranscript: any) => {
      setIncident((prev: any) => {
        if (!prev) return prev;
        const exists = prev.transcripts?.find((t: any) => t.id === newTranscript.id);
        if (exists) return prev;
        
        return {
          ...prev,
          // API returns desc order (newest first), so prepend the new transcript
          transcripts: [newTranscript, ...(prev.transcripts || [])],
        };
      });
      
      // Auto-scroll chat
      setTimeout(scrollToBottom, 100);
    };

    const handleIncidentUpdated = (updatedIncident: any) => {
      setIncident(updatedIncident);
    };

    const handlePartial = (data: { incidentId: string, userId?: string, userName: string, text: string }) => {
      if (!data.text) return;
      const key = data.userId || data.userName;
      setActivePartials(prev => ({
        ...prev,
        [key]: { userName: data.userName, text: data.text, timestamp: Date.now() }
      }));
    };

    socket.on("TRANSCRIPT_NEW", handleNewTranscript);
    socket.on("incident:updated", handleIncidentUpdated);
    socket.on("TRANSCRIPT_PARTIAL", handlePartial);

    return () => {
      socket.emit("leave-incident", id);
      socket.off("TRANSCRIPT_NEW", handleNewTranscript);
      socket.off("incident:updated", handleIncidentUpdated);
      socket.off("TRANSCRIPT_PARTIAL", handlePartial);
    };
  }, [socket, id]);

  // Clean up stale partials (older than 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActivePartials(prev => {
        let changed = false;
        const next = { ...prev };
        for (const [key, val] of Object.entries(next)) {
          if (now - val.timestamp > 3000) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3-second polling loop — keeps all clients in sync without WebSocket
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(fetchIncidentSilent, 3000);
    return () => clearInterval(interval);
  }, [id, fetchIncidentSilent]);

  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    if (!window.confirm("Are you sure you want to resolve this incident? This will close the voice room.")) return;
    setIsResolving(true);
    try {
      await client.post(`/incidents/${id}/resolve`);
      // UI updates via socket incident:updated automatically
      // Removed redirect so user can view/edit the post-mortem summary
    } catch (err) {
      console.error("Failed to resolve incident", err);
      setIsResolving(false);
    }
  };

  const handleSaveSummary = async () => {
    setIsSavingSummary(true);
    try {
      await client.patch(`/incidents/${id}/summary`, { summary: editedSummary });
      setIsEditingSummary(false);
    } catch (err) {
      console.error("Failed to update summary", err);
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleActionComplete = async (actionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await client.patch(`/incidents/${id}/actions/${actionId}`, { status: newStatus });
      await fetchIncidentSilent(); // Refresh data real time
    } catch (err) {
      console.error("Failed to update action status", err);
    }
  };

  if (isLoading && !incident) {
    return (
      <div className="min-h-screen bg-bg-primary dark:bg-bg-primary flex items-center justify-center transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted font-medium">Entering Room...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-bg-primary dark:bg-bg-primary flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <p className="text-text-muted dark:text-text-muted font-medium">{error || "Incident not found or access denied."}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-primary dark:bg-bg-primary text-text-primary dark:text-text-primary flex flex-col overflow-hidden relative transition-colors duration-200">
      {/* Mesh Background */}
      <div className="absolute inset-0 z-0 hidden dark:block bg-mesh opacity-[0.15] mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-grid opacity-30 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-bg-primary/90 pointer-events-none" />
      


      {/* Critical Action Item Toasts */}
      <div className="absolute bottom-6 right-6 z-[90] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="bg-bg-surface border border-border-glow shadow-[0_0_30px_rgba(177,140,240,0.3)] p-5 rounded-2xl max-w-sm pointer-events-auto flex items-start gap-4"
              style={{ borderColor: 'var(--color-state-action)' }}
            >
              <div className="w-10 h-10 rounded-full bg-state-action/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-state-action" />
              </div>
              <div>
                <h4 className="text-state-action text-xs font-bold uppercase tracking-widest mb-1">New Action Item</h4>
                <p className="text-sm font-semibold text-text-primary">{toast.description}</p>
                {toast.owner && (
                  <p className="text-xs text-text-muted mt-2">Assigned to: {toast.owner.name}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-border-subtle flex items-center justify-between px-6 hud-panel shrink-0">

        <div className="flex items-center">
          <BackButton className="mr-5" />
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 bg-gradient-to-b from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30 group-hover:shadow-blue-500/40 group-hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-5 h-5 text-black dark:text-zinc-900 fill-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-text-primary dark:text-zinc-100">OpsEcho</span>
          </div>
          <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700/50 mx-5" />
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono font-bold px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 uppercase tracking-widest shadow-[0_4px_15px_rgba(79,70,229,0.15)] transition-all hover:shadow-[0_4px_20px_rgba(79,70,229,0.25)] hover:-translate-y-0.5">
              {incident.roomCode}
            </span>
            <h1 className="font-extrabold text-lg truncate max-w-[350px] text-zinc-900 dark:text-white tracking-tight">{incident.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-4 relative z-10">
              {incident.participants.slice(0, 3).map((p: any) => (
                <div key={p.user.id} className="w-8 h-8 rounded-full bg-bg-surface dark:bg-bg-surface border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold text-text-primary dark:text-text-primary shadow-sm ring-1 ring-white/10" title={p.user.name}>
                  {p.user.name.charAt(0)}
                </div>
              ))}
              {incident.participants.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-bg-surface border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold text-text-muted shadow-sm ring-1 ring-white/10">
                  +{incident.participants.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-text-muted font-medium">{incident.participants.length} Active</span>
          </div>
          {incident.status !== 'RESOLVED' && (
            <button 
              onClick={handleResolve}
              disabled={isResolving || incident.status === "RESOLVED"}
              className="px-6 py-2 bg-zinc-900 dark:bg-bg-surface/10 hover:bg-zinc-800 dark:hover:bg-bg-surface/20 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              {isResolving ? (
                <div className="w-4 h-4 border-2 border-border-subtle border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {incident.status === "RESOLVED" ? "Resolved" : (isResolving ? "Resolving..." : "Resolve Incident")}
            </button>
          )}
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Participants & Status */}
        <aside className="w-64 border-r border-border-subtle dark:border-border-subtle flex flex-col hud-panel shrink-0 relative z-10 bg-bg-surface/50 dark:bg-bg-primary">
          <div className="p-4 space-y-6 overflow-y-auto">
            <section>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-accent mb-4 ml-1">Incident Status</h3>
              <div className="space-y-2">
                <StatusItem icon={<ShieldAlert className="text-state-conflict" />} label="Severity" value={incident.severity} />
                <StatusItem icon={<Activity className="text-accent" />} label="Status" value={incident.status} />
                <StatusItem icon={<Clock className="text-state-fact" />} label="Uptime" value={uptime} />
              </div>
            </section>

            <section>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-4 ml-1 flex items-center justify-between">
                Participants
                <span className="text-accent lowercase font-medium">Live</span>
              </h3>
              <div className="space-y-1">
                {incident.participants.map((p: any) => {
                  const isParticipantSpeaking = remoteVolumes[p.user.id] > 5;
                  
                  return (
                  <div key={p.user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-surface dark:hover:bg-bg-surface/5 transition-colors group">
                    <div className="relative">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300",
                        isParticipantSpeaking ? "bg-emerald-500/20 border-emerald-500 text-state-fact" : "bg-bg-surface dark:bg-bg-surface border-white dark:border-border-subtle"
                      )}>
                        {p.user.name.charAt(0)}
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#080808] transition-colors",
                        remoteUsers.find(u => u.uid === p.user.id) || p.user.id === user?.id 
                          ? "bg-emerald-500" 
                          : "bg-zinc-700"
                      )} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{p.user.name}</p>
                      <p className="text-[9px] text-text-muted uppercase tracking-tighter">{p.user.role.replace('_', ' ')}</p>
                    </div>
                    
                    {isParticipantSpeaking && (
                      <div className="ml-auto flex items-end gap-0.5 h-2.5">
                        <div className="w-0.5 rounded-t-sm bg-emerald-500 animate-[bounce_0.8s_infinite]" style={{ animationDelay: '0ms' }} />
                        <div className="w-0.5 rounded-t-sm bg-emerald-500 animate-[bounce_0.8s_infinite]" style={{ animationDelay: '150ms' }} />
                        <div className="w-0.5 rounded-t-sm bg-emerald-500 animate-[bounce_0.8s_infinite]" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </section>
          </div>

          {/* AIOBSERVER sidebar indicator removed in favor of central visualizer */}

          <div className="mt-auto p-4 border-t border-border-subtle dark:border-border-subtle bg-bg-surface dark:bg-bg-surface">
            {!isVoiceConnected ? (
              <button 
                onClick={joinChannel}
                disabled={isJoining}
                className={cn(
                  "w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm",
                  isJoining ? "bg-zinc-800 text-text-muted cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                )}
              >
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Join Voice Room
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute}
                  className={cn(
                    "flex-1 p-3 rounded-xl transition-all border flex items-center justify-center gap-2 font-bold text-sm",
                    isMuted ? "bg-state-conflict/10 border-state-conflict/20 text-state-conflict" : "bg-bg-surface/5 border-border-subtle dark:border-border-subtle text-text-primary dark:text-text-primary hover:bg-bg-surface dark:hover:bg-bg-surface/10"
                  )}
                >
                  {isMuted ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Muted
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Mic On
                    </>
                  )}
                </button>
                <button 
                  onClick={handleHangUp}
                  className="p-3 bg-red-600/20 hover:bg-red-600/40 border border-state-conflict/30 text-red-600 dark:text-red-100 rounded-xl transition-all"
                  title="Hang Up"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {voiceError && (
              <div className="mt-3 flex items-center gap-2 text-red-600 dark:text-state-conflict text-xs bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {voiceError}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Main Dashboard Tabs */}
        <div className="flex-1 flex flex-col relative z-10">
          <div className="flex items-center px-6 py-4 gap-2">
            <div className="flex items-center p-1.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md">
              <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="Overview" icon={<Layout className="w-4 h-4" />} />
              <TabButton active={activeTab === "transcript"} onClick={() => setActiveTab("transcript")} label="Transcript" icon={<MessageSquare className="w-4 h-4" />} />
              <TabButton active={activeTab === "evidence"} onClick={() => setActiveTab("evidence")} label="Evidence" icon={<FileText className="w-4 h-4" />} />
              <TabButton active={activeTab === "report"} onClick={() => setActiveTab("report")} label="Report" icon={<CheckCircle2 className="w-4 h-4" />} />
              <TabButton active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")} label="Timeline" icon={<History className="w-4 h-4" />} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <div className="grid grid-cols-[1.2fr_1fr] gap-6">
                  {/* Left Column: Live Transcript */}
                  <div className="glass-panel p-6 flex flex-col h-[calc(100vh-12rem)] rounded-3xl border border-white/40 dark:border-white/10 relative overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-lg">
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-surface dark:from-[#0a0a0a] to-transparent pointer-events-none" />
                    <div className="mb-6 relative z-10 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-text-primary dark:text-text-primary flex items-center gap-2 drop-shadow-sm">
                          <Activity className="w-5 h-5 text-blue-500" />
                          Live Transcript
                        </h3>
                        <p className="text-xs text-blue-500/80 dark:text-blue-400/80 font-medium tracking-wide mt-1">OpsEcho AI is listening — classified in real time</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">STT: Active</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 relative z-10 flex flex-col">
                      {aiPredictionFeed.length === 0 && (
                        <div className="m-auto text-center flex flex-col items-center gap-3">
                          <Mic className="w-8 h-8 text-zinc-300 dark:text-text-primary/10" />
                          <p className="text-text-muted italic text-sm">AI is listening — facts and hypotheses will appear here</p>
                        </div>
                      )}
                      {aiPredictionFeed.map((item: any, idx: number) => {
                        const meta = TYPE_META[item.type] || TYPE_META.transcript;
                        return (
                          <motion.div 
                            key={item.id || idx} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.01, y: -2 }}
                            className={cn("rounded-2xl p-4 shadow-sm relative group border backdrop-blur-md transition-all duration-300", meta.bgClass)} 
                            style={{ borderColor: `${meta.color}40`, boxShadow: `0 4px 20px ${meta.color}15` }}
                          >
                            <div className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl shadow-[0_0_10px_currentColor]" style={{ background: meta.color, color: meta.color }} />
                            <div className="flex justify-between items-center mb-3 pl-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full shadow-sm" style={{ color: meta.color, background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}>
                                {meta.label}
                              </span>
                              <span className="text-[10px] text-text-muted font-mono opacity-80">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-[14px] font-medium leading-relaxed pl-3 pr-1 text-zinc-800 dark:text-zinc-100">{item.text}</p>
                            <div className="flex items-center gap-2 mt-3 pl-3">
                              <div className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[8px] font-bold text-text-muted uppercase">
                                {item.speaker.charAt(0)}
                              </div>
                              <p className="text-[10px] text-text-muted font-bold tracking-wide uppercase">{item.speaker}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                      {/* Invisible element to ensure scrolling to bottom works if needed */}
                      <div ref={liveTranscriptEndRef} />
                    </div>
                  </div>

                  {/* Right Column: Action Items & Conflicts */}
                  <div className="flex flex-col gap-6 h-[calc(100vh-14rem)] overflow-y-auto pr-2">

                    {incident.conflicts && incident.conflicts.length > 0 && (
                      <Section title="Conflicts & Gaps" icon={<AlertTriangle className="w-4 h-4 text-state-conflict" />}>
                        <div className="grid grid-cols-1 gap-3">
                          {incident.conflicts.map((c: any) => (
                            <div key={c.id} className="p-3 bg-state-conflict/5 border border-state-conflict/20 rounded-xl text-xs leading-relaxed text-red-800 dark:text-red-200 flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-state-conflict mt-0.5 shrink-0" />
                              {c.description}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    <Section title="Action Items" icon={<Zap className="w-4 h-4 text-accent" />}>
                      <div className="grid grid-cols-1 gap-3">
                        {incident.actions?.map((a: any) => (
                          <motion.div 
                            key={a.id} 
                            whileHover={{ scale: 1.015, x: 2 }}
                            className={cn(
                              "group p-4 bg-white/60 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/5 rounded-2xl transition-all duration-300 relative overflow-hidden shadow-sm",
                              a.isCritical
                                ? "border-rose-500/40 shadow-[0_4px_20px_rgba(225,29,72,0.15)] hover:border-rose-500/60"
                                : "hover:border-blue-500/30 hover:shadow-[0_4px_20px_rgba(59,130,246,0.1)]"
                            )}
                          >
                            {a.isCritical && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 animate-pulse-slow" />
                            )}
                            <div className="flex items-center gap-4 relative z-10">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm",
                                a.isCritical ? "bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/30 text-white" : "bg-white dark:bg-zinc-800 border border-white/20 dark:border-white/5"
                              )}>
                                {a.isCritical
                                  ? <AlertTriangle className="w-5 h-5 drop-shadow-md" />
                                  : <Zap className="w-5 h-5 text-blue-500" />}
                              </div>
                              <div className="flex-1">
                                <p className={cn("text-[13px] font-bold mb-1.5 leading-snug", a.status === 'DONE' && "line-through opacity-50 text-text-muted")}>{a.description}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{a.owner?.name || "Unassigned"}</span>
                                  <span className={cn(
                                    "text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-bold shadow-sm",
                                    a.status === 'DONE' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                                    a.isCritical
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  )}>{a.status === 'DONE' ? 'DONE' : (a.isCritical ? 'CRITICAL' : a.status)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {(!incident.actions || incident.actions.length === 0) && (
                          <div className="flex flex-col items-center justify-center py-8 opacity-50">
                            <Zap className="w-8 h-8 mb-2 text-text-muted" />
                            <p className="text-text-muted text-xs italic font-medium">No action items assigned yet.</p>
                          </div>
                        )}
                      </div>
                    </Section>
                  </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "transcript" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto space-y-4 py-4"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Raw Transcripts</h2>
                    <p className="text-xs text-text-muted">Unfiltered speech-to-text log</p>
                  </div>
                  {(!incident.transcripts || incident.transcripts.length === 0) ? (
                    <div className="text-center py-12 glass-card rounded-2xl">
                      <Mic className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                      <p className="text-text-muted text-sm">No speech detected yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {incident.transcripts.map((t: any) => (
                        <div key={t.id} className="p-4 bg-bg-surface/50 dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-2xl flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted">{t.userName}</h4>
                            <span className="text-[10px] text-text-muted font-mono">{new Date(t.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm mt-0.5 text-text-primary dark:text-text-primary font-medium">{t.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "report" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto py-4 space-y-6"
                >
                    <div className="glass-panel flex flex-col h-[calc(100vh-14rem)] rounded-3xl border border-border-subtle dark:border-border-subtle relative overflow-hidden bg-bg-surface dark:bg-bg-surface/40">
                      <div className="h-16 px-6 border-b border-border-subtle dark:border-border-subtle flex items-center justify-between shrink-0 bg-bg-surface/50 dark:bg-bg-surface">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-state-fact" />
                          <h2 className="font-bold">Post-Mortem Report</h2>
                        </div>
                        {isEditingSummary ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsEditingSummary(false);
                                setEditedSummary(incident.summary || "");
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveSummary}
                              disabled={isSavingSummary}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isSavingSummary ? (
                                <div className="w-3 h-3 border-2 border-border-subtle border-t-white rounded-full animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ExportPDFButton incident={incident} />
                            <button
                              onClick={() => setIsEditingSummary(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface hover:bg-bg-surface dark:bg-bg-surface/5 dark:hover:bg-bg-surface/10 text-text-primary dark:text-zinc-300 text-xs font-bold rounded-lg transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit Report
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {isEditingSummary ? (
                          <textarea
                            value={editedSummary}
                            onChange={(e) => setEditedSummary(e.target.value)}
                            className="w-full h-full bg-bg-primary dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl p-6 text-sm text-text-primary dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono"
                            placeholder="Write post-mortem summary here..."
                          />
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {incident.summary ? (
                              <ReactMarkdown>{incident.summary}</ReactMarkdown>
                            ) : incident.status === "RESOLVED" ? (
                              <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4 mt-20">
                                <div className="w-8 h-8 border-2 border-zinc-300 dark:border-border-subtle border-t-zinc-600 dark:border-t-white/60 rounded-full animate-spin" />
                                <p>Generating AI summary...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4 mt-20">
                                <FileText className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-2" />
                                <h3 className="text-lg font-medium text-text-primary">No Summary Available</h3>
                                <p className="text-center max-w-sm">Resolve the incident to automatically generate an AI post-mortem summary, or click "Edit Report" to write it manually.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                </motion.div>
              )}

              {activeTab === "timeline" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto space-y-8 py-4"
                >
                  {incident.timeline?.length > 0 ? (
                    <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-bg-surface dark:before:bg-bg-surface/5">
                      {incident.timeline.map((event: any) => (
                        <div key={event.id} className="relative pl-10">
                          <div className={cn(
                            "absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-50 dark:border-[#060606] shadow-xl",
                            event.type === 'STATUS_CHANGE' ? "bg-blue-600" : 
                            event.type === 'PARTICIPANT_JOINED' ? "bg-emerald-600" :
                            "bg-zinc-700"
                          )}>
                            <div className="w-1.5 h-1.5 rounded-full bg-bg-surface" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-bg-surface dark:bg-bg-surface/5 border border-border-subtle text-text-muted dark:text-text-muted uppercase tracking-tighter">
                                {event.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-text-primary dark:text-zinc-200">{event.description}</p>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-3 bg-bg-surface dark:bg-bg-surface rounded-xl grid grid-cols-2 gap-2">
                                {Object.entries(event.metadata).map(([key, value]: [string, any]) => (
                                  <div key={key} className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">{key}</span>
                                    <span className="text-[11px] text-text-muted dark:text-text-muted truncate">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <History className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mx-auto mb-4" />
                      <p className="text-text-muted font-medium italic">No timeline events recorded yet.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "evidence" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <Section title="Transcript History" icon={<FileText className="w-4 h-4 text-text-muted" />}>
                    <div className="bg-bg-surface dark:bg-bg-surface/30 border border-border-subtle dark:border-border-subtle rounded-2xl overflow-hidden">
                      {incident.transcripts?.length > 0 ? (
                        <div className="divide-y divide-zinc-200 dark:divide-white/5">
                          {incident.transcripts.map((t: any) => {
                            const isAI = t.userName === "AI Observer";
                            return (
                            <div key={t.id} className="p-4 hover:bg-bg-primary dark:hover:bg-bg-surface/[0.01] transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isAI && <TriangleAlert className="w-3.5 h-3.5 text-purple-400" />}
                                  <span className={cn("text-xs font-bold", isAI ? "text-purple-400" : "text-accent")}>{t.userName}</span>
                                  <span className="text-[10px] text-text-muted uppercase tracking-widest">{new Date(t.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                              <p className={cn("text-xs leading-relaxed", isAI ? "text-purple-800 dark:text-purple-200" : "text-zinc-700 dark:text-zinc-300")}>{t.text}</p>
                            </div>
                          )})}
                        </div>
                      ) : (
                        <p className="text-center py-10 text-text-muted italic text-sm">No transcripts recorded yet.</p>
                      )}
                    </div>
                  </Section>

                  <Section title="Environment Details" icon={<Activity className="w-4 h-4 text-accent" />}>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-bg-surface dark:bg-bg-surface/50 border border-border-subtle dark:border-border-subtle rounded-2xl">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-text-muted mb-1">Service</p>
                        <p className="text-sm font-bold text-text-primary dark:text-text-primary">{incident.service}</p>
                      </div>
                      <div className="p-4 bg-bg-surface dark:bg-bg-surface/50 border border-border-subtle dark:border-border-subtle rounded-2xl">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-text-muted mb-1">Environment</p>
                        <p className="text-sm font-bold text-text-primary dark:text-text-primary">{incident.environment}</p>
                      </div>
                      <div className="p-4 bg-bg-surface dark:bg-bg-surface/50 border border-border-subtle dark:border-border-subtle rounded-2xl">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-text-muted mb-1">Severity</p>
                        <p className="text-sm font-bold text-text-primary dark:text-text-primary">{incident.severity}</p>
                      </div>
                    </div>
                  </Section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Speakers Voice-to-Text & Animation */}
          <div className="absolute bottom-4 left-0 right-0 px-6 pointer-events-none flex flex-col items-center gap-2 z-50">
            <AnimatePresence>
              {[
                ...Object.values(activePartials),
                ...(localTranscript ? [{ userName: "You", text: localTranscript, timestamp: Date.now() }] : [])
              ].map((transcript, i) => (
                <motion.div
                  key={transcript.userName + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-bg-surface/90 dark:bg-bg-surface backdrop-blur-xl border border-border-subtle dark:border-border-subtle rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-3xl w-full mx-auto"
                >
                  <div className="flex-shrink-0">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted dark:text-text-muted font-bold uppercase tracking-widest mb-1">{transcript.userName}</span>
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary/95 leading-relaxed drop-shadow-lg">
                      {transcript.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Glowing Orb Audio Visualizer */}
            <div className="w-full max-w-2xl mx-auto pointer-events-none mt-2 flex justify-center">
              <AudioVisualizer stream={vizStream} isActive={isVoiceConnected && !isMuted} />
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Transcript & Commander */}
        <aside className="w-80 border-l border-border-subtle dark:border-border-subtle flex flex-col hud-panel shrink-0 relative z-10 bg-bg-surface/50 dark:bg-bg-primary">
          <div className="h-12 border-b border-border-subtle dark:border-border-subtle flex items-center px-4 gap-2 bg-gradient-to-r from-indigo-500/5 to-transparent">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-800 dark:text-indigo-300 text-glow">Live Intel</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar">
            <div className="flex-1" />
            <div className="space-y-4 mt-auto">
              <div className="text-center py-6">
                <div className="w-1 h-1 bg-zinc-700 rounded-full mx-auto mb-2" />
                <p className="text-[10px] text-text-muted uppercase tracking-widest">Beginning of Session</p>
              </div>
              
              {[...(incident.transcripts || [])].reverse().map((t: any) => {
                const isAI = t.userName === "AI Observer";
                const isMe = t.userName === user?.name;
                return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={t.id} 
                  className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    {isMe && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                        <button onClick={() => { setEditingChatId(t.id); setEditChatText(t.text); }} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-text-muted hover:text-indigo-500 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteChat(t.id)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-text-muted hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {!isMe && !isAI && (
                       <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-300">
                         {t.userName.charAt(0)}
                       </div>
                    )}
                    {isAI && (
                       <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                         <TriangleAlert className="w-2.5 h-2.5 text-purple-400" />
                       </div>
                    )}
                    <span className={cn(
                      "text-[10px] font-bold tracking-wide", 
                      isAI ? "text-purple-400" : isMe ? "text-accent hidden" : "text-text-muted"
                    )}>
                      {isMe ? "" : t.userName}
                    </span>
                    <span className="text-[9px] text-text-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={cn(
                    "relative text-[13px] leading-relaxed px-4 py-3 max-w-[90%] shadow-sm backdrop-blur-md transition-all", 
                    isAI ? "text-purple-900 dark:text-purple-100 bg-purple-500/10 border border-purple-500/20 rounded-3xl rounded-tl-sm shadow-[0_4px_15px_rgba(168,85,247,0.1)]" 
                         : isMe ? "text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl rounded-tr-sm shadow-[0_4px_15px_rgba(59,130,246,0.25)] border border-blue-400/30" 
                         : "text-zinc-800 dark:text-zinc-200 bg-white/60 dark:bg-black/40 rounded-3xl rounded-tl-sm border border-white/40 dark:border-white/5"
                  )}>
                    {editingChatId === t.id ? (
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <input 
                          autoFocus
                          value={editChatText} 
                          onChange={e => setEditChatText(e.target.value)}
                          className="bg-black/20 border border-white/20 rounded px-2 py-1.5 text-[13px] text-white focus:outline-none focus:border-white/50 w-full"
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') handleEditChat(t.id); 
                            else if (e.key === 'Escape') setEditingChatId(null); 
                          }}
                        />
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditingChatId(null)} className="p-1 hover:bg-black/20 rounded transition-colors"><X className="w-3.5 h-3.5 text-white/80" /></button>
                          <button onClick={() => handleEditChat(t.id)} className="p-1 hover:bg-black/20 rounded transition-colors"><Check className="w-3.5 h-3.5 text-white" /></button>
                        </div>
                      </div>
                    ) : (
                      t.text
                    )}
                  </div>
                </motion.div>
              )})}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          <div className="p-4 bg-transparent border-t border-border-subtle dark:border-border-subtle relative z-20">
            <form onSubmit={handleSendChat} className="flex gap-2 relative group">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full pl-6 pr-24 py-3.5 text-[14px] focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-text-primary dark:text-text-primary placeholder:text-text-muted transition-all shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 rounded-full text-xs font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
              >
                {isSending ? '...' : 'Send'}
              </button>
            </form>
          </div>

          <div className="p-4 bg-bg-surface/50 dark:bg-bg-surface backdrop-blur-xl border-t border-border-subtle dark:border-border-subtle">
            <div className="hud-card bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-border-glow p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-shimmer pointer-events-none" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="w-4 h-4 text-accent" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent text-glow">AI Observer</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", isAISpeaking ? "bg-emerald-400 animate-pulse-glow" : "bg-indigo-500 animate-pulse-glow")} />
                  <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-300 font-mono">
                    {isAISpeaking ? "SPEAKING" : "LISTENING"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-blue-200/70 leading-relaxed italic">
                Listening to the room. I will automatically extract facts and actions as they are discussed.
              </p>
            </div>
          </div>
        </aside>
      </div>


      {/* Critical Action Confirmation Banner (Gap 3) */}
      <AnimatePresence>
        {pendingCriticalActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="bg-amber-950/90 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-state-hypothesis shrink-0" />
                <p className="text-sm font-bold text-amber-200">Critical Action Requires Confirmation</p>
              </div>
              <div className="space-y-2">
                {pendingCriticalActions.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-xs text-amber-100 flex-1">{a.description}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          await client.patch(`/incidents/${id}/actions/${a.id}`, { status: 'IN_PROGRESS' });
                          await fetchIncidentSilent();
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors"
                      >
                        Confirm & Start
                      </button>
                      <button
                        onClick={() => setPendingCriticalActions(prev => prev.filter(x => x.id !== a.id))}
                        className="p-1.5 hover:bg-bg-surface/10 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <DebugPanel />
    </div>
  );
}

function StatusItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  let valueColor = "text-indigo-700 dark:text-indigo-200";
  let glowColor = "rgba(79,70,229,0.05)";
  
  if (value === 'SEV-1' || value === 'RESOLVED') {
    valueColor = "text-emerald-600 dark:text-emerald-400";
    glowColor = "rgba(16, 185, 129, 0.1)";
  } else if (value.includes('SEV')) {
    valueColor = "text-rose-600 dark:text-rose-400";
    glowColor = "rgba(225, 29, 72, 0.1)";
  }

  return (
    <div className={`flex items-center justify-between p-3.5 bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/5 rounded-2xl group hover:border-white/80 dark:hover:border-white/10 transition-all duration-300 shadow-sm hover:-translate-y-0.5`} style={{ boxShadow: `0 4px 20px ${glowColor}` }}>
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      </div>
      <span className={cn("text-xs font-bold font-mono tracking-wider drop-shadow-sm", valueColor)}>{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded-full relative overflow-hidden group border",
        active ? "text-blue-700 dark:text-blue-300 bg-blue-500/10 shadow-sm border-blue-500/20" : "text-text-muted border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary"
      )}
    >
      <div className={cn("transition-transform group-hover:scale-110", active && "text-blue-600 dark:text-blue-400")}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function Section({ title, icon, children, className }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <h3 className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 dark:text-indigo-300 flex items-center gap-2 ml-1 drop-shadow-sm">
        {icon}
        {title}
      </h3>
      <div className="min-h-[100px]">
        {children}
      </div>
    </section>
  );
}
