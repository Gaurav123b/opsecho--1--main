import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Terminal, Globe, Layout, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import client from "../api/client";

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

export default function CreateIncident() {
  const [formData, setFormData] = useState({
    title: "",
    severity: "SEV-2",
    description: "",
    service: "",
    environment: "production",
    impact: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await client.post("/incidents", formData);
      navigate(`/incident/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create incident. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const severities = [
    { id: "SEV-1", label: "Critical", color: "text-state-conflict", bg: "bg-state-conflict/10", border: "border-state-conflict/20" },
    { id: "SEV-2", label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { id: "SEV-3", label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { id: "SEV-4", label: "Low", color: "text-accent", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-bg-surface/80 dark:bg-bg-surface/30 border border-border-subtle dark:border-border-subtle p-6 md:p-10 rounded-3xl backdrop-blur-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 md:mb-10">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-600/20">
            <ShieldAlert className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Declare Incident</h1>
            <p className="text-text-muted dark:text-text-muted text-sm">Initialize a new mission control room and notify responders.</p>
          </div>
        </div>

        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit} 
          className="space-y-8"
        >
          {error && (
            <motion.div variants={itemVariants} className="bg-state-conflict/10 border border-state-conflict/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-state-conflict shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="space-y-4">
            <label className="text-sm font-medium text-text-muted dark:text-text-muted">Incident Severity</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {severities.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: s.id })}
                  className={`p-4 rounded-2xl border transition-all text-center ${
                    formData.severity === s.id 
                      ? `${s.bg} ${s.border} ${s.color} ring-2 ring-blue-500/20` 
                      : "bg-bg-primary dark:bg-bg-surface/5 border-border-subtle dark:border-border-subtle text-text-muted hover:border-zinc-300 dark:hover:border-border-subtle"
                  }`}
                >
                  <p className="font-bold text-lg">{s.id}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">{s.label}</p>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Incident Title</label>
            <div className="relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-bg-surface dark:bg-black border border-border-subtle dark:border-border-subtle rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-text-primary dark:text-text-primary"
                placeholder="e.g. Payment Gateway timeout errors"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Affected Service</label>
              <div className="relative">
                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full bg-bg-surface dark:bg-black border border-border-subtle dark:border-border-subtle rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-text-primary dark:text-text-primary"
                  placeholder="e.g. checkout-service"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Environment</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full bg-bg-surface dark:bg-black border border-border-subtle dark:border-border-subtle rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer text-text-primary dark:text-text-primary"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="qa">QA</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-medium text-text-muted dark:text-text-muted ml-1">Incident Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-bg-surface dark:bg-black border border-border-subtle dark:border-border-subtle rounded-2xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none text-text-primary dark:text-text-primary"
              placeholder="Provide a high-level summary of what is happening..."
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Declare Incident"}
            </button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}
