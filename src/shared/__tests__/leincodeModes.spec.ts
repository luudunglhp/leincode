import { describe, expect, it } from "vitest"
import { AgentModeSpecSchema, generateModeFromTemplate, ModeRegistry } from "../leincode/modeGeneration"

describe("mode generation", () => {
	it("validates schema", () => {
		const parsed = AgentModeSpecSchema.parse({
			name: "Custom",
			description: "desc",
			allowedTools: [],
			fileScopes: ["src/**/*"],
			requiredSkills: [],
			responseFormat: "markdown",
			verificationChecklist: [],
		})
		expect(parsed.name).toBe("Custom")
	})

	it("registers template-derived mode", () => {
		const registry = new ModeRegistry()
		const spec = generateModeFromTemplate("Test Engineer")
		const registration = registry.register(spec, "Test Engineer")
		expect(registration.id).toContain("test-engineer")
		expect(registry.list()).toHaveLength(1)
	})
})
