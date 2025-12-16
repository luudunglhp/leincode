import { logger } from "../../utils/logging"

export type LeincodeFeatureKey = "skills" | "tasks" | "orchestration" | "customModes" | "codeSearch" | "planningUX"

export interface LeincodeFeatureFlags {
	skills: boolean
	tasks: boolean
	orchestration: boolean
	customModes: boolean
	codeSearch: boolean
	planningUX: boolean
}

export const DEFAULT_LEINCODE_FEATURE_FLAGS: LeincodeFeatureFlags = {
	skills: false,
	tasks: false,
	orchestration: false,
	customModes: false,
	codeSearch: false,
	planningUX: false,
}

const normalizeBoolean = (value: string | boolean | undefined) => {
	if (value === undefined) {
		return undefined
	}

	if (typeof value === "boolean") {
		return value
	}

	const normalized = value.trim().toLowerCase()
	return ["1", "true", "yes", "on"].includes(normalized)
}

const parseFeatureList = (value: string | undefined): Partial<LeincodeFeatureFlags> => {
	if (!value) {
		return {}
	}

	const entries = value
		.split(",")
		.map((flag) => flag.trim())
		.filter(Boolean) as LeincodeFeatureKey[]

	return entries.reduce<Partial<LeincodeFeatureFlags>>((acc, key) => {
		acc[key] = true
		return acc
	}, {})
}

const applyExplicitFlag = (
	env: NodeJS.ProcessEnv,
	key: LeincodeFeatureKey,
	accumulator: Partial<LeincodeFeatureFlags>,
) => {
	const envKey = `LEINCODE_FEATURE_${key.toUpperCase()}`
	const value = normalizeBoolean(env[envKey])

	if (value !== undefined) {
		accumulator[key] = value
	}
}

export interface ResolveFeatureFlagOptions {
	env?: NodeJS.ProcessEnv
	configFlags?: Partial<LeincodeFeatureFlags>
	overrides?: Partial<LeincodeFeatureFlags>
}

/**
 * Resolve Leincode feature flags from defaults, environment variables, and explicit overrides.
 * Environment variables take the form of `LEINCODE_FEATURES=skills,tasks` or per-flag toggles
 * like `LEINCODE_FEATURE_SKILLS=true`.
 */
export const resolveLeincodeFeatureFlags = (options: ResolveFeatureFlagOptions = {}): LeincodeFeatureFlags => {
	const env = options.env ?? process.env

	const flags: Partial<LeincodeFeatureFlags> = {
		...DEFAULT_LEINCODE_FEATURE_FLAGS,
	}

	Object.assign(flags, parseFeatureList(env.LEINCODE_FEATURES))

	for (const key of Object.keys(DEFAULT_LEINCODE_FEATURE_FLAGS) as LeincodeFeatureKey[]) {
		applyExplicitFlag(env, key, flags)
	}

	if (options.configFlags) {
		Object.assign(flags, options.configFlags)
	}

	if (options.overrides) {
		Object.assign(flags, options.overrides)
	}

	const resolved = flags as LeincodeFeatureFlags
	logger.debug?.(`Leincode feature flags resolved: ${JSON.stringify(resolved)}`)

	return resolved
}

export class LeincodeFeatureFlagService {
	private flags: LeincodeFeatureFlags

	constructor(options?: ResolveFeatureFlagOptions) {
		this.flags = resolveLeincodeFeatureFlags(options)
	}

	public isEnabled(key: LeincodeFeatureKey) {
		return this.flags[key]
	}

	public toJSON(): LeincodeFeatureFlags {
		return { ...this.flags }
	}
}
