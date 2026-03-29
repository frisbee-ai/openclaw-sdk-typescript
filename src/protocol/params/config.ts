/**
 * Config API Parameter Types
 *
 * Parameter and result types for configuration operations.
 *
 * @module protocol/params/config
 */

import type { WizardStep } from '../api-common.js';

export interface ConfigGetParams {
  key?: string;
}

export interface ConfigSetParams {
  key: string;
  value: unknown;
}

export interface ConfigApplyParams {}

export interface ConfigPatchParams {
  patches: Array<{ op: string; path: string; value?: unknown }>;
}

export interface ConfigSchemaParams {
  key?: string;
}

export interface ConfigSchemaResponse {
  schema: unknown;
}

export interface ConfigSchemaLookupParams {
  key: string;
}

export interface ConfigSchemaLookupResult {
  schema: unknown;
}

export interface ToolsEffectiveParams {
  skillId?: string;
  nodeId?: string;
}

export interface ToolsEffectiveResult {
  tools: unknown[];
}

// ============================================================================
// Wizard Types
// ============================================================================

export interface WizardStartParams {
  wizardId: string;
  input?: unknown;
}

export interface WizardNextParams {
  wizardId: string;
  input?: unknown;
}

export interface WizardCancelParams {
  wizardId: string;
}

export interface WizardStatusParams {
  wizardId: string;
}

export interface WizardNextResult {
  step: WizardStep;
  complete: boolean;
}

export interface WizardStartResult extends WizardNextResult {}

export interface WizardStatusResult {
  currentStep: WizardStep;
  complete: boolean;
}
