# Leincode Skills Library

Leincode introduces a progressive disclosure skills system. Skills are folders that contain a `SKILL.md` file with YAML frontmatter plus optional resources.

## Authoring a Skill

Create a folder under your chosen skills root (workspace or user scope) and add `SKILL.md`:

```md
---
name: coding-review
description: Review code with deterministic checks
version: 1.0.0
tags:
    - code-review
    - testing
---

Body content describing the skill, linked resources, and deterministic scripts.
```

Supported frontmatter keys are `name`, `description`, `version`, `tags`, and `tool_requirements`. Additional keys are rejected during validation.

## Progressive Disclosure

- `buildSkillIndex` reads only the frontmatter for installed skills and exposes name, description, and tags.
- `loadSkill` loads the full body and any resources in the skill folder on demand.
- Skill packs can be built via `buildDefaultSkillPacks` to group skills such as coding, product management, and planning.

## Security

Resources are only loaded from within the skill directory; any path traversal attempts are rejected. Deterministic scripts should be executed via the extension's allowlisted tool wrappers.

## How to verify

Run parsing and progressive disclosure tests:

```bash
pnpm --filter kilo-code exec vitest run shared/__tests__/leincodeSkills.spec.ts
```
