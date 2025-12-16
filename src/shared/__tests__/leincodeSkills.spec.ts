import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it } from "vitest"
import { buildSkillIndex, loadSkill, SkillValidationError } from "../leincode/skills"

afterEach(() => {
	fs.rmSync(path.join(os.tmpdir(), "skills-test"), { recursive: true, force: true })
})

describe("skills", () => {
	it("loads metadata without full body until requested", () => {
		const root = path.join(os.tmpdir(), "skills-test", "packs")
		fs.mkdirSync(path.join(root, "coding"), { recursive: true })
		fs.writeFileSync(
			path.join(root, "coding", "SKILL.md"),
			`---\nname: coding-review\ndescription: review code\ntags:\n - code-review\n---\nDetailed guidance here.`,
		)

		const index = buildSkillIndex([root])
		expect(index[0]).toMatchObject({ name: "coding-review", description: "review code" })
		expect((index as any)[0].body).toBeUndefined()

		const skill = loadSkill(path.join(root, "coding", "SKILL.md"))
		expect(skill.body).toContain("Detailed guidance")
	})

	it("rejects unknown frontmatter keys", () => {
		const root = path.join(os.tmpdir(), "skills-test", "bad")
		fs.mkdirSync(root, { recursive: true })
		const manifest = path.join(root, "SKILL.md")
		fs.writeFileSync(manifest, `---\nname: bad\ndescription: nope\nextra: true\n---`)

		expect(() => loadSkill(manifest)).toThrow(SkillValidationError)
	})
})
