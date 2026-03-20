/**
 * Agents API Namespace
 *
 * Provides typed methods for agent operations on the OpenClaw Gateway.
 *
 * @module api/agents
 */

import type {
  AgentIdentityParams,
  AgentIdentityResult,
  AgentWaitParams,
  AgentsCreateParams,
  AgentsCreateResult,
  AgentsUpdateParams,
  AgentsUpdateResult,
  AgentsDeleteParams,
  AgentsDeleteResult,
  AgentsListParams,
  AgentsListResult,
  AgentsFilesListParams,
  AgentsFilesListResult,
  AgentsFilesGetParams,
  AgentsFilesGetResult,
  AgentsFilesSetParams,
  AgentsFilesSetResult,
} from '../protocol/types.js';

import type { RequestFn } from './shared.js';

/**
 * Agents API namespace.
 *
 * Provides typed methods for agent lifecycle and file operations.
 *
 * @example
 * ```ts
 * // List all agents
 * const { agents } = await client.agents.list();
 *
 * // Create a new agent
 * await client.agents.create({ agentId: "my-agent", files: [{ path: "main.ts", content: "..." }] });
 *
 * // Get agent file
 * const { content } = await client.agents.files.get({ agentId: "my-agent", path: "main.ts" });
 * ```
 */
export class AgentsAPI {
  constructor(private request: RequestFn) {}

  /**
   * Verify agent identity.
   */
  async identity(params: AgentIdentityParams): Promise<AgentIdentityResult> {
    return this.request<AgentIdentityResult>('agent.identity', params);
  }

  /**
   * Wait for an agent to become available.
   */
  async wait(params: AgentWaitParams): Promise<void> {
    await this.request('agent.wait', params);
  }

  /**
   * List all agents.
   */
  async list(params?: AgentsListParams): Promise<AgentsListResult> {
    return this.request<AgentsListResult>('agents.list', params);
  }

  /**
   * Create a new agent with files.
   */
  async create(params: AgentsCreateParams): Promise<AgentsCreateResult> {
    return this.request<AgentsCreateResult>('agents.create', params);
  }

  /**
   * Update agent files.
   */
  async update(params: AgentsUpdateParams): Promise<AgentsUpdateResult> {
    return this.request<AgentsUpdateResult>('agents.update', params);
  }

  /**
   * Delete an agent.
   */
  async delete(params: AgentsDeleteParams): Promise<AgentsDeleteResult> {
    return this.request<AgentsDeleteResult>('agents.delete', params);
  }

  /**
   * Agent file operations.
   */
  get files() {
    const request = this.request;
    return {
      /**
       * List files for an agent.
       */
      async list(params: AgentsFilesListParams): Promise<AgentsFilesListResult> {
        return request<AgentsFilesListResult>('agents.files.list', params);
      },

      /**
       * Get a specific file from an agent.
       */
      async get(params: AgentsFilesGetParams): Promise<AgentsFilesGetResult> {
        return request<AgentsFilesGetResult>('agents.files.get', params);
      },

      /**
       * Set/update a file in an agent.
       */
      async set(params: AgentsFilesSetParams): Promise<AgentsFilesSetResult> {
        return request<AgentsFilesSetResult>('agents.files.set', params);
      },
    };
  }
}
