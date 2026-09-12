import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, AlertCircle, User, Briefcase, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.OBSERVER);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await client.post("/auth/register", { name, email, password, role });
      login(response.data.token, response.data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-bg-primary text-text-primary dark:text-text-primary flex items-center justify-center p-6 transition-colors duration-200">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-text-muted hover:text-text-primary dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo.png" alt="OpsEcho Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">OpsEcho</span>
          </Link>
          <h1 className="text-2xl font-bold">Join the response team</h1>
          <p className="text-text-muted dark:text-text-muted mt-2">Create your engineer profile to start coordinating</p>
        </div>

        <div className="bg-bg-surface/80 dark:bg-bg-surface/50 border border-border-subtle dark:border-border-subtle p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-state-conflict/10 border border-state-conflict/20 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-state-conflict shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted dark:text-text-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-text-primary dark:text-text-primary text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Your Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted dark:text-text-muted" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-text-primary dark:text-text-primary text-sm appearance-none cursor-pointer"
                  >
                    {Object.values(Role).map((r) => (
                      <option key={r} value={r} className="bg-bg-surface dark:bg-bg-surface text-text-primary dark:text-text-primary">
                        {r.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted dark:text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-text-primary dark:text-text-primary text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted dark:text-text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-surface dark:bg-bg-surface border border-border-subtle dark:border-border-subtle rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-text-primary dark:text-text-primary text-sm"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-text-primary dark:text-text-primary hover:text-accent dark:hover:text-accent transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
