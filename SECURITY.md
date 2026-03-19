# Security Policy

This document outlines the security practices and considerations for the OpenClaw SDK (TypeScript).

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2026.x  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by opening a GitHub issue with the label `security`. We will respond within 48 hours.

## Security Architecture

### TLS Certificate Validation

The SDK implements TLS certificate fingerprint validation to ensure secure connections to the OpenClaw Gateway.

- **Fingerprint Validation**: Validates SHA-256 SPKI fingerprints of TLS certificates
- **Timing Attack Prevention**: Uses constant-time comparison algorithms to prevent timing attacks
- **Platform Support**: Full validation in Node.js; browser environments rely on native TLS

```typescript
import { createTlsValidator } from '@frisbee-ai/openclaw-sdk';

const validator = createTlsValidator({
  expectedFingerprints: ['AB:CD:EF:...'],
  requireValidation: true,
});
```

### Authentication

The SDK supports multiple authentication methods with a priority-based fallback chain:

| Method | Description | Use Case |
|--------|-------------|----------|
| `bootstrapToken` | Initial pairing token | Device onboarding |
| `deviceToken` | Keypair authentication | Registered devices |
| `token` | JWT/bearer token | Session-based auth |
| `password` | Username/password | Legacy systems |

#### CredentialsProvider Pattern

The SDK uses a `CredentialsProvider` interface to abstract credential storage, allowing secure implementations:

- **Custom Providers**: Implement `CredentialsProvider` to integrate with secure storage (HSM, keychain, vault)
- **Challenge Signing**: Device authentication uses nonce challenge signing with private keys
- **Token Refresh**: Automatic token refresh on reconnection

```typescript
import { CredentialsProvider } from '@frisbee-ai/openclaw-sdk';

class SecureCredentialsProvider implements CredentialsProvider {
  async getToken() {
    // Fetch from secure storage (HSM, keychain, vault)
    return await this.vault.getToken();
  }

  async signChallenge(nonce: string, timestamp: number): Promise<string> {
    // Sign using HSM or secure key storage
    return await this.hsm.sign(nonce + ':' + timestamp);
  }
}
```

### DoS Protection

The SDK implements message size limits to prevent denial-of-service attacks:

- **Maximum Message Size**: 1MB (1,048,576 bytes) for incoming WebSocket messages
- **Empty Message Rejection**: Rejects empty or whitespace-only messages
- **JSON Parse Error Handling**: Safe error handling with data preview for debugging

### Error Handling

Security-related error classification:

| Error Code | Retryable | Description |
|------------|-----------|-------------|
| `TLS_FINGERPRINT_MISMATCH` | No | Certificate validation failed |
| `CHALLENGE_EXPIRED` | Yes | Authentication challenge timed out |
| `CHALLENGE_FAILED` | No | Challenge signing failed |

## Security Best Practices

### For Application Developers

1. **Use CredentialsProvider**: Never hardcode credentials. Implement a custom `CredentialsProvider` for production use.

2. **Validate TLS Fingerprints**: Configure expected TLS fingerprints in production:

   ```typescript
   const client = createClient({
     tls: {
       expectedFingerprints: ['YOUR_PRODUCTION_FINGERPRINT'],
       requireValidation: true,
     },
   });
   ```

3. **Secure Private Keys**: Store private keys in secure storage (HSM, OS keychain). Never log or expose private keys.

4. **Token Expiration**: Implement token refresh logic to handle expired tokens gracefully:

   ```typescript
   const provider = new YourCredentialsProvider({
     refreshToken: async (currentToken) => {
       const newToken = await yourAuthService.refresh(currentToken);
       return newToken;
     },
   });
   ```

5. **Connection Security**: Always use `wss://` (WebSocket Secure) connections in production.

### For Credential Storage

| Storage Type | Recommendation |
|--------------|----------------|
| Development | Environment variables (not committed) |
| Production | HSM, keychain, or vault service |
| Browser | Browser Key Storage API |
| Node.js | Native keychain or encrypted file |

## Known Considerations

### Client-Side Limitations

- **In-Memory Credentials**: When using `StaticCredentialsProvider`, credentials are stored in memory. For long-running applications, consider custom implementations with periodic memory clearing.
- **No Client-Side Rate Limiting**: The SDK does not implement client-side rate limiting. Implement rate limiting at the application level if needed.

### Browser Environment

- **TLS Validation**: Browser environments skip TLS fingerprint validation (browser handles TLS)
- **Private Key Storage**: Use Web Crypto API or browser key storage for secure key management

## Changelog

### 2026.3.17

- Added message size limit (1MB) to prevent DoS attacks
- Added TLS fingerprint validation with timing attack protection
- Added challenge expiration checking
