import { useState } from 'react';
import api from '../api';
import { X, Loader2 } from 'lucide-react';

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

  const varMatches = content.match(/\{\{(\w+)\}\}/g) || [];
  const uniqueVars = [...new Set(varMatches)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/templates', { name, content, language: 'en' });
      onSuccess(); onClose(); setName(''); setContent('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">Create template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Template name</label>
              <input type="text" value={name}
                onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g. welcome_message" required />
              <p className="text-xs text-gray-400 mt-1">Lowercase, numbers, underscores only</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none leading-relaxed"
                placeholder="Hi {{name}}, your order #{{order_id}} is ready!" required />
              <p className="text-xs text-gray-400 mt-1">
                Use <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-violet-600">{"{{variable}}"}</code> for dynamic content
              </p>
            </div>

            {uniqueVars.length > 0 && (
              <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 animate-fade-in">
                <p className="text-xs font-medium text-violet-700 mb-1.5">Detected variables</p>
                <div className="flex gap-1.5 flex-wrap">
                  {uniqueVars.map(v => (
                    <span key={v} className="text-2xs font-mono font-medium bg-white text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">{error}</div>}

            <div className="pt-1 flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={loading} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create template
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
