import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Users, MessageSquare, ShieldAlert, Zap, 
  Mic, MicOff, PhoneOff, AlertCircle, 
  Clock, Share2, ChevronRight, Activity,
  CheckCircle2, HelpCircle, TriangleAlert, 
  FileText, History, Layout, AlertTriangle, XCircle, Volume2
} from "lucide-react";
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function IncidentRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [incident, setIncident] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uptime, setUptime] = useState("00:00:00");
  // Critical actions pending human confirmation
  const [pendingCriticalActions, setPendingCriticalActions] = useState<any[]>([]);
  // Track last seen AI transcript count so we can fire TTS on new ones
  const lastAITranscriptCountRef = useRef(0);
  const spokenTranscriptIdsRef = useRef<Set<string>>(new Set());
  const [activePartials, setActivePartials] = useState<Record<string, { userName: string, text: string, timestamp: number }>>({});
  
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // REST-based chat — works on Vercel without persistent WebSocket
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !id || isSending) return;
    const text = chatInput.trim();
    setChatInput("");
    setIsSending(true);
    try {
      await client.post(`/incidents/${id}/chat`, { text });
      // Immediately refresh to show the new message
      await fetchIncidentSilent();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


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
    socket
  );
  const isSpeaking = localVolume > 5;

  // Build a MediaStream from the Agora track for the audio visualizer
  // This is available immediately when voice connects (not dependent on Gemini)
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

  // Silent refresh (no loading state) used after sending chat messages
  const fetchIncidentSilent = useCallback(async () => {
    try {
      const res = await client.get(`/incidents/${id}`);
      const updated = res.data;
      setIncident(updated);

      // ── AI Spoken Summaries (Gap 2) ──────────────────────────────────────────
      // Speak any new AI Observer transcript that we haven't spoken yet
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const aiTranscripts = (updated.transcripts || [])
          .filter((t: any) => t.userName === 'AI Observer');
        for (const t of aiTranscripts) {
          if (!spokenTranscriptIdsRef.current.has(t.id)) {
            spokenTranscriptIdsRef.current.add(t.id);
            const utterance = new SpeechSynthesisUtterance(t.text);
            utterance.rate = 1.05;
            utterance.pitch = 0.9;
            // Prefer a natural-sounding voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v =>
              v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
            );
            if (preferred) utterance.voice = preferred;
            window.speechSynthesis.speak(utterance);
          }
        }
      }

      // ── Critical Action Confirmation (Gap 3) ─────────────────────────────────
      // Surface any newly-detected critical actions that haven't been acknowledged
      const criticals = (updated.actions || []).filter((a: any) => a.isCritical && a.status === 'TODO');
      setPendingCriticalActions(criticals);
    } catch { /* ignore */ }
  }, [id]);

  // Initial load
  useEffect(() => {
    if (id) fetchIncident();
  }, [id, fetchIncident]);

  // Real-time Uptime Calculation
  useEffect(() => {
    if (!incident?.createdAt) return;

    // Run once immediately so it doesn't wait 1s for the first tick
    const updateTimer = () => {
      const start = new Date(incident.createdAt).getTime();
      const end = incident.status === "RESOLVED" && incident.updatedAt ? new Date(incident.updatedAt).getTime() : Date.now();
      const diff = end - start;
      if (diff < 0) return;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setUptime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    
    updateTimer();
    
    // If it's resolved, the time is fixed, no need to run the interval
    if (incident.status === "RESOLVED") return;

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
          transcripts: [newTranscript, ...(prev.transcripts || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        };
      });
      
      // Auto-scroll chat
      setTimeout(scrollToBottom, 100);

      // Speak AI Observer new messages
      if (newTranscript.userName === 'AI Observer' && typeof window !== 'undefined' && window.speechSynthesis) {
        if (!spokenTranscriptIdsRef.current.has(newTranscript.id)) {
          spokenTranscriptIdsRef.current.add(newTranscript.id);
          const utterance = new SpeechSynthesisUtterance(newTranscript.text);
          utterance.rate = 1.05;
          utterance.pitch = 0.9;
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
          );
          if (preferred) utterance.voice = preferred;
          window.speechSynthesis.speak(utterance);
        }
      }
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
      // UI updates via socket incident:updated
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Failed to resolve incident", err);
      setIsResolving(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium">Entering Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#060606] text-white flex flex-col overflow-hidden relative"
    >
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0 bg-mesh opacity-80 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-grid opacity-30 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-[#03050a]/90 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 h-16 border-b border-indigo-500/20 flex items-center justify-between px-6 hud-panel shrink-0">

        <div className="flex items-center">
          <BackButton className="mr-4" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <span className="font-bold tracking-tight">OpsEcho</span>
          </div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider shadow-[0_0_10px_rgba(79,70,229,0.2)]">
                {incident.roomCode}
              </span>
              <h1 className="font-bold text-sm truncate max-w-[300px] text-glow bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">{incident.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {incident.participants.slice(0, 3).map((p: any) => (
                <div key={p.user.id} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold" title={p.user.name}>
                  {p.user.name.charAt(0)}
                </div>
              ))}
              {incident.participants.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  +{incident.participants.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-zinc-500 font-medium">{incident.participants.length} Active</span>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-zinc-400" />
          </button>
          {incident.status !== 'RESOLVED' && (
            <button 
              onClick={handleResolve}
              disabled={isResolving || incident.status === "RESOLVED"}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              {isResolving ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
        <aside className="w-64 border-r border-indigo-500/20 flex flex-col hud-panel shrink-0 relative z-10">
          <div className="p-4 space-y-6 overflow-y-auto">
            <section>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-4 ml-1">Incident Status</h3>
              <div className="space-y-2">
                <StatusItem icon={<ShieldAlert className="text-red-500" />} label="Severity" value={incident.severity} />
                <StatusItem icon={<Activity className="text-indigo-400" />} label="Status" value={incident.status} />
                <StatusItem icon={<Clock className="text-emerald-400" />} label="Uptime" value={uptime} />
              </div>
            </section>

            <section>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4 ml-1 flex items-center justify-between">
                Participants
                <span className="text-blue-500 lowercase font-medium">Live</span>
              </h3>
              <div className="space-y-1">
                {incident.participants.map((p: any) => {
                  const isParticipantSpeaking = remoteVolumes[p.user.id] > 5;
                  
                  return (
                  <div key={p.user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="relative">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300",
                        isParticipantSpeaking ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-zinc-800 border-white/5"
                      )}>
                        {p.user.name.charAt(0)}
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080808] transition-colors",
                        remoteUsers.find(u => u.uid === p.user.id) || p.user.id === user?.id 
                          ? "bg-emerald-500" 
                          : "bg-zinc-700"
                      )} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{p.user.name}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">{p.user.role.replace('_', ' ')}</p>
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
        </aside>

        {/* Center: Main Dashboard Tabs */}
        <div className="flex-1 flex flex-col relative z-10">
          <div className="flex items-center px-6 h-12 border-b border-white/5 gap-6">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="Overview" icon={<Layout className="w-4 h-4" />} />
            <TabButton active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")} label="Timeline" icon={<History className="w-4 h-4" />} />
            <TabButton active={activeTab === "evidence"} onClick={() => setActiveTab("evidence")} label="Evidence" icon={<FileText className="w-4 h-4" />} />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-6"
                >
                  <Section title="Confirmed Facts" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}>
                    <div className="space-y-3">
                      {incident.facts?.map((f: any) => (
                        <div key={f.id} className="p-3 glass-card rounded-xl text-xs leading-relaxed">
                          {f.description}
                        </div>
                      ))}
                      {(!incident.facts || incident.facts.length === 0) && (
                        <p className="text-zinc-600 text-[11px] italic p-2">AI is listening for confirmed facts...</p>
                      )}
                    </div>
                  </Section>

                  <Section title="Hypotheses" icon={<HelpCircle className="w-4 h-4 text-orange-500" />}>
                    <div className="space-y-3">
                      {incident.hypotheses?.map((h: any) => (
                        <div key={h.id} className="p-3 glass-card rounded-xl text-xs leading-relaxed">
                          {h.description}
                        </div>
                      ))}
                      {(!incident.hypotheses || incident.hypotheses.length === 0) && (
                        <p className="text-zinc-600 text-[11px] italic p-2">Identifying possible causes...</p>
                      )}
                    </div>
                  </Section>

                  {/* Conflicts & Missing Info (Gap 1 — now shown) */}
                  {incident.conflicts && incident.conflicts.length > 0 && (
                    <Section title="Conflicts & Gaps" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} className="col-span-2">
                      <div className="grid grid-cols-2 gap-3">
                        {incident.conflicts.map((c: any) => (
                          <div key={c.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs leading-relaxed text-red-200 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                            {c.description}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section title="Action Items" icon={<Zap className="w-4 h-4 text-blue-500" />} className="col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                      {incident.actions?.map((a: any) => (
                        <div key={a.id} className={cn(
                          "p-4 rounded-2xl flex items-center justify-between group transition-colors relative overflow-hidden",
                          a.isCritical
                            ? "bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            : "hud-card"
                        )}>
                          {/* Animated scanline effect inside action items */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] animate-scanline pointer-events-none" />
                          <div className="flex items-center gap-3 relative z-10">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              a.isCritical ? "bg-amber-500/20" : "bg-zinc-800"
                            )}>
                              {a.isCritical
                                ? <AlertTriangle className="w-4 h-4 text-amber-400" />
                                : <Zap className="w-4 h-4 text-blue-400" />}
                            </div>
                            <div>
                              <p className={cn("text-xs font-bold mb-0.5", a.status === 'DONE' && "line-through opacity-50")}>{a.description}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{a.owner?.name || "Unassigned"}</span>
                                <span className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-widest",
                                  a.status === 'DONE' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  a.isCritical
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/10"
                                )}>{a.status === 'DONE' ? 'DONE' : (a.isCritical ? 'CRITICAL' : a.status)}</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleActionComplete(a.id, a.status)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                            title="Toggle Status"
                          >
                            {a.status === 'DONE' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <CheckCircle2 className="w-5 h-5 text-zinc-500" />}
                          </button>
                        </div>
                      ))}
                      {(!incident.actions || incident.actions.length === 0) && (
                        <p className="text-zinc-600 text-xs italic col-span-2 text-center py-4">No action items assigned yet.</p>
                      )}
                    </div>
                  </Section>
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
                    <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                      {incident.timeline.map((event: any) => (
                        <div key={event.id} className="relative pl-10">
                          <div className={cn(
                            "absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#060606] shadow-xl",
                            event.type === 'STATUS_CHANGE' ? "bg-blue-600" : 
                            event.type === 'PARTICIPANT_JOINED' ? "bg-emerald-600" :
                            "bg-zinc-700"
                          )}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400 uppercase tracking-tighter">
                                {event.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-zinc-200">{event.description}</p>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-3 glass-card rounded-xl grid grid-cols-2 gap-2">
                                {Object.entries(event.metadata).map(([key, value]: [string, any]) => (
                                  <div key={key} className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">{key}</span>
                                    <span className="text-[11px] text-zinc-400 truncate">{String(value)}</span>
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
                      <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500 font-medium italic">No timeline events recorded yet.</p>
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
                  <Section title="Transcript History" icon={<FileText className="w-4 h-4 text-zinc-400" />}>
                    <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                      {incident.transcripts?.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {incident.transcripts.map((t: any) => {
                            const isAI = t.userName === "AI Observer";
                            return (
                            <div key={t.id} className="p-4 hover:bg-white/[0.01] transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isAI && <TriangleAlert className="w-3.5 h-3.5 text-purple-400" />}
                                  <span className={cn("text-xs font-bold", isAI ? "text-purple-400" : "text-blue-400")}>{t.userName}</span>
                                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{new Date(t.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                              <p className={cn("text-xs leading-relaxed", isAI ? "text-purple-200" : "text-zinc-300")}>{t.text}</p>
                            </div>
                          )})}
                        </div>
                      ) : (
                        <p className="text-center py-10 text-zinc-600 italic text-sm">No transcripts recorded yet.</p>
                      )}
                    </div>
                  </Section>

                  <Section title="Environment Details" icon={<Activity className="w-4 h-4 text-blue-500" />}>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Service</p>
                        <p className="text-sm font-bold text-white">{incident.service}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Environment</p>
                        <p className="text-sm font-bold text-white">{incident.environment}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Severity</p>
                        <p className="text-sm font-bold text-white">{incident.severity}</p>
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
                  className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-3xl w-full mx-auto"
                >
                  <div className="flex-shrink-0">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">{transcript.userName}</span>
                    <p className="text-sm font-medium text-white/95 leading-relaxed drop-shadow-lg">
                      {transcript.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="w-full max-w-2xl mx-auto pointer-events-none mt-2">
              <AudioVisualizer stream={vizStream} isActive={isVoiceConnected && !isMuted} />
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Transcript & Commander */}
        <aside className="w-80 border-l border-indigo-500/20 flex flex-col hud-panel shrink-0 relative z-10">
          <div className="h-12 border-b border-indigo-500/20 flex items-center px-4 gap-2 bg-gradient-to-r from-indigo-500/10 to-transparent">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 text-glow">Live Intel</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar">
            <div className="flex-1" />
            <div className="space-y-4 mt-auto">
              <div className="text-center py-6">
                <div className="w-1 h-1 bg-zinc-700 rounded-full mx-auto mb-2" />
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Beginning of Session</p>
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
                      isAI ? "text-purple-400" : isMe ? "text-blue-400 hidden" : "text-zinc-400"
                    )}>
                      {isMe ? "" : t.userName}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={cn(
                    "relative text-[13px] leading-relaxed px-4 py-2.5 max-w-[90%] shadow-sm", 
                    isAI ? "text-purple-100 bg-purple-500/10 border border-purple-500/20 rounded-2xl rounded-tl-sm" 
                         : isMe ? "text-white bg-blue-600 rounded-2xl rounded-tr-sm" 
                         : "text-zinc-200 bg-zinc-800 rounded-2xl rounded-tl-sm border border-white/5"
                  )}>
                    {t.text}
                  </div>
                </motion.div>
              )})}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-white placeholder:text-zinc-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-xs font-bold disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-600/20"
              >
                {isSending ? '...' : 'Send'}
              </button>
            </form>
          </div>

          <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-indigo-500/20">
            <div className="hud-card bg-indigo-950/40 border-indigo-500/30 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-shimmer pointer-events-none" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 text-glow">AI Observer</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", isAISpeaking ? "bg-emerald-400 animate-pulse-glow" : "bg-indigo-500 animate-pulse-glow")} />
                  <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-300 font-mono">
                    {isAISpeaking ? "SPEAKING" : "LISTENING"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-blue-200/70 leading-relaxed italic">
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
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
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
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Control Bar */}
      <footer className="h-20 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          {!isVoiceConnected ? (
            <button 
              onClick={joinChannel}
              disabled={isJoining}
              className={cn(
                "px-6 py-2.5 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg",
                isJoining ? "bg-zinc-800 text-zinc-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
              )}
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Join Voice Room
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className={cn(
                  "p-3 rounded-xl transition-all border",
                  isMuted ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button 
                onClick={leaveChannel}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
              >
                <PhoneOff className="w-5 h-5" />
                Disconnect
              </button>
            </div>
          )}
          
          {voiceError && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
              <AlertCircle className="w-4 h-4" />
              {voiceError}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-white/5">
            {isVoiceConnected ? (
              <div className="flex items-end gap-[2px] h-3">
                <div className={cn("w-1 rounded-t-sm bg-emerald-500", isSpeaking ? "animate-[bounce_0.8s_infinite]" : "h-1.5")} style={{ animationDelay: '0ms' }} />
                <div className={cn("w-1 rounded-t-sm bg-emerald-500", isSpeaking ? "animate-[bounce_0.8s_infinite]" : "h-2.5")} style={{ animationDelay: '150ms' }} />
                <div className={cn("w-1 rounded-t-sm bg-emerald-500", isSpeaking ? "animate-[bounce_0.8s_infinite]" : "h-2")} style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {isVoiceConnected ? (isSpeaking ? "Speaking..." : "Voice Active") : "Voice Offline"}
            </span>
          </div>
        </div>
      </footer>
      <DebugPanel />
    </div>
  );
}

function StatusItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(79,70,229,0.1)] transition-all">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-xs font-bold text-indigo-100 font-mono tracking-wide">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 h-full px-2 text-xs font-bold transition-all border-b-2",
        active ? "text-white border-blue-500" : "text-zinc-500 border-transparent hover:text-zinc-300"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Section({ title, icon, children, className }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <h3 className="text-[10px] uppercase tracking-widest font-bold text-indigo-300 flex items-center gap-2 ml-1 text-glow">
        {icon}
        {title}
      </h3>
      <div className="min-h-[100px]">
        {children}
      </div>
    </section>
  );
}
