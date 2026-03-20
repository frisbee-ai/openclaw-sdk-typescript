/**
 * Shared type for API namespace request functions.
 *
 * @module api/shared
 */

/** Request function type used by all API namespaces */
export type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;
