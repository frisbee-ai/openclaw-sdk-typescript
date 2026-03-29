---
phase: 02-code-health
plan: "02"
subsystem: api
tags: [typescript, refactoring, types, api]

# Dependency graph
requires:
  - phase: 01-critical-reliability
    provides: tick monitor, gap detector, reconnect with auth
provides:
  - Per-domain type files in src/protocol/params/
  - Co-located types next to their API classes
affects:
  - Phase 03 (bug fixes)
  - Phase 04 (transport consolidation)
  - Phase 05 (hardening)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Per-domain type organization (co-location with API classes)
    - Shared types in api-common.ts, cross-file type references via imports

key-files:
  created:
    - src/protocol/params/chat.ts
    - src/protocol/params/agents.ts
    - src/protocol/params/sessions.ts
    - src/protocol/params/config.ts
    - src/protocol/params/cron.ts
    - src/protocol/params/nodes.ts
    - src/protocol/params/skills.ts
    - src/protocol/params/devicePairing.ts
    - src/protocol/params/browser.ts
    - src/protocol/params/push.ts
    - src/protocol/params/execApprovals.ts
    - src/protocol/params/system.ts
    - src/protocol/params/channels.ts
    - src/protocol/params/secrets.ts
    - src/protocol/params/usage.ts
    - src/protocol/params/index.ts
  modified:
    - src/api/chat.ts, agents.ts, sessions.ts, config.ts, cron.ts, nodes.ts, skills.ts, devicePairing.ts, browser.ts, push.ts, execApprovals.ts, system.ts, channels.ts, secrets.ts, usage.ts
    - src/index.ts (re-exports updated)
    - src/protocol/index.ts (barrel updated)

key-decisions:
  - "Types co-located next to their API classes (D-04)"
  - "Shared types stay in api-common.ts - AgentSummary, WizardStep, CronJob, etc. (D-05)"
  - "api-params.ts deleted after migration (D-06)"
  - "NodePair* types defined in nodes.ts, imported by agents.ts for pairing sub-namespace"
  - "Wizard* types in config.ts, also imported by system.ts for wizard methods"
  - "ToolsEffectiveParams defined in config.ts, imported by skills.ts to avoid duplication"

requirements-completed: [REF-02]

# Metrics
duration: 13min
completed: 2026-03-29
---

# Phase 02 Plan 02: Split api-params.ts into Per-Domain Files Summary

**Split 809-line api-params.ts into 15 focused domain type files, co-located next to their API classes**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-29T16:47:28Z
- **Completed:** 2026-03-29T17:00:19Z
- **Tasks:** 3
- **Files modified:** 34 (15 new, 16 modified, 1 deleted)

## Accomplishments
- Split 809-line api-params.ts into 15 domain-specific type files under src/protocol/params/
- Each API class now imports types from its co-located params file
- Shared types (AgentSummary, WizardStep, CronJob, etc.) remain in api-common.ts
- src/protocol/api-params.ts deleted
- All 872 tests pass with strict TypeScript

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 15 type files in src/protocol/params/** - `041e73e` (refactor)
2. **Task 2: Update API files to import from co-located params** - `041e73e` (refactor)
3. **Task 3: Update index.ts re-exports and delete api-params.ts** - `041e73e` (refactor)

**Plan metadata:** `041e73e` (docs: complete plan)

## Decisions Made

- Types co-located next to their API classes (D-04)
- Shared types stay in api-common.ts - AgentSummary, WizardStep, CronJob, etc. (D-05)
- api-params.ts deleted after migration (D-06)
- NodePair* types defined in nodes.ts, imported by agents.ts for pairing sub-namespace
- Wizard* types in config.ts, also imported by system.ts for wizard methods
- ToolsEffectiveParams defined in config.ts, imported by skills.ts to avoid duplication

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Added cross-file type references**
- **Found during:** Task 2 (updating API imports)
- **Issue:** TypeScript type sharing across params files required cross-imports (NodePair* in nodes.ts, Wizard* in config.ts, Usage* in usage.ts)
- **Fix:** API files import from correct params files; params/index.ts uses selective re-exports to avoid duplicates
- **Files modified:** src/api/system.ts, src/api/agents.ts, src/protocol/params/index.ts
- **Verification:** npm run typecheck passes, 872 tests pass
- **Committed in:** 041e73e (part of task commit)

**2. [Rule 2 - Missing Critical] Fixed params/index.ts duplicate exports**
- **Found during:** Task 3 (index re-exports)
- **Issue:** ToolsEffectiveParams exported from both config.ts and skills.ts; NodePair* exported from both nodes.ts and agents.ts; params/index.ts had conflicts
- **Fix:** Used selective re-exports in params/index.ts; NodePair* only from nodes.js; ToolsEffectiveParams only from config.js
- **Files modified:** src/protocol/params/index.ts, src/api/agents.ts
- **Verification:** npm run typecheck passes
- **Committed in:** 041e73e

**3. [Rule 3 - Blocking] Fixed src/protocol/index.ts api-params reference**
- **Found during:** Task 3 (post-deletion verification)
- **Issue:** src/protocol/index.ts still referenced deleted api-params.js
- **Fix:** Changed export to point to ./params/index.js
- **Files modified:** src/protocol/index.ts
- **Verification:** npm run typecheck passes
- **Committed in:** 041e73e

---

**Total deviations:** 3 auto-fixed (3 missing critical/blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- TypeScript duplicate export conflicts in params/index.ts barrel - resolved with selective re-exports
- NodePair* types needed in both nodes.ts (definition) and agents.ts (import by pairing sub-namespace) - resolved via cross-file import
- Wizard*, Usage*, VoiceWake*, BrowserRequest* used by multiple API files - resolved via targeted imports from correct params files

## Next Phase Readiness

- Type system refactoring complete - REF-02 satisfied
- All 872 tests pass, no breaking changes to public API surface
- Ready for Phase 03 bug fixes

---
*Phase: 02-code-health plan 02*
*Completed: 2026-03-29*
