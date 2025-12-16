import { describe, expect, it } from "vitest"

import {
	DEFAULT_LEINCODE_FEATURE_FLAGS,
	LeincodeFeatureFlagService,
	resolveLeincodeFeatureFlags,
} from "../leincode/featureFlags"

describe("resolveLeincodeFeatureFlags", () => {
	it("defaults to all flags disabled", () => {
		const flags = resolveLeincodeFeatureFlags({ env: {} })

		expect(flags).toEqual(DEFAULT_LEINCODE_FEATURE_FLAGS)
	})

	it("enables flags from LEINCODE_FEATURES list", () => {
		const flags = resolveLeincodeFeatureFlags({ env: { LEINCODE_FEATURES: "skills,tasks" } })

		expect(flags.skills).toBe(true)
		expect(flags.tasks).toBe(true)
		expect(flags.codeSearch).toBe(false)
	})

	it("applies per-flag environment variables", () => {
		const flags = resolveLeincodeFeatureFlags({
			env: {
				LEINCODE_FEATURE_SKILLS: "true",
				LEINCODE_FEATURE_CODESEARCH: "yes",
			},
		})

		expect(flags.skills).toBe(true)
		expect(flags.codeSearch).toBe(true)
	})

	it("applies config overrides after environment", () => {
		const flags = resolveLeincodeFeatureFlags({
			env: { LEINCODE_FEATURES: "skills,tasks" },
			configFlags: { tasks: false, codeSearch: true },
		})

		expect(flags.skills).toBe(true)
		expect(flags.tasks).toBe(false)
		expect(flags.codeSearch).toBe(true)
	})

	it("overrides everything with explicit overrides", () => {
		const flags = resolveLeincodeFeatureFlags({
			env: { LEINCODE_FEATURES: "skills" },
			overrides: { skills: false, orchestration: true },
		})

		expect(flags.skills).toBe(false)
		expect(flags.orchestration).toBe(true)
	})
})

describe("LeincodeFeatureFlagService", () => {
	it("exposes isEnabled and toJSON helpers", () => {
		const service = new LeincodeFeatureFlagService({ env: { LEINCODE_FEATURE_PLANNINGUX: "1" } })

		expect(service.isEnabled("planningUX")).toBe(true)
		expect(service.toJSON().planningUX).toBe(true)
	})
})
