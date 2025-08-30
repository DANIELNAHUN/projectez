/**
 * Unit tests for OpenAIService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIService } from '../../services/openAIService.js';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

describe('OpenAIService', () => {
  let service;
  let mockOpenAI;

  beforeEach(async () => {
    service = new OpenAIService();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Get the mocked OpenAI constructor
    const OpenAI = (await import('openai')).default;
    mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    };
    OpenAI.mockReturnValue(mockOpenAI);
  });

  describe('Configuration', () => {
    it('should not be ready initially', () => {
      expect(service.isReady()).toBe(false);
    });

    it('should configure successfully with valid API key', () => {
      const apiKey = 'sk-test-key-123';
      
      expect(() => service.configure(apiKey)).not.toThrow();
      expect(service.isReady()).toBe(true);
    });

    it('should throw error with invalid API key', () => {
      expect(() => service.configure('')).toThrow('Valid OpenAI API key is required');
      expect(() => service.configure(null)).toThrow('Valid OpenAI API key is required');
      expect(() => service.configure(123)).toThrow('Valid OpenAI API key is required');
    });
  });

  describe('System Prompt Generation', () => {
    it('should create system prompt with default parameters', () => {
      const prompt = service.createSystemPrompt();
      
      expect(prompt).toContain('You are an expert project manager');
      expect(prompt).toContain('valid JSON only');
      expect(prompt).toContain('Complexity level: medium');
      expect(prompt).toContain('Maximum tasks: 20');
      expect(prompt).toContain('teamMembers');
    });

    it('should create system prompt without team members', () => {
      const prompt = service.createSystemPrompt('basic', false, 10);
      
      expect(prompt).toContain('Complexity level: basic');
      expect(prompt).toContain('Maximum tasks: 10');
      expect(prompt).not.toContain('teamMembers');
    });

    it('should include appropriate complexity guidelines', () => {
      const basicPrompt = service.createSystemPrompt('basic');
      const mediumPrompt = service.createSystemPrompt('medium');
      const detailedPrompt = service.createSystemPrompt('detailed');
      
      expect(basicPrompt).toContain('3-8 main tasks');
      expect(mediumPrompt).toContain('5-15 main tasks');
      expect(detailedPrompt).toContain('10-20 main tasks');
    });
  });

  describe('User Prompt Enhancement', () => {
    it('should enhance basic user prompt', () => {
      const enhanced = service.enhanceUserPrompt('Create a web app');
      
      expect(enhanced).toContain('Create a project for: Create a web app');
      expect(enhanced).toContain('realistic and follows software development best practices');
    });

    it('should include estimated duration when provided', () => {
      const enhanced = service.enhanceUserPrompt('Create a web app', 30);
      
      expect(enhanced).toContain('Estimated total duration: 30 working days');
    });
  });

  describe('Project Generation', () => {
    beforeEach(() => {
      service.configure('sk-test-key-123');
    });

    it('should throw error when not configured', async () => {
      const unconfiguredService = new OpenAIService();
      
      await expect(unconfiguredService.generateProject('test prompt'))
        .rejects.toThrow('OpenAI service is not configured');
    });

    it('should throw error with invalid prompt', async () => {
      await expect(service.generateProject('')).rejects.toThrow('Valid project prompt is required');
      await expect(service.generateProject(null)).rejects.toThrow('Valid project prompt is required');
    });

    it('should generate project successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              name: 'Test Project',
              description: 'A test project',
              estimatedDuration: 10,
              tasks: [{
                title: 'Task 1',
                description: 'First task',
                duration: 5,
                priority: 'high',
                type: 'simple'
              }],
              teamMembers: [{
                name: 'John Doe',
                role: 'Developer',
                email: 'john@example.com'
              }]
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateProject('Create a test project');

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
      expect(result.tasks).toHaveLength(1);
      expect(result.teamMembers).toHaveLength(1);
      expect(result.id).toMatch(/^ai_project_/);
    });

    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('API Error');
      apiError.code = 'rate_limit_exceeded';
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(service.generateProject('test prompt'))
        .rejects.toThrow('OpenAI API rate limit exceeded');
    });

    it('should handle quota exceeded error', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.code = 'insufficient_quota';
      mockOpenAI.chat.completions.create.mockRejectedValue(quotaError);

      await expect(service.generateProject('test prompt'))
        .rejects.toThrow('OpenAI API quota exceeded');
    });

    it('should handle invalid API key error', async () => {
      const keyError = new Error('Invalid API key');
      keyError.code = 'invalid_api_key';
      mockOpenAI.chat.completions.create.mockRejectedValue(keyError);

      await expect(service.generateProject('test prompt'))
        .rejects.toThrow('Invalid OpenAI API key');
    });
  });

  describe('AI Response Processing', () => {
    it('should process valid AI response', () => {
      const validResponse = JSON.stringify({
        name: 'Test Project',
        description: 'A test project',
        estimatedDuration: 10,
        tasks: [{
          title: 'Task 1',
          description: 'First task',
          duration: 5,
          priority: 'high',
          type: 'simple'
        }]
      });

      const result = service.processAIResponse(validResponse);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
      expect(result.tasks).toHaveLength(1);
      expect(result.id).toMatch(/^ai_project_/);
    });

    it('should throw error for invalid JSON', () => {
      const invalidResponse = 'This is not JSON';

      expect(() => service.processAIResponse(invalidResponse))
        .toThrow('Failed to parse AI response as JSON');
    });

    it('should throw error for empty response', () => {
      expect(() => service.processAIResponse(''))
        .toThrow('Invalid AI response received');
      
      expect(() => service.processAIResponse(null))
        .toThrow('Invalid AI response received');
    });
  });

  describe('Project Validation', () => {
    it('should validate valid project data', () => {
      const validProject = {
        name: 'Test Project',
        description: 'A test project',
        estimatedDuration: 10,
        tasks: [{
          title: 'Task 1',
          description: 'First task',
          duration: 5,
          priority: 'high',
          type: 'simple'
        }]
      };

      const result = service.validateGeneratedProject(validProject);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject project without name', () => {
      const invalidProject = {
        description: 'A test project',
        tasks: []
      };

      const result = service.validateGeneratedProject(invalidProject);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have a valid name');
    });

    it('should reject project without tasks', () => {
      const invalidProject = {
        name: 'Test Project',
        description: 'A test project'
      };

      const result = service.validateGeneratedProject(invalidProject);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have a tasks array');
    });

    it('should reject project with empty tasks array', () => {
      const invalidProject = {
        name: 'Test Project',
        description: 'A test project',
        tasks: []
      };

      const result = service.validateGeneratedProject(invalidProject);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have at least one task');
    });

    it('should validate task structure', () => {
      const projectWithInvalidTask = {
        name: 'Test Project',
        description: 'A test project',
        tasks: [{
          // Missing title and duration
          description: 'Task without title'
        }]
      };

      const result = service.validateGeneratedProject(projectWithInvalidTask);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('must have a valid title'))).toBe(true);
      expect(result.errors.some(error => error.includes('must have a valid duration'))).toBe(true);
    });

    it('should warn about invalid task priorities', () => {
      const projectWithInvalidPriority = {
        name: 'Test Project',
        description: 'A test project',
        tasks: [{
          title: 'Task 1',
          description: 'First task',
          duration: 5,
          priority: 'invalid_priority',
          type: 'simple'
        }]
      };

      const result = service.validateGeneratedProject(projectWithInvalidPriority);

      expect(result.warnings.some(warning => warning.includes('invalid priority'))).toBe(true);
    });
  });

  describe('Task Validation', () => {
    it('should validate valid task', () => {
      const validTask = {
        title: 'Test Task',
        description: 'A test task',
        duration: 5,
        priority: 'high',
        type: 'simple'
      };

      const result = service.validateGeneratedTask(validTask, 0);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate task with deliverable', () => {
      const taskWithDeliverable = {
        title: 'Test Task',
        description: 'A test task',
        duration: 5,
        priority: 'high',
        type: 'with_deliverable',
        deliverable: {
          type: 'file',
          description: 'Test deliverable'
        }
      };

      const result = service.validateGeneratedTask(taskWithDeliverable, 0);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate subtasks recursively', () => {
      const taskWithSubtasks = {
        title: 'Parent Task',
        description: 'A parent task',
        duration: 10,
        priority: 'high',
        type: 'simple',
        subtasks: [{
          title: 'Subtask 1',
          description: 'First subtask',
          duration: 3,
          priority: 'medium',
          type: 'simple'
        }, {
          // Invalid subtask without title
          description: 'Subtask without title',
          duration: 2
        }]
      };

      const result = service.validateGeneratedTask(taskWithSubtasks, 0);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('0.1') && error.includes('title'))).toBe(true);
    });
  });

  describe('Data Enhancement', () => {
    it('should enhance project data with IDs and metadata', () => {
      const rawProject = {
        name: 'Test Project',
        description: 'A test project',
        estimatedDuration: 10,
        tasks: [{
          title: 'Task 1',
          description: 'First task',
          duration: 5,
          priority: 'high',
          type: 'simple'
        }],
        teamMembers: [{
          name: 'John Doe',
          role: 'Developer',
          email: 'john@example.com'
        }]
      };

      const enhanced = service.enhanceProjectData(rawProject);

      expect(enhanced.id).toMatch(/^ai_project_/);
      expect(enhanced.status).toBe('active');
      expect(enhanced.createdAt).toBeDefined();
      expect(enhanced.updatedAt).toBeDefined();
      expect(enhanced.tasks[0].id).toMatch(/^task_/);
      expect(enhanced.tasks[0].projectId).toBe(enhanced.id);
      expect(enhanced.teamMembers[0].id).toMatch(/^member_/);
    });

    it('should enhance tasks with proper hierarchy', () => {
      const tasksData = [{
        title: 'Parent Task',
        description: 'A parent task',
        duration: 10,
        subtasks: [{
          title: 'Subtask 1',
          description: 'First subtask',
          duration: 3
        }]
      }];

      const enhanced = service.enhanceTasksData(tasksData, 'project_123');

      expect(enhanced).toHaveLength(1);
      expect(enhanced[0].level).toBe(0);
      expect(enhanced[0].subtasks).toHaveLength(1);
      expect(enhanced[0].subtasks[0].level).toBe(1);
      expect(enhanced[0].subtasks[0].parentTaskId).toBe(enhanced[0].id);
    });
  });

  describe('Safe Generation', () => {
    beforeEach(() => {
      service.configure('sk-test-key-123');
    });

    it('should return success result for successful generation', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              name: 'Test Project',
              description: 'A test project',
              estimatedDuration: 10,
              tasks: [{
                title: 'Task 1',
                description: 'First task',
                duration: 5,
                priority: 'high',
                type: 'simple'
              }]
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateProjectSafe('Create a test project');

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.retryCount).toBe(0);
    });

    it('should handle errors and return failure result', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await service.generateProjectSafe('test prompt', { maxRetries: 1 });

      expect(result.success).toBe(false);
      expect(result.project).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should not retry on configuration errors', async () => {
      const configError = new Error('OpenAI service is not configured');
      mockOpenAI.chat.completions.create.mockRejectedValue(configError);

      const result = await service.generateProjectSafe('test prompt', { maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1); // Should not retry
    });
  });

  describe('Connection Testing', () => {
    it('should return failure when not configured', async () => {
      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenAI service is not configured');
    });

    it('should return success for valid connection', async () => {
      service.configure('sk-test-key-123');
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: { content: 'Connection successful' }
        }]
      });

      const result = await service.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('OpenAI connection successful');
      expect(result.model).toBe('gpt-3.5-turbo');
    });

    it('should return failure for connection error', async () => {
      service.configure('sk-test-key-123');
      
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Connection failed'));

      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });
});