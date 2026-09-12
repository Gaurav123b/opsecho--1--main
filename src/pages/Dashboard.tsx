import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Activity, Search, Filter, ArrowUpRight, Clock, ShieldAlert } from "lucide-react";
import client from "../api/client";
import { IncidentStatus } from "../types";
import { motion } from "motion/react";

interface Incident {
  id: string;
  roomCode: string;
  title: string;
  severity: string;
  status: IncidentStatus;
  createdAt: string;
  createdBy: { name: string; role: string };
  participants: { id: string }[];
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await client.get("/incidents");
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode) return;
    
    setIsJoining(true);
    setJoinError("");
    try {
      const res = await client.post("/incidents/join", { roomCode });
      navigate(`/incident/${res.data.id}`);
    } catch (err: any) {
      setJoinError(err.response?.data?.error || "Invalid room code or incident not found");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] -mt-8 pt-8">
      {/* Background Mesh */}
      <div className="absolute inset-0 -z-10 hidden dark:block bg-mesh opacity-50 mix-blend-screen pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 px-4 pb-12 relative z-10">
      {/* Welcome & Stats */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-900 p-6 md:p-10 rounded-[2rem] shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-bg-surface/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000 ease-out" />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight !text-white">Command Center</h1>
            <p className="text-indigo-100 dark:text-blue-100/90 mb-6 md:mb-8 max-w-lg text-base md:text-lg font-light">Coordinate effectively, analyze real-time audio evidence, and resolve critical technical issues faster.</p>
            <div className="flex gap-4">
              <Link to="/create" className="px-6 py-3 md:px-8 md:py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm md:text-base">
                <Plus className="w-5 h-5" />
                New Incident
              </Link>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <p className="text-xs md:text-sm font-semibold tracking-wider text-text-muted dark:text-text-muted uppercase mb-4 md:mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Join Active Room
            </p>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Room Code (PAY-4827)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-bg-surface/50 dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-2xl py-3 px-4 md:py-4 focus:ring-2 focus:ring-indigo-500/50 outline-none text-center font-mono tracking-widest text-base md:text-lg transition-all focus:bg-bg-surface/80 dark:focus:bg-black/60 shadow-inner placeholder:text-text-muted dark:placeholder:text-text-muted text-text-primary dark:text-text-primary"
                />
                {joinError && <p className="text-xs text-state-conflict mt-2 ml-2 font-medium">{joinError}</p>}
              </div>
              <button
                disabled={isJoining}
                className="w-full bg-indigo-500/10 border border-border-glow text-indigo-300 font-bold py-3 md:py-4 rounded-2xl hover:bg-indigo-500/20 transition-all disabled:opacity-50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] active:scale-[0.98] text-sm md:text-base"
              >
                {isJoining ? "Joining..." : "Enter Room"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <h3 className="text-xl md:text-2xl font-display font-bold flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-accent">
              <Activity className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Recent Activity
          </h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search incidents..." 
                className="bg-bg-surface/50 dark:bg-zinc-950/50 border border-border-subtle dark:border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/50 transition-all shadow-inner w-full sm:w-64 text-text-primary dark:text-text-primary"
              />
            </div>
            <button className="p-2.5 bg-bg-surface/50 dark:bg-zinc-950/50 border border-border-subtle dark:border-border-subtle rounded-xl hover:bg-bg-surface dark:hover:bg-bg-surface/5 transition-colors shrink-0">
              <Filter className="w-4 h-4 text-text-muted dark:text-text-muted" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 glass-card rounded-[1.5rem] animate-pulse" />
            ))}
          </div>
        ) : incidents.length > 0 ? (
          <div className="grid gap-4">
            {incidents.map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                className="group relative glass-card p-4 md:p-6 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between overflow-hidden gap-4 sm:gap-0"
              >
                {/* Status Indicator Glow */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  incident.severity === 'SEV-1' ? 'bg-state-conflict shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                  incident.severity === 'SEV-2' ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' :
                  'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                }`} />

                <div className="flex items-start sm:items-center gap-4 md:gap-6 pl-2 w-full sm:w-auto">
                  <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg shadow-inner border backdrop-blur-md ${
                    incident.severity === 'SEV-1' ? 'bg-state-conflict/10 text-state-conflict border-state-conflict/20' :
                    incident.severity === 'SEV-2' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {incident.severity.replace('SEV-', '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5">
                      <span className="text-[10px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg bg-bg-surface dark:bg-bg-surface text-text-muted dark:text-zinc-300 border border-border-subtle dark:border-border-subtle uppercase tracking-widest shadow-inner shrink-0">
                        {incident.roomCode}
                      </span>
                      <h4 className="font-display font-semibold text-base md:text-lg tracking-tight text-text-primary dark:text-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors truncate">{incident.title}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs md:text-sm text-text-muted dark:text-text-muted font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 opacity-70" />
                        {incident.status}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(3, incident.participants.length))].map((_, idx) => (
                            <div key={idx} className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 shadow-sm"></div>
                          ))}
                        </div>
                        <span className="ml-1 text-[10px] md:text-xs opacity-70">{incident.participants.length} Active</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/incident/${incident.id}`}
                  className="p-3 md:p-4 rounded-2xl bg-bg-surface dark:bg-bg-surface/5 border border-transparent group-hover:border-border-subtle dark:group-hover:border-border-subtle group-hover:bg-indigo-500/10 text-text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-all duration-300 transform group-hover:scale-105 active:scale-95 self-end sm:self-auto"
                >
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 glass-panel border-dashed border-2 border-border-subtle dark:border-border-subtle rounded-[2rem]"
          >
            <div className="w-20 h-20 bg-bg-surface dark:bg-bg-surface/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-subtle dark:border-border-subtle shadow-inner">
              <Activity className="w-10 h-10 text-text-muted dark:text-text-muted" />
            </div>
            <h4 className="font-display font-bold text-xl text-text-primary dark:text-zinc-300 mb-2">No active incidents</h4>
            <p className="text-text-muted">Great job! Everything seems stable right now.</p>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
}
