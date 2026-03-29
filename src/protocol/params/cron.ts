/**
 * Cron API Parameter Types
 *
 * Parameter and result types for cron job operations.
 *
 * @module protocol/params/cron
 */

export interface CronListParams {}

export interface CronStatusParams {
  jobId: string;
}

export interface CronAddParams {
  cron: string;
  prompt: string;
}

export interface CronUpdateParams {
  jobId: string;
  cron?: string;
  prompt?: string;
}

export interface CronRemoveParams {
  jobId: string;
}

export interface CronRunParams {
  jobId: string;
}

export interface CronRunsParams {}
