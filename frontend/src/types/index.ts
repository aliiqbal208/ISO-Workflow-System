// ── Domain Models ──

// ── Status Constants ──

export const APP_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const STEP_STATUS = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
} as const;

export type AppStatus = (typeof APP_STATUS)[keyof typeof APP_STATUS];
export type StepStatus = (typeof STEP_STATUS)[keyof typeof STEP_STATUS];

export interface Component {
  _id: string;
  name: string;
  description: string;
}

export interface Organization {
  _id: string;
  name: string;
  description: string;
}

export interface WorkflowStep {
  component_id: string;
  order: number;
}

export interface Workflow {
  _id: string;
  name: string;
  organization_id: string;
  steps: WorkflowStep[];
}

export interface ApplicationStep {
  component_id: string;
  component_name: string;
  order: number;
}

export interface HistoryEntry {
  step: number;
  step_name: string;
  component_id: string;
  action: string;
  notes: string;
  timestamp: string;
}

export interface Application {
  _id: string;
  name: string;
  organization_id: string;
  workflow_id: string;
  status: AppStatus;
  current_step: number;
  workflow_steps?: ApplicationStep[];
  history?: HistoryEntry[];
  created_at?: string;
  updated_at?: string;
}

// ── Reducer Helpers ──

export interface Message {
  type: 'success' | 'error';
  text: string;
}

// ── Selected Step (used in Workflow Builder) ──

export interface SelectedStep {
  component_id: string;
  component_name: string;
  order: number;
}
