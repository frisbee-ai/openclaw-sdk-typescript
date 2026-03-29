# Technology Stack

**Analysis Date:** 2026-03-29

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code, tests, and examples

**Secondary:**
- JavaScript - Build output (ESM + CJS dual compilation)

## Runtime

**Environment:**
- Node.js >=22.0.0 (required)

**Package Manager:**
- npm (with `package-lock.json` for reproducible installs)
- Lockfile: `package-lock.json` (present, committed)

## Frameworks

**Core:**
- None (pure TypeScript library, no framework dependency)

**Testing:**
- Vitest 4.1.1 - Unit and integration test runner
- @vitest/coverage-v8 4.1.1 - Coverage reporting via V8 inspector

**Build/Dev:**
- TypeScript 5.9.3 - Compilation (tsc), dual output (ESM + CJS)
- esbuild 0.27.4 - Bundler for build tooling
- TypeDoc 0.28.18 - API documentation generation
- typedoc-plugin-markdown 4.11.0 - Markdown output for TypeDoc

**Code Quality:**
- ESLint 10.1.0 - Linting
- @typescript-eslint/eslint-plugin 8.57.1 - TypeScript ESLint rules
- @typescript-eslint/parser 8.57.2 - TypeScript parser for ESLint
- Prettier 3.8.1 - Code formatting
- madge 8.0.0 - Circular dependency detection

**Git Hooks:**
- Husky 9.1.7 - Git hooks (pre-commit via `prepare` script)
- lint-staged 16.4.0 - Run linters on staged files

**Changelog:**
- git-cliff - Conventional commit changelog generation

## Key Dependencies

**Critical (Production):**
- `ws` 8.20.0 - WebSocket client library (only runtime dependency)
  - Used in `src/transport/node.ts` via `import { WebSocket as WS } from 'ws'`
  - Also used as fallback in `src/transport/websocket.ts` via `require('ws')`

**Type Definitions (Dev):**
- `@types/node` 24.12.0 - Node.js type definitions
- `@types/ws` 8.18.1 - WebSocket type definitions

## Configuration

**TypeScript:**
- `tsconfig.json` - ESM build config (target ES2020, module ESNext, bundler resolution)
- `tsconfig.cjs.json` - CJS build config (CommonJS output)
- `tsconfig.examples.json` - Type checking for example files

**Build Output:**
- ESM: `dist/esm/` (TypeScript with `module: ESNext`, declarations)
- CJS: `dist/cjs/` (TypeScript with `module: CommonJS`, no declarations)
- Browser: `dist/browser/` (entry at `openclaw/browser`)

**ESLint:**
- `eslint.config.js` - Flat config with TypeScript support
- Separate configs for: test files, source files, example files
- Vitest globals declared (describe, it, expect, vi, etc.)
- Browser + Node.js globals declared per config

**Prettier:**
- `.prettierrc` - Semi-colons, single quotes, 2-space tabs, trailing commas (es5), 100 char print width

**TypeDoc:**
- `typedoc.json` - Generates API docs in `docs/api/` from `src/index.ts`

**git-cliff:**
- `cliff.toml` - Conventional commits parsing for changelog generation

## Path Aliases

**In tsconfig.json:**
```json
{
  "paths": {
    "openclaw/protocol": ["./node_modules/openclaw/dist/plugin-sdk/gateway/protocol/index"]
  }
}
```
- References the `openclaw` npm package's plugin SDK protocol types

## Platform Requirements

**Development:**
- Node.js >=22.0.0
- npm for dependency management

**Production:**
- Node.js >=22.0.0 (for CJS/ESM consumption)
- Browser environments (for `openclaw/browser` entry point)
- No native dependencies required (pure JavaScript runtime)

---

*Stack analysis: 2026-03-29*
