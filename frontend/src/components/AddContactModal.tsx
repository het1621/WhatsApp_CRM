import { useState } from 'react';
import api from '../api';
import { X, Upload, User, Loader2 } from 'lucide-react';

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
        if (!file) { setError('Select a CSV file'); setLoading(false); return; }
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/contacts/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data.errors?.length > 0) {
          setError(`Imported ${res.data.successCount} contacts. ${res.data.errors.length} rows failed.`);
          onSuccess();
        } else { onSuccess(); onClose(); }
      } else {
        await api.post('/contacts', { name, phone });
        onSuccess(); onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">Add contact</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          <div className="flex bg-gray-100 p-0.5 rounded-lg mb-5">
            <button type="button" onClick={() => { setIsBulk(false); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!isBulk ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              <User className="w-3 h-3 inline mr-1" /> Single
            </button>
            <button type="button" onClick={() => { setIsBulk(true); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${isBulk ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              <Upload className="w-3 h-3 inline mr-1" /> Bulk CSV
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isBulk ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Smith"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 98765 43210"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  <p className="text-xs text-gray-400 mt-1">Include country code</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">CSV file</label>
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-400 transition-colors">
                  <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} required
                    className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Must include a <b>phone</b> column. <b>name</b> is optional.</p>
              </div>
            )}

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">{error}</div>}

            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={loading} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isBulk ? 'Upload' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
