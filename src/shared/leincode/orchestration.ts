import { randomUUID } from "crypto"
import { flattenTasks, TaskNode, TaskStore } from "./tasks"

export interface TeamMember {
	id: string
	name: string
	mode: string
	skills?: string[]
}

export interface TeamSpec {
	id: string
	goal: string
	leader: TeamMember
	members: TeamMember[]
	policies?: {
		toolAllowlist?: string[]
		budget?: number
		constraints?: string[]
	}
}

export interface TaskSpec {
	goal: string
	owner?: string
}

export interface TeamRunResult {
	tasks: TaskNode[]
	mergedChanges: Change[]
	transcripts: string[]
	artifacts: string[]
}

export interface Change {
	file: string
	start: number
	end: number
	content: string
}

export class TeamRunner {
	constructor(private taskStore: TaskStore) {}

	runTeam(team: TeamSpec, taskSpec: TaskSpec): TeamRunResult {
		const leaderPlan = this.plan(team, taskSpec)
		const mergedChanges = mergeChanges(leaderPlan.proposedChanges)
		const transcripts = leaderPlan.logs
		this.taskStore.save(leaderPlan.tasks)
		return {
			tasks: leaderPlan.tasks,
			mergedChanges,
			transcripts,
			artifacts: leaderPlan.artifacts,
		}
	}

	private plan(team: TeamSpec, taskSpec: TaskSpec) {
		const sentences = taskSpec.goal
			.split(/\.|\n/)
			.map((s) => s.trim())
			.filter(Boolean)
		const tasks: TaskNode[] = sentences.map((sentence, index) => ({
			id: randomUUID(),
			title: sentence,
			description: sentence,
			status: "todo",
			owner: team.members[index % team.members.length]?.name ?? team.leader.name,
			subtasks: [],
		}))
		const logs = tasks.map((task) => `${team.leader.name} delegated '${task.title}' to ${task.owner}`)
		const artifacts = tasks.map((task) => `plan-${task.id}`)
		const proposedChanges: Change[] = tasks.map((task, idx) => ({
			file: `plan-${team.id}.md`,
			start: idx * 10,
			end: idx * 10 + 5,
			content: `- [ ] ${task.title} (${task.owner})`,
		}))
		const tree = tasks.map((task) => ({ ...task, subtasks: [] }))
		return { tasks: tree, logs, artifacts, proposedChanges }
	}
}

export function mergeChanges(changes: Change[]): Change[] {
	const sorted = [...changes].sort((a, b) => (a.file === b.file ? a.start - b.start : a.file.localeCompare(b.file)))
	const result: Change[] = []
	const byFile = new Map<string, Change[]>()
	sorted.forEach((change) => {
		const list = byFile.get(change.file) || []
		list.push(change)
		byFile.set(change.file, list)
	})

	byFile.forEach((fileChanges, file) => {
		let lastEnd = -1
		fileChanges.forEach((change) => {
			if (change.start < lastEnd) {
				throw new Error(`Overlapping change detected in ${file}`)
			}
			result.push(change)
			lastEnd = change.end
		})
	})
	return result
}

export function verifyExecutionOrder(tasks: TaskNode[]): string[] {
	const flat = flattenTasks(tasks)
	return flat.map((task) => `${task.title}:${task.status}`)
}
