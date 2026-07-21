import { useState, useEffect } from 'react';
import api from '../api';

interface NewBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewBroadcastModal({ isOpen, onClose, onSuccess }: NewBroadcastModalProps) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/templates')
        .then(res => {
          setTemplates(res.data);
          if (res.data.length > 0) setTemplateId(res.data[0].id);
        })
        .catch(err => console.error('Failed to load templates', err));
      setResult(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/campaigns', { name, templateId });

      if (scheduledAt) {
        await api.post(`/campaigns/${res.data.campaign.id}/schedule`, {
          scheduledAt: new Date(scheduledAt).toISOString()
        });
      }

      setResult(res.data.summary);
      onSuccess();

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
        setName('');
        setScheduledAt('');
        setResult(null);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === templateId);
  const content = selectedTemplate?.components?.[0]?.text || '';
  const variables = selectedTemplate?.components?.[0]?.variables || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700/50">
        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">🚀 New Broadcast</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
        </div>
        
        <div className="p-5">
          {result ? (
            <div className="animate-fade-in text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h4 className="text-xl font-bold text-white mb-2">Campaign Launched!</h4>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-2xl font-bold text-white">{result.totalContacts}</p>
                  <p className="text-xs text-slate-500">Targeted</p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-2xl font-bold text-emerald-400">{result.sentMessages}</p>
                  <p className="text-xs text-slate-500">Sent</p>
                </div>
                {result.failedMessages > 0 && (
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                    <p className="text-2xl font-bold text-red-400">{result.failedMessages}</p>
                    <p className="text-xs text-slate-500">Failed</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Campaign Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                  placeholder="E.g. Summer Promo 2024" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Template</label>
                {templates.length === 0 ? (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    No templates found. Create one first!
                  </div>
                ) : (
                  <>
                    <select value={templateId} onChange={e => setTemplateId(e.target.value)} required
                      className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm">
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    
                    {/* Template preview */}
                    {content && (
                      <div className="mt-3 bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-1 font-semibold">Preview:</p>
                        <p className="text-sm text-slate-300">{content}</p>
                      </div>
                    )}

                    {variables.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap items-center">
                        <span className="text-xs text-slate-500">Variables:</span>
                        {variables.map((v: string) => (
                          <span key={v} className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-mono">{`{{${v}}}`}</span>
                        ))}
                        <span className="text-xs text-slate-500 ml-1">→ auto-filled from contact data</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Schedule <span className="text-slate-500 normal-case">(optional)</span>
                </label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm [color-scheme:dark]" />
                <p className="text-xs text-slate-500 mt-1">
                  {scheduledAt ? `📅 Will send at ${new Date(scheduledAt).toLocaleString()}` : '⚡ Leave empty to send immediately'}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{error}</div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={onClose} disabled={loading}
                  className="px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={loading || templates.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60 flex items-center gap-2">
                  {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                  {scheduledAt ? '📅 Schedule Campaign' : '🚀 Launch Now'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
