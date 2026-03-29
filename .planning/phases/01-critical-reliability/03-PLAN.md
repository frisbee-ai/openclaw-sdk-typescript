---
phase: 01-critical-reliability
plan: 03
type: execute
wave: 2
depends_on:
  - 01
files_modified:
  - src/client.ts
autonomous: true
requirements:
  - REL-03

must_haves:
  truths:
    - "When a gap is detected in 'reconnect' mode, ConnectionManager.reconnect() is called"
    - "When a gap is detected in 'snapshot' mode, the configured snapshot endpoint is called via HTTP POST"
    - "GapDetector does not trigger recovery on the first event after connect (initialized state tracked)"
  artifacts:
    - path: "src/client.ts"
      provides: "GapDetector recovery event handling in client.ts"
      exports: ["GapDetector 'gap' event listener"]
  key_links:
    - from: "src/client.ts"
      to: "src/events/gap.ts"
      via: "this.gapDetector.on('gap', handler)"
      pattern: "gapDetector.*on\\('gap'"
    - from: "src/client.ts"
      to: "src/managers/connection.ts"
      via: "this.connectionManager.reconnect()"
      pattern: "connectionManager\\.reconnect"
---

<objective>
Implement GapDetector recovery actions in client.ts. When a gap is detected, dispatch based on mode: 'reconnect' triggers ConnectionManager.reconnect(), 'snapshot' calls the configured HTTP endpoint. Per D-05, GapDetector itself remains a pure detector and client.ts handles all recovery actions.

Purpose: When message gaps are detected, the SDK must automatically recover by either reconnecting or fetching a state snapshot.
Output: GapDetector 'gap' event listener in client.ts with mode-based dispatch.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/client.ts
@src/events/gap.ts
@src/managers/connection.ts

<interfaces>
From src/events/gap.ts:
```typescript
export type GapRecoveryMode = 'reconnect' | 'snapshot' | 'skip';

export interface GapRecoveryConfig {
  mode: GapRecoveryMode;
  onGap?: (gaps: GapInfo[]) => void;
  snapshotEndpoint?: string;
}

export interface GapDetectorConfig {
  recovery: GapRecoveryConfig;
  maxGaps?: number;
}

// GapDetector emits 'gap' event:
// this.emit('gap', this.gaps);
```

From src/managers/connection.ts:
```typescript
// Plan 01 adds this method:
reconnect(): void;
```

From src/client.ts:
```typescript
// Existing gapDetector creation (around line 680-684):
if (this._config.gapDetector) {
  this.gapDetector = createGapDetector({
    recovery: { mode: 'reconnect', ...this._config.gapDetector.recovery },
    ...this._config.gapDetector,
  });
}
```

GapInfo from gap.ts:
```typescript
export interface GapInfo {
  expected: number;
  received: number;
  detectedAt: number;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add initialized state tracking to GapDetector</name>
  <files>src/events/gap.ts</files>
  <action>
    The GapDetector needs to track whether it has been initialized (first sequence received after connect) to avoid triggering recovery on the expected gap between sequence 1 and the first received sequence.

    Add a private field to GapDetector:
    ```typescript
    private initialized = false;
    ```

    Modify recordSequence() to set initialized=true after first sequence:
    ```typescript
    recordSequence(seq: number): void {
      // ... existing gap detection logic ...

      // Update lastSequence BEFORE executing side-effects
      this.lastSequence = seq;

      // Mark as initialized after first sequence
      if (!this.initialized) {
        this.initialized = true;
      }

      // ... existing deferred side-effects execution ...
    }
    ```

    Modify the gap detection logic to NOT trigger when not yet initialized:
    ```typescript
    // In recordSequence(), modify the gap detection condition:
    if (this.lastSequence !== null && this.initialized) {
      // Only detect gaps after initialization
      const expected = this.lastSequence + 1;
      if (seq > this.lastSequence && seq > expected) {
        // ... gap detection ...
      }
    }
    ```

    Note: The order matters - we need to update `initialized` BEFORE checking for gaps so that subsequent calls after the first will properly detect gaps.

    Add a `isInitialized()` method:
    ```typescript
    /**
     * Check if the detector has been initialized (received first sequence).
     */
    isInitialized(): boolean {
      return this.initialized;
    }
    ```
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>GapDetector tracks initialized state, does not trigger gap events on first sequence</done>
  <read_first>
    - src/events/gap.ts
  </read_first>
  <acceptance_criteria>
    - grep -n "initialized" src/events/gap.ts finds the field and usage
    - grep -n "isInitialized" src/events/gap.ts finds the method
    - TypeScript compiles without errors (npm run typecheck passes)
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Wire GapDetector 'gap' event handler in client.ts</name>
  <files>src/client.ts</files>
  <action>
    After the gapDetector is created (around line 684), add a listener for the 'gap' event that dispatches based on mode:

    Find the existing gapDetector creation block (around line 679-684):
    ```typescript
    // Create gap detector
    if (this._config.gapDetector) {
      this.gapDetector = createGapDetector({
        recovery: { mode: 'reconnect', ...this._config.gapDetector.recovery },
        ...this._config.gapDetector,
      });
    }
    ```

    Add the gap event handler AFTER the gapDetector creation (still inside the `if (serverInfo)` block, after line 684):

    ```typescript
    // Create gap detector
    if (this._config.gapDetector) {
      this.gapDetector = createGapDetector({
        recovery: { mode: 'reconnect', ...this._config.gapDetector.recovery },
        ...this._config.gapDetector,
      });

      // Wire gap recovery actions per D-05: client.ts handles recovery, GapDetector remains pure
      this.gapDetector.on('gap', (gaps: import('./events/gap.js').GapInfo[]) => {
        const mode = this._config.gapDetector?.recovery?.mode ?? 'skip';
        this.logger.debug('Gap detected', { mode, gapCount: gaps.length });

        if (mode === 'reconnect') {
          // Reconnect mode: trigger reconnection
          this.connectionManager.reconnect();
        } else if (mode === 'snapshot') {
          // Snapshot mode: call the configured HTTP endpoint
          const endpoint = this._config.gapDetector?.recovery?.snapshotEndpoint;
          if (endpoint) {
            this.performSnapshotRecovery(endpoint, gaps).catch(error => {
              this.logger.error('Snapshot recovery failed', { error: String(error) });
            });
          } else {
            this.logger.warn('Gap detected in snapshot mode but no snapshotEndpoint configured');
          }
        }
        // 'skip' mode: no action, just log
      });
    }
    ```

    Add a private helper method for snapshot recovery (add after the disconnect() method, around line 720):
    ```typescript
    /**
     * Perform snapshot recovery by fetching state from the snapshot endpoint.
     */
    private async performSnapshotRecovery(
      endpoint: string,
      gaps: import('./events/gap.js').GapInfo[]
    ): Promise<void> {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gaps,
            clientId: this._config.clientId,
            timestamp: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Snapshot endpoint returned ${response.status}: ${response.statusText}`);
        }

        this.logger.info('Snapshot recovery completed', { endpoint });
      } catch (error) {
        this.logger.error('Snapshot recovery failed', { endpoint, error: String(error) });
        throw error;
      }
    }
    ```
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>GapDetector 'gap' event listener in client.ts dispatches based on mode: reconnect calls connectionManager.reconnect(), snapshot calls performSnapshotRecovery()</done>
  <read_first>
    - src/client.ts
  </read_first>
  <acceptance_criteria>
    - grep -n "gapDetector.on" src/client.ts finds the event listener
    - grep -n "performSnapshotRecovery" src/client.ts finds the helper method
    - grep -n "connectionManager.reconnect" src/client.ts finds the reconnect call
    - grep -n "snapshotEndpoint" src/client.ts finds the endpoint usage
    - TypeScript compiles without errors (npm run typecheck passes)
  </acceptance_criteria>
</task>

</tasks>

<verification>
- npm run typecheck passes with no errors
- npm run build passes (ESM + CJS)
- npm test -- --run passes
</verification>

<success_criteria>
When a gap is detected in 'reconnect' mode, ConnectionManager.reconnect() is called. When a gap is detected in 'snapshot' mode, the configured snapshotEndpoint is called via HTTP POST with gap info as JSON. The first sequence after connect does not trigger recovery (initialized state). The 'skip' mode logs but takes no action.
</success_criteria>

<output>
After completion, create `.planning/phases/01-critical-reliability/03-PLAN-SUMMARY.md`
</output>
