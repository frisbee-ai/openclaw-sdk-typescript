---
phase: 01-critical-reliability
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/timeoutManager.ts
  - src/events/tick.ts
autonomous: true
requirements:
  - REL-02

must_haves:
  truths:
    - "When TickMonitor.start() is called, a periodic timer fires and calls checkStale() automatically"
    - "When no tick is received for stalenessThresholdMs, the onStale callback fires"
    - "When TickMonitor.stop() is called, the periodic timer is cleared"
  artifacts:
    - path: "src/utils/timeoutManager.ts"
      provides: "setInterval method for repeated timer execution"
      exports: ["TimeoutManager.setInterval", "TimerHandle"]
    - path: "src/events/tick.ts"
      provides: "TickMonitor timer loop using TimeoutManager"
  key_links:
    - from: "src/events/tick.ts"
      to: "src/utils/timeoutManager.ts"
      via: "this.timeoutManager.setInterval(checkStale, intervalMs)"
      pattern: "setInterval"
---

<objective>
Activate TickMonitor's automatic staleness detection by adding a periodic timer loop that calls checkStale() on a regular interval. This requires extending TimeoutManager with setInterval support (per D-03) and wiring it into TickMonitor (per D-04).

Purpose: The SDK must automatically detect stale connections even when no tick events arrive, without requiring external polling.
Output: TimeoutManager.setInterval() and TickMonitor using it for automatic checkStale() calls.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/utils/timeoutManager.ts
@src/events/tick.ts

<interfaces>
From src/utils/timeoutManager.ts:
```typescript
// Existing interface:
export interface TimeoutHandle {
  readonly id: string;
  readonly cleared: boolean;
  clear: () => void;
}

// New interface to add:
export interface TimerHandle {
  readonly id: string;
  readonly cleared: boolean;
  clear: () => void;
}
```

From src/events/tick.ts:
```typescript
// Existing constructor fields (line 45-53):
private started = false;
private onStale?: () => void;
private onRecovered?: () => void;
private getTime: () => number;

// New field to add:
private timeoutManager: TimeoutManager;
private timerHandle?: TimerHandle;
private checkIntervalMs: number;

// Existing methods to modify:
// - start() - starts the periodic timer
// - stop() - clears the periodic timer
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add setInterval method to TimeoutManager</name>
  <files>src/utils/timeoutManager.ts</files>
  <action>
    Add a new `TimerHandle` interface at the top with the other interface definitions (after TimeoutHandle):
    ```typescript
    /**
     * Interval handle returned by setInterval
     */
    export interface TimerHandle {
      /** Unique identifier for this interval */
      readonly id: string;
      /** Whether the interval has been cleared */
      readonly cleared: boolean;
      /** Clear this interval */
      clear: () => void;
    }
    ```

    Add a new private map for intervals in the TimeoutManager class (after `private timeouts`):
    ```typescript
    private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
    ```

    Add the `setInterval` method after the existing `set` method:
    ```typescript
    /**
     * Set a repeating interval.
     *
     * @param callback - Function to execute on each interval
     * @param ms - Interval in milliseconds
     * @param name - Optional name for debugging
     * @returns TimerHandle for clearing the interval
     */
    setInterval(callback: () => void, ms: number, name?: string): TimerHandle {
      const id = name ?? `interval_${++this.idCounter}`;

      // Clear any existing interval with same name
      if (this.intervals.has(id)) {
        if (this.config.warnOnClear) {
          console.warn(`TimeoutManager: Overwriting existing interval "${id}"`);
        }
        this.clearInterval(id);
      }

      const intervalId = setInterval(() => {
        callback();
      }, ms);

      this.intervals.set(id, intervalId);

      return {
        id,
        cleared: false,
        clear: () => this.clearInterval(id),
      };
    }
    ```

    Add a `clearInterval` method after the `clear` method:
    ```typescript
    /**
     * Clear a specific interval by ID.
     *
     * @param id - The interval ID to clear
     * @returns true if interval was found and cleared
     */
    clearInterval(id: string): boolean {
      const intervalId = this.intervals.get(id);
      if (intervalId) {
        clearInterval(intervalId);
        this.intervals.delete(id);
        return true;
      }
      return false;
    }
    ```

    Modify `clearAll` to also clear intervals:
    ```typescript
    clearAll(): void {
      // Clear timeouts
      for (const timeoutId of this.timeouts.values()) {
        clearTimeout(timeoutId);
      }
      this.timeouts.clear();
      // Clear intervals
      for (const intervalId of this.intervals.values()) {
        clearInterval(intervalId);
      }
      this.intervals.clear();
    }
    ```

    Modify `has` to check intervals as well:
    ```typescript
    has(id: string): boolean {
      return this.timeouts.has(id) || this.intervals.has(id);
    }
    ```
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>TimeoutManager has setInterval, clearInterval, and TimerHandle interface</done>
  <read_first>
    - src/utils/timeoutManager.ts
  </read_first>
  <acceptance_criteria>
    - grep -n "setInterval" src/utils/timeoutManager.ts finds the new method
    - grep -n "TimerHandle" src/utils/timeoutManager.ts finds the interface
    - grep -n "clearInterval" src/utils/timeoutManager.ts finds the method
    - grep -n "intervals" src/utils/timeoutManager.ts finds the Map and usage
    - TypeScript compiles without errors (npm run typecheck passes)
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Wire setInterval into TickMonitor for automatic checkStale()</name>
  <files>src/events/tick.ts</files>
  <action>
    Import TimeoutManager at the top of the file:
    ```typescript
    import { TimeoutManager, type TimerHandle } from '../utils/timeoutManager.js';
    ```

    Add to TickMonitor constructor config interface (TickMonitorConfig), add a new optional checkIntervalMs property:
    ```typescript
    export interface TickMonitorConfig {
      tickIntervalMs: number;
      staleMultiplier?: number;
      onStale?: () => void;
      onRecovered?: () => void;
      /** Optional time provider for testing */
      getTime?: () => number;
      /** Optional TimeoutManager instance (for timer management). Creates one if not provided. */
      timeoutManager?: TimeoutManager;
    }
    ```

    Add new fields to TickMonitor class:
    ```typescript
    private timeoutManager: TimeoutManager;
    private timerHandle?: TimerHandle;
    private checkIntervalMs: number;
    ```

    Modify TickMonitor constructor to initialize TimeoutManager and checkIntervalMs:
    ```typescript
    constructor(config: TickMonitorConfig) {
      super();
      this.tickIntervalMs = config.tickIntervalMs;
      this.staleMultiplier = config.staleMultiplier ?? DEFAULT_STALE_MULTIPLIER;
      this.onStale = config.onStale;
      this.onRecovered = config.onRecovered;
      this.getTime = config.getTime ?? (() => Date.now());
      this.timeoutManager = config.timeoutManager ?? new TimeoutManager();
      // Check staleness every tickIntervalMs (not multiplied by staleMultiplier)
      this.checkIntervalMs = config.tickIntervalMs;
    }
    ```

    Modify the `start()` method to schedule periodic checkStale() calls:
    ```typescript
    start(): void {
      this.started = true;
      // Schedule periodic checkStale() calls using TimeoutManager's setInterval
      // The interval is based on tickIntervalMs (not staleMultiplier) since checkStale() computes staleness internally
      this.timerHandle = this.timeoutManager.setInterval(
        () => { this.checkStale(); },
        this.checkIntervalMs,
        'tickMonitor:staleCheck'
      );
    }
    ```

    Modify the `stop()` method to clear the interval:
    ```typescript
    stop(): void {
      this.started = false;
      // Clear the periodic timer
      if (this.timerHandle) {
        this.timerHandle.clear();
        this.timerHandle = undefined;
      }
    }
    ```
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>TickMonitor.start() schedules periodic checkStale() via TimeoutManager.setInterval(), stop() clears it</done>
  <read_first>
    - src/events/tick.ts
  </read_first>
  <acceptance_criteria>
    - grep -n "setInterval" src/events/tick.ts finds the timer scheduling
    - grep -n "timerHandle" src/events/tick.ts finds the handle management
    - grep -n "timeoutManager" src/events/tick.ts finds the import and usage
    - grep -n "stop()" src/events/tick.ts shows timer cleared on stop
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
When TickMonitor.start() is called, checkStale() is called automatically at each tickIntervalMs via TimeoutManager.setInterval(). When a tick is received (via recordTick), the stale state resets. When no tick is received for tickIntervalMs * staleMultiplier, onStale callback fires. When stop() is called, the interval is cleared and checkStale() stops being called automatically.
</success_criteria>

<output>
After completion, create `.planning/phases/01-critical-reliability/02-PLAN-SUMMARY.md`
</output>
