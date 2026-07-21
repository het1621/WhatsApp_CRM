import { useState, useEffect } from 'react';
import api from '../api';
import { X, Loader2, Calendar, Zap, CheckCircle2 } from 'lucide-react';

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
        .then(r => { setTemplates(r.data); if (r.data.length > 0) setTemplateId(r.data[0].id); })
        .catch(() => {});
      setResult(null); setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/campaigns', { name, templateId });
      if (scheduledAt) {
        await api.post(`/campaigns/${res.data.campaign.id}/schedule`, { scheduledAt: new Date(scheduledAt).toISOString() });
      }
      setResult(res.data.summary);
      onSuccess();
      setTimeout(() => { onClose(); setName(''); setScheduledAt(''); setResult(null); }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const selected = templates.find(t => t.id === templateId);
  const content = selected?.components?.[0]?.text || '';
  const vars = selected?.components?.[0]?.variables || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">New broadcast</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          {result ? (
            <div className="animate-fade-up text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-brand-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900">Campaign launched</h4>
              <div className="flex justify-center gap-6 mt-5">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.totalContacts}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Targeted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-600">{result.sentMessages}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sent</p>
                </div>
                {result.failedMessages > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{result.failedMessages}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Failed</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Campaign name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Summer Promo 2024"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Template</label>
                {templates.length === 0 ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">No templates found. Create one first.</div>
                ) : (
                  <>
                    <select value={templateId} onChange={e => setTemplateId(e.target.value)} required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white">
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    {content && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 font-medium mb-1">Preview</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
                      </div>
                    )}

                    {vars.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-xs text-gray-400">Variables:</span>
                        {vars.map((v: string) => (
                          <span key={v} className="text-2xs font-mono bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Schedule <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  {scheduledAt ? <><Calendar className="w-3 h-3" /> Scheduled for {new Date(scheduledAt).toLocaleString()}</> : <><Zap className="w-3 h-3" /> Leave empty to send immediately</>}
                </p>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">{error}</div>}

              <div className="pt-1 flex justify-end gap-2">
                <button type="button" onClick={onClose} disabled={loading} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={loading || templates.length === 0}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {scheduledAt ? 'Schedule' : 'Launch now'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
