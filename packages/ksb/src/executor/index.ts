import { WorkflowSpec, NodeSpec } from '../workflow-spec/index';
import { RunStore, SystemEvent } from '../run-store/index';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutorOptions {
    store: RunStore;
}

export class Executor {
    private store: RunStore;

    constructor(options: ExecutorOptions) {
        this.store = options.store;
    }

    async startRun(workflow: WorkflowSpec, inputs: Record<string, any> = {}): Promise<string> {
        const runId = uuidv4();
        const now = Date.now();

        await this.store.appendEvent(runId, {
            t: "RUN_CREATED",
            runId,
            ts: now,
            workflowRef: {
                name: workflow.metadata.name,
                version: workflow.metadata.version
            },
            inputs
        });

        await this.execute(runId, workflow);
        return runId;
    }

    private async execute(runId: string, workflow: WorkflowSpec) {
        // Simple sequential execution for V1 Slice
        // TODO: Build DAG and Topological Sort

        for (const node of workflow.spec.nodes) {
            await this.executeNode(runId, node);
        }

        await this.store.appendEvent(runId, {
            t: "RUN_SUCCEEDED",
            runId,
            ts: Date.now()
        });
    }

    private async executeNode(runId: string, node: NodeSpec) {
        await this.store.appendEvent(runId, {
            t: "STEP_STARTED",
            runId,
            stepId: node.id,
            ts: Date.now()
        });

        // Mock execution for dummy node
        // In real impl, check node.type and invoke tool
        await this.invokeTool(runId, node);

        await this.store.appendEvent(runId, {
            t: "STEP_SUCCEEDED",
            runId,
            stepId: node.id,
            ts: Date.now()
        });
    }

    private async invokeTool(runId: string, node: NodeSpec) {
        await this.store.appendEvent(runId, {
            t: "TOOL_CALLED",
            runId,
            stepId: node.id,
            tool: node.type,
            inputHash: "mock",
            ts: Date.now()
        });

        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 100));

        await this.store.appendEvent(runId, {
            t: "TOOL_RESULT",
            runId,
            stepId: node.id,
            status: "ok",
            outputHash: "mock",
            ts: Date.now()
        });
    }
}
