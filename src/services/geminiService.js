/**
 * GeminiService - Handles AI project generation using Google Gemini API
 * Provides methods to generate complete projects from user prompts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getProviderConfig, getErrorConfig } from '../config/aiConfig.js';

export class GeminiService {
  constructor() {
    this.client = null;
    this.model = null;
    this.isConfigured = false;
  }

  /**
   * Configure Gemini client with API key
   * @param {string} apiKey - Gemini API key
   */
  configure(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Valid Gemini API key is required');
    }

    try {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      this.isConfigured = true;
    } catch (error) {
      throw new Error(`Failed to configure Gemini client: ${error.message}`);
    }
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} Configuration status
   */
  isReady() {
    return this.isConfigured && this.client !== null && this.model !== null;
  }

  /**
   * Generate project from user prompt
   * @param {string} prompt - User description of the project
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated project data
   */
  async generateProject(prompt, options = {}) {
    if (!this.isReady()) {
      throw new Error('Gemini service is not configured. Please provide an API key.');
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
      
      const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response received from Gemini');
      }

      return this.processAIResponse(text);

    } catch (error) {
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Gemini API quota exceeded. Please check your billing settings.');
      } else if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('Failed to parse AI response as JSON')) {
        // Enhanced JSON parsing error with debugging info
        throw new Error(`Gemini returned invalid JSON: ${error.message}. Try reducing project complexity or using a simpler description.`);
      } else {
        throw new Error(`Gemini API error: ${error.message}`);
      }
    }
  }  /**

   * Create system prompt for project generation
   * @param {string} complexity - Project complexity level
   * @param {boolean} includeTeamMembers - Whether to include team members
   * @param {number} maxTasks - Maximum number of tasks to generate
   * @returns {string} System prompt
   */
  createSystemPrompt(complexity = 'medium', includeTeamMembers = true, maxTasks = 20) {
    return `You are an expert project manager and software architect. Your task is to generate a comprehensive project structure from user descriptions.

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY valid, complete JSON
2. Do NOT include any explanations, comments, or text outside the JSON
3. Start your response with { and end with }
4. Ensure the JSON is properly closed with all braces and brackets
5. Keep descriptions concise to avoid token limits
6. Maximum ${maxTasks} main tasks

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
- Keep descriptions concise (max 100 characters each)
- Assign appropriate priorities based on task importance and dependencies
- ENSURE the JSON response is complete and properly formatted`;
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

    // Clean and attempt to fix the JSON response
    let cleanedResponse = this.cleanAndFixJSON(response);

    let projectData;
    try {
      projectData = JSON.parse(cleanedResponse);
    } catch (error) {
      // Log debugging information
      console.error('Gemini JSON Parse Error:', {
        originalLength: response.length,
        cleanedLength: cleanedResponse.length,
        errorMessage: error.message,
        responsePreview: response.substring(0, 200) + '...',
        responseEnd: response.substring(Math.max(0, response.length - 200))
      });

      // If parsing fails, try to extract and fix the JSON
      const fixedJSON = this.attemptJSONFix(cleanedResponse);
      if (fixedJSON) {
        try {
          projectData = JSON.parse(fixedJSON);
          console.log('Successfully fixed JSON response');
        } catch (secondError) {
          throw new Error(`Failed to parse AI response as JSON: ${error.message}. Response length: ${response.length} characters. Try using a simpler project description.`);
        }
      } else {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}. Response length: ${response.length} characters. Try using a simpler project description.`);
      }
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
   * Clean and prepare JSON response
   * @param {string} response - Raw response
   * @returns {string} Cleaned response
   */
  cleanAndFixJSON(response) {
    // Remove any markdown code blocks
    let cleaned = response.trim();
    
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Find JSON object boundaries
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    return cleaned;
  }

  /**
   * Attempt to fix incomplete JSON
   * @param {string} jsonString - Potentially incomplete JSON
   * @returns {string|null} Fixed JSON or null if unfixable
   */
  attemptJSONFix(jsonString) {
    try {
      let fixed = jsonString.trim();
      
      // Handle unterminated strings first
      const quotes = (fixed.match(/"/g) || []).length;
      if (quotes % 2 !== 0) {
        // Odd number of quotes means unterminated string
        // Find the last quote and check if it needs closing
        const lastQuoteIndex = fixed.lastIndexOf('"');
        const beforeLastQuote = fixed.substring(0, lastQuoteIndex);
        const afterLastQuote = fixed.substring(lastQuoteIndex + 1);
        
        // Count quotes before the last quote
        const quotesBeforeLast = (beforeLastQuote.match(/"/g) || []).length;
        
        // If even number of quotes before, this is an opening quote that needs closing
        if (quotesBeforeLast % 2 === 0) {
          // Check if there's unfinished content after the quote
          if (afterLastQuote && !afterLastQuote.match(/^\s*[,\]\}]/)) {
            // Close the string before any structural characters
            const nextStructuralChar = afterLastQuote.search(/[,\]\}]/);
            if (nextStructuralChar !== -1) {
              fixed = fixed.substring(0, lastQuoteIndex + 1) + '"' + afterLastQuote.substring(nextStructuralChar);
            } else {
              // Just close the string
              fixed = fixed.substring(0, lastQuoteIndex + 1) + '"';
            }
          }
        }
      }
      
      // Count opening and closing braces/brackets
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      
      // Add missing closing brackets first (inner structures)
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixed += ']';
      }
      
      // Add missing closing braces (outer structures)
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixed += '}';
      }
      
      // Test if the fixed JSON is valid
      JSON.parse(fixed);
      return fixed;
      
    } catch (error) {
      // If we can't fix it, return null
      return null;
    }
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
  }  /**
  
 * Enhance project data with additional metadata and IDs
   * @param {Object} projectData - Raw project data from AI
   * @returns {Object} Enhanced project data
   */
  enhanceProjectData(projectData) {
    // Generate unique project ID
    const projectId = 'gemini_project_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    
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
   * Generate project with enhanced error handling and retries
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
      retryCount: 0,
      totalTime: 0,
      retryHistory: []
    };

    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const attemptStartTime = Date.now();
      
      try {
        result.project = await this.generateProject(prompt, options);
        result.success = true;
        result.retryCount = attempt;
        result.totalTime = Date.now() - startTime;
        
        // Log successful generation
        if (attempt > 0) {
          console.log(`Gemini project generation succeeded after ${attempt} retries`, {
            totalTime: result.totalTime,
            retryHistory: result.retryHistory
          });
        }
        
        break;
      } catch (error) {
        const attemptTime = Date.now() - attemptStartTime;
        const errorInfo = {
          attempt: attempt + 1,
          error: error.message,
          errorCode: error.code,
          time: attemptTime,
          timestamp: new Date().toISOString()
        };
        
        result.errors.push(`Intento ${attempt + 1}: ${error.message}`);
        result.retryHistory.push(errorInfo);
        
        // Determine if we should retry based on error type
        const shouldRetry = this.shouldRetryError(error);
        
        if (!shouldRetry || attempt >= maxRetries) {
          result.totalTime = Date.now() - startTime;
          
          // Add specific error guidance
          if (error.message?.includes('API_KEY_INVALID')) {
            result.errors.push('Sugerencia: Verifica que tu clave API de Gemini sea válida');
          } else if (error.message?.includes('QUOTA_EXCEEDED')) {
            result.errors.push('Sugerencia: Verifica tu configuración de facturación en Google Cloud');
          } else if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
            result.errors.push('Sugerencia: Espera unos minutos antes de intentar nuevamente');
          }
          
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5),
          10000 // Max 10 seconds
        );
        
        console.log(`Gemini generation failed, retrying in ${delay}ms`, errorInfo);
        
        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return result;
  }

  /**
   * Determine if an error should be retried
   * @param {Error} error - The error to check
   * @returns {boolean} Whether the error should be retried
   */
  shouldRetryError(error) {
    const errorConfig = getErrorConfig('gemini');
    
    // Don't retry on permanent failures
    const message = error.message?.toUpperCase() || '';
    if (errorConfig.permanent.some(code => message.includes(code))) {
      return false;
    }
    
    // Don't retry on validation errors
    if (message.includes('VALIDATION') || message.includes('INVALID')) {
      return false;
    }
    
    // Retry on configured retryable errors
    if (errorConfig.retryable.some(code => message.includes(code))) {
      return true;
    }
    
    // Retry on network-related errors
    return message.includes('NETWORK') || 
           message.includes('TIMEOUT') || 
           message.includes('FETCH') ||
           message.includes('CONNECTION');
  }

  /**
   * Test the Gemini connection and configuration
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Gemini service is not configured'
      };
    }

    try {
      const result = await this.model.generateContent('Hello, this is a connection test. Please respond with "Connection successful".');
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: 'Gemini connection successful',
        model: 'gemini-pro',
        response: text
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
export const geminiService = new GeminiService();