import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Zap, LayoutDashboard, History, Settings, LogOut, PlusCircle, UserCircle, Sun, Moon, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import BackButton from "../components/BackButton";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";

const sidebarVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Create Incident", path: "/create", icon: PlusCircle },
    { label: "History", path: "/history", icon: History },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="h-screen bg-bg-primary dark:bg-bg-primary text-text-primary dark:text-text-primary flex relative overflow-hidden transition-colors duration-200">
      {/* Background Mesh (Dark Mode Only) */}
      <div className="hidden dark:block absolute inset-0 z-0 bg-mesh opacity-80 pointer-events-none" />
      <div className="hidden dark:block absolute inset-0 z-0 bg-gradient-to-br from-transparent via-[#0a0a0a]/60 to-[#0a0a0a]/90 pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 md:w-20 lg:w-64 border-r border-border-subtle dark:border-border-subtle bg-bg-surface dark:bg-bg-surface dark:backdrop-blur-xl flex flex-col shrink-0 transition-all duration-300 shadow-2xl md:relative md:translate-x-0 md:bg-bg-surface md:dark:bg-bg-surface md:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 md:p-4 lg:p-6 flex items-center justify-between md:justify-center lg:justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="OpsEcho Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight block md:hidden lg:block">OpsEcho</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-text-muted hover:text-text-primary dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <motion.nav 
          variants={sidebarVariants}
          initial="hidden"
          animate="show"
          className="flex-1 px-4 md:px-2 lg:px-4 space-y-1"
        >
          {navItems.map((item) => (
            <motion.div key={item.path} variants={navItemVariants}>
              <Link
                to={item.path}
                title={item.label}
                className={cn(
                  "group flex items-center gap-3 md:justify-center lg:justify-start px-4 md:px-0 lg:px-4 py-3 rounded-xl transition-all duration-300 text-sm font-bold",
                  location.pathname === item.path
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-accent border border-blue-200 dark:border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                    : "text-text-muted dark:text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-bg-surface dark:hover:bg-bg-surface/5 border border-transparent"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", location.pathname === item.path ? "scale-110" : "group-hover:scale-110 group-hover:text-text-primary dark:group-hover:text-white")} />
                <span className="block md:hidden lg:block whitespace-nowrap">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.nav>

        <div className="p-4 md:p-2 lg:p-4 border-t border-border-subtle dark:border-border-subtle">
          <Link to="/settings?tab=profile" className="flex items-center gap-3 md:justify-center lg:justify-start px-4 md:px-0 lg:px-4 py-3 bg-bg-surface dark:bg-bg-surface/50 rounded-2xl md:rounded-xl lg:rounded-2xl border border-border-subtle dark:border-border-subtle mb-4 hover:bg-border-subtle/50 dark:hover:bg-bg-surface/80 transition-colors cursor-pointer group">
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center text-accent dark:text-accent font-bold border border-blue-200 dark:border-blue-600/20 group-hover:scale-105 transition-transform">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden block md:hidden lg:block">
              <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{user?.name}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold truncate">
                {user?.role.replace("_", " ")}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-3 md:justify-center lg:justify-start px-4 md:px-0 lg:px-4 py-3 rounded-xl w-full text-text-muted dark:text-text-muted hover:text-red-600 dark:hover:text-state-conflict hover:bg-red-50 dark:hover:bg-state-conflict/10 transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="block md:hidden lg:block whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        <header className="h-16 border-b border-border-subtle dark:border-border-subtle flex items-center justify-between px-4 md:px-8 bg-bg-surface/50 dark:bg-bg-surface dark:backdrop-blur-md transition-colors duration-200 shadow-sm shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-text-muted dark:text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-bg-surface dark:hover:bg-bg-surface/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {location.pathname !== '/dashboard' && <BackButton className="mr-0 md:mr-4" />}
            <h2 className="font-bold text-lg text-text-primary dark:text-text-primary truncate max-w-[150px] sm:max-w-xs md:max-w-none">
              {navItems.find(item => item.path === location.pathname)?.label || "Incident Detail"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-text-muted dark:text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-bg-surface dark:hover:bg-bg-surface/10 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/settings" className="p-2 text-text-muted dark:text-text-muted hover:text-text-primary dark:hover:text-white transition-colors">
              <UserCircle className="w-6 h-6" />
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
