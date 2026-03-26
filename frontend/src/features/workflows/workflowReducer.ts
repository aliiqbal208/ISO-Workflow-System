import type {
  Component,
  Organization,
  Workflow,
  Message,
  SelectedStep,
} from '../../types';

export interface WorkflowState {
  components: Component[];
  organizations: Organization[];
  workflows: Workflow[];
  selectedOrg: string;
  workflowName: string;
  selectedSteps: SelectedStep[];
  message: Message | null;
}

export type WorkflowAction =
  | {
      type: 'SET_DATA';
      payload: {
        components: Component[];
        organizations: Organization[];
        workflows: Workflow[];
      };
    }
  | { type: 'SET_FIELD'; field: keyof WorkflowState; payload: string }
  | { type: 'SET_MESSAGE'; payload: Message | null }
  | { type: 'ADD_STEP'; payload: Component }
  | { type: 'REMOVE_STEP'; payload: number }
  | { type: 'MOVE_STEP'; payload: { index: number; direction: number } }
  | { type: 'ADD_ORG'; payload: Organization }
  | { type: 'RESET_FORM' };

export const initialState: WorkflowState = {
  components: [],
  organizations: [],
  workflows: [],
  selectedOrg: '',
  workflowName: '',
  selectedSteps: [],
  message: null,
};

export function workflowReducer(
  state: WorkflowState,
  action: WorkflowAction
): WorkflowState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        components: action.payload.components,
        organizations: action.payload.organizations,
        workflows: action.payload.workflows,
      };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'ADD_STEP': {
      if (
        state.selectedSteps.find(
          (s) => s.component_id === action.payload._id
        )
      )
        return state;
      return {
        ...state,
        selectedSteps: [
          ...state.selectedSteps,
          {
            component_id: action.payload._id,
            component_name: action.payload.name,
            order: state.selectedSteps.length + 1,
          },
        ],
      };
    }
    case 'REMOVE_STEP': {
      const updated = state.selectedSteps
        .filter((_, i) => i !== action.payload)
        .map((s, i) => ({ ...s, order: i + 1 }));
      return { ...state, selectedSteps: updated };
    }
    case 'MOVE_STEP': {
      const { index, direction } = action.payload;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= state.selectedSteps.length)
        return state;
      const newSteps = [...state.selectedSteps];
      [newSteps[index], newSteps[targetIndex]] = [
        newSteps[targetIndex],
        newSteps[index],
      ];
      return {
        ...state,
        selectedSteps: newSteps.map((s, i) => ({ ...s, order: i + 1 })),
      };
    }
    case 'ADD_ORG':
      return {
        ...state,
        organizations: [...state.organizations, action.payload],
        selectedOrg: action.payload._id,
      };
    case 'RESET_FORM':
      return { ...state, workflowName: '', selectedSteps: [], selectedOrg: '' };
    default:
      return state;
  }
}
