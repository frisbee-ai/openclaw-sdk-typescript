# Summary 05-01: Protocol Version Fallbacks (HARD-01)

**Phase:** 05-hardening
**Wave:** 1
**Commit:** 6573d3e
**Requirements addressed:** HARD-01

## Changes Made

### Files Modified

| File | Change |
|------|--------|
| `src/connection/protocol.ts` | Changed `DEFAULT_PROTOCOL_VERSION` to `DEFAULT_PROTOCOL_VERSIONS` array with v3, v2, v1 fallback; updated class to use array-based ranges |
| `src/connection/protocol.test.ts` | Updated 18 unit tests to use new array-based API |
| `src/connection/protocol.integration.test.ts` | Updated 11 integration tests to use new array-based API |
| `src/client-builder.ts` | Changed `createProtocolNegotiator({ min: 3, max: 3 })` to `createProtocolNegotiator()` (uses defaults) |

### Implementation Details

1. **`DEFAULT_PROTOCOL_VERSIONS`**: Array of `ProtocolVersionRange[]` with v3, v2, v1 in fallback order
   ```ts
   export const DEFAULT_PROTOCOL_VERSIONS: ProtocolVersionRange[] = [
     { min: 3, max: 3 },
     { min: 2, max: 2 },
     { min: 1, max: 1 },
   ];
   ```

2. **`ProtocolNegotiator` class**:
   - Constructor now accepts `ProtocolVersionRange[]` instead of `Partial<ProtocolVersionRange>`
   - `negotiate()` iterates through ranges in order
   - Warning logged when server version < preferred (degraded mode)
   - Throws only when ALL ranges exhausted

3. **`negotiate()` behavior**:
   - v3 server: No warning, proceeds normally
   - v2 server: WARNING logged, proceeds in degraded mode
   - v1 server: WARNING logged, proceeds in degraded mode
   - v4+ server: Throws with supported ranges

### Verification

- Build: `npm run build` passes
- Tests: 869 tests pass (47 test files)
- Protocol tests: 29 tests pass (2 test files)

## Must-Haves Achieved

- [x] `DEFAULT_PROTOCOL_VERSIONS` array with v3, v2, v1
- [x] `negotiate()` logs WARNING when server version < preferred (degraded mode)
- [x] `negotiate()` throws only when ALL ranges exhausted
- [x] `npm run build` succeeds
- [x] `npm test -- --run src/connection/protocol.test.ts` passes
