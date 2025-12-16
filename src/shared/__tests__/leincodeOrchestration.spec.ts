import { describe, expect, it } from "vitest"
import { mergeChanges, TeamRunner } from "../leincode/orchestration"
import { TaskStore } from "../leincode/tasks"

const team = {
	id: "team-1",
	goal: "Ship",
	leader: { id: "l", name: "Lead", mode: "leader" },
	members: [
		{ id: "c1", name: "Coder", mode: "coder" },
		{ id: "d1", name: "Debugger", mode: "debugger" },
	],
}

describe("orchestration", () => {
	it("delegates tasks to members", () => {
		const runner = new TeamRunner(new TaskStore("/tmp/team-orch.json"))
		const result = runner.runTeam(team, { goal: "Implement feature. Add tests." })
		const owners = result.tasks.map((task) => task.owner)
		expect(owners).toContain("Coder")
		expect(owners).toContain("Debugger")
	})

	it("merges non-overlapping changes", () => {
		const merged = mergeChanges([
			{ file: "a", start: 0, end: 1, content: "first" },
			{ file: "a", start: 2, end: 3, content: "second" },
		])
		expect(merged).toHaveLength(2)
	})
})
