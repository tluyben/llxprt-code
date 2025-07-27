/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported hook event names matching Claude Code's system.
 */
export const HOOK_EVENTS = {
  USER_PROMPT_SUBMIT: 'UserPromptSubmit',
  PRE_TOOL_USE: 'PreToolUse',
  POST_TOOL_USE: 'PostToolUse',
  STOP: 'Stop',
  SUBAGENT_STOP: 'SubagentStop',
  NOTIFICATION: 'Notification',
  PRE_COMPACT: 'PreCompact',
} as const;

export type HookEventName = typeof HOOK_EVENTS[keyof typeof HOOK_EVENTS];

/**
 * Configuration for a single hook command - matches Claude Code format.
 */
export interface HookCommand {
  type: 'command';
  command: string;
  timeout?: number; // in seconds, defaults to 60
}

/**
 * Configuration for hook matchers - matches Claude Code format.
 */
export interface HookMatcher {
  matcher?: string; // regex pattern for tool names, optional for events that don't use matchers
  hooks: HookCommand[];
}

/**
 * Complete hook configuration structure - matches Claude Code format.
 */
export interface HookConfig {
  [HOOK_EVENTS.USER_PROMPT_SUBMIT]?: HookMatcher[];
  [HOOK_EVENTS.PRE_TOOL_USE]?: HookMatcher[];
  [HOOK_EVENTS.POST_TOOL_USE]?: HookMatcher[];
  [HOOK_EVENTS.STOP]?: HookMatcher[];
  [HOOK_EVENTS.SUBAGENT_STOP]?: HookMatcher[];
  [HOOK_EVENTS.NOTIFICATION]?: HookMatcher[];
  [HOOK_EVENTS.PRE_COMPACT]?: HookMatcher[];
}

/**
 * Base data provided to all hooks via stdin as JSON.
 */
export interface BaseHookEventData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: HookEventName;
}

/**
 * Data provided to UserPromptSubmit hooks.
 */
export interface UserPromptSubmitEventData extends BaseHookEventData {
  hook_event_name: typeof HOOK_EVENTS.USER_PROMPT_SUBMIT;
  prompt: string;
}

/**
 * Data provided to PreToolUse hooks.
 */
export interface PreToolUseEventData extends BaseHookEventData {
  hook_event_name: typeof HOOK_EVENTS.PRE_TOOL_USE;
  tool_name: string;
  tool_input: Record<string, unknown>;
}

/**
 * Data provided to PostToolUse hooks.
 */
export interface PostToolUseEventData extends BaseHookEventData {
  hook_event_name: typeof HOOK_EVENTS.POST_TOOL_USE;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: Record<string, unknown>;
}

/**
 * Data provided to Stop and SubagentStop hooks.
 */
export interface StopEventData extends BaseHookEventData {
  hook_event_name: typeof HOOK_EVENTS.STOP | typeof HOOK_EVENTS.SUBAGENT_STOP;
  stop_hook_active: boolean;
}

/**
 * Data provided to Notification hooks.
 */
export interface NotificationEventData extends BaseHookEventData {
  hook_event_name: typeof HOOK_EVENTS.NOTIFICATION;
  message: string;
}

/**
 * Data provided to PreCompact hooks.
 */
export interface PreCompactEventData extends BaseHookEventData {
  hook_event_name: typeof HOOK_EVENTS.PRE_COMPACT;
  trigger: 'manual' | 'auto';
  custom_instructions: string;
}

/**
 * Union type for all hook event data.
 */
export type HookEventData = 
  | UserPromptSubmitEventData
  | PreToolUseEventData
  | PostToolUseEventData
  | StopEventData
  | NotificationEventData
  | PreCompactEventData;

/**
 * Hook decision types for controlling execution flow.
 */
export type HookDecision = 'approve' | 'block' | undefined;

/**
 * Structured JSON output that hooks can return for advanced control.
 */
export interface HookJsonOutput {
  decision?: HookDecision;
  reason?: string;
  continue?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
  context?: string;
}

/**
 * Result of executing a single hook command.
 */
export interface HookResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error?: Error;
  jsonOutput?: HookJsonOutput;
}

/**
 * Aggregated results from executing multiple hooks for an event.
 */
export interface HookExecutionResult {
  results: HookResult[];
  shouldBlock: boolean;
  blockReason?: string;
  shouldContinue: boolean;
  stopReason?: string;
  contextToAdd: string[];
}