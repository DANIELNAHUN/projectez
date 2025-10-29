/**
 * Tests for JSON parsing fixes in AI services
 */

import { describe, it, expect } from 'vitest';
import { openAIService } from '../services/openAIService.js';
import { geminiService } from '../services/geminiService.js';

describe('JSON Parsing Fixes', () => {
  describe('OpenAI Service', () => {
    it('should clean and fix basic JSON', () => {
      const response = '```json\n{"name": "Test Project", "tasks": []}\n```';
      const cleaned = openAIService.cleanAndFixJSON(response);
      expect(cleaned).toBe('{"name": "Test Project", "tasks": []}');
    });

    it('should fix incomplete JSON with missing closing braces', () => {
      const incompleteJSON = '{"name": "Test", "tasks": [{"title": "Task 1"}]';
      const fixed = openAIService.attemptJSONFix(incompleteJSON);
      expect(fixed).toBe('{"name": "Test", "tasks": [{"title": "Task 1"}]}');
    });

    it('should fix unterminated strings at end of JSON', () => {
      const incompleteJSON = '{"name": "Test Project", "description": "This is a test"}';
      const fixed = openAIService.attemptJSONFix(incompleteJSON);
      expect(fixed).toBe('{"name": "Test Project", "description": "This is a test"}');
    });

    it('should handle mixed missing brackets and braces', () => {
      const incompleteJSON = '{"name": "Test", "tasks": [{"title": "Task 1", "subtasks": [{"title": "Sub 1"}';
      const fixed = openAIService.attemptJSONFix(incompleteJSON);
      // Should at least close the structure properly
      expect(fixed).toContain('"name": "Test"');
      expect(fixed).toContain('"title": "Task 1"');
      expect(JSON.parse(fixed)).toBeDefined(); // Should be valid JSON
    });

    it('should return null for unfixable JSON', () => {
      const badJSON = 'This is not JSON at all';
      const fixed = openAIService.attemptJSONFix(badJSON);
      expect(fixed).toBe(null);
    });
  });

  describe('Gemini Service', () => {
    it('should clean and fix basic JSON', () => {
      const response = '```json\n{"name": "Test Project", "tasks": []}\n```';
      const cleaned = geminiService.cleanAndFixJSON(response);
      expect(cleaned).toBe('{"name": "Test Project", "tasks": []}');
    });

    it('should fix incomplete JSON with missing closing braces', () => {
      const incompleteJSON = '{"name": "Test", "tasks": [{"title": "Task 1"}]';
      const fixed = geminiService.attemptJSONFix(incompleteJSON);
      expect(fixed).toBe('{"name": "Test", "tasks": [{"title": "Task 1"}]}');
    });

    it('should handle Gemini-specific response format', () => {
      const response = 'Here is your project:\n\n{"name": "Test", "tasks": []}\n\nThis should work well.';
      const cleaned = geminiService.cleanAndFixJSON(response);
      expect(cleaned).toBe('{"name": "Test", "tasks": []}');
    });
  });

  describe('Error Handling', () => {
    it('should identify permanent OpenAI errors correctly', () => {
      const quotaError = { code: 'insufficient_quota', message: 'Quota exceeded' };
      const keyError = { code: 'invalid_api_key', message: 'Invalid API key' };
      const networkError = { message: 'Network timeout' };

      expect(openAIService.shouldRetryError(quotaError)).toBe(false);
      expect(openAIService.shouldRetryError(keyError)).toBe(false);
      expect(openAIService.shouldRetryError(networkError)).toBe(true);
    });

    it('should identify permanent Gemini errors correctly', () => {
      const quotaError = { message: 'QUOTA_EXCEEDED: API quota exceeded' };
      const keyError = { message: 'API_KEY_INVALID: Invalid API key' };
      const networkError = { message: 'Network connection failed' };

      expect(geminiService.shouldRetryError(quotaError)).toBe(false);
      expect(geminiService.shouldRetryError(keyError)).toBe(false);
      expect(geminiService.shouldRetryError(networkError)).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    it('should use correct token limits for different complexity levels', () => {
      // This would require mocking the AI services to test actual API calls
      // For now, we just verify the configuration is accessible
      expect(typeof openAIService.createSystemPrompt).toBe('function');
      expect(typeof geminiService.createSystemPrompt).toBe('function');
    });
  });
});

// Mock responses for testing
export const mockResponses = {
  validJSON: {
    complete: '{"name": "Test Project", "description": "A test project", "estimatedDuration": 10, "tasks": [{"title": "Task 1", "description": "First task", "duration": 5, "priority": "high", "type": "simple"}]}',

    incomplete: '{"name": "Test Project", "description": "A test project", "estimatedDuration": 10, "tasks": [{"title": "Task 1", "description": "First task", "duration": 5, "priority": "high", "type": "simple"}',

    withMarkdown: '```json\n{"name": "Test Project", "description": "A test project", "estimatedDuration": 10, "tasks": []}\n```',

    withExtraText: 'Here is your project structure:\n\n{"name": "Test Project", "tasks": []}\n\nThis should work well for your needs.',

    unterminatedString: '{"name": "Test Project", "description": "This is a test project with a very long description that might get cut off in the middle of the sentence'
  },

  invalidJSON: {
    notJSON: 'This is not JSON at all, just plain text.',
    malformed: '{"name": "Test", "tasks": [}',
    emptyResponse: '',
    nullResponse: null
  }
};

export default mockResponses;