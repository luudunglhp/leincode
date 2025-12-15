import os from "os"
import path from "path"
import fs from "fs"
import { buildSkillIndex, loadSkill } from "../src/shared/leincode/skills"
import { TaskStore } from "../src/shared/leincode/tasks"
import { TeamRunner } from "../src/shared/leincode/orchestration"
import { generateModeFromTemplate, ModeRegistry } from "../src/shared/leincode/modeGeneration"
import { buildIndex, semanticSearch } from "../src/shared/leincode/codeSearch"

function main() {
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leincode-demo-"))

	// Skills
	const skillRoot = path.join(temp, "skills", "coding")
	fs.mkdirSync(skillRoot, { recursive: true })
	const skillPath = path.join(skillRoot, "SKILL.md")
	fs.writeFileSync(skillPath, `---\nname: demo-skill\ndescription: demo\ntags:\n - code-review\n---\nBody`)
	const index = buildSkillIndex([path.dirname(skillRoot)])
	const skill = loadSkill(skillPath)

	// Tasks + team
	const store = new TaskStore(path.join(temp, "tasks.json"))
	const runner = new TeamRunner(store)
	const result = runner.runTeam(
		{
			id: "demo-team",
			goal: "demo",
			leader: { id: "l", name: "Lead", mode: "leader" },
			members: [{ id: "m", name: "Member", mode: "coder" }],
		},
		{ goal: "Write docs. Add tests." },
	)

	// Mode generation
	const registry = new ModeRegistry()
	const mode = generateModeFromTemplate("Codebase Navigator")
	registry.register(mode, "Codebase Navigator")

	// Code index
	const file = path.join(temp, "code.ts")
	fs.writeFileSync(file, "export const value = 42;\nexport function get(){return value;}")
	const codeIndex = buildIndex(temp, [file])
	const search = semanticSearch(codeIndex, "get value")

	console.log(
		JSON.stringify({
			skills: index.length,
			skillBody: skill.body.length,
			tasks: result.tasks.length,
			mode: registry.list()[0].id,
			searchTop: search[0]?.file,
		}),
	)
}

main()
