/**
 * Browser API Parameter Types
 *
 * Parameter and result types for browser/tab operations.
 *
 * @module protocol/params/browser
 */

export interface BrowserOpenParams {
  url: string;
  nodeId?: string;
}

export interface BrowserOpenResult {
  tabId: string;
}

export interface BrowserCloseParams {
  tabId: string;
}

export interface BrowserCloseResult {}

export interface BrowserListParams {}

export interface BrowserScreenshotParams {
  tabId: string;
}

export interface BrowserScreenshotResult {
  imageUrl: string;
}

export interface BrowserEvalParams {
  tabId: string;
  script: string;
}

export interface BrowserEvalResult {
  result: unknown;
}

export interface BrowserRequestParams {
  action: string;
  params?: unknown;
}

export interface BrowserRequestResult {
  result: unknown;
}
