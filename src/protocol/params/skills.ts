/**
 * Skills API Parameter Types
 *
 * Parameter and result types for skill and tool operations.
 *
 * @module protocol/params/skills
 */

export interface SkillsStatusParams {
  skillId?: string;
}

export interface ToolsCatalogParams {}

export interface ToolsCatalogResult {
  tools: unknown[];
}

export interface SkillsBinsParams {}

export interface SkillsBinsResult {
  bins: unknown[];
}

export interface SkillsInstallParams {
  skillId: string;
}

export interface SkillsUpdateParams {
  skillId: string;
}

export interface ToolsEffectiveParams {
  skillId?: string;
  nodeId?: string;
}

export interface ToolsEffectiveResult {
  tools: unknown[];
}

// ============================================================================
// VoiceWake Types
// ============================================================================

export interface VoiceWakeStartParams {
  sensitivity?: number;
  keywords?: string[];
}

export interface VoiceWakeStopParams {}

export interface VoiceWakeStatusParams {}

export interface VoiceWakeGetParams {}

export interface VoiceWakeSetParams {
  enabled?: boolean;
  sensitivity?: number;
  keywords?: string[];
}
