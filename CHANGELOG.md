# Changelog

All notable changes to this project will be documented in this file.

## v2026.3.19(2026-03-19)




### 🚀 Features

- Add listener error handling callbacks and fix EventManager unsubscribe bug ([c2483f4](c2483f4aad91a081817cd1fe33aa0cd533d1c88e)) - (Lin Yang)
- Add TimeoutManager utility class ([09741c9](09741c982081656da53135f890b11c78f64d4246)) - (Lin Yang)
- Export TimeoutManager in public API ([07db1ac](07db1accf49212059c622decb981706671b58b7b)) - (Lin Yang)
- Extract ConnectionConfig from ClientConfig ([a403958](a40395856765cfed03f27cbec6b238f94797c1ae)) - (Lin Yang)

### 🐛 Bug Fixes

- Enhance JSON parse error handling with data preview ([71f2e5a](71f2e5a6392fc9adcf9ded7aceff7df3e0791dc0)) - (Lin Yang)
- Prevent memory leaks in event handlers and WebSocket cleanup ([5da1a71](5da1a71dbe17464bc026b3c48f666e5ab06137d5)) - (Lin Yang)
- Correct repository URL in package.json ([a6eef3b](a6eef3b4700823d87050646dbb6f3386497e82c0)) - (Lin Yang)

### 🔒 Security

- Add message size limit to prevent DoS attacks ([87fb519](87fb519af761bf9f6f80fc4aa14d18da8231af09)) - (Lin Yang)

### ⚡ Performance

- Optimize Fibonacci calculation with pre-computed lookup table ([7f51ea9](7f51ea90a92c8e6c7e86ecdd8dd48603066da91f)) - (Lin Yang)

### ♻️ Refactor

- Extract readyStateString to shared utility function ([4e44da9](4e44da9162ae35d80f77719b2d94024ba5d89a53)) - (Lin Yang)
- Remove type assertions and add proper private fields to ConnectionManager ([9ba04fb](9ba04fb3eed49b82e2ecafd10776ff3e180cb3a2)) - (Lin Yang)
- Add FrameTypes constants to avoid magic strings ([e6e3197](e6e3197fa3dc914e5f762f813fbf39612d2d828a)) - (Lin Yang)
- Use TimeoutManager in ReconnectManager ([59e55f2](59e55f21e6527c3b446d6c14aeff8d962216d7b9)) - (Lin Yang)
- Use TimeoutManager in WebSocketTransport ([877bad9](877bad97af56895e9e3e80ca3ce02f2b7a01773a)) - (Lin Yang)
- Extract magic numbers into named constants in client.ts ([a8e1fd7](a8e1fd7c7528e543a79e1f1b7d54f81eb0ca8c4b)) - (Lin Yang)
- Extract base error string and update docs requirement ([c1e1440](c1e14405aa248c0faa602cc6d34ae34e05d90a14)) - (Lin Yang)

### ✅ Testing

- Add comprehensive unit and integration test coverage ([210e816](210e81678bcf028cec7fc0dd3d5440434786f2c7)) - (Lin Yang)



### 📖 Documentation

- Update timeout manager refactor plan with selective refactoring ([5b965c9](5b965c911a15b1e1ebbb82986ab55450b4fd0673)) - (Lin Yang)
- Add config bloat fix plan and translate timeout manager plan ([18f5ea4](18f5ea4173c64a56110f5c0011461a0851c541f2)) - (Lin Yang)
- Enhance CLAUDE.md with comprehensive project guidance ([de442ef](de442ef25f63200d304a75650d80b1e416b18ee7)) - (Lin Yang)
- Add COMMANDS.md with npm script reference ([62bfc14](62bfc1478a432bbfd6abb0054bfd653e3334f138)) - (Lin Yang)
- Add security notes for in-memory credentials ([9a1156a](9a1156a9749567d63a07e14a50738b6c28af2512)) - (Lin Yang)
- Add SECURITY.md with security policy and best practices ([0f90de7](0f90de70fb19343fbce01300602c0fddcda31381)) - (Lin Yang)
- Add CONTRIBUTING.md with contribution guidelines ([55a45c1](55a45c16e17c9c37c3f57cf82a52604cf551c167)) - (Lin Yang)
- Add TypeDoc @example and @returns to public APIs ([56c3da8](56c3da8f2c917901d399eb993ebdae67aed1d184)) - (Lin Yang)
- Add GitHub Pages deployment for TypeDoc documentation ([8f6d3e0](8f6d3e068b3d9d4612a6819c229bdea0f1062065)) - (Lin Yang)
- Restore docs/examples/ ([9043de7](9043de73e975f8076d835d8d5b611d1df05283c1)) - (Lin Yang)
- Update README with badges and detailed description ([9561de4](9561de4f4d2bb721354cba6d608a9bc67d208f0f)) - (Lin Yang)
- Update copyright year and owner in LICENSE file ([6d32052](6d32052c6a9933d84ab1b6b890fe42f2cb775bdb)) - (Lin Yang)
- Fix TypeDoc warnings and update scoped package name ([50eabec](50eabec2115d6907a787ab9ef8df732906b890d9)) - (Lin Yang)

### 🔧 Miscellaneous Tasks

- Add Dependabot configuration for automated dependency updates ([94213a0](94213a08329d49999393dc83bf578e6a9fa23de7)) - (Lin Yang)
- Update CI workflow to build before coverage check ([0b29783](0b29783fcafea6eee9f048397a791e2764e5c6da)) - (Lin Yang)
- Update Codecov slug in CI workflow ([7c3afe4](7c3afe47d7baaf0d52c91cad0188bc0280992176)) - (Lin Yang)
- Rename job 'validate' to 'test' in CI workflow ([810a5f3](810a5f30c765157fa2d4b88d9d2b4087d73a1926)) - (Lin Yang)



**Full Changelog:** [v2026.3.17...v2026.3.19](https://github.com/clawparty-ai/openclaw-channel-plugin-ztm/compare/v2026.3.17...v2026.3.19)
## v2026.3.17(2026-03-18)




### 🚀 Features

- Initialize TypeScript SDK project structure ([8be0ccd](8be0ccd1c28c20563d9e6529062dc3784cf0946d)) - (Lin Yang)
- Implement Phase 1 core SDK architecture ([bad4d07](bad4d078ea7611721b0059fa7a203c4ac4a69f62)) - (Lin Yang)
- Implement Phase 2 authentication, events, and reconnection ([29b7d24](29b7d246cb2029680b2d341feaac008605624f1d)) - (Lin Yang)
- Implement Phase 3 connection reliability ([953f03e](953f03edb674145122f247fc02b0bcf71b1c3975)) - (Lin Yang)
- Implement Phase 4 enhanced features (4.5, 4.6) ([cc08d0d](cc08d0d5bf730417a290076944bd574bd7286726)) - (Lin Yang)
- Implement Phase 5 Platform Support ([4fbe243](4fbe2433640d29ca3325f2af614cdcb30781ecb1)) - (Lin Yang)
- Implement Phase 6 Polish ([7dd9ec7](7dd9ec760d2dc2047186a81d564daeced81e72da)) - (Lin Yang)

### 🐛 Bug Fixes

- Update implementation plan based on review feedback ([b7c99f4](b7c99f4ddb87fc39c551252a7410b11e11bb5aef)) - (Lin Yang)
- Remove unnecessary openclaw dependency and unify Node version ([9a31702](9a317020b2a73e8c27173b4b5d4a889a050a5862)) - (Lin Yang)
- Add CloseEvent polyfill for Node.js test environment ([75a6d4c](75a6d4c74cc60d24ddf73c97501fd10321459ca7)) - (Lin Yang)
- Add --access public flag for first-time npm publish ([f53c709](f53c70904e6c2f9b7a99f668d786369c4b91727f)) - (Lin Yang)
- Explicitly set NODE_AUTH_TOKEN for npm publish ([b9037b3](b9037b345fbb7c53458d6891e31221372a41a1c9)) - (Lin Yang)







### 📖 Documentation

- Add OpenClaw SDK design document ([d263c33](d263c33b5874266e276e02001fac109f6645a034)) - (Lin Yang)




<!-- generated by git-cliff -->
