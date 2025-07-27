/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useStopExecution } from './useStopExecution.js';
import { useSession } from './useSession.js';
import { MessageType } from '../types.js';

// Mock useSession
jest.mock('./useSession', () => ({
  useSession: jest.fn(),
}));

describe('useStopExecution', () => {
  const mockAddItem = jest.fn();
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      addItem: mockAddItem,
      dispatch: mockDispatch,
    });
  });

  it('should stop execution successfully', async () => {
    const { result } = renderHook(() => useStopExecution());

    const success = await result.current();

    expect(success).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_EXECUTION_STOPPED',
      payload: true,
    });
    expect(mockAddItem).toHaveBeenCalledWith(
      {
        type: MessageType.SYSTEM,
        text: 'Execution stopped by user',
      },
      expect.any(Number),
    );
  });

  it('should call onBeforeStop and onAfterStop', async () => {
    const onBeforeStop = jest.fn().mockReturnValue(true);
    const onAfterStop = jest.fn();

    const { result } = renderHook(() =>
      useStopExecution({ onBeforeStop, onAfterStop }),
    );

    const success = await result.current();

    expect(success).toBe(true);
    expect(onBeforeStop).toHaveBeenCalled();
    expect(onAfterStop).toHaveBeenCalled();
  });

  it('should not stop if onBeforeStop returns false', async () => {
    const onBeforeStop = jest.fn().mockReturnValue(false);
    const onAfterStop = jest.fn();

    const { result } = renderHook(() =>
      useStopExecution({ onBeforeStop, onAfterStop }),
    );

    const success = await result.current();

    expect(success).toBe(false);
    expect(onBeforeStop).toHaveBeenCalled();
    expect(onAfterStop).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('test error');
    const onError = jest.fn();
    mockDispatch.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useStopExecution({ onError }));

    const success = await result.current();

    expect(success).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
  });
});