import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';


export default function BackButton({ className }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/dashboard')} 
      className={`p-2 rounded-lg bg-bg-surface dark:bg-bg-surface/5 hover:bg-bg-surface dark:hover:bg-bg-surface/10 text-text-muted dark:text-text-muted hover:text-text-primary dark:hover:text-white transition-all flex items-center justify-center ${className || ''}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
