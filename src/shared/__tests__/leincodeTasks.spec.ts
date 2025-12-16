import fs from "fs"
import os from "os"
import path from "path"
import { describe, expect, it } from "vitest"
import { detectDependencyCycles, TaskStore } from "../leincode/tasks"

describe("tasks", () => {
	const storage = path.join(os.tmpdir(), "tasks-store", "tasks.json")

	it("stores nested subtasks and updates status", () => {
		fs.rmSync(path.dirname(storage), { recursive: true, force: true })
		const store = new TaskStore(storage)
		const parent = store.addTask({ title: "Parent" })
		store.addSubtask(parent.id, { title: "Child" })
		store.updateStatus(parent.id, "in-progress")

		const loaded = store.list()
		expect(loaded[0].subtasks).toHaveLength(1)
		expect(loaded[0].status).toBe("in-progress")
	})

	it("detects dependency cycles", () => {
		fs.rmSync(path.dirname(storage), { recursive: true, force: true })
		const store = new TaskStore(storage)
		const a = store.addTask({ title: "A", id: "a", dependsOn: ["c"] })
		const b = store.addTask({ title: "B", id: "b", dependsOn: [a.id] })
		const c = store.addTask({ title: "C", id: "c", dependsOn: [b.id] })

		const cycles = detectDependencyCycles(store.list())
		expect(cycles[0]).toContain(a.id)
		expect(cycles[0]).toContain(b.id)
		expect(cycles[0]).toContain(c.id)
	})
})
