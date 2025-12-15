import { z } from "zod"

export const AgentModeSpecSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	allowedTools: z.array(z.string()).default([]),
	fileScopes: z.array(z.string()).default(["**/*"]),
	requiredSkills: z.array(z.string()).default([]),
	responseFormat: z.enum(["markdown", "json", "text"]).default("markdown"),
	verificationChecklist: z.array(z.string()).default([]),
})

export type AgentModeSpec = z.infer<typeof AgentModeSpecSchema>

export interface ModeRegistration {
	id: string
	spec: AgentModeSpec
	template?: string
}

export const MODE_TEMPLATES: Record<string, Partial<AgentModeSpec>> = {
	"Test Engineer": {
		description: "Focus on testing and coverage",
		allowedTools: ["terminal"],
		requiredSkills: ["testing"],
		verificationChecklist: ["Add unit tests", "Update snapshots"],
	},
	"Documentation Writer": {
		description: "Produces docs with verification steps",
		allowedTools: ["terminal"],
		requiredSkills: ["documentation"],
	},
	"PM Planner": {
		description: "Creates product plans and roadmaps",
		allowedTools: ["browser"],
		requiredSkills: ["product-management"],
	},
	"Codebase Navigator": {
		description: "Uses semantic search to find code",
		allowedTools: ["semantic-search", "terminal"],
		requiredSkills: ["code-search"],
	},
}

export class ModeRegistry {
	private modes: ModeRegistration[] = []

	register(spec: AgentModeSpec, template?: string): ModeRegistration {
		const parsed = AgentModeSpecSchema.parse(spec)
		const id = `${parsed.name.toLowerCase().replace(/\s+/g, "-")}`
		const registration = { id, spec: parsed, template }
		this.modes.push(registration)
		return registration
	}

	list(): ModeRegistration[] {
		return [...this.modes]
	}
}

export function generateModeFromTemplate(name: keyof typeof MODE_TEMPLATES): AgentModeSpec {
	const template = MODE_TEMPLATES[name]
	const merged = {
		name,
		description: template.description || name,
		allowedTools: template.allowedTools || [],
		fileScopes: ["**/*"],
		requiredSkills: template.requiredSkills || [],
		responseFormat: "markdown",
		verificationChecklist: template.verificationChecklist || ["Run verification"],
	} satisfies AgentModeSpec
	return AgentModeSpecSchema.parse(merged)
}

export function generateCustomMode(spec: AgentModeSpec, examples?: string[]): AgentModeSpec {
	const parsed = AgentModeSpecSchema.parse(spec)
	if (examples && examples.length) {
		parsed.verificationChecklist = [...parsed.verificationChecklist, `Examples: ${examples.length}`]
	}
	return parsed
}
