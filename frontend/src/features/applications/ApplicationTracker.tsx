import { useReducer, useEffect, useMemo, type FormEvent } from 'react';
import {
  getOrganizations,
  getWorkflows,
  getApplications,
  getApplication,
  createApplication,
  advanceApplication,
} from '../../api';
import { applicationReducer, initialState } from './applicationReducer';
import OrgSelect from '../../components/ui/OrgSelect';
import type { Organization } from '../../types';
import { APP_STATUS, STEP_STATUS } from '../../types';
import type { StepStatus } from '../../types';

/* ── Step-status → Tailwind class maps ── */
const STEP_ITEM_CLASSES: Record<StepStatus, string> = {
  [STEP_STATUS.COMPLETED]: 'border-l-success bg-success-light',
  [STEP_STATUS.IN_PROGRESS]: 'border-l-primary bg-primary-light shadow-sm',
  [STEP_STATUS.PENDING]: 'border-l-slate-200',
};

const STEP_NUMBER_CLASSES: Record<StepStatus, string> = {
  [STEP_STATUS.COMPLETED]: 'bg-success shadow-[0_2px_4px_rgba(16,185,129,0.3)]',
  [STEP_STATUS.IN_PROGRESS]: 'bg-primary animate-pulse-glow',
  [STEP_STATUS.PENDING]: 'bg-slate-400',
};

export default function ApplicationTracker() {
  const [state, dispatch] = useReducer(applicationReducer, initialState);
  const { organizations, workflows, applications, selectedApp, message, appName, selectedOrg, selectedWorkflow } = state;

  const orgWorkflows = useMemo(() => {
    if (!selectedOrg) return [];
    return workflows.filter((w) => w.organization_id === selectedOrg);
  }, [selectedOrg, workflows]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgRes, wfRes, appRes] = await Promise.all([
        getOrganizations(),
        getWorkflows(),
        getApplications(),
      ]);
      dispatch({
        type: 'SET_DATA',
        payload: {
          organizations: orgRes.data,
          workflows: wfRes.data,
          applications: appRes.data,
        },
      });
    } catch {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Failed to load data' } });
    }
  };

  const handleCreateApp = async (e: FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !selectedOrg || !selectedWorkflow) {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Please fill all fields' } });
      return;
    }
    try {
      await createApplication({
        name: appName.trim(),
        organization_id: selectedOrg,
        workflow_id: selectedWorkflow,
      });
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'success', text: `Application "${appName}" created!` } });
      dispatch({ type: 'RESET_FORM' });
      loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      dispatch({
        type: 'SET_MESSAGE',
        payload: { type: 'error', text: axiosErr.response?.data?.error || 'Failed to create application' },
      });
    }
  };

  const handleViewApp = async (appId: string) => {
    try {
      const res = await getApplication(appId);
      dispatch({ type: 'SET_SELECTED_APP', payload: res.data });
    } catch {
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'error', text: 'Failed to load application details' } });
    }
  };

  const handleAdvance = async () => {
    if (!selectedApp) return;
    try {
      await advanceApplication(selectedApp._id, {});
      dispatch({ type: 'SET_MESSAGE', payload: { type: 'success', text: 'Application advanced to next step!' } });
      const detailRes = await getApplication(selectedApp._id);
      dispatch({ type: 'SET_SELECTED_APP', payload: detailRes.data });
      loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      dispatch({
        type: 'SET_MESSAGE',
        payload: { type: 'error', text: axiosErr.response?.data?.error || 'Failed to advance application' },
      });
    }
  };

  const getOrgName = (orgId: string): string => {
    const org = organizations.find((o) => o._id === orgId);
    return org ? org.name : 'Unknown';
  };

  const getStepStatus = (stepOrder: number): StepStatus => {
    if (!selectedApp) return STEP_STATUS.PENDING;
    if (selectedApp.status === APP_STATUS.COMPLETED) return STEP_STATUS.COMPLETED;
    if (stepOrder < selectedApp.current_step) return STEP_STATUS.COMPLETED;
    if (stepOrder === selectedApp.current_step) return STEP_STATUS.IN_PROGRESS;
    return STEP_STATUS.PENDING;
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

      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div>
          {/* Create Application */}
          <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
            <h3 className="mb-3.5 text-slate-800 text-[1.05rem] font-semibold">📝 Create Application</h3>
            <form onSubmit={handleCreateApp}>
              <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
                Application Name
              </label>
              <input
                className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                value={appName}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'appName', payload: e.target.value })}
                placeholder="e.g. Company X ISO 9001"
                required
              />
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
                    dispatch({ type: 'SELECT_ORG', payload: orgId });
                  }
                }}
                required
              />
              <label className="block mb-1 font-semibold text-xs text-slate-500 uppercase tracking-wider">
                Workflow
              </label>
              <select
                className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                value={selectedWorkflow}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'selectedWorkflow', payload: e.target.value })}
                required
                disabled={!selectedOrg}
              >
                <option value="">
                  {selectedOrg ? 'Select workflow...' : 'Select an organization first'}
                </option>
                {orgWorkflows.map((wf) => (
                  <option key={wf._id} value={wf._id}>
                    {wf.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="mt-2.5 px-4.5 py-2 border-none rounded-md text-sm font-semibold bg-primary text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)] cursor-pointer transition-all hover:bg-primary-dark hover:shadow-[0_2px_8px_rgba(99,102,241,0.4)] hover:-translate-y-px"
              >
                Create Application
              </button>
            </form>
          </div>

          {/* Application List */}
          <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
            <h3 className="mb-3.5 text-slate-800 text-[1.05rem] font-semibold">
              📂 Applications ({applications.length})
            </h3>
            {applications.length === 0 ? (
              <div className="text-center py-11 px-5 text-slate-400">
                <p className="text-sm">No applications yet.</p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app._id}
                  onClick={() => handleViewApp(app._id)}
                  className={`py-2.5 px-3.5 rounded-lg mb-2 cursor-pointer border-l-4 transition-all ${
                    selectedApp?._id === app._id ? 'bg-indigo-50' : 'bg-slate-50 hover:bg-slate-100'
                  } ${
                    app.status === APP_STATUS.COMPLETED ? 'border-l-success' : 'border-l-primary'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-sm">{app.name}</strong>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider ${
                        app.status === APP_STATUS.COMPLETED
                          ? 'bg-success-light text-success-dark border border-emerald-300'
                          : 'bg-primary-light text-primary border border-primary-muted'
                      }`}
                    >
                      {app.status === APP_STATUS.COMPLETED ? '✅ Completed' : '🔄 In Progress'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {getOrgName(app.organization_id)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column — Detail Panel */}
        <div>
          {selectedApp ? (
            <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
              {/* Header */}
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-[1.05rem] font-semibold text-slate-800">📊 {selectedApp.name}</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider ${
                    selectedApp.status === APP_STATUS.COMPLETED
                      ? 'bg-success-light text-success-dark border border-emerald-300'
                      : 'bg-primary-light text-primary border border-primary-muted'
                  }`}
                >
                  {selectedApp.status === APP_STATUS.COMPLETED ? '✅ Completed' : '🔄 In Progress'}
                </span>
              </div>

              <p className="text-[0.85rem] text-slate-500 mb-4">
                Organization: {getOrgName(selectedApp.organization_id)}
              </p>

              {/* Step Progress */}
              {selectedApp.workflow_steps && (
                <div className="flex flex-col gap-1.5">
                  {selectedApp.workflow_steps.map((step, i) => {
                    const stepStatus = getStepStatus(step.order);
                    return (
                      <div key={i}>
                        <div
                          className={`flex items-center gap-3.5 py-3 px-4 rounded-md border-l-4 transition-all ${STEP_ITEM_CLASSES[stepStatus]}`}
                        >
                          <span
                            className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${STEP_NUMBER_CLASSES[stepStatus]}`}
                          >
                            {stepStatus === STEP_STATUS.COMPLETED ? '✓' : step.order}
                          </span>
                          <div>
                            <div className="font-medium text-sm">{step.component_name}</div>
                            <div className="text-xs text-slate-400 capitalize">
                              {stepStatus.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        {i < selectedApp.workflow_steps!.length - 1 && (
                          <div className="text-center text-slate-300 text-base my-0.5 opacity-50">↓</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Advance Button */}
              {selectedApp.status !== APP_STATUS.COMPLETED && (
                <button
                  className="w-full mt-4 px-4.5 py-2.5 border-none rounded-md text-sm font-semibold bg-success text-white shadow-[0_1px_3px_rgba(16,185,129,0.3)] cursor-pointer transition-all hover:bg-success-dark hover:shadow-[0_2px_8px_rgba(16,185,129,0.4)] hover:-translate-y-px"
                  onClick={handleAdvance}
                >
                  ✅ Complete Current Step & Advance
                </button>
              )}

              {/* History */}
              {selectedApp.history && selectedApp.history.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2.5 text-sm font-semibold text-slate-700">📜 History</h4>
                  {selectedApp.history.map((entry, i) => (
                    <div
                      key={i}
                      className="flex gap-3 py-2.5 border-b border-slate-100 last:border-b-0 text-[0.84rem]"
                    >
                      <span className="text-slate-400 min-w-[160px] text-xs font-mono">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <span className="font-medium text-slate-500">
                        Step {entry.step}: {entry.step_name} — <em>{entry.action}</em>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-200 text-center py-11 px-5 text-slate-400">
              <p className="text-sm">👈 Select an application to view its progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
