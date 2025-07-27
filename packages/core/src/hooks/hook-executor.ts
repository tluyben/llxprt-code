/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import { 
  HookConfig, 
  HookEventData, 
  HookResult, 
  HookExecutionResult, 
  HookCommand,
  HookMatcher,
  HookEventName,
  HookJsonOutput,
  HOOK_EVENTS
} from './hook-types.js';

/**
 * Claude Code-compatible hook executor that handles command execution and result processing.
 */
export class HookExecutor {
  private static readonly DEFAULT_TIMEOUT = 60; // seconds
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  /**
   * Execute all matching hooks for a given event.
   * @param eventName - Name of the hook event
   * @param eventData - Data to pass to hooks via stdin
   * @param matcher - Optional matcher string for tool-specific events
   * @returns Aggregated results from all matching hooks
   */
  async executeHooks(
    eventName: HookEventName,
    eventData: HookEventData,
    hookConfig: HookConfig,
    matcher?: string
  ): Promise<HookExecutionResult> {
    const matchers = hookConfig[eventName] || [];
    const results: HookResult[] = [];
    let shouldBlock = false;
    let blockReason: string | undefined;
    let shouldContinue = true;
    let stopReason: string | undefined;
    const contextToAdd: string[] = [];

    // Execute all matching hooks in parallel
    const promises = matchers
      .filter(hookMatcher => this.matchesPattern(hookMatcher, matcher))
      .flatMap(hookMatcher => 
        hookMatcher.hooks.map(command => 
          this.executeCommand(command, eventData)
        )
      );

    const hookResults = await Promise.all(promises);
    results.push(...hookResults);

    // Process results according to Claude Code's behavior
    for (const result of results) {
      if (result.exitCode === 2 && result.stderr) {
        // Exit code 2 is blocking
        shouldBlock = true;
        blockReason = result.stderr;
      }

      if (result.jsonOutput) {
        const { decision, reason, continue: cont, stopReason: stop, context } = result.jsonOutput;
        
        if (decision === 'block') {
          shouldBlock = true;
          blockReason = reason;
        }

        if (cont === false) {
          shouldContinue = false;
          stopReason = stop;
        }

        if (context && result.exitCode === 0) {
          contextToAdd.push(context);
        }
      }

      // Add stdout as context for successful hooks (exit code 0)
      if (result.exitCode === 0 && result.stdout && !result.jsonOutput?.suppressOutput) {
        contextToAdd.push(result.stdout);
      }
    }

    return {
      results,
      shouldBlock,
      blockReason,
      shouldContinue,
      stopReason,
      contextToAdd
    };
  }

  /**
   * Execute a single hook command.
   * @param command - Hook command configuration
   * @param eventData - Event data to pass via stdin
   * @returns Hook execution result
   */
  private async executeCommand(command: HookCommand, eventData: HookEventData): Promise<HookResult> {
    const timeoutSeconds = command.timeout || HookExecutor.DEFAULT_TIMEOUT;
    const timeoutMs = timeoutSeconds * 1000;
    let timedOut = false;

    if (this.debug) {
      console.debug(`[DEBUG] Executing hook command: ${command.command} with timeout ${timeoutSeconds}s`);
    }

    return new Promise((resolve) => {
      const child = spawn(command.command, {
        shell: true,
        cwd: eventData.cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let error: Error | undefined;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeoutMs);

      // Send event data via stdin
      child.stdin.write(JSON.stringify(eventData));
      child.stdin.end();

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        error = err;
      });

      child.on('close', (exitCode) => {
        clearTimeout(timeoutId);
        
        // Try to parse JSON output from stdout
        let jsonOutput: HookJsonOutput | undefined;
        try {
          if (stdout.trim()) {
            jsonOutput = JSON.parse(stdout.trim());
          }
        } catch {
          // Not JSON output, treat as regular stdout
        }

        const result: HookResult = {
          success: exitCode === 0,
          exitCode: exitCode ?? -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timedOut,
          error,
          jsonOutput
        };

        if (this.debug) {
          console.debug(`[DEBUG] Hook command completed with status ${result.exitCode}`);
        }

        resolve(result);
      });
    });
  }

  /**
   * Check if a hook matcher pattern matches the given tool name.
   * @param hookMatcher - Hook matcher configuration
   * @param toolName - Tool name to match against (for PreToolUse/PostToolUse)
   * @returns Whether the pattern matches
   */
  private matchesPattern(hookMatcher: HookMatcher, toolName?: string): boolean {
    // If no matcher is specified, hook applies to all events of this type
    if (!hookMatcher.matcher) {
      return true;
    }

    // If no tool name provided but matcher is specified, no match
    if (!toolName) {
      return false;
    }

    try {
      const regex = new RegExp(hookMatcher.matcher);
      return regex.test(toolName);
    } catch {
      // If regex is invalid, fall back to exact string match
      return hookMatcher.matcher === toolName;
    }
  }
}