import { Command, CommandContext } from "../core/types.js";
import { FileSystemRunStore, Executor, WorkflowSpec, SystemEvent } from "@kilocode/ksb";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";

export const ksbCommand: Command = {
	name: "ksb",
	aliases: ["ksb"],
	description: "KiloCode System Builder",
	usage: "ksb <subcommand> [options]",
	examples: ["ksb run system.graph.yaml --auto --json"],
	category: "system",
	handler: async (context: CommandContext) => {
		const subcommand = context.args[0];

		if (subcommand === "run") {
			await handleRun(context);
		} else if (subcommand === "init") {
			await handleInit(context);
		} else {
			context.addMessage({
				type: "error",
				content: "Unknown subcommand. Available: run, init",
			});
		}
	},
};

async function handleRun(context: CommandContext) {
	const workflowFile = context.args[1];
	if (!workflowFile) {
		context.addMessage({
			type: "error",
			content: "Usage: ksb run <workflow-file>",
		});
		return;
	}

	const cwd = process.cwd();
	const workflowPath = path.resolve(cwd, workflowFile);

	try {
		const content = await fs.readFile(workflowPath, "utf-8");
		let workflow: WorkflowSpec;

		if (workflowFile.endsWith(".json")) {
			workflow = JSON.parse(content);
		} else {
			workflow = yaml.parse(content);
		}

		const store = new FileSystemRunStore(cwd);
		const executor = new Executor({ store });

		context.addMessage({
			type: "info",
			content: `Starting run for workflow: ${workflow.metadata.name}`,
		});

		const runId = await executor.startRun(workflow);
        const events = await store.loadEvents(runId);

		context.addMessage({
			type: "success",
			content: `Run completed. Run ID: ${runId}`,
		});

        if (context.options.json) {
            console.log(JSON.stringify({
                runId,
                status: "completed",
                events: events
            }, null, 2));
        }

	} catch (error) {
		context.addMessage({
			type: "error",
			content: `Failed to run workflow: ${(error as any).message}`,
		});
	}
}

async function handleInit(context: CommandContext) {
    const cwd = process.cwd();
    const systemDir = path.join(cwd, ".kilocode", "system");
    const dirs = [
        "workflows",
        "data/schemas",
        "data/openapi",
        "acceptance",
        "adr",
        "gates",
        "evals"
    ];

    try {
        for (const dir of dirs) {
            await fs.mkdir(path.join(systemDir, dir), { recursive: true });
        }

        // Create prd.md
        await fs.writeFile(path.join(systemDir, "prd.md"), "# System PRD\n\n## Main Flows\n\n## NFR/SLO\n");

        // Create slo.yaml
        await fs.writeFile(path.join(systemDir, "slo.yaml"), "api:\n  p95_latency_ms: 250\n");

        context.addMessage({
            type: "success",
            content: `Initialized KSB system structure at ${systemDir}`,
        });
    } catch (error) {
        context.addMessage({
            type: "error",
            content: `Failed to initialize: ${(error as any).message}`,
        });
    }
}
