import type { Component, Message } from '../../types';

export interface ComponentsState {
  components: Component[];
  name: string;
  description: string;
  message: Message | null;
}

export type ComponentsAction =
  | { type: 'SET_COMPONENTS'; payload: Component[] }
  | { type: 'SET_FIELD'; field: keyof ComponentsState; payload: string }
  | { type: 'SET_MESSAGE'; payload: Message | null }
  | { type: 'RESET_FORM' };

export const initialState: ComponentsState = {
  components: [],
  name: '',
  description: '',
  message: null,
};

export function componentsReducer(
  state: ComponentsState,
  action: ComponentsAction
): ComponentsState {
  switch (action.type) {
    case 'SET_COMPONENTS':
      return { ...state, components: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'RESET_FORM':
      return { ...state, name: '', description: '' };
    default:
      return state;
  }
}
