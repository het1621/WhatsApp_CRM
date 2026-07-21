import { useState } from 'react';
import api from '../api';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddContactModal({ isOpen, onClose, onSuccess }: AddContactModalProps) {
  const [isBulk, setIsBulk] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isBulk) {
        if (!file) { setError('Please select a CSV file'); setLoading(false); return; }
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/contacts/bulk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.errors?.length > 0) {
          setError(`Added ${res.data.successCount} contacts. ${res.data.errors.length} rows failed.`);
          onSuccess();
        } else {
          onSuccess();
          onClose();
        }
      } else {
        await api.post('/contacts', { name, phone });
        onSuccess();
        onClose();
      }
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
          <h3 className="text-lg font-bold text-white">Add Contact</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
        </div>
        
        <div className="p-5">
          {/* Toggle */}
          <div className="flex bg-slate-900/50 p-1 rounded-xl mb-5">
            <button type="button" onClick={() => { setIsBulk(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isBulk ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              Single Contact
            </button>
            <button type="button" onClick={() => { setIsBulk(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isBulk ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              Bulk Upload
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isBulk ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm"
                    placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm"
                    placeholder="+91 98765 43210" />
                  <p className="text-xs text-slate-500 mt-1">Include country code (e.g. +91 for India)</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">CSV File</label>
                <div className="border-2 border-dashed border-slate-600/50 rounded-xl p-8 text-center hover:border-emerald-500/30 transition-colors bg-slate-900/30">
                  <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} required
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer" />
                </div>
                <p className="text-xs text-slate-500 mt-2">CSV must have a <b>phone</b> column. <b>name</b> is optional.</p>
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
                {isBulk ? 'Upload CSV' : 'Save Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
