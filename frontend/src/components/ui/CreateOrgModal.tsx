import { useState, type FormEvent } from 'react';
import { createOrganization } from '../../api';
import type { Organization } from '../../types';
import type { AxiosError } from 'axios';

interface CreateOrgModalProps {
  onClose: () => void;
  onCreated: (org: Organization) => void;
}

export default function CreateOrgModal({ onClose, onCreated }: CreateOrgModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await createOrganization({
        name: name.trim(),
        description: description.trim(),
      });
      onCreated(res.data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      setError(axiosErr.response?.data?.error || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] p-7 w-[90%] max-w-[480px] shadow-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-[1.1rem] font-bold text-slate-800">🏢 Create Organization</h3>
          <button
            className="bg-transparent border-none text-2xl text-slate-400 cursor-pointer px-2 py-1 rounded-md transition-all leading-none hover:bg-danger-light hover:text-danger"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4.5 py-3 rounded-md mb-4 text-sm font-medium bg-danger-light text-danger-dark border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Organization Name
          </label>
          <input
            className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Global Certifications Inc."
            autoFocus
            required
          />

          <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Description (optional)
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all resize-y focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this organization..."
            rows={3}
          />

          <div className="flex justify-end gap-2.5 mt-2">
            <button
              type="button"
              className="px-4.5 py-2 rounded-md text-sm font-semibold bg-slate-50 text-slate-500 border border-slate-200 cursor-pointer transition-all hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 border-none rounded-md text-sm font-semibold bg-primary text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)] cursor-pointer transition-all hover:bg-primary-dark hover:shadow-[0_2px_8px_rgba(99,102,241,0.4)] hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
