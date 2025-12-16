# Building the Leincode VSIX

Use this guide to build a ready-to-install VS Code extension package for Leincode without mixing the artifact into the source tree.

## Steps

1. Ensure dependencies are installed: `pnpm install`
2. Clean any previous bundles: `pnpm --filter kilo-code exec pnpm run vsix:clean`
3. Build the VSIX: `pnpm vsix`
    - The build runs from the `src` workspace and writes the package to `bin/kilo-code-<version>.vsix`.
4. Copy or move the VSIX to a separate location (for example `releases/`) if you want it isolated from the repository checkout.

## Notes

- The output file is ignored by Git via `*.vsix` so it will not be committed accidentally.
- To inspect the contents without installing, use `pnpm --filter kilo-code exec pnpm run vsix:unpacked` to unzip into `bin-unpacked/`.
- Installation from the command line: `code --install-extension bin/kilo-code-<version>.vsix`.

## How to verify

Rebuild the VSIX after any changes and confirm the expected file is generated:

```bash
pnpm vsix
ls bin/*.vsix
```
