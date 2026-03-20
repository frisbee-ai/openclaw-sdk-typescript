/**
 * Config API Namespace
 *
 * Provides typed methods for configuration operations on the OpenClaw Gateway.
 *
 * @module api/config
 */

import type {
  ConfigGetParams,
  ConfigSetParams,
  ConfigApplyParams,
  ConfigPatchParams,
  ConfigSchemaParams,
  ConfigSchemaResponse,
} from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

/**
 * Config API namespace.
 *
 * @example
 * ```ts
 * const config = await client.config.get();
 * await client.config.set({ key: "theme", value: "dark" });
 * ```
 */
export class ConfigAPI {
  constructor(private request: RequestFn) {}

  /**
   * Get configuration.
   */
  async get(params?: ConfigGetParams): Promise<unknown> {
    return this.request('config.get', params);
  }

  /**
   * Set a configuration value.
   */
  async set(params: ConfigSetParams): Promise<void> {
    await this.request('config.set', params);
  }

  /**
   * Apply pending configuration changes.
   */
  async apply(params?: ConfigApplyParams): Promise<void> {
    await this.request('config.apply', params);
  }

  /**
   * Patch configuration with JSON Patch operations.
   */
  async patch(params: ConfigPatchParams): Promise<void> {
    await this.request('config.patch', params);
  }

  /**
   * Get configuration schema.
   */
  async schema(params?: ConfigSchemaParams): Promise<ConfigSchemaResponse> {
    return this.request<ConfigSchemaResponse>('config.schema', params);
  }
}
