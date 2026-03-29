/**
 * Browser API Namespace
 *
 * Provides typed methods for browser/tab operations on the OpenClaw Gateway.
 *
 * @module api/browser
 */

import type {
  BrowserOpenParams,
  BrowserOpenResult,
  BrowserListParams,
  BrowserScreenshotParams,
  BrowserScreenshotResult,
  BrowserEvalParams,
  BrowserEvalResult,
} from '../protocol/params/browser.js';
import type { BrowserListResult } from '../protocol/api-common.js';

import type { RequestFn } from './shared.js';

/**
 * Browser API namespace.
 *
 * @example
 * ```ts
 * const { tabId } = await client.browser.open({ url: 'https://example.com' });
 * await client.browser.screenshot({ tabId });
 * ```
 */
export class BrowserAPI {
  constructor(private request: RequestFn) {}

  /**
   * Open a URL in a browser tab.
   */
  async open(params: BrowserOpenParams): Promise<BrowserOpenResult> {
    return this.request<BrowserOpenResult>('browser.open', params);
  }

  /**
   * List open browser tabs.
   */
  async list(params?: BrowserListParams): Promise<BrowserListResult> {
    return this.request<BrowserListResult>('browser.list', params);
  }

  /**
   * Take a screenshot of a browser tab.
   */
  async screenshot(params: BrowserScreenshotParams): Promise<BrowserScreenshotResult> {
    return this.request<BrowserScreenshotResult>('browser.screenshot', params);
  }

  /**
   * Evaluate JavaScript in a browser tab.
   */
  async eval(params: BrowserEvalParams): Promise<BrowserEvalResult> {
    return this.request<BrowserEvalResult>('browser.eval', params);
  }
}
