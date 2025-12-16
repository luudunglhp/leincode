import { FileSystemRunStore, Executor, WorkflowSpec } from "../index";
import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";

// Simple test harness
async function runTest() {
    console.log("Running Acceptance Test: WF_CREATE_RUN_HISTORY");
    const testDir = path.join(os.tmpdir(), "ksb-test-" + Date.now());
    await fs.mkdir(testDir);

    const workflow: WorkflowSpec = {
        apiVersion: "kilocode.ai/ksb/v1",
        kind: "Workflow",
        metadata: { name: "acceptance-test", version: "1.0.0" },
        spec: {
            nodes: [
                { id: "n1", type: "tool.dummy", displayName: "Node 1" }
            ],
            edges: []
        }
    };

    const store = new FileSystemRunStore(testDir);
    const executor = new Executor({ store });

    const runId = await executor.startRun(workflow);
    console.log("Run finished:", runId);

    const events = await store.loadEvents(runId);
    console.log(`Loaded ${events.length} events`);

    const hasCreated = events.some(e => e.t === "RUN_CREATED");
    const hasSuccess = events.some(e => e.t === "RUN_SUCCEEDED");
    const hasNodeSuccess = events.some(e => e.t === "STEP_SUCCEEDED" && e.stepId === "n1");

    assert.ok(hasCreated, "Missing RUN_CREATED");
    assert.ok(hasSuccess, "Missing RUN_SUCCEEDED");
    assert.ok(hasNodeSuccess, "Missing STEP_SUCCEEDED for n1");

    console.log("PASS: WF_CREATE_RUN_HISTORY");
}

runTest().catch(err => {
    console.error("FAIL:", err);
    process.exit(1);
});
