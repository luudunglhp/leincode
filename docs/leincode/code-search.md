# Leincode Code Search

Leincode ships a lightweight semantic code indexer and retriever for embedding-aware navigation.

## Indexing

`buildIndex(root, files)` chunk files into line-based spans and stores a hashed embedding per chunk. Use `updateIndex` to incrementally refresh modified files and `saveIndex`/`loadIndex` to persist the index locally.

## Retrieval

`semanticSearch(index, query, topK)` returns the best-matching snippets with start/end lines and a similarity score. The embedding function is deterministic and stable across runs.

## CLI

A minimal demo script exercises the end-to-end workflow:

```bash
pnpm leincode:e2e
```

## How to verify

Run unit coverage for chunking and incremental updates:

```bash
pnpm --filter kilo-code exec vitest run shared/__tests__/leincodeCodeSearch.spec.ts
```
