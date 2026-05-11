import type { Workflow, WorkflowRun } from "../types";
import { apiRequest } from "./client";

export const api = {
  listWorkflows: () => apiRequest<Workflow[]>("GET", "/workflows"),

  getWorkflow: (id: string) => apiRequest<Workflow>("GET", `/workflows/${id}`),

  saveWorkflow: (wf: Workflow) =>
    apiRequest<Workflow>(wf.id ? "PUT" : "POST", wf.id ? `/workflows/${wf.id}` : "/workflows", wf),

  deleteWorkflow: (id: string) =>
    apiRequest<{ ok: boolean }>("DELETE", `/workflows/${id}`),

  runWorkflow: (id: string) =>
    apiRequest<WorkflowRun>("POST", `/workflows/${id}/run`),

  getRun: (id: string) => apiRequest<WorkflowRun>("GET", `/runs/${id}`),

  listRuns: (workflowId?: string) =>
    apiRequest<WorkflowRun[]>("GET", `/runs${workflowId ? `?workflow_id=${workflowId}` : ""}`),

  duplicateWorkflow: (id: string) =>
    apiRequest<Workflow>("POST", `/workflows/${id}/duplicate`),

  importWorkflow: (wf: Workflow) =>
    apiRequest<Workflow>("POST", "/workflows/import", wf),
};
