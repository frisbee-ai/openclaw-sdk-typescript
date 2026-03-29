/**
 * Secrets API Parameter Types
 *
 * Parameter and result types for secrets management operations.
 *
 * @module protocol/params/secrets
 */

export interface SecretsListParams {}

export interface SecretsGetParams {
  key: string;
}

export interface SecretsGetResult {
  value: string;
}

export interface SecretsSetParams {
  key: string;
  value: string;
}

export interface SecretsSetResult {}

export interface SecretsDeleteParams {
  key: string;
}

export interface SecretsDeleteResult {}

export interface SecretsReloadParams {}

export interface SecretsResolveParams {
  key: string;
}
