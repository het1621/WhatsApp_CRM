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
        if (!file) {
          setError('Please select a CSV file');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await api.post('/contacts/bulk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        if (res.data.errors && res.data.errors.length > 0) {
          setError(`Added ${res.data.successCount} contacts. Failed rows: ${res.data.errors.length}`);
          // Don't close immediately if there are errors so user can read them,
          // but we can trigger success to refresh list anyway
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/80 backdrop-blur-md w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/50">
        <div className="p-6 border-b border-gray-200/50 flex justify-between items-center bg-white/50">
          <h3 className="text-xl font-bold text-gray-800">Add Contact</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex bg-gray-100/50 p-1 rounded-xl mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isBulk ? 'bg-white shadow-sm text-whatsapp-dark' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsBulk(false); setError(''); }}
            >
              Single Contact
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isBulk ? 'bg-white shadow-sm text-whatsapp-dark' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsBulk(true); setError(''); }}
            >
              Bulk Upload
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isBulk ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-whatsapp-light outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-whatsapp-light outline-none transition-all"
                    placeholder="+1234567890"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-1">Include country code (e.g. +1 for US, +91 for India)</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload CSV File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-whatsapp-light transition-colors bg-white/30">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-whatsapp-light/10 file:text-whatsapp-dark hover:file:bg-whatsapp-light/20 cursor-pointer"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 ml-1">
                  CSV must include a <b>phone</b> column. <b>name</b> is optional.
                </p>
              </div>
            )}

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
                disabled={loading}
                className="px-6 py-2.5 bg-whatsapp-dark text-white font-medium rounded-xl hover:bg-whatsapp-darker transition-colors shadow-md shadow-whatsapp-dark/20 disabled:opacity-70 flex items-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : null}
                {isBulk ? 'Upload CSV' : 'Save Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
