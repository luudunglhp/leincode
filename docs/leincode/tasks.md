# Leincode Tasks and Subtasks

Tasks support nested subtasks, dependency links, and status tracking. The `TaskStore` persists trees to disk so orchestration leaders can emit plans that downstream workflows can update.

## Data Model

Each `TaskNode` includes:

- `id`, `title`, optional `description`
- `status` (`todo`, `in-progress`, `blocked`, `done`)
- `priority`, `owner`, `dueDate`, `tags`
- `dependsOn`, `blocks`, `related`
- `subtasks` (recursive)

## Usage

```ts
import { TaskStore } from "src/shared/leincode/tasks"
const store = new TaskStore(".kilocode/tasks.json")
const task = store.addTask({ title: "Ship feature" })
store.addSubtask(task.id, { title: "Write tests" })
store.updateStatus(task.id, "in-progress")
```

`detectDependencyCycles` can be used to prevent introducing dependency loops before persisting a plan.

## How to verify

Run nested operations and dependency tests:

```bash
pnpm --filter kilo-code exec vitest run shared/__tests__/leincodeTasks.spec.ts
```
