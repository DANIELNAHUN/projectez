/**
 * OpenAIService - Handles AI project generation using OpenAI API
 * Provides methods to generate complete projects from user prompts
 */

import OpenAI from 'openai';
import { Project, Task, TeamMember, Deliverable } from '../models/index.js';

export class OpenAIService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
  }

  /**
   * Configure OpenAI client with API key
   * @param {string} apiKey - OpenAI API key
   */
  configure(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Valid OpenAI API key is required');
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, API calls should go through a backend
      });
      this.isConfigured = true;
    } catch (error) {
      throw new Error(`Failed to configure OpenAI client: ${error.message}`);
    }
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} Configuration status
   */
  isReady() {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Generate project from user prompt
   * @param {string} prompt - User description of the project
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated project data
   */
  async generateProject(prompt, options = {}) {
    if (!this.isReady()) {
      throw new Error('OpenAI service is not configured. Please provide an API key.');
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Valid project prompt is required');
    }

    const {
      complexity = 'medium',
      includeTeamMembers = true,
      maxTasks = 20,
      estimatedDuration = null
    } = options;

    try {
      const systemPrompt = this.createSystemPrompt(complexity, includeTeamMembers, maxTasks);
      const userPrompt = this.enhanceUserPrompt(prompt, estimatedDuration);

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response received from OpenAI');
      }

      const aiResponse = response.choices[0].message.content;
      return this.processAIResponse(aiResponse);

    } catch (error) {
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
  }

  /**
   * Create system prompt for project generation
   * @param {string} complexity - Project complexity level
   * @param {boolean} includeTeamMembers - Whether to include team members
   * @param {number} maxTasks - Maximum number of tasks to generate
   * @returns {string} System prompt
   */
  createSystemPrompt(complexity = 'medium', includeTeamMembers = true, maxTasks = 20) {
    return `You are an expert project manager and software architect. Your task is to generate a comprehensive project structure from user descriptions.

IMPORTANT: You must respond with valid JSON only. Do not include any explanations or additional text outside the JSON.

Generate a project with the following structure:
{
  "name": "Project Name",
  "description": "Detailed project description",
  "estimatedDuration": number_of_working_days,
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed task description",
      "duration": number_of_working_days,
      "priority": "low|medium|high",
      "type": "simple|with_deliverable",
      "dependencies": ["task_title_1", "task_title_2"],
      "deliverable": {
        "type": "presentation|file|exposition|other",
        "description": "Deliverable description"
      },
      "subtasks": [
        {
          "title": "Subtask title",
          "description": "Subtask description",
          "duration": number_of_working_days,
          "priority": "low|medium|high",
          "type": "simple|with_deliverable"
        }
      ]
    }
  ]${includeTeamMembers ? `,
  "teamMembers": [
    {
      "name": "Team member name",
      "role": "Role/Position",
      "email": "email@example.com"
    }
  ]` : ''}
}

Guidelines:
- Complexity level: ${complexity}
- Maximum tasks: ${maxTasks}
- Duration should be realistic working days (Monday-Saturday, excluding Sunday)
- Create a logical hierarchy with main tasks and subtasks
- Include dependencies between tasks where appropriate
- For ${complexity} complexity: ${this.getComplexityGuidelines(complexity)}
- Only include deliverable object if type is "with_deliverable"
- Dependencies should reference exact task titles
- Ensure all durations are positive integers
- Make task descriptions specific and actionable
- Assign appropriate priorities based on task importance and dependencies`;
  }

  /**
   * Get complexity-specific guidelines
   * @param {string} complexity - Complexity level
   * @returns {string} Guidelines for the complexity level
   */
  getComplexityGuidelines(complexity) {
    switch (complexity) {
      case 'basic':
        return 'Create 3-8 main tasks with minimal subtasks. Focus on essential milestones.';
      case 'medium':
        return 'Create 5-15 main tasks with relevant subtasks. Include planning, development, and testing phases.';
      case 'detailed':
        return 'Create 10-20 main tasks with comprehensive subtasks. Include detailed planning, development, testing, deployment, and maintenance phases.';
      default:
        return 'Create a balanced project structure with appropriate task breakdown.';
    }
  }

  /**
   * Enhance user prompt with additional context
   * @param {string} prompt - Original user prompt
   * @param {number} estimatedDuration - Optional estimated duration
   * @returns {string} Enhanced prompt
   */
  enhanceUserPrompt(prompt, estimatedDuration = null) {
    let enhancedPrompt = `Create a project for: ${prompt}`;
    
    if (estimatedDuration) {
      enhancedPrompt += `\n\nEstimated total duration: ${estimatedDuration} working days`;
    }

    enhancedPrompt += `\n\nPlease ensure the project structure is realistic and follows software development best practices. Include appropriate task dependencies and realistic time estimates.`;

    return enhancedPrompt;
  }

  /**
   * Process AI response and convert to project structure
   * @param {string} response - Raw AI response
   * @returns {Object} Processed project data
   */
  processAIResponse(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid AI response received');
    }

    let projectData;
    try {
      projectData = JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
    }

    // Validate and process the generated project
    const validation = this.validateGeneratedProject(projectData);
    if (!validation.isValid) {
      throw new Error(`Generated project validation failed: ${validation.errors.join(', ')}`);
    }

    // Process and enhance the project data
    return this.enhanceProjectData(projectData);
  }

  /**
   * Validate generated project structure
   * @param {Object} projectData - Generated project data
   * @returns {Object} Validation result
   */
  validateGeneratedProject(projectData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate basic structure
    if (!projectData || typeof projectData !== 'object') {
      result.errors.push('Project data must be an object');
      result.isValid = false;
      return result;
    }

    // Validate required fields
    if (!projectData.name || typeof projectData.name !== 'string' || projectData.name.trim() === '') {
      result.errors.push('Project must have a valid name');
      result.isValid = false;
    }

    if (!projectData.description || typeof projectData.description !== 'string') {
      result.warnings.push('Project should have a description');
    }

    if (!projectData.estimatedDuration || typeof projectData.estimatedDuration !== 'number' || projectData.estimatedDuration <= 0) {
      result.warnings.push('Project should have a valid estimated duration');
    }

    // Validate tasks array
    if (!projectData.tasks || !Array.isArray(projectData.tasks)) {
      result.errors.push('Project must have a tasks array');
      result.isValid = false;
    } else if (projectData.tasks.length === 0) {
      result.errors.push('Project must have at least one task');
      result.isValid = false;
    } else {
      // Validate each task
      projectData.tasks.forEach((task, index) => {
        const taskValidation = this.validateGeneratedTask(task, index);
        result.errors.push(...taskValidation.errors);
        result.warnings.push(...taskValidation.warnings);
        if (!taskValidation.isValid) {
          result.isValid = false;
        }
      });
    }

    // Validate team members if present
    if (projectData.teamMembers) {
      if (!Array.isArray(projectData.teamMembers)) {
        result.warnings.push('Team members should be an array');
      } else {
        projectData.teamMembers.forEach((member, index) => {
          if (!member.name || typeof member.name !== 'string') {
            result.warnings.push(`Team member at index ${index} should have a name`);
          }
          if (!member.role || typeof member.role !== 'string') {
            result.warnings.push(`Team member at index ${index} should have a role`);
          }
        });
      }
    }

    return result;
  }

  /**
   * Validate generated task structure
   * @param {Object} task - Task data
   * @param {number} index - Task index for error reporting
   * @returns {Object} Validation result
   */
  validateGeneratedTask(task, index) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!task || typeof task !== 'object') {
      result.errors.push(`Task at index ${index} must be an object`);
      result.isValid = false;
      return result;
    }

    // Validate required fields
    if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
      result.errors.push(`Task at index ${index} must have a valid title`);
      result.isValid = false;
    }

    if (!task.description || typeof task.description !== 'string') {
      result.warnings.push(`Task at index ${index} should have a description`);
    }

    if (!task.duration || typeof task.duration !== 'number' || task.duration <= 0) {
      result.errors.push(`Task at index ${index} must have a valid duration`);
      result.isValid = false;
    }

    // Validate optional fields
    const validPriorities = ['low', 'medium', 'high'];
    if (task.priority && !validPriorities.includes(task.priority)) {
      result.warnings.push(`Task at index ${index} has invalid priority "${task.priority}"`);
    }

    const validTypes = ['simple', 'with_deliverable'];
    if (task.type && !validTypes.includes(task.type)) {
      result.warnings.push(`Task at index ${index} has invalid type "${task.type}"`);
    }

    // Validate deliverable if present
    if (task.deliverable) {
      if (task.type !== 'with_deliverable') {
        result.warnings.push(`Task at index ${index} has deliverable but type is not "with_deliverable"`);
      }
      
      const validDeliverableTypes = ['presentation', 'file', 'exposition', 'other'];
      if (!task.deliverable.type || !validDeliverableTypes.includes(task.deliverable.type)) {
        result.warnings.push(`Task at index ${index} deliverable has invalid type`);
      }
    }

    // Validate subtasks recursively
    if (task.subtasks && Array.isArray(task.subtasks)) {
      task.subtasks.forEach((subtask, subtaskIndex) => {
        const subtaskValidation = this.validateGeneratedTask(subtask, `${index}.${subtaskIndex}`);
        result.errors.push(...subtaskValidation.errors);
        result.warnings.push(...subtaskValidation.warnings);
        if (!subtaskValidation.isValid) {
          result.isValid = false;
        }
      });
    }

    return result;
  }

  /**
   * Enhance project data with additional metadata and IDs
   * @param {Object} projectData - Raw project data from AI
   * @returns {Object} Enhanced project data
   */
  enhanceProjectData(projectData) {
    // Generate unique project ID
    const projectId = 'ai_project_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    
    // Enhance project data
    const enhancedProject = {
      id: projectId,
      name: projectData.name,
      description: projectData.description || '',
      estimatedDuration: projectData.estimatedDuration || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
      teamMembers: []
    };

    // Process tasks
    if (projectData.tasks && Array.isArray(projectData.tasks)) {
      enhancedProject.tasks = this.enhanceTasksData(projectData.tasks, projectId);
    }

    // Process team members
    if (projectData.teamMembers && Array.isArray(projectData.teamMembers)) {
      enhancedProject.teamMembers = projectData.teamMembers.map(member => ({
        id: 'member_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
        name: member.name || '',
        email: member.email || '',
        role: member.role || '',
        avatar: null,
        joinedAt: new Date().toISOString()
      }));
    }

    return enhancedProject;
  }

  /**
   * Enhance tasks data with IDs and proper structure
   * @param {Array} tasks - Raw tasks data
   * @param {string} projectId - Project ID
   * @param {string} parentTaskId - Parent task ID for subtasks
   * @param {number} level - Task hierarchy level
   * @returns {Array} Enhanced tasks data
   */
  enhanceTasksData(tasks, projectId, parentTaskId = null, level = 0) {
    const enhancedTasks = [];

    tasks.forEach(task => {
      const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      
      const enhancedTask = {
        id: taskId,
        projectId: projectId,
        parentTaskId: parentTaskId,
        title: task.title || '',
        description: task.description || '',
        duration: task.duration || 1,
        priority: task.priority || 'medium',
        type: task.type || 'simple',
        status: 'pending',
        progress: 0,
        level: level,
        adjustStartDate: false,
        assignedTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: []
      };

      // Add deliverable if present
      if (task.deliverable && task.type === 'with_deliverable') {
        enhancedTask.deliverable = {
          type: task.deliverable.type || 'other',
          description: task.deliverable.description || '',
          status: 'pending',
          notes: ''
        };
      }

      // Process subtasks recursively
      if (task.subtasks && Array.isArray(task.subtasks)) {
        enhancedTask.subtasks = this.enhanceTasksData(
          task.subtasks, 
          projectId, 
          taskId, 
          level + 1
        );
      }

      enhancedTasks.push(enhancedTask);
    });

    return enhancedTasks;
  }

  /**
   * Generate project with error handling and retries
   * @param {string} prompt - User prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result with success status
   */
  async generateProjectSafe(prompt, options = {}) {
    const result = {
      success: false,
      project: null,
      errors: [],
      warnings: [],
      retryCount: 0
    };

    const maxRetries = options.maxRetries || 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        result.project = await this.generateProject(prompt, options);
        result.success = true;
        result.retryCount = attempt;
        break;
      } catch (error) {
        result.errors.push(`Attempt ${attempt + 1}: ${error.message}`);
        
        // Don't retry on configuration or quota errors
        if (error.message.includes('not configured') || 
            error.message.includes('quota exceeded') || 
            error.message.includes('invalid_api_key')) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return result;
  }

  /**
   * Test the OpenAI connection and configuration
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'OpenAI service is not configured'
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hello, this is a connection test. Please respond with "Connection successful".' }
        ],
        max_tokens: 10
      });

      return {
        success: true,
        message: 'OpenAI connection successful',
        model: 'gpt-3.5-turbo'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();