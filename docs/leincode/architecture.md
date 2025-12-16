# Leincode Architecture

This document defines the proposed Leincode architecture layered on top of the existing Kilo extension. It focuses on the new skills library, orchestration, custom mode generation, semantic code search, and hierarchical tasks.

## Component Diagram (Text)

- **Extension Host Layer** (`src/extension.ts`, `src/core/webview`): boots services, exposes commands, and bridges messages to the React webview.
- **Leincode Feature Gate** (`src/shared/leincode/featureFlags.ts`): central toggle for new capabilities to preserve Kilo defaults.
- **Skills Subsystem** (`packages/skills` planned): discovers SKILL.md metadata, validates frontmatter, and exposes progressive loaders to agents and modes.
- **Task & Planning Subsystem** (`packages/tasks` planned): provides task/subtask CRUD, dependency handling, and serialization shared between orchestration and UI.
- **Orchestration Subsystem** (`packages/orchestration` planned): manages teams with leader/member roles, dispatches work, merges outputs, and records transcripts/artifacts.
- **Mode Generator** (`packages/modes` planned): validates AgentModeSpec objects, renders templates, and registers new modes into workspace and UI settings.
- **Semantic Code Search** (`packages/code-search` planned): chunks code, stores embeddings locally, and exposes CLI + in-proc retrieval to agent strategies.
- **UI Surfaces** (`webview-ui`): settings panels to manage skills, teams, tasks, and generated modes; search panel to query embeddings.
- **Persistence**: VS Code global/workspace storage via `ContextProxy`, plus per-feature local stores (e.g., code index cache) rooted in the extension storage path.

## Data Models

- **Skill**: name, description, version, tags[], toolRequirements[], entryPaths[], resources. Backed by `SKILL.md` with YAML frontmatter.
- **SkillPack**: id, label, skills[], enabled (per workspace), defaultPolicy (tool allowlist/runtime caps).
- **Task/Subtask**: id, title, description, status, priority, owner, dueDate, tags[], dependsOn[], blocks[], children[].
- **Team**: id, goal, leader (TeamLeader), members (TeamMember[]), policies (tool allowlist, budget, constraints), activeTasks[].
- **TeamLeader**: agent id, modeSlug, strategy (planner/delegate/merger), verificationPlan, skills[].
- **AgentModeSpec**: name, slug, description, allowedTools[], readGlobs[], writeGlobs[], requiredSkills[], responseFormat?, verificationChecklistTemplate.
- **CodeIndex**: id, rootPath, chunks[{file, span, symbolHints, hash, embeddingTs, embeddingVector}], stats, version.

## Public Interfaces (TypeScript)

```ts
export interface Skill {
	name: string
	description: string
	version: string
	tags: string[]
	toolRequirements: string[]
	entryPaths: string[]
}

export interface SkillPack {
	id: string
	label: string
	skills: Skill[]
	enabled: boolean
	defaultPolicy?: {
		toolAllowlist?: string[]
		maxRuntimeMs?: number
	}
}

export interface TaskNode {
	id: string
	title: string
	description?: string
	status: "todo" | "in-progress" | "blocked" | "done"
	priority?: "low" | "medium" | "high"
	owner?: string
	dueDate?: string
	tags?: string[]
	dependsOn?: string[]
	blocks?: string[]
	children?: TaskNode[]
}

export interface Team {
	id: string
	goal: string
	leader: TeamLeader
	members: TeamMember[]
	policies?: {
		toolAllowlist?: string[]
		budgetTokens?: number
		constraints?: string[]
	}
	activeTasks?: TaskNode[]
}

export interface TeamLeader extends TeamMember {
	strategy: "planner" | "delegate" | "merge-first" | "verify-first"
	verificationPlan: string[]
}

export interface TeamMember {
	id: string
	displayName: string
	modeSlug: string
	skills?: string[]
}

export interface AgentModeSpec {
	name: string
	slug: string
	description: string
	allowedTools: string[]
	readGlobs?: string[]
	writeGlobs?: string[]
	requiredSkills?: string[]
	responseFormat?: "markdown" | "json" | "text"
	verificationChecklistTemplate?: string[]
}

export interface CodeIndex {
	id: string
	rootPath: string
	version: string
	chunks: Array<{
		file: string
		span: { start: number; end: number }
		symbolHints?: string[]
		hash: string
		embeddingTs: number
		embeddingVector: number[]
	}>
	stats?: Record<string, number>
}
```

## Feature Flags and Migration Plan

- **Flags**: `skills`, `tasks`, `orchestration`, `customModes`, `codeSearch`, `planningUX` defined in `src/shared/leincode/featureFlags.ts`.
- **Defaults**: all flags default to `false` to preserve baseline Kilo behavior.
- **Enablement**: opt-in via environment variables (e.g., `LEINCODE_FEATURES=skills,tasks`) or explicit overrides passed to the flag service.
- **Migration**: new code paths must check the flag service before altering existing flows. Once stability is proven, flags can graduate to settings-driven defaults.

## Security Model

- **Tool Execution**: constrain skill-associated scripts to allowlisted commands and timeouts; reuse existing command runner guards in `src/services/command` and browser sandboxing in `src/services/browser`.
- **Storage**: keep embeddings, task data, and skill caches inside the VS Code storage directory to avoid leaking workspace contents; use hashed identifiers when persisting cross-session indexes.
- **Isolation**: custom modes and generated agents inherit file-scope read/write globs; orchestration delegates must respect per-member tool allowlists.
- **Telemetry**: new events should route through `packages/telemetry` with opt-in respects existing privacy controls.

## How to Verify

Use the feature flag unit tests to validate the architecture scaffolding and guardrails:

```bash
pnpm --filter kilo-code exec vitest run src/shared/__tests__/leincodeFeatureFlags.spec.ts
```
