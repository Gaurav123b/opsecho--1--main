import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut, 
  Activity,
  PlusCircle,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Settings, label: 'Admin', path: '/admin', adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || user?.role === 'ADMIN' || user?.role === 'SRE_DEVOPS');

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-subtle bg-[#080808] flex flex-col shrink-0">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">OpsEcho</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                location.pathname === item.path 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-text-muted hover:text-zinc-200 hover:bg-bg-surface/5"
              )}
            >
              <item.icon className={clsx(
                "w-5 h-5",
                location.pathname === item.path ? "text-white" : "text-text-muted group-hover:text-zinc-300"
              )} />
              {item.label}
            </Link>
          ))}
          
          <Link
            to="/create"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-state-fact hover:bg-emerald-500/10 transition-all group mt-4 border border-emerald-500/20"
          >
            <PlusCircle className="w-5 h-5" />
            New Incident
          </Link>
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <div className="bg-zinc-900/50 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold border border-border-subtle">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest truncate">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-state-conflict hover:bg-red-400/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border-subtle flex items-center justify-end px-8 bg-[#080808]/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button className="p-2 text-text-muted hover:text-zinc-200 hover:bg-bg-surface/5 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-[#080808]" />
            </button>
            <div className="h-6 w-px bg-bg-surface/5 mx-2" />
            <div className="text-right">
              <p className="text-xs font-bold">{user?.name}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">Available</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
