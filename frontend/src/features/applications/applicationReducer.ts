import type {
  Organization,
  Workflow,
  Application,
  Message,
} from '../../types';

export interface ApplicationState {
  organizations: Organization[];
  workflows: Workflow[];
  applications: Application[];
  selectedApp: Application | null;
  message: Message | null;
  appName: string;
  selectedOrg: string;
  selectedWorkflow: string;
}

export type ApplicationAction =
  | {
      type: 'SET_DATA';
      payload: {
        organizations: Organization[];
        workflows: Workflow[];
        applications: Application[];
      };
    }
  | { type: 'SET_FIELD'; field: keyof ApplicationState; payload: string }
  | { type: 'SET_MESSAGE'; payload: Message | null }
  | { type: 'SET_SELECTED_APP'; payload: Application }
  | { type: 'ADD_ORG'; payload: Organization }
  | { type: 'SELECT_ORG'; payload: string }
  | { type: 'RESET_FORM' };

export const initialState: ApplicationState = {
  organizations: [],
  workflows: [],
  applications: [],
  selectedApp: null,
  message: null,
  appName: '',
  selectedOrg: '',
  selectedWorkflow: '',
};

export function applicationReducer(
  state: ApplicationState,
  action: ApplicationAction
): ApplicationState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        organizations: action.payload.organizations,
        workflows: action.payload.workflows,
        applications: action.payload.applications,
      };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'SET_SELECTED_APP':
      return { ...state, selectedApp: action.payload };
    case 'ADD_ORG':
      return {
        ...state,
        organizations: [...state.organizations, action.payload],
        selectedOrg: action.payload._id,
        selectedWorkflow: '',
      };
    case 'SELECT_ORG':
      return { ...state, selectedOrg: action.payload, selectedWorkflow: '' };
    case 'RESET_FORM':
      return { ...state, appName: '', selectedOrg: '', selectedWorkflow: '' };
    default:
      return state;
  }
}
