/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useUserPromptSubmit } from './useUserPromptSubmit.js';
import { useSession } from './useSession.js';
import { MessageType } from '../types.js';

// Mock useSession
jest.mock('./useSession', () => ({
  useSession: jest.fn(),
}));

describe('useUserPromptSubmit', () => {
  const mockAddItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ addItem: mockAddItem });
  });

  it('should submit prompt successfully', async () => {
    const { result } = renderHook(() => useUserPromptSubmit());
    const prompt = 'test prompt';

    const success = await result.current(prompt);

    expect(success).toBe(true);
    expect(mockAddItem).toHaveBeenCalledWith(
      {
        type: MessageType.USER,
        text: prompt,
      },
      expect.any(Number),
    );
  });

  it('should call onBeforeSubmit and onAfterSubmit', async () => {
    const onBeforeSubmit = jest.fn().mockReturnValue(true);
    const onAfterSubmit = jest.fn();

    const { result } = renderHook(() =>
      useUserPromptSubmit({ onBeforeSubmit, onAfterSubmit }),
    );
    const prompt = 'test prompt';

    const success = await result.current(prompt);

    expect(success).toBe(true);
    expect(onBeforeSubmit).toHaveBeenCalledWith(prompt);
    expect(onAfterSubmit).toHaveBeenCalledWith(prompt);
  });

  it('should not submit if onBeforeSubmit returns false', async () => {
    const onBeforeSubmit = jest.fn().mockReturnValue(false);
    const onAfterSubmit = jest.fn();

    const { result } = renderHook(() =>
      useUserPromptSubmit({ onBeforeSubmit, onAfterSubmit }),
    );
    const prompt = 'test prompt';

    const success = await result.current(prompt);

    expect(success).toBe(false);
    expect(onBeforeSubmit).toHaveBeenCalledWith(prompt);
    expect(onAfterSubmit).not.toHaveBeenCalled();
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('test error');
    const onError = jest.fn();
    mockAddItem.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useUserPromptSubmit({ onError }));
    const prompt = 'test prompt';

    const success = await result.current(prompt);

    expect(success).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
  });
});