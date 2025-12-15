import fs from "fs"
import path from "path"
import matter from "gray-matter"

export type SkillFrontmatter = {
	name: string
	description: string
	version?: string
	tags?: string[]
	tool_requirements?: string[]
}

export type SkillMetadata = SkillFrontmatter & {
	skillPath: string
}

export type Skill = SkillMetadata & {
	body: string
	resources: Record<string, string>
}

export class SkillValidationError extends Error {}

const FRONTMATTER_KEYS = ["name", "description", "version", "tags", "tool_requirements"]

function isValidFrontmatter(value: unknown): value is SkillFrontmatter {
	if (!value || typeof value !== "object") {
		return false
	}
	const data = value as Record<string, unknown>
	return typeof data.name === "string" && typeof data.description === "string"
}

export function discoverSkillManifests(skillRoots: string[]): string[] {
	const manifests: string[] = []
	skillRoots.forEach((root) => {
		if (!fs.existsSync(root)) return
		const entries = fs.readdirSync(root, { withFileTypes: true })
		entries.forEach((entry) => {
			if (!entry.isDirectory()) return
			const manifestPath = path.join(root, entry.name, "SKILL.md")
			if (fs.existsSync(manifestPath)) {
				manifests.push(manifestPath)
			}
		})
	})
	return manifests
}

export function parseSkillMetadata(manifestPath: string): SkillMetadata {
	const stat = fs.statSync(manifestPath)
	if (!stat.isFile()) {
		throw new SkillValidationError(`Manifest is not a file: ${manifestPath}`)
	}
	const file = fs.readFileSync(manifestPath, "utf8")
	const parsed = matter(file)
	if (!isValidFrontmatter(parsed.data)) {
		throw new SkillValidationError(`Invalid frontmatter in ${manifestPath}`)
	}
	const extraKeys = Object.keys(parsed.data).filter((key) => !FRONTMATTER_KEYS.includes(key))
	if (extraKeys.length) {
		throw new SkillValidationError(`Unsupported keys in ${manifestPath}: ${extraKeys.join(",")}`)
	}
	const skillDir = path.dirname(manifestPath)
	const skillPath = path.resolve(skillDir)
	return {
		...(parsed.data as SkillFrontmatter),
		skillPath,
	}
}

export function loadSkill(manifestPath: string): Skill {
	const metadata = parseSkillMetadata(manifestPath)
	const file = fs.readFileSync(manifestPath, "utf8")
	const parsed = matter(file)
	const resources: Record<string, string> = {}
	const files = fs.readdirSync(metadata.skillPath)
	files
		.filter((fileName) => fileName !== "SKILL.md")
		.forEach((fileName) => {
			const resourcePath = path.join(metadata.skillPath, fileName)
			const resolved = path.resolve(resourcePath)
			if (!resolved.startsWith(metadata.skillPath)) {
				throw new SkillValidationError(`Resource escapes skill directory: ${resourcePath}`)
			}
			if (fs.statSync(resourcePath).isFile()) {
				resources[fileName] = fs.readFileSync(resourcePath, "utf8")
			}
		})
	return {
		...metadata,
		body: parsed.content.trim(),
		resources,
	}
}

export function buildSkillIndex(skillRoots: string[]): SkillMetadata[] {
	return discoverSkillManifests(skillRoots).map(parseSkillMetadata)
}

export type SkillPackConfig = {
	id: string
	name: string
	skills: SkillMetadata[]
	enabled: boolean
}

export function buildDefaultSkillPacks(skillRoots: string[]): SkillPackConfig[] {
	const metadata = buildSkillIndex(skillRoots)
	const packs = [
		{ id: "coding", name: "Coding", tags: ["code-review", "refactor", "testing"] },
		{ id: "product-management", name: "Product Management", tags: ["PRD", "roadmap", "stories"] },
		{ id: "planning", name: "Planning", tags: ["work-breakdown", "estimation", "risk"] },
	]
	return packs.map((pack) => ({
		id: pack.id,
		name: pack.name,
		enabled: true,
		skills: metadata.filter((skill) => (skill.tags || []).some((tag) => pack.tags.includes(tag))),
	}))
}

export function listSkillUsage(metadata: SkillMetadata[], usedSkillNames: string[]): SkillMetadata[] {
	const names = new Set(usedSkillNames)
	return metadata.filter((skill) => names.has(skill.name))
}
