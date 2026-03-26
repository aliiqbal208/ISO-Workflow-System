import { useReducer, useEffect, type FormEvent } from 'react';
import {
  getComponents,
  getOrganizations,
  getWorkflows,
  createWorkflow,
  deleteWorkflow,
} from '../../api';
import { workflowReducer, initialState } from './workflowReducer';
import OrgSelect from '../../components/ui/OrgSelect';
import type { Organization } from '../../types';

export default function WorkflowBuilder() {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const { components, organizations, workflows, selectedOrg, workflowName, selectedSteps, message } = state;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [compRes, orgRes, wfRes] = await Promise.all([
        getComponents(),
        getOrganizations(),
        getWorkflows(),
      ]);
      dispatch({
        type: 'SET_DATA',
        payload: {
          components: compRes.data,
          organizations: orgRes.data,
          workflows: wfRes.data,
        },
      });
    } catch {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Failed to load data' } });
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !workflowName.trim() || selectedSteps.length === 0) {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Please fill all fields and add at least one step' } });
      return;
    }

    try {
      await createWorkflow({
        name: workflowName.trim(),
        organization_id: selectedOrg,
        steps: selectedSteps.map((s) => ({
          component_id: s.component_id,
          order: s.order,
        })),
      });
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'success', text: `Workflow "${workflowName}" created!` } });
      dispatch({ type: 'RESET_FORM' });
      loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      dispatch({
        type: 'SET_MESSAGE',
        payload: { type: 'error', text: axiosErr.response?.data?.error || 'Failed to create workflow' },
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete workflow "${name}"?`)) return;
    try {
      await deleteWorkflow(id);
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'success', text: 'Workflow deleted' } });
      loadData();
    } catch {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Failed to delete workflow' } });
    }
  };

  const getOrgName = (orgId: string): string => {
    const org = organizations.find((o) => o._id === orgId);
    return org ? org.name : 'Unknown';
  };

  const getCompName = (compId: string): string => {
    const comp = components.find((c) => c._id === compId);
    return comp ? comp.name : 'Unknown';
  };

  return (
    <div>
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

      {/* Build Workflow Card */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
        <h3 className="mb-3.5 text-slate-800 text-[1.05rem] font-semibold">🔧 Build a Workflow</h3>
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
                Organization
              </label>
              <OrgSelect
                organizations={organizations}
                value={selectedOrg}
                onChange={(orgId: string, newOrg?: Organization) => {
                  if (newOrg) {
                    dispatch({ type: 'ADD_ORG', payload: newOrg });
                  } else {
                    dispatch({ type: 'SET_FIELD', field: 'selectedOrg', payload: orgId });
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
                Workflow Name
              </label>
              <input
                className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                value={workflowName}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'workflowName', payload: e.target.value })}
                placeholder="e.g. ISO 9001 Certification"
                required
              />
            </div>
          </div>

          {/* Builder Section */}
          <div className="grid grid-cols-2 gap-5 mt-4">
            {/* Available Components */}
            <div className="min-h-[200px]">
              <h4 className="mb-2.5 text-sm font-semibold text-slate-700">Available Components</h4>
              <p className="text-xs text-slate-400 mb-2.5">Click to add to workflow →</p>
              <div className="flex flex-wrap gap-1.5">
                {components.map((comp) => {
                  const isSelected = selectedSteps.find((s) => s.component_id === comp._id);
                  return (
                    <div
                      key={comp._id}
                      className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-[0.82rem] font-medium cursor-pointer border-[1.5px] transition-all hover:-translate-y-px hover:shadow-sm ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-[0_2px_6px_rgba(99,102,241,0.3)]'
                          : 'bg-primary-light text-primary border-primary-muted hover:bg-primary-muted hover:border-primary'
                      }`}
                      onClick={() => dispatch({ type: 'ADD_STEP', payload: comp })}
                      title={comp.description}
                    >
                      {comp.name}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Steps */}
            <div className="min-h-[200px]">
              <h4 className="mb-2.5 text-sm font-semibold text-slate-700">
                Workflow Steps ({selectedSteps.length})
              </h4>
              {selectedSteps.length === 0 ? (
                <div className="text-center py-11 px-5 text-slate-400">
                  <p className="text-sm">← Click components to add steps</p>
                </div>
              ) : (
                selectedSteps.map((step, index) => (
                  <div
                    key={step.component_id}
                    className="flex items-center justify-between py-2.5 px-3.5 bg-primary-light border-[1.5px] border-primary-muted rounded-md mb-1.5 transition-all hover:border-primary hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary min-w-[20px]">{step.order}.</span>
                      <span className="text-sm">{step.component_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'MOVE_STEP', payload: { index, direction: -1 } })}
                        disabled={index === 0}
                        className="px-2 py-0.5 text-xs bg-slate-50 text-slate-500 border border-slate-200 rounded-md cursor-pointer transition-all hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'MOVE_STEP', payload: { index, direction: 1 } })}
                        disabled={index === selectedSteps.length - 1}
                        className="px-2 py-0.5 text-xs bg-slate-50 text-slate-500 border border-slate-200 rounded-md cursor-pointer transition-all hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="bg-transparent border-none text-danger cursor-pointer text-lg px-1.5 py-0.5 rounded transition-all hover:bg-danger-light"
                        onClick={() => dispatch({ type: 'REMOVE_STEP', payload: index })}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 px-4.5 py-2 border-none rounded-md text-sm font-semibold bg-primary text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)] cursor-pointer transition-all hover:bg-primary-dark hover:shadow-[0_2px_8px_rgba(99,102,241,0.4)] hover:-translate-y-px"
          >
            Create Workflow
          </button>
        </form>
      </div>

      {/* Existing Workflows */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
        <h3 className="mb-3.5 text-slate-800 text-[1.05rem] font-semibold">
          📋 Existing Workflows ({workflows.length})
        </h3>
        {workflows.length === 0 ? (
          <div className="text-center py-11 px-5 text-slate-400">
            <p className="text-sm">No workflows created yet.</p>
          </div>
        ) : (
          workflows.map((wf) => (
            <div
              key={wf._id}
              className="p-3 bg-slate-50 rounded-lg mb-2.5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <strong>{wf.name}</strong>
                  <span className="ml-2 text-xs text-slate-400">
                    — {getOrgName(wf.organization_id)}
                  </span>
                </div>
                <button
                  className="px-2.5 py-1 text-xs border-none rounded-md font-semibold bg-danger text-white shadow-[0_1px_3px_rgba(239,68,68,0.3)] cursor-pointer transition-all hover:bg-danger-dark hover:shadow-[0_2px_8px_rgba(239,68,68,0.4)] hover:-translate-y-px"
                  onClick={() => handleDelete(wf._id, wf.name)}
                >
                  Delete
                </button>
              </div>
              <div className="mt-2 text-[0.85rem] text-slate-500">
                {wf.steps.map((step, i) => (
                  <span key={i}>
                    {getCompName(step.component_id)}
                    {i < wf.steps.length - 1 && ' → '}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
