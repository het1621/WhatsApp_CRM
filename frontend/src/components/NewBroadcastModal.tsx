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

  useEffect(() => {
    if (isOpen) {
      api.get('/templates')
        .then(res => {
          setTemplates(res.data);
          if (res.data.length > 0) setTemplateId(res.data[0].id);
        })
        .catch(err => console.error('Failed to load templates', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create the campaign
      const res = await api.post('/campaigns', { 
        name, 
        templateId
        // We aren't doing custom variables in this basic UI yet since we default to contact.name
      });

      // 2. Schedule it if a date was provided
      if (scheduledAt) {
        await api.post(`/campaigns/${res.data.campaign.id}/schedule`, {
          scheduledAt: new Date(scheduledAt).toISOString()
        });
      }

      onSuccess();
      onClose();
      // Reset form
      setName('');
      setScheduledAt('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === templateId);
  const variables = selectedTemplate?.components?.[0]?.variables || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/80 backdrop-blur-md w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/50">
        <div className="p-6 border-b border-indigo-100/50 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <h3 className="text-xl font-bold text-gray-800">New Broadcast</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                placeholder="E.g. Summer Promo 2024"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Template</label>
              {templates.length === 0 ? (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                  You have no templates. Please create one first!
                </div>
              ) : (
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                  required
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              {variables.length > 0 && (
                <p className="text-xs text-indigo-600 mt-2 ml-1 bg-indigo-50 p-2 rounded inline-block">
                  Detected variables: {variables.map((v: string) => `{{${v}}}`).join(', ')}
                  <br/>
                  <span className="text-gray-500">Will be replaced with contact name automatically.</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule For (Optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Leave empty to send immediately.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || templates.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/30 disabled:opacity-70 flex items-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : null}
                {scheduledAt ? 'Schedule Campaign' : 'Launch Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
