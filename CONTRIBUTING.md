# Contributing to OpenClaw SDK

Thank you for your interest in contributing to the OpenClaw SDK (TypeScript).

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. All interactions should be professional and constructive.

## Getting Started

### Prerequisites

- **Node.js**: >= 22.0.0
- **npm**: Latest version

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/frisbee-ai/openclaw-sdk-typescript.git
   cd openclaw-sdk
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run tests**

   ```bash
   npm test
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

## Development Workflow

### Running Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (Vitest) |
| `npm run build` | Build ESM + CJS |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Type check with TypeScript |
| `npm run check:circular` | Check for circular dependencies |
| `npm run docs` | Generate TypeDoc documentation |

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (automatically applied via lint-staged)
- **Linting**: ESLint with TypeScript support
- **Testing**: Vitest with 80%+ coverage requirement

### Git Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

<optional body>
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Example:
```
feat: add token refresh support for reconnection

Implement refreshToken method in CredentialsProvider to support
automatic token refresh on reconnection.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following the code style guidelines

3. **Run all checks**

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run check:circular
   ```

4. **Submit a Pull Request**
   - Ensure all tests pass
   - Update documentation if needed
   - Describe your changes in the PR description

### Pre-commit Checks

The project uses Husky + lint-staged to run checks before commit:

- Prettier formatting
- ESLint linting
- TypeScript type checking
- Circular dependency check
- Documentation validation
- All tests must pass

## Project Structure

```
src/
├── index.ts              # Public API exports
├── client.ts             # Main OpenClawClient class
├── errors.ts             # Error hierarchy
├── managers/
│   ├── connection.ts     # Connection lifecycle
│   ├── request.ts        # Request management
│   ├── event.ts          # Event system
│   └── reconnect.ts      # Reconnection logic
├── transport/
│   ├── websocket.ts      # WebSocket abstraction
│   ├── node.ts           # Node.js implementation
│   └── browser.ts        # Browser implementation
├── protocol/
│   ├── types.ts          # Frame types
│   └── validation.ts     # Validation utilities
├── connection/
│   ├── protocol.ts       # Protocol negotiation
│   ├── state.ts          # State machine
│   ├── policies.ts       # Policy management
│   └── tls.ts            # TLS validation
├── events/
│   ├── tick.ts           # Heartbeat monitor
│   └── gap.ts            # Message gap detection
├── auth/
│   └── provider.ts       # Credentials provider
└── utils/
    └── timeoutManager.ts  # Timeout utilities
```

## Testing Guidelines

- All new features require tests
- Use Vitest for unit and integration tests
- Aim for 80%+ test coverage
- Test both success and error paths

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';

describe('FeatureName', () => {
  it('should do something specific', () => {
    // Test implementation
  });
});
```

## Documentation

- All public APIs require JSDoc comments
- Use English for all documentation
- Run `npm run docs` to generate API documentation
- Update README.md for user-facing changes

## License

By contributing to this project, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

## Questions?

- Open an issue for bug reports or feature requests
- Use discussions for questions
