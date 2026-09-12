import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, ArrowLeft, Search, Activity, ShieldAlert, ArrowRight } from "lucide-react";
import client from "../api/client";
import { motion } from "motion/react";

export default function JoinPage() {
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode) return;

    setIsLoading(true);
    setError("");
    try {
      const res = await client.post("/incidents/join", { roomCode });
      navigate(`/incident/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid room code or incident not found");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-[#050505] text-text-primary dark:text-text-primary flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 transition-colors duration-200">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-text-muted hover:text-text-primary dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-accent/20 mx-auto">
            <img src="/logo.png" alt="OpsEcho Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Join Response Room</h1>
          <p className="text-text-muted dark:text-text-muted">Enter a unique incident code to coordinate with the team.</p>
        </div>

        <div className="bg-bg-surface/80 dark:bg-bg-surface/50 border border-border-subtle dark:border-border-subtle rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted ml-1">Room Code</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="E.G. PAY-4827"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono tracking-widest text-lg text-text-primary dark:text-text-primary"
                  autoFocus
                />
              </div>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-state-conflict text-xs mt-2 ml-1"
                >
                  <ShieldAlert className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </div>

            <button
              disabled={isLoading || !roomCode}
              className="w-full bg-zinc-900 dark:bg-bg-surface text-white dark:text-black font-bold py-4 rounded-2xl hover:bg-zinc-800 dark:hover:bg-bg-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Join Incident
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border-subtle dark:border-border-subtle grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-bg-surface dark:bg-bg-surface/[0.02] border border-border-subtle dark:border-border-subtle">
              <Activity className="w-5 h-5 text-accent mb-2" />
              <p className="text-[10px] font-bold text-text-muted dark:text-text-muted uppercase tracking-widest">Active Stats</p>
              <p className="text-xl font-bold mt-1 tracking-tight">Live</p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-surface dark:bg-bg-surface/[0.02] border border-border-subtle dark:border-border-subtle">
              <ShieldAlert className="w-5 h-5 text-orange-500 mb-2" />
              <p className="text-[10px] font-bold text-text-muted dark:text-text-muted uppercase tracking-widest">Safety First</p>
              <p className="text-xl font-bold mt-1 tracking-tight">Audit</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-text-muted dark:text-text-muted">
          Don't have a code? <Link to="/dashboard" className="text-text-muted dark:text-text-muted hover:text-text-primary dark:hover:text-white underline underline-offset-4">Check your dashboard</Link>
        </p>
      </motion.div>
    </div>
  );
}
