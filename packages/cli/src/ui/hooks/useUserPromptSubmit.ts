/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useSession } from './useSession.js';
import { MessageType } from '../types.js';
import { HookExecutor, HOOK_EVENTS, UserPromptSubmitEventData } from '@vybestack/llxprt-code-core';

interface UseUserPromptSubmitOptions {
  /**
   * Called before the prompt is submitted
   * Return false to prevent submission
   */
  onBeforeSubmit?: (prompt: string) => boolean | Promise<boolean>;
  
  /**
   * Called after the prompt is successfully submitted
   */
  onAfterSubmit?: (prompt: string) => void | Promise<void>;

  /**
   * Called if submission fails
   */
  onError?: (error: Error) => void;

  /**
   * Hook executor for UserPromptSubmit hooks
   */
  hookExecutor?: HookExecutor;

  /**
   * Hook configuration
   */
  hookConfig?: any;

  /**
   * Session ID for hook context
   */
  sessionId?: string;

  /**
   * Transcript path for hook context
   */
  transcriptPath?: string;
}

/**
 * Hook for handling user prompt submissions with Claude Code hook support
 */
export const useUserPromptSubmit = (options: UseUserPromptSubmitOptions = {}) => {
  const { addItem } = useSession();
  const { onBeforeSubmit, onAfterSubmit, onError, hookExecutor, hookConfig, sessionId, transcriptPath } = options;

  const submitPrompt = useCallback(
    async (prompt: string) => {
      try {
        // Execute UserPromptSubmit hooks if available
        if (hookExecutor && hookConfig && sessionId) {
          const eventData: UserPromptSubmitEventData = {
            hook_event_name: HOOK_EVENTS.USER_PROMPT_SUBMIT,
            session_id: sessionId,
            transcript_path: transcriptPath || '/tmp/gemini-cli-transcript.json',
            cwd: process.cwd(),
            user_prompt: prompt,
          };

          try {
            const hookResults = await hookExecutor.executeHooks(
              HOOK_EVENTS.USER_PROMPT_SUBMIT,
              eventData,
              hookConfig
            );

            // Check if hooks block submission
            if (hookResults.shouldBlock) {
              console.warn(`User prompt submission blocked by hook: ${hookResults.blockReason}`);
              return false;
            }

            // Add any context provided by hooks to the prompt
            if (hookResults.context) {
              console.log(`Hook context: ${hookResults.context}`);
            }
          } catch (hookError) {
            console.warn(`UserPromptSubmit hook execution failed: ${hookError}`);
            // Continue with submission even if hooks fail
          }
        }

        // Call onBeforeSubmit if provided
        if (onBeforeSubmit) {
          const shouldContinue = await onBeforeSubmit(prompt);
          if (!shouldContinue) {
            return false;
          }
        }

        // Add the user's prompt to the history
        addItem(
          {
            type: MessageType.USER,
            text: prompt,
          },
          Date.now(),
        );

        // Call onAfterSubmit if provided
        if (onAfterSubmit) {
          await onAfterSubmit(prompt);
        }

        return true;
      } catch (error) {
        // Handle errors
        if (onError && error instanceof Error) {
          onError(error);
        }
        return false;
      }
    },
    [addItem, onBeforeSubmit, onAfterSubmit, onError, hookExecutor, hookConfig, sessionId, transcriptPath],
  );

  return submitPrompt;
};