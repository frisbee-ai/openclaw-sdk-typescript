/**
 * Usage API Parameter Types
 *
 * Parameter and result types for usage reporting operations.
 *
 * @module protocol/params/usage
 */

export interface UsageSummaryParams {
  period?: string;
}

export interface UsageSummaryResult {
  totalTokens?: number;
  totalCost?: number;
  period?: string;
  [key: string]: unknown;
}

export interface UsageDetailsParams {
  period?: string;
  agentId?: string;
}

export interface UsageDetailsResult {
  entries: unknown[];
}

export interface UsageStatusParams {}

export interface UsageCostParams {}

export interface UsageStatusResult {
  status: string;
  [key: string]: unknown;
}

export interface UsageCostResult {
  cost: number;
  currency?: string;
  [key: string]: unknown;
}
