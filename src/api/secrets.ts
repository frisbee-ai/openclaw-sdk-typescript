/**
 * Secrets API Namespace
 *
 * Provides typed methods for secrets management operations on the OpenClaw Gateway.
 *
 * @module api/secrets
 */

import type { SecretsReloadParams, SecretsResolveParams } from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

/**
 * Secrets API namespace.
 *
 * @example
 * ```ts
 * await client.secrets.reload();
 * const { value } = await client.secrets.resolve({ key: 'API_KEY' });
 * ```
 */
export class SecretsAPI {
  constructor(private request: RequestFn) {}

  /**
   * Reload secrets from the secrets store.
   */
  async reload(params?: SecretsReloadParams): Promise<void> {
    await this.request('secrets.reload', params);
  }

  /**
   * Resolve a secret value by key.
   */
  async resolve(params: SecretsResolveParams): Promise<{ value: string }> {
    return this.request<{ value: string }>('secrets.resolve', params);
  }
}
