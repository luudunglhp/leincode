export interface WorkflowSpec {
  apiVersion: string;
  kind: "Workflow";
  metadata: {
    name: string;
    version: string;
    createdAt?: string;
    description?: string;
  };
  spec: {
    inputs?: Record<string, PortSpec>;
    nodes: NodeSpec[];
    edges: EdgeSpec[];
  };
  definitions?: Record<string, any>;
}

export interface NodeSpec {
  id: string;
  type: string; // e.g., "tool.execute_command"
  displayName?: string;
  timeoutMs?: number;
  retry?: {
    maxAttempts: number;
    backoff?: string; // e.g. "exponential", "linear"
  };
  dependsOn?: string[]; // Node IDs
  ports?: {
    in?: Record<string, PortSpec>;
    out?: Record<string, PortSpec>;
  };
  args?: Record<string, any>; // Static arguments
}

export interface EdgeSpec {
  from: { node: string; port: string };
  to: { node: string; port: string };
}

export interface PortSpec {
  schemaRef?: string;
  type?: string;
  description?: string;
}

export const WORKFLOW_API_VERSION = "kilocode.ai/ksb/v1";
