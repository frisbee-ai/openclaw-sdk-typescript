# External Integrations

**Analysis Date:** 2026-03-29

## APIs & External Services

**OpenClaw Gateway (primary integration):**
- WebSocket-based protocol communication
- SDK connects to any `ws://` or `wss://` endpoint via `ClientConfig.url`
- Custom binary/text frame protocol with JSON messages
- 15+ API namespaces: chat, agents, sessions, config, cron, nodes, skills, devicePairing, browser, execApprovals, push, channels, secrets, system, usage

**External npm Package:**
- `openclaw` - Plugin SDK protocol types (referenced via path alias in `tsconfig.json`)
  - Used for type definitions only (no runtime dependency)
  - Path: `openclaw/dist/plugin-sdk/gateway/protocol/index`

## Data Storage

**Databases:**
- None (SDK is a client library; data storage is backend's responsibility)

**File Storage:**
- None

**Caching:**
- None

## Authentication & Identity

**Auth Methods (4 supported):**
1. **Bootstrap Token** - Initial pairing token (`bootstrapToken`)
2. **Device Token** - Keypair-based device authentication (`deviceToken`)
3. **Bearer Token** - Simple token auth (`token`)
4. **Password** - Username/password credentials (`password`)

**Auth Provider Pattern:**
- `CredentialsProvider` interface (`src/auth/provider.ts`)
  - `getToken()`, `refreshToken()`, `getDeviceCredentials()`, `getBootstrapToken()`, `getPassword()`, `signChallenge()`
- `StaticCredentialsProvider` - Simple static credential storage
- `AuthHandler` - Manages auth flow, fallback chain, and challenge signing
- Challenge-based device auth using Node.js `crypto` module (RSA-SHA256 signing)

**Credential Configuration (via `ClientConfig`):**
- `auth: { token?, bootstrapToken?, deviceToken?, password? }` (simple config)
- `credentialsProvider: CredentialsProvider` (advanced/polyglot auth)
- `device: { id, publicKey, signature, signedAt, nonce }` (pre-computed device creds)

**Token Refresh:**
- Supported via `refreshToken()` callback in `StaticCredentialsProvider`
- `RefreshResult` with retry hints (`retryAfterMs`, error codes)

## Monitoring & Observability

**Error Tracking:**
- None (SDK does not integrate with external error tracking)
- Custom error hierarchy in `src/errors.ts`: 9 error classes (OpenClawError, AuthError, ConnectionError, ProtocolError, RequestError, TimeoutError, CancelledError, AbortError, GatewayError, ReconnectError)
- Type guards for all error types

**Logs:**
- `Logger` interface in `src/types/logger.ts`
- `LogLevel` enum (Debug, Info, Warn, Error)
- Custom logger injection via `ClientConfig.logger`
- Default no-op logger if not provided

**Heartbeat / Tick Monitoring:**
- `TickMonitor` (`src/events/tick.ts`) - Tracks heartbeat ticks from server
- `GapDetector` (`src/events/gap.ts`) - Detects message sequence gaps

## CI/CD & Deployment

**Hosting:**
- GitHub (source code at `frisbee-ai/openclaw-sdk-typescript`)
- npm registry (public package: `openclaw-sdk`)

**CI Pipeline (GitHub Actions):**
- `.github/workflows/ci.yml` - Runs on every push to `main` and all PRs
  - Steps: checkout, setup Node 22, `npm ci`, typecheck, lint, build, test with coverage, upload to Codecov
  - Codecov token: `${{ secrets.CODECOV_TOKEN }}`

**Release Pipeline (GitHub Actions):**
- `.github/workflows/release.yml` - Triggered by version tags (`v*.*.*`)
  - Steps: checkout (full history), setup Node 22, validate version match, typecheck, lint, test, build, generate TypeDoc, deploy docs to GitHub Pages, dry-run npm pack, publish to npm (with provenance), generate changelog via git-cliff, create GitHub Release
  - npm token: `${{ secrets.NPM_TOKEN }}`
  - GitHub token: `${{ secrets.GITHUB_TOKEN }}`
  - Prerelease versions (alpha/beta/rc) publish to `next` tag; stable to `latest`
  - GitHub Pages deploys TypeDoc API docs from `docs/api/`

**Dependabot:**
- `.github/dependabot.yml` - Daily dependency updates
  - GitHub Actions updates (assigned to `i0r3k`)
  - npm package updates (assigned to `i0r3k`)

## Environment Configuration

**Required env vars:**
- None required by the SDK itself (all config via `ClientConfig`)
- `NPM_TOKEN` - Used by release workflow for npm publishing (GitHub Actions secret)
- `CODECOV_TOKEN` - Used by CI workflow for coverage upload (GitHub Actions secret)

**Secrets location:**
- GitHub Actions secrets (`.github/workflows/`)
- npm publish auth via `NODE_AUTH_TOKEN` environment variable

## Webhooks & Callbacks

**Incoming (server to SDK):**
- None (SDK is client, does not receive webhooks)
- However, the SDK subscribes to server-sent events via WebSocket:
  - Event subscription patterns: exact match (`'tick'`), prefix wildcard (`'agent:*'`), global wildcard (`'*'`)
  - `client.on(pattern, handler)` - Subscribe to events
  - `client.once(pattern, handler)` - One-time subscription
  - `client.off(pattern, handler)` - Unsubscribe

**Outgoing (SDK to server):**
- All communication is outbound WebSocket to the Gateway URL
- Request/response pattern via JSON frames
- No HTTP webhooks or outbound HTTP calls

## Platform-Specific Considerations

**Node.js:**
- Uses `ws` package (8.20.0) for WebSocket
- TLS certificate fingerprint validation via `tls.TLSSocket`
- Node.js `crypto` module for RSA-SHA256 challenge signing
- Default timeout: 30s

**Browser:**
- Uses native browser `WebSocket` API
- TLS handled by browser (no socket inspection available)
- Separate transport: `BrowserWebSocketTransport` (`src/transport/browser.ts`)
- `dist/browser/index.js` entry point

---

*Integration audit: 2026-03-29*
