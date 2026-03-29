/**
 * Cron API Namespace
 *
 * Provides typed methods for cron job operations on the OpenClaw Gateway.
 *
 * @module api/cron
 */

import type {
  CronListParams,
  CronStatusParams,
  CronAddParams,
  CronUpdateParams,
  CronRemoveParams,
  CronRunParams,
  CronRunsParams,
} from '../protocol/params/cron.js';
import type { CronJob, CronRunLogEntry } from '../protocol/api-common.js';

import type { RequestFn } from './shared.js';

/**
 * Cron API namespace.
 *
 * @example
 * ```ts
 * const { jobs } = await client.cron.list();
 * await client.cron.add({ cron: "0 * * * *", prompt: "Check status" });
 * ```
 */
export class CronAPI {
  constructor(private request: RequestFn) {}

  /**
   * List all cron jobs.
   */
  async list(params?: CronListParams): Promise<{ jobs: CronJob[] }> {
    return this.request<{ jobs: CronJob[] }>('cron.list', params);
  }

  /**
   * Get cron job status.
   */
  async status(params: CronStatusParams): Promise<CronJob> {
    return this.request<CronJob>('cron.status', params);
  }

  /**
   * Add a new cron job.
   */
  async add(params: CronAddParams): Promise<CronJob> {
    return this.request<CronJob>('cron.add', params);
  }

  /**
   * Update a cron job.
   */
  async update(params: CronUpdateParams): Promise<CronJob> {
    return this.request<CronJob>('cron.update', params);
  }

  /**
   * Remove a cron job.
   */
  async remove(params: CronRemoveParams): Promise<void> {
    await this.request('cron.remove', params);
  }

  /**
   * Manually trigger a cron job.
   */
  async run(params: CronRunParams): Promise<void> {
    await this.request('cron.run', params);
  }

  /**
   * Get cron job run history.
   */
  async runs(params?: CronRunsParams): Promise<{ runs: CronRunLogEntry[] }> {
    return this.request<{ runs: CronRunLogEntry[] }>('cron.runs', params);
  }
}
