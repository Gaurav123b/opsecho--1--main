import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Activity, Server, Radio, Database } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const socket = useSocket();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    if (socket.connected) setSocketStatus('connected');
    
    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50 w-96 bg-zinc-950 border border-border-subtle rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 bg-zinc-900 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-text-muted">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Debug Console</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto font-mono text-[10px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2"><Server className="w-3 h-3" /> Socket.IO</span>
                <span className={socketStatus === 'connected' ? 'text-state-fact' : 'text-state-conflict'}>{socketStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2"><Radio className="w-3 h-3" /> Agora RTC</span>
                <span className="text-accent">managed by hook</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2"><Database className="w-3 h-3" /> AI Pipeline</span>
                <span className="text-purple-400">active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2"><Activity className="w-3 h-3" /> System</span>
                <span className="text-zinc-300">nominal</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-text-muted mb-2">Instructions:</p>
              <ul className="text-text-muted list-disc list-inside space-y-1">
                <li>Check backend terminal for AI logs</li>
                <li>Make sure microphone permissions are granted</li>
                <li>Partial transcripts shown at bottom of screen</li>
                <li>Press ⌘+K to toggle this panel</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
