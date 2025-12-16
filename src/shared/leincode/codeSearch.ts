import fs from "fs"
import path from "path"

export interface CodeChunk {
	file: string
	startLine: number
	endLine: number
	content: string
	embedding: number[]
}

export interface CodeIndex {
	root: string
	chunks: CodeChunk[]
	hash: string
}

export interface SearchResult extends CodeChunk {
	score: number
}

const VECTOR_SIZE = 12

function hashContent(content: string): string {
	let hash = 0
	for (let i = 0; i < content.length; i += 1) {
		hash = (hash * 31 + content.charCodeAt(i)) % 1_000_000_007
	}
	return hash.toString(16)
}

export function embed(text: string): number[] {
	const vec = new Array<number>(VECTOR_SIZE).fill(0)
	text.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean)
		.forEach((token) => {
			const bucket = Math.abs(hashContent(token).charCodeAt(0)) % VECTOR_SIZE
			vec[bucket] += 1
		})
	return vec
}

function cosine(a: number[], b: number[]): number {
	let dot = 0
	let magA = 0
	let magB = 0
	for (let i = 0; i < a.length; i += 1) {
		dot += a[i] * b[i]
		magA += a[i] * a[i]
		magB += b[i] * b[i]
	}
	if (!magA || !magB) return 0
	return dot / Math.sqrt(magA * magB)
}

function chunkFile(filePath: string, size = 20): CodeChunk[] {
	const content = fs.readFileSync(filePath, "utf8")
	const lines = content.split(/\r?\n/)
	const chunks: CodeChunk[] = []
	for (let i = 0; i < lines.length; i += size) {
		const slice = lines.slice(i, i + size)
		const chunkContent = slice.join("\n")
		chunks.push({
			file: filePath,
			startLine: i + 1,
			endLine: Math.min(i + size, lines.length),
			content: chunkContent,
			embedding: embed(chunkContent),
		})
	}
	return chunks
}

function shouldIndex(file: string): boolean {
	return !/node_modules|\.git|dist/.test(file) && fs.statSync(file).isFile()
}

export function buildIndex(root: string, files: string[]): CodeIndex {
	const chunks: CodeChunk[] = []
	files
		.map((file) => path.resolve(root, file))
		.filter((file) => shouldIndex(file))
		.forEach((file) => {
			chunks.push(...chunkFile(file))
		})
	const hash = hashContent(chunks.map((c) => c.content).join("|"))
	return { root, chunks, hash }
}

export function updateIndex(existing: CodeIndex, files: string[]): CodeIndex {
	const remaining = existing.chunks.filter(
		(chunk) => !files.some((file) => path.resolve(existing.root, file) === chunk.file),
	)
	const additions = buildIndex(existing.root, files).chunks
	return {
		root: existing.root,
		chunks: [...remaining, ...additions],
		hash: hashContent([...remaining, ...additions].map((c) => c.content).join("|")),
	}
}

export function semanticSearch(index: CodeIndex, query: string, topK = 3): SearchResult[] {
	const queryVec = embed(query)
	return index.chunks
		.map((chunk) => ({ ...chunk, score: cosine(queryVec, chunk.embedding) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, topK)
}

export function saveIndex(index: CodeIndex, filePath: string) {
	fs.writeFileSync(filePath, JSON.stringify(index, null, 2))
}

export function loadIndex(filePath: string): CodeIndex {
	const content = fs.readFileSync(filePath, "utf8")
	return JSON.parse(content) as CodeIndex
}
