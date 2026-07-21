import { useState } from 'react';
import api from '../api';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTemplateModal({ isOpen, onClose, onSuccess }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Extract variables live
  const varMatches = content.match(/\{\{(\w+)\}\}/g) || [];
  const uniqueVars = [...new Set(varMatches)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/templates', { name, content, language: 'en' });
      onSuccess();
      onClose();
      setName(''); setContent('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700/50">
        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Create Template</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
        </div>
        
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Template Name</label>
              <input type="text" value={name}
                onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm font-mono"
                placeholder="e.g. welcome_message" required />
              <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, and underscores only</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm resize-none"
                placeholder="Hi {{name}}, your order is ready for pickup!" required />
              <p className="text-xs text-slate-500 mt-1">
                Use <code className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-xs">{"{{variable}}"}</code> for dynamic content
              </p>
            </div>

            {/* Live variable detection */}
            {uniqueVars.length > 0 && (
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 animate-fade-in">
                <p className="text-xs text-cyan-400 font-semibold mb-2">Detected Variables:</p>
                <div className="flex gap-2 flex-wrap">
                  {uniqueVars.map(v => (
                    <span key={v} className="text-xs bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-lg font-mono">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{error}</div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} disabled={loading}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60 flex items-center gap-2">
                {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                Save Template
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
