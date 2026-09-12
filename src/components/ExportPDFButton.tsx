import React, { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import { ShieldAlert, Zap, Clock, CheckCircle2 } from 'lucide-react';

export default function ExportPDFButton({ incident }: { incident: any }) {
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!reportRef.current || !incident) return;
    setIsExporting(true);

    try {
      // Temporarily make the hidden div visible for html2canvas
      reportRef.current.style.display = 'block';
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // higher resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      reportRef.current.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`OpsEcho_PostMortem_${incident.roomCode}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/80 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        Export PDF
      </button>

      {/* Hidden printable report layout */}
      <div 
        ref={reportRef} 
        style={{ 
          display: 'none', 
          width: '850px', 
          padding: '60px', 
          backgroundColor: '#ffffff', 
          color: '#1e293b',
          fontFamily: 'Inter, system-ui, sans-serif' 
        }}
      >
        {/* Header Section */}
        <div style={{ borderBottom: '3px solid #3b82f6', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a', letterSpacing: '-0.02em' }}>
              OpsEcho Post-Mortem Report
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Incident:</strong> {incident.title} <span style={{ color: '#cbd5e1' }}>|</span> <strong>Room Code:</strong> {incident.roomCode}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', backgroundColor: incident.severity === 'SEV-1' ? '#fee2e2' : '#fef3c7', color: incident.severity === 'SEV-1' ? '#991b1b' : '#92400e', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
              {incident.severity}
            </div>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
              Status: {incident.status}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
              Generated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Executive Summary (AI Generated) */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            Executive Summary
          </h2>
          <div className="prose prose-sm max-w-none text-slate-700" style={{ fontSize: '15px', lineHeight: '1.7', color: '#334155' }}>
            {incident.summary ? (
              <ReactMarkdown>{incident.summary}</ReactMarkdown>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>No summary provided.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          {/* Action Items */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Action Items
            </h2>
            {incident.actions && incident.actions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incident.actions.map((a: any) => (
                  <div key={a.id} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${a.status === 'DONE' ? '#10b981' : '#f59e0b'}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{a.description}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <span style={{ fontWeight: '600', color: a.status === 'DONE' ? '#10b981' : '#f59e0b' }}>{a.status}</span>
                      {a.owner && ` • Owner: ${a.owner.name}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>No action items assigned.</p>
            )}
          </div>

          {/* Key Facts */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Key Facts
            </h2>
            {incident.facts && incident.facts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incident.facts.map((f: any) => (
                  <div key={f.id} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginBottom: '4px' }}>
                      {new Date(f.timestamp).toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: '14px', color: '#334155' }}>{f.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>No facts recorded.</p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          OpsEcho • Real-Time AI Incident Command • Generated Securely
        </div>
      </div>
    </>
  );
}
