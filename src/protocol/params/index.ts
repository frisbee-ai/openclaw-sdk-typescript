/**
 * Protocol Params Index
 *
 * Re-exports all per-domain parameter types.
 *
 * @module protocol/params
 */

export type * from './chat.js';
export type * from './agents.js';
export type * from './sessions.js';
// Note: config.js and skills.js both export ToolsEffectiveParams/ToolsEffectiveResult
// Only re-export from config.js (first wins via selective re-export below)
export type {
  ConfigGetParams,
  ConfigSetParams,
  ConfigApplyParams,
  ConfigPatchParams,
  ConfigSchemaParams,
  ConfigSchemaResponse,
  ConfigSchemaLookupParams,
  ConfigSchemaLookupResult,
  ToolsEffectiveParams,
  ToolsEffectiveResult,
  WizardStartParams,
  WizardNextParams,
  WizardCancelParams,
  WizardStatusParams,
  WizardNextResult,
  WizardStartResult,
  WizardStatusResult,
} from './config.js';
export type * from './cron.js';
export type * from './nodes.js';
// Note: skills.js re-exports ToolsEffectiveParams/ToolsEffectiveResult from config
// to avoid conflict in this barrel, we selectively exclude them
export type {
  SkillsStatusParams,
  ToolsCatalogParams,
  ToolsCatalogResult,
  SkillsBinsParams,
  SkillsBinsResult,
  SkillsInstallParams,
  SkillsUpdateParams,
  VoiceWakeStartParams,
  VoiceWakeStopParams,
  VoiceWakeStatusParams,
  VoiceWakeGetParams,
  VoiceWakeSetParams,
} from './skills.js';
export type * from './devicePairing.js';
export type * from './browser.js';
export type * from './push.js';
export type * from './execApprovals.js';
export type * from './system.js';
export type * from './channels.js';
export type * from './secrets.js';
export type * from './usage.js';
