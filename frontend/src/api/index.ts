import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type {
  Component,
  Organization,
  Workflow,
  Application,
  HistoryEntry,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

// ── Components ──
export const getComponents = (): Promise<AxiosResponse<Component[]>> =>
  api.get('/components');

export const createComponent = (
  data: Omit<Component, '_id'>
): Promise<AxiosResponse<Component>> => api.post('/components', data);

export const deleteComponent = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/components/${id}`);

// ── Organizations ──
export const getOrganizations = (): Promise<AxiosResponse<Organization[]>> =>
  api.get('/organizations');

export const createOrganization = (
  data: Omit<Organization, '_id'>
): Promise<AxiosResponse<Organization>> => api.post('/organizations', data);

export const deleteOrganization = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/organizations/${id}`);

// ── Workflows ──
export const getWorkflows = (
  orgId?: string
): Promise<AxiosResponse<Workflow[]>> =>
  api.get('/workflows', { params: orgId ? { organization_id: orgId } : {} });

export const getWorkflow = (id: string): Promise<AxiosResponse<Workflow>> =>
  api.get(`/workflows/${id}`);

export const createWorkflow = (data: {
  name: string;
  organization_id: string;
  steps: { component_id: string; order: number }[];
}): Promise<AxiosResponse<Workflow>> => api.post('/workflows', data);

export const deleteWorkflow = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/workflows/${id}`);

// ── Applications ──
export const getApplications = (
  params?: Record<string, string>
): Promise<AxiosResponse<Application[]>> => api.get('/applications', { params });

export const getApplication = (
  id: string
): Promise<AxiosResponse<Application>> => api.get(`/applications/${id}`);

export const createApplication = (data: {
  name: string;
  organization_id: string;
  workflow_id: string;
}): Promise<AxiosResponse<Application>> => api.post('/applications', data);

export const advanceApplication = (
  id: string,
  data: Record<string, unknown>
): Promise<AxiosResponse<Application>> =>
  api.post(`/applications/${id}/advance`, data);

export const getApplicationHistory = (
  id: string
): Promise<AxiosResponse<HistoryEntry[]>> =>
  api.get(`/applications/${id}/history`);

export default api;
