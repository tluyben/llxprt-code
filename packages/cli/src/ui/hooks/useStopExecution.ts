/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useSession } from './useSession.js';
import { MessageType } from '../types.js';

interface UseStopExecutionOptions {
  /**
   * Called before stopping execution
   * Return false to prevent stopping
   */
  onBeforeStop?: () => boolean | Promise<boolean>;
  
  /**
   * Called after execution is successfully stopped
   */
  onAfterStop?: () => void | Promise<void>;

  /**
   * Called if stopping fails
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for handling execution stopping
 */
export const useStopExecution = (options: UseStopExecutionOptions = {}) => {
  const { addItem } = useSession();
  const { onBeforeStop, onAfterStop, onError } = options;

  const stopExecution = useCallback(
    async () => {
      try {
        // Call onBeforeStop if provided
        if (onBeforeStop) {
          const shouldContinue = await onBeforeStop();
          if (!shouldContinue) {
            return false;
          }
        }

        // Add stop message to history
        addItem(
          {
            type: MessageType.SYSTEM,
            text: 'Execution stopped by user',
          },
          Date.now(),
        );

        // Call onAfterStop if provided
        if (onAfterStop) {
          await onAfterStop();
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
    [addItem, onBeforeStop, onAfterStop, onError],
  );

  return stopExecution;
};