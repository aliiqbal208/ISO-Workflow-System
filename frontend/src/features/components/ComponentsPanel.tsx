import { useReducer, useEffect, type FormEvent } from 'react';
import { getComponents, createComponent, deleteComponent } from '../../api';
import { componentsReducer, initialState } from './componentsReducer';

export default function ComponentsPanel() {
  const [state, dispatch] = useReducer(componentsReducer, initialState);
  const { components, name, description, message } = state;

  const fetchComponents = async () => {
    try {
      const res = await getComponents();
      dispatch({ type: 'SET_COMPONENTS', payload: res.data });
    } catch {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Failed to load components' } });
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createComponent({ name: name.trim(), description: description.trim() });
      dispatch({ type: 'RESET_FORM' });
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'success', text: `Component "${name}" created!` } });
      fetchComponents();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      dispatch({
        type: 'SET_MESSAGE',
        payload: { type: 'error', text: axiosErr.response?.data?.error || 'Failed to create component' },
      });
    }
  };

  const handleDelete = async (id: string, compName: string) => {
    if (!window.confirm(`Delete component "${compName}"?`)) return;
    try {
      await deleteComponent(id);
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'success', text: `Component "${compName}" deleted` } });
      fetchComponents();
    } catch {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Failed to delete component' } });
    }
  };

  return (
    <div>
      {/* Create Form */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
        <h3 className="mb-3.5 text-slate-800 text-[1.05rem] font-semibold">➕ Create New Component</h3>
        <form onSubmit={handleCreate}>
          <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Name
          </label>
          <input
            className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            value={name}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', payload: e.target.value })}
            placeholder="e.g. Document Review"
            required
          />
          <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Description
          </label>
          <input
            className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            value={description}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', payload: e.target.value })}
            placeholder="Brief description of this step"
          />
          <button
            type="submit"
            className="mt-2.5 px-4.5 py-2 border-none rounded-md text-sm font-semibold bg-primary text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)] cursor-pointer transition-all hover:bg-primary-dark hover:shadow-[0_2px_8px_rgba(99,102,241,0.4)] hover:-translate-y-px"
          >
            Create Component
          </button>
        </form>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4.5 py-3 rounded-md mb-4 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-success-light text-success-dark border border-emerald-300'
              : 'bg-danger-light text-danger-dark border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Component List */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
        <h3 className="mb-3.5 text-slate-800 text-[1.05rem] font-semibold">
          📦 Available Components ({components.length})
        </h3>
        {components.length === 0 ? (
          <div className="text-center py-11 px-5 text-slate-400">
            <p className="mt-2 text-sm">No components yet. Create one above or run the seed script.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {components.map((comp) => (
              <div
                key={comp._id}
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-primary-light text-primary rounded-full text-[0.82rem] font-medium border-[1.5px] border-primary-muted transition-all hover:bg-primary-muted hover:border-primary hover:-translate-y-px hover:shadow-sm"
                title={comp.description}
              >
                {comp.name}
                <button
                  className="bg-transparent border-none text-danger cursor-pointer text-lg px-1.5 py-0.5 rounded transition-all hover:bg-danger-light"
                  onClick={() => handleDelete(comp._id, comp.name)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
