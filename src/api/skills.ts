/**
 * Skills API Namespace
 *
 * Provides typed methods for skill/tool operations on the OpenClaw Gateway.
 *
 * @module api/skills
 */

import type {
  SkillsStatusParams,
  ToolsCatalogParams,
  ToolsCatalogResult,
  SkillsBinsParams,
  SkillsBinsResult,
  SkillsInstallParams,
  SkillsUpdateParams,
  ToolsEffectiveParams,
  ToolsEffectiveResult,
} from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

/**
 * Skills API namespace.
 *
 * @example
 * ```ts
 * const status = await client.skills.status();
 * const { tools } = await client.skills.tools.catalog();
 * ```
 */
export class SkillsAPI {
  constructor(private request: RequestFn) {}

  /**
   * Get skill status.
   */
  async status(params?: SkillsStatusParams): Promise<unknown> {
    return this.request('skills.status', params);
  }

  /**
   * Install a skill.
   */
  async install(params: SkillsInstallParams): Promise<void> {
    await this.request('skills.install', params);
  }

  /**
   * Update a skill.
   */
  async update(params: SkillsUpdateParams): Promise<void> {
    await this.request('skills.update', params);
  }

  /**
   * Get skills bins.
   */
  async bins(params?: SkillsBinsParams): Promise<SkillsBinsResult> {
    return this.request<SkillsBinsResult>('skills.bins', params);
  }

  /**
   * Tools operations.
   */
  get tools() {
    const request = this.request;
    return {
      /**
       * Get the tools catalog.
       */
      async catalog(params?: ToolsCatalogParams): Promise<ToolsCatalogResult> {
        return request<ToolsCatalogResult>('tools.catalog', params);
      },

      /**
       * Get effective tools for a skill or node.
       */
      async effective(params?: ToolsEffectiveParams): Promise<ToolsEffectiveResult> {
        return request<ToolsEffectiveResult>('tools.effective', params);
      },
    };
  }
}
