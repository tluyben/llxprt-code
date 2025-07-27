/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useSession } from './useSession.js';
import { MessageType } from '../types.js';

interface UseSubagentStopOptions {
  /**
   * Called before stopping the subagent
   * Return false to prevent stopping
   */
  onBeforeStop?: (subagentId: string) => boolean | Promise<boolean>;
  
  /**
   * Called after subagent is successfully stopped
   */
  onAfterStop?: (subagentId: string) => void | Promise<void>;

  /**
   * Called if stopping fails
   */
  onError?: (error: Error, subagentId: string) => void;
}

/**
 * Hook for handling subagent stopping for Task tool
 */
export const useSubagentStop = (options: UseSubagentStopOptions = {}) => {
  const { addItem } = useSession();
  const { onBeforeStop, onAfterStop, onError } = options;

  const stopSubagent = useCallback(
    async (subagentId: string) => {
      try {
        // Call onBeforeStop if provided
        if (onBeforeStop) {
          const shouldContinue = await onBeforeStop(subagentId);
          if (!shouldContinue) {
            return false;
          }
        }

        // Add stop message to history
        addItem(
          {
            type: MessageType.SYSTEM,
            text: `Subagent ${subagentId} stopped by user`,
          },
          Date.now(),
        );

        // Call onAfterStop if provided
        if (onAfterStop) {
          await onAfterStop(subagentId);
        }

        return true;
      } catch (error) {
        // Handle errors
        if (onError && error instanceof Error) {
          onError(error, subagentId);
        }
        return false;
      }
    },
    [addItem, onBeforeStop, onAfterStop, onError],
  );

  return stopSubagent;
};