#!/usr/bin/env node

/**
 * Simple test to verify the hooks system implementation works
 */

import { HookExecutor, HOOK_EVENTS } from './packages/core/dist/index.js';

async function testHooksSystem() {
  console.log('Testing hooks system...');

  const hookExecutor = new HookExecutor(true); // debug mode

  const testHookConfig = {
    [HOOK_EVENTS.PRE_TOOL_USE]: [
      {
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command: 'echo "Hook executed for Bash tool"',
            timeout: 5
          }
        ]
      }
    ]
  };

  const testEventData = {
    session_id: 'test-session-123',
    transcript_path: '/tmp/test-transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: HOOK_EVENTS.PRE_TOOL_USE,
    tool_name: 'Bash',
    tool_input: { command: 'echo "test"' }
  };

  try {
    console.log('Executing hooks for Bash tool...');
    const result = await hookExecutor.executeHooks(
      HOOK_EVENTS.PRE_TOOL_USE,
      testEventData,
      testHookConfig,
      'Bash'
    );

    console.log('Hook execution result:', {
      resultsCount: result.results.length,
      shouldBlock: result.shouldBlock,
      contextToAdd: result.contextToAdd
    });

    if (result.results.length > 0) {
      console.log('First hook result:', {
        success: result.results[0].success,
        exitCode: result.results[0].exitCode,
        stdout: result.results[0].stdout,
        stderr: result.results[0].stderr
      });
    }

    console.log('✅ Hooks system test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Hooks system test failed:', error.message);
    return false;
  }
}

// Run the test
testHooksSystem().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});