import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"

export type TaskStatus = "todo" | "in-progress" | "blocked" | "done"

export interface TaskLink {
	dependsOn?: string[]
	blocks?: string[]
	related?: string[]
}

export interface TaskNode extends TaskLink {
	id: string
	title: string
	description?: string
	status: TaskStatus
	priority?: number
	owner?: string
	dueDate?: string
	tags?: string[]
	subtasks: TaskNode[]
}

export type TaskInput = Omit<TaskNode, "id" | "subtasks" | "status"> & {
	id?: string
	status?: TaskStatus
	subtasks?: TaskInput[]
}

export class TaskValidationError extends Error {}

function ensureDir(filePath: string) {
	const dir = path.dirname(filePath)
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true })
	}
}

export class TaskStore {
	constructor(private storagePath: string) {}

	load(): TaskNode[] {
		if (!fs.existsSync(this.storagePath)) return []
		const content = fs.readFileSync(this.storagePath, "utf8")
		if (!content.trim()) return []
		return JSON.parse(content) as TaskNode[]
	}

	save(tasks: TaskNode[]) {
		ensureDir(this.storagePath)
		fs.writeFileSync(this.storagePath, JSON.stringify(tasks, null, 2))
	}

	private createNode(input: TaskInput): TaskNode {
		return {
			id: input.id ?? randomUUID(),
			title: input.title,
			description: input.description,
			status: input.status ?? "todo",
			priority: input.priority,
			owner: input.owner,
			dueDate: input.dueDate,
			tags: input.tags,
			dependsOn: input.dependsOn,
			blocks: input.blocks,
			related: input.related,
			subtasks: (input.subtasks || []).map((child) => this.createNode(child)),
		}
	}

	addTask(input: TaskInput): TaskNode {
		const tasks = this.load()
		const node = this.createNode(input)
		tasks.push(node)
		this.save(tasks)
		return node
	}

	updateStatus(taskId: string, status: TaskStatus): TaskNode | undefined {
		const tasks = this.load()
		const updated = updateNode(tasks, taskId, (node) => ({ ...node, status }))
		this.save(tasks)
		return updated
	}

	addSubtask(taskId: string, input: TaskInput): TaskNode | undefined {
		const tasks = this.load()
		const updated = updateNode(tasks, taskId, (node) => ({
			...node,
			subtasks: [...node.subtasks, this.createNode(input)],
		}))
		this.save(tasks)
		return updated
	}

	list(): TaskNode[] {
		return this.load()
	}
}

export function detectDependencyCycles(tasks: TaskNode[]): string[][] {
	const cycles: string[][] = []
	const graph = new Map<string, string[]>()

	const collect = (node: TaskNode) => {
		graph.set(node.id, node.dependsOn || [])
		node.subtasks.forEach(collect)
	}
	tasks.forEach(collect)

	const visited = new Set<string>()
	const stack = new Set<string>()

	const dfs = (nodeId: string, path: string[]) => {
		if (stack.has(nodeId)) {
			const cycleStart = path.indexOf(nodeId)
			cycles.push(path.slice(cycleStart))
			return
		}
		if (visited.has(nodeId)) return
		visited.add(nodeId)
		stack.add(nodeId)
		const neighbors = graph.get(nodeId) || []
		neighbors.forEach((neighbor) => dfs(neighbor, [...path, neighbor]))
		stack.delete(nodeId)
	}

	Array.from(graph.keys()).forEach((id) => dfs(id, [id]))
	return cycles
}

function updateNode(nodes: TaskNode[], taskId: string, updater: (node: TaskNode) => TaskNode): TaskNode | undefined {
	for (let i = 0; i < nodes.length; i += 1) {
		if (nodes[i].id === taskId) {
			const updated = updater(nodes[i])
			nodes[i] = updated
			return updated
		}
		const child = updateNode(nodes[i].subtasks, taskId, updater)
		if (child) return child
	}
	return undefined
}

export function flattenTasks(tasks: TaskNode[]): TaskNode[] {
	const result: TaskNode[] = []
	const walk = (node: TaskNode) => {
		result.push(node)
		node.subtasks.forEach(walk)
	}
	tasks.forEach(walk)
	return result
}
