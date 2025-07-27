/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useSubagentStop } from './useSubagentStop.js';
import { useSession } from './useSession.js';
import { MessageType } from '../types.js';

// Mock useSession
jest.mock('./useSession', () => ({
  useSession: jest.fn(),
}));

describe('useSubagentStop', () => {
  const mockAddItem = jest.fn();
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      addItem: mockAddItem,
      dispatch: mockDispatch,
    });
  });

  it('should stop subagent successfully', async () => {
    const { result } = renderHook(() => useSubagentStop());
    const subagentId = 'test-agent-1';

    const success = await result.current(subagentId);

    expect(success).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_SUBAGENT',
      payload: subagentId,
    });
    expect(mockAddItem).toHaveBeenCalledWith(
      {
        type: MessageType.SYSTEM,
        text: `Subagent ${subagentId} stopped by user`,
      },
      expect.any(Number),
    );
  });

  it('should call onBeforeStop and onAfterStop', async () => {
    const onBeforeStop = jest.fn().mockReturnValue(true);
    const onAfterStop = jest.fn();
    const subagentId = 'test-agent-1';

    const { result } = renderHook(() =>
      useSubagentStop({ onBeforeStop, onAfterStop }),
    );

    const success = await result.current(subagentId);

    expect(success).toBe(true);
    expect(onBeforeStop).toHaveBeenCalledWith(subagentId);
    expect(onAfterStop).toHaveBeenCalledWith(subagentId);
  });

  it('should not stop if onBeforeStop returns false', async () => {
    const onBeforeStop = jest.fn().mockReturnValue(false);
    const onAfterStop = jest.fn();
    const subagentId = 'test-agent-1';

    const { result } = renderHook(() =>
      useSubagentStop({ onBeforeStop, onAfterStop }),
    );

    const success = await result.current(subagentId);

    expect(success).toBe(false);
    expect(onBeforeStop).toHaveBeenCalledWith(subagentId);
    expect(onAfterStop).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('test error');
    const onError = jest.fn();
    const subagentId = 'test-agent-1';
    mockDispatch.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useSubagentStop({ onError }));

    const success = await result.current(subagentId);

    expect(success).toBe(false);
    expect(onError).toHaveBeenCalledWith(error, subagentId);
  });
});