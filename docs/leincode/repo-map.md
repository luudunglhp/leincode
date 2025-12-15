# Leincode Repo Map

This document summarizes the major areas of the Kilo/Leincode codebase and where to look when extending the platform.

## Build and Test Commands

- Install: `pnpm install`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Bundle extension (vsix): `pnpm vsix`

## Core Extension

- **Entry point**: `src/extension.ts` wires activation, telemetry, and service initialization.
- **Activation utilities**: `src/activate` registers commands, code actions, terminals, and URI handlers.
- **Configuration/persistence**: `src/core/config/ContextProxy.ts` wraps VS Code global state, secrets, and workspace settings; `src/services/settings-sync` mirrors settings across machines.
- **Shared logic**: `src/shared` holds mode definitions (`modes.ts`), language helpers, and common types.
- **Integrations**: `src/integrations` connects to editor views, terminals, and MCP marketplace tooling.

## Agent Logic and Tools

- **Core agent/webview bridge**: `src/core/webview` (including `ClineProvider`) handles prompt assembly and messaging between the extension host and React UI.
- **Execution helpers**: `src/services/command` for running shell commands, `src/services/browser` for browser automation, and `src/services/search` for repository search.
- **Indexing**: `src/services/code-index` manages source code indexing and diagnostics; `src/services/code-index/managed` adds cloud-managed flows.
- **Autonomy components**: `src/services/continuedev` and `src/services/kilocode` provide automation loops and session handling.

## UI Surfaces

- **Webview UI**: `webview-ui/` contains the React interface shown inside VS Code, with localization under `webview-ui/src/i18n` and mode/task views under `webview-ui/src/components`.
- **Docs site**: `apps/kilocode-docs` holds the documentation site source (Docusaurus) with feature guides and images.
- **Walkthrough content**: `src/walkthrough` contains onboarding Markdown surfaced by VS Code walkthroughs.

## CLI and Supporting Packages

- **CLI**: `cli/` implements the command-line experience, mode switching, and workspace bootstrap logic. Custom mode configuration helpers live under `cli/src/config`.
- **Type definitions**: `packages/types` exposes shared schemas for provider settings, modes, and telemetry payloads.
- **Build tooling**: `packages/build`, `packages/config-eslint`, and `packages/config-typescript` provide repo-wide build and lint configuration.
- **Telemetry**: `packages/telemetry` implements the telemetry service and event contracts.
- **IPC bridge**: `packages/ipc` contains shared IPC contracts for the extension/runtime boundary.

## Storage and Settings

- **User/workspace settings**: handled through VS Code configuration (`kiloCode.*` keys) with schema in `@roo-code/types` and migration utilities in `src/utils/migrateSettings.ts`.
- **Stateful artifacts**: global storage and secrets handled through `ContextProxy`; session/cli state under `src/shared/kilocode/cli-sessions`.
- **Index/cache data**: code-index caches stored under the extension storage folder via `src/services/code-index` utilities.

## Testing

- **Unit/integration tests**: primarily run with Vitest and live alongside source under `src/**/__tests__` and `webview-ui/src/**/__tests__`.
- **End-to-end**: playwright-based tests live under `webview-ui` and extension tests under `src/__tests__`.

## How to Verify

Run the repository lint and test suites to ensure the map aligns with the active code:

```bash
pnpm lint
pnpm test
```
