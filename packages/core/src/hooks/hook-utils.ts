/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { isAbsolute, normalize, resolve } from 'node:path';
import type { HookCommand, HookEventData, HookResult } from './hook-types.js';

/**
 * Validates a hook command for security issues
 * @param command - Hook command to validate
 * @throws Error if validation fails
 */
export function validateHookSecurity(command: HookCommand): void {
  // Validate command
  if (!command.command || typeof command.command !== 'string') {
    throw new Error('Hook must have a valid command string');
  }

  // Validate timeout if specified
  if (command.timeout !== undefined) {
    if (typeof command.timeout !== 'number' || command.timeout < 0) {
      throw new Error('Hook timeout must be a positive number');
    }
  }
}

/**
 * Validates a file path for security issues
 * @param path - Path to validate
 * @throws Error if validation fails
 */
export function validatePath(path: string): void {
  // Ensure path is a string
  if (typeof path !== 'string') {
    throw new Error('Path must be a string');
  }

  // Normalize path to resolve ../ sequences
  const normalizedPath = normalize(path);

  // Check for path traversal attempts
  if (normalizedPath.includes('../')) {
    throw new Error('Path traversal is not allowed');
  }

  // Convert to absolute path if relative
  const absolutePath = isAbsolute(path) ? path : resolve(process.cwd(), path);

  // Additional path validation can be added here
  // For example, checking against allowed directories
}

/**
 * Processes hook results and returns formatted output
 * @param results - Hook execution results to process
 * @returns Formatted results summary
 */
export function processHookResults(results: HookResult[]): string {
  const summary = results.map((result) => {
    const status = result.success ? 'SUCCESS' : 'FAILURE';
    const output = result.stdout ? `\nOutput: ${result.stdout}` : '';
    const error = result.error ? `\nError: ${result.error.message}` : '';
    const timedOut = result.timedOut ? `\nTimed out: true` : '';

    return `Status: ${status}${output}${error}${timedOut}
---`;
  });

  return summary.join('\n');
}

/**
 * Formats hook event data for logging
 * @param eventData - Hook event data to format
 * @returns Formatted event data string
 */
export function formatEventData(eventData: HookEventData): string {
  const parts = [`Event: ${eventData.hook_event_name}`];

  if ('tool_name' in eventData) {
    parts.push(`Tool: ${eventData.tool_name}`);
  }

  if ('prompt' in eventData) {
    parts.push(`Prompt: ${eventData.prompt}`);
  }

  if ('message' in eventData) {
    parts.push(`Message: ${eventData.message}`);
  }

  parts.push(`Session: ${eventData.session_id}`);
  parts.push(`CWD: ${eventData.cwd}`);

  return parts.join('\n');
}