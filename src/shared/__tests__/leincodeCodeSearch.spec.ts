import fs from "fs"
import os from "os"
import path from "path"
import { describe, expect, it } from "vitest"
import { buildIndex, semanticSearch, updateIndex } from "../leincode/codeSearch"

describe("code search", () => {
	const root = path.join(os.tmpdir(), "code-search")
	const file = path.join(root, "file.ts")

	it("chunks and searches deterministically", () => {
		fs.rmSync(root, { recursive: true, force: true })
		fs.mkdirSync(root, { recursive: true })
		fs.writeFileSync(file, "function add(a,b){return a+b;}\nfunction sub(a,b){return a-b;}")
		const index = buildIndex(root, [file])
		const result = semanticSearch(index, "add numbers")[0]
		expect(result.file).toContain("file.ts")
		expect(result.startLine).toBe(1)
	})

	it("updates index when files change", () => {
		fs.writeFileSync(file, "const value = 1;\nconst other = value + 2;")
		const first = buildIndex(root, [file])
		fs.writeFileSync(file, "const value = 2;\nconst other = value + 3;")
		const updated = updateIndex(first, [file])
		expect(updated.hash).not.toBe(first.hash)
	})
})
