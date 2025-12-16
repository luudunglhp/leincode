export type EventType =
  | "RUN_CREATED"
  | "STEP_STARTED"
  | "TOOL_CALLED"
  | "TOOL_RESULT"
  | "STEP_SUCCEEDED"
  | "STEP_FAILED"
  | "RUN_SUCCEEDED"
  | "RUN_FAILED";

export interface SystemEvent {
  t: EventType;
  runId: string;
  ts: number;
  [key: string]: any;
}

export interface RunStore {
  appendEvent(runId: string, event: SystemEvent): Promise<void>;
  loadEvents(runId: string): Promise<SystemEvent[]>;
  listRuns(): Promise<string[]>;
}

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class FileSystemRunStore implements RunStore {
  private baseDir: string;

  constructor(workspaceRoot?: string) {
    this.baseDir = workspaceRoot
      ? path.join(workspaceRoot, '.kilocode/runs')
      : path.join(os.homedir(), '.kilocode/runs');
  }

  async appendEvent(runId: string, event: SystemEvent): Promise<void> {
    const runDir = path.join(this.baseDir, runId);
    await fs.mkdir(runDir, { recursive: true });
    const eventFile = path.join(runDir, 'events.jsonl');
    await fs.appendFile(eventFile, JSON.stringify(event) + '\n');
  }

  async loadEvents(runId: string): Promise<SystemEvent[]> {
    const runDir = path.join(this.baseDir, runId);
    const eventFile = path.join(runDir, 'events.jsonl');
    try {
      const content = await fs.readFile(eventFile, 'utf-8');
      return content.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async listRuns(): Promise<string[]> {
      try {
          const files = await fs.readdir(this.baseDir);
          return files; // Assuming directories are runIds
      } catch (e) {
          if ((e as any).code === 'ENOENT') return [];
          throw e;
      }
  }
}
