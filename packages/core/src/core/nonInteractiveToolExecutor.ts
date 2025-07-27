/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  logToolCall,
  ToolCallRequestInfo,
  ToolCallResponseInfo,
  ToolRegistry,
  ToolResult,
} from '../index.js';
import { Config } from '../config/config.js';
import { convertToFunctionResponse } from './coreToolScheduler.js';

/**
 * Executes a single tool call non-interactively with hook support.
 * It does not handle confirmations, multiple calls, or live updates.
 */
export async function executeToolCall(
  config: Config,
  toolCallRequest: ToolCallRequestInfo,
  toolRegistry: ToolRegistry,
  abortSignal?: AbortSignal,
): Promise<ToolCallResponseInfo> {
  const tool = toolRegistry.getTool(toolCallRequest.name);

  const startTime = Date.now();
  if (!tool) {
    const error = new Error(
      `Tool "${toolCallRequest.name}" not found in registry.`,
    );
    const durationMs = Date.now() - startTime;
    logToolCall(config, {
      'event.name': 'tool_call',
      'event.timestamp': new Date().toISOString(),
      function_name: toolCallRequest.name,
      function_args: toolCallRequest.args,
      duration_ms: durationMs,
      success: false,
      error: error.message,
      prompt_id: toolCallRequest.prompt_id,
    });
    // Ensure the response structure matches what the API expects for an error
    return {
      callId: toolCallRequest.callId,
      responseParts: {
        functionResponse: {
          id: toolCallRequest.callId,
          name: toolCallRequest.name,
          response: { error: error.message },
        },
      },
      resultDisplay: error.message,
      error,
    };
  }

  try {
    // Use hook-aware tool execution if available, otherwise fallback to direct execution
    let toolResult: ToolResult;
    if (typeof toolRegistry.executeToolWithHooks === 'function') {
      // Try hook-aware execution with session context
      try {
        toolResult = await toolRegistry.executeToolWithHooks(
          toolCallRequest.name,
          toolCallRequest.args,
          config.getSessionId(),
          // Use a default transcript path for non-interactive mode
          process.env.LLXPRT_TRANSCRIPT_PATH || '/tmp/gemini-cli-transcript.json'
        );
      } catch (hookError) {
        // If hooks fail, fall back to direct execution
        console.warn(`Hook execution failed, falling back to direct execution: ${hookError}`);
        const effectiveAbortSignal = abortSignal ?? new AbortController().signal;
        toolResult = await tool.execute(
          toolCallRequest.args,
          effectiveAbortSignal,
          // No live output callback for non-interactive mode
        );
      }
    } else {
      // Direct execution without hooks
      const effectiveAbortSignal = abortSignal ?? new AbortController().signal;
      toolResult = await tool.execute(
        toolCallRequest.args,
        effectiveAbortSignal,
        // No live output callback for non-interactive mode
      );
    }

    const tool_output = toolResult.llmContent;

    const tool_display = toolResult.returnDisplay;

    const durationMs = Date.now() - startTime;
    logToolCall(config, {
      'event.name': 'tool_call',
      'event.timestamp': new Date().toISOString(),
      function_name: toolCallRequest.name,
      function_args: toolCallRequest.args,
      duration_ms: durationMs,
      success: true,
      prompt_id: toolCallRequest.prompt_id,
    });

    const response = convertToFunctionResponse(
      toolCallRequest.name,
      toolCallRequest.callId,
      tool_output,
    );

    return {
      callId: toolCallRequest.callId,
      responseParts: response,
      resultDisplay: tool_display,
      error: undefined,
    };
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const durationMs = Date.now() - startTime;
    logToolCall(config, {
      'event.name': 'tool_call',
      'event.timestamp': new Date().toISOString(),
      function_name: toolCallRequest.name,
      function_args: toolCallRequest.args,
      duration_ms: durationMs,
      success: false,
      error: error.message,
      prompt_id: toolCallRequest.prompt_id,
    });
    return {
      callId: toolCallRequest.callId,
      responseParts: {
        functionResponse: {
          id: toolCallRequest.callId,
          name: toolCallRequest.name,
          response: { error: error.message },
        },
      },
      resultDisplay: error.message,
      error,
    };
  }
}
