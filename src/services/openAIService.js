/**
 * OpenAIService - Handles AI project generation using OpenAI API
 * Provides methods to generate complete projects from user prompts
 */

import OpenAI from 'openai';
import { Project, Task, TeamMember, Deliverable } from '../models/index.js';
import { getProviderConfig, getErrorConfig } from '../config/aiConfig.js';
import { promptAnalyzer } from '../utils/promptAnalyzer.js';
import { hierarchyResponseParser } from '../utils/hierarchyResponseParser.js';
import { taskHierarchyBuilder } from '../utils/taskHierarchyBuilder.js';

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
      estimatedDuration = null,
      analysisResult = null
    } = options;

    try {
      const systemPrompt = this.createSystemPrompt(complexity, includeTeamMembers, maxTasks, analysisResult);
      const userPrompt = this.enhanceUserPrompt(prompt, estimatedDuration, analysisResult);

      // Get configuration for this complexity level
      const config = getProviderConfig('openai', complexity);

      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        response_format: config.responseFormat
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response received from OpenAI');
      }

      const aiResponse = response.choices[0].message.content;
      return this.processAIResponse(aiResponse, analysisResult);

    } catch (error) {
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('Failed to parse AI response as JSON')) {
        // Enhanced JSON parsing error with debugging info
        throw new Error(`OpenAI returned invalid JSON: ${error.message}. Try reducing project complexity or using a simpler description.`);
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
   * @param {Object} analysisResult - Optional prompt analysis result for hierarchical enhancement
   * @returns {string} System prompt
   */
  createSystemPrompt(complexity = 'medium', includeTeamMembers = true, maxTasks = 20, analysisResult = null) {
    // Check if hierarchical structure is detected
    const isHierarchical = analysisResult?.isHierarchical || false;
    const detectedModules = analysisResult?.modules || [];
    const suggestedLevels = analysisResult?.suggestedLevels || 2;
    const language = analysisResult?.language || 'english';

    let hierarchicalInstructions = '';
    let hierarchicalExample = '';

    if (isHierarchical && suggestedLevels >= 3) {
      hierarchicalInstructions = `
HIERARCHICAL PROJECT DETECTED:
- This project has ${detectedModules.length} main modules: ${detectedModules.map(m => m.name).join(', ')}
- CRITICAL: Generate EXACTLY ${suggestedLevels} levels of hierarchy: Main Tasks → Subtasks → Sub-subtasks
- Level 0 (Main Tasks): Major modules (e.g., "INTRANET", "COMERCIAL")
- Level 1 (Subtasks): Submodules within each main module (e.g., "Login Submodule", "Sales Forms Submodule")
- Level 2 (Sub-subtasks): Specific features within each submodule (e.g., "User Login", "User Registration", "Password Reset")
- IMPORTANT: Every Level 1 task MUST have multiple Level 2 sub-subtasks
- DO NOT group multiple features into one task - create separate sub-subtasks for each feature
- Preserve the exact modular structure from the user description
${language === 'spanish' ? '- Maintain Spanish terminology and descriptions' : ''}`;

      hierarchicalExample = `
      "subtasks": [
        {
          "title": "Login Submodule",
          "description": "User authentication and login management",
          "duration": number_of_working_days,
          "priority": "low|medium|high",
          "type": "simple|with_deliverable",
          "subtasks": [
            {
              "title": "User Login Implementation",
              "description": "Implement encrypted user login functionality",
              "duration": number_of_working_days,
              "priority": "low|medium|high",
              "type": "simple|with_deliverable"
            },
            {
              "title": "User Registration System",
              "description": "Create new user registration process",
              "duration": number_of_working_days,
              "priority": "low|medium|high",
              "type": "simple|with_deliverable"
            },
            {
              "title": "User Management Operations",
              "description": "Update and delete user functionality",
              "duration": number_of_working_days,
              "priority": "low|medium|high",
              "type": "simple|with_deliverable"
            }
          ]
        }
      ]`;
    } else if (isHierarchical) {
      hierarchicalInstructions = `
HIERARCHICAL STRUCTURE DETECTED:
- Generate ${suggestedLevels} levels of hierarchy
- Create logical groupings based on detected modules
${language === 'spanish' ? '- Maintain Spanish terminology and descriptions' : ''}`;

      hierarchicalExample = `
      "subtasks": [
        {
          "title": "Subtask title",
          "description": "Subtask description",
          "duration": number_of_working_days,
          "priority": "low|medium|high",
          "type": "simple|with_deliverable"
        }
      ]`;
    } else {
      hierarchicalExample = `
      "subtasks": [
        {
          "title": "Subtask title",
          "description": "Subtask description",
          "duration": number_of_working_days,
          "priority": "low|medium|high",
          "type": "simple|with_deliverable"
        }
      ]`;
    }

    return `You are an expert project manager and software architect. Your task is to generate a comprehensive project structure from user descriptions.

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY valid, complete JSON
2. Do NOT include any explanations, comments, or text outside the JSON
3. Ensure the JSON is properly closed with all braces and brackets
4. Keep descriptions concise to avoid token limits
5. Maximum ${maxTasks} main tasks
${hierarchicalInstructions}

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
${hierarchicalExample}
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
- Maximum tasks: ${maxTasks}${isHierarchical && suggestedLevels >= 3 ? ` (Level 0 main tasks only - Level 1 and 2 subtasks are unlimited within reason)` : ''}
- Duration should be realistic working days (Monday-Saturday, excluding Sunday)
- Create a logical hierarchy with main tasks and subtasks${isHierarchical && suggestedLevels >= 3 ? ' and sub-subtasks' : ''}
- Include dependencies between tasks where appropriate
- For ${complexity} complexity: ${this.getComplexityGuidelines(complexity, isHierarchical, suggestedLevels)}
- Only include deliverable object if type is "with_deliverable"
- Dependencies should reference exact task titles
- Ensure all durations are positive integers
- Keep descriptions concise (max 100 characters each)
- Assign appropriate priorities based on task importance and dependencies
${isHierarchical ? `- CRITICAL HIERARCHY REQUIREMENT: Generate comprehensive ${suggestedLevels}-level hierarchy matching the detected structure` : ''}
${isHierarchical && suggestedLevels >= 3 ? `- MANDATORY: Each Level 1 subtask MUST contain multiple Level 2 sub-subtasks` : ''}
${isHierarchical && suggestedLevels >= 3 ? `- DO NOT combine multiple features into single tasks - break them down into individual sub-subtasks` : ''}
${isHierarchical && suggestedLevels >= 3 ? `- Example structure: "INTRANET" → "Login Submodule" → ["User Login", "User Registration", "Password Reset"]` : ''}
${detectedModules.length > 0 ? `- MODULE-SPECIFIC GUIDELINES: Create main tasks for: ${detectedModules.map(m => m.name).join(', ')}` : ''}
- ENSURE the JSON response is complete and properly formatted`;
  }

  /**
   * Get complexity-specific guidelines
   * @param {string} complexity - Complexity level
   * @param {boolean} isHierarchical - Whether hierarchical structure is detected
   * @param {number} suggestedLevels - Number of suggested hierarchy levels
   * @returns {string} Guidelines for the complexity level
   */
  getComplexityGuidelines(complexity, isHierarchical = false, suggestedLevels = 2) {
    const hierarchicalSuffix = isHierarchical && suggestedLevels >= 3 
      ? ` Generate ${suggestedLevels} levels: main tasks (modules) → subtasks (submodules) → sub-subtasks (specific features).`
      : isHierarchical 
        ? ` Generate ${suggestedLevels} levels with logical groupings.`
        : '';

    switch (complexity) {
      case 'basic':
        return `Create 3-8 main tasks with minimal subtasks. Focus on essential milestones.${hierarchicalSuffix}`;
      case 'medium':
        return `Create 5-15 main tasks with relevant subtasks. Include planning, development, and testing phases.${hierarchicalSuffix}`;
      case 'detailed':
        return `Create 10-20 main tasks with comprehensive subtasks. Include detailed planning, development, testing, deployment, and maintenance phases.${hierarchicalSuffix}`;
      default:
        return `Create a balanced project structure with appropriate task breakdown.${hierarchicalSuffix}`;
    }
  }

  /**
   * Enhance user prompt with additional context
   * @param {string} prompt - Original user prompt
   * @param {number} estimatedDuration - Optional estimated duration
   * @param {Object} analysisResult - Optional prompt analysis result
   * @returns {string} Enhanced prompt
   */
  enhanceUserPrompt(prompt, estimatedDuration = null, analysisResult = null) {
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
   * @param {Object} analysisResult - Optional prompt analysis result for hierarchical processing
   * @returns {Object} Processed project data
   */
  processAIResponse(response, analysisResult = null) {
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
      console.error('OpenAI JSON Parse Error:', {
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

    // Use hierarchical processing if hierarchical structure is detected
    if (analysisResult?.isHierarchical) {
      return this.processHierarchicalResponse(projectData, analysisResult);
    }

    // Process and enhance the project data (fallback for non-hierarchical)
    return this.enhanceProjectData(projectData, analysisResult);
  }

  /**
   * Process hierarchical AI response using dedicated hierarchical components
   * @param {Object} projectData - Parsed project data from AI
   * @param {Object} analysisResult - Prompt analysis result with hierarchical information
   * @returns {Object} Enhanced project data with proper hierarchical structure
   */
  processHierarchicalResponse(projectData, analysisResult) {
    try {
      // Use the hierarchical response parser to build proper task relationships
      const hierarchyResult = hierarchyResponseParser.parseHierarchicalResponse(projectData, analysisResult);

      // Check if hierarchy parsing was successful
      if (!hierarchyResult.validationResults.isValid) {
        console.warn('Hierarchy validation failed, falling back to standard processing:', hierarchyResult.validationResults.errors);
        return this.enhanceProjectData(projectData, analysisResult);
      }

      // Generate unique project ID
      const projectId = 'ai_project_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);

      // Create enhanced project structure with hierarchical data
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

      // Process tasks using the hierarchical task builder
      if (hierarchyResult.mainTasks && hierarchyResult.mainTasks.length > 0) {
        const hierarchyBuilderResult = taskHierarchyBuilder.buildTaskHierarchy(hierarchyResult.mainTasks, {
          projectId: projectId,
          preserveAnalysisMetadata: true,
          analysisResult: analysisResult
        });

        // Use the enhanced tasks from the hierarchy builder
        enhancedProject.tasks = hierarchyBuilderResult.tasks;

        // Add hierarchy metadata to the project
        enhancedProject.hierarchyMetadata = {
          isHierarchical: true,
          totalTasks: hierarchyBuilderResult.metadata.totalTasks,
          maxDepth: hierarchyBuilderResult.metadata.maxDepth,
          mainTaskCount: hierarchyBuilderResult.metadata.mainTaskCount,
          subtaskCount: hierarchyBuilderResult.metadata.subtaskCount,
          modules: analysisResult.modules || [],
          analysisComplexity: analysisResult.complexity || 'medium'
        };
      } else {
        // Fallback if no main tasks were generated
        enhancedProject.tasks = this.enhanceTasksData(projectData.tasks || [], projectId, null, 0, analysisResult, { counter: 0 });
      }

      // Process team members (same as standard processing)
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

    } catch (error) {
      console.error('Hierarchical processing failed:', error.message);
      console.warn('Falling back to standard project processing');

      // Fallback to standard processing if hierarchical processing fails
      return this.enhanceProjectData(projectData, analysisResult);
    }
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
  }

  /**
   * Enhance project data with additional metadata and IDs
   * @param {Object} projectData - Raw project data from AI
   * @param {Object} analysisResult - Optional prompt analysis result for hierarchical enhancement
   * @returns {Object} Enhanced project data
   */
  enhanceProjectData(projectData, analysisResult = null) {
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
      enhancedProject.tasks = this.enhanceTasksData(projectData.tasks, projectId, null, 0, analysisResult, { counter: 0 });
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
   * @param {Object} analysisResult - Optional prompt analysis result for hierarchical enhancement
   * @param {Object} globalOrder - Global task order counter for preserving sequence
   * @returns {Array} Enhanced tasks data
   */
  enhanceTasksData(tasks, projectId, parentTaskId = null, level = 0, analysisResult = null, globalOrder = { counter: 0 }) {
    const enhancedTasks = [];

    // Ensure globalOrder is properly initialized
    if (!globalOrder || typeof globalOrder.counter !== 'number') {
      globalOrder = { counter: 0 };
    }

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
        subtasks: [],
        // Hierarchical metadata
        isMainTask: level === 0,
        hasSubtasks: !!(task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0),
        originalOrder: globalOrder.counter++,
        moduleType: null,
        aggregatedDuration: task.duration || 1
      };

      // Enhanced hierarchical metadata when analysis result is available
      if (analysisResult?.isHierarchical) {
        // Try to match task with detected modules for moduleType metadata
        if (level === 0 && analysisResult.modules && Array.isArray(analysisResult.modules)) {
          const matchingModule = analysisResult.modules.find(module => {
            const taskTitle = task.title.toUpperCase();
            const moduleName = module.name.toUpperCase();
            return taskTitle.includes(moduleName) ||
              moduleName.includes(taskTitle) ||
              (module.keywords && module.keywords.some(keyword =>
                taskTitle.includes(keyword.toUpperCase())
              ));
          });

          if (matchingModule) {
            enhancedTask.moduleType = matchingModule.name;
          }
        }

        // Add additional metadata for complex hierarchical structures
        if (analysisResult.complexity === 'high' && level === 0) {
          enhancedTask.complexityLevel = 'high';
          enhancedTask.estimatedSubtasks = task.subtasks ? task.subtasks.length : 0;
        }
      } else if (level === 0) {
        // Fallback: try to detect common module patterns in task titles
        const taskTitle = task.title.toUpperCase();
        const commonModules = ['INTRANET', 'COMERCIAL', 'OPERACIONES', 'ADMIN', 'USUARIOS', 'REPORTES'];
        const detectedModule = commonModules.find(module => taskTitle.includes(module));
        if (detectedModule) {
          enhancedTask.moduleType = detectedModule;
        }
      }

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
          level + 1,
          analysisResult,
          globalOrder
        );

        // Calculate aggregated duration from subtasks
        const subtaskDurations = enhancedTask.subtasks.reduce((sum, subtask) => {
          return sum + (subtask.aggregatedDuration || subtask.duration || 0);
        }, 0);

        if (subtaskDurations > 0) {
          enhancedTask.aggregatedDuration = subtaskDurations;
        }
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
          console.log(`OpenAI project generation succeeded after ${attempt} retries`, {
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
          if (error.code === 'insufficient_quota') {
            result.errors.push('Sugerencia: Verifica tu configuración de facturación en OpenAI');
          } else if (error.code === 'invalid_api_key') {
            result.errors.push('Sugerencia: Verifica que tu clave API sea válida y tenga permisos');
          } else if (error.code === 'rate_limit_exceeded') {
            result.errors.push('Sugerencia: Espera unos minutos antes de intentar nuevamente');
          }

          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5),
          10000 // Max 10 seconds
        );

        console.log(`OpenAI generation failed, retrying in ${delay}ms`, errorInfo);

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
    const errorConfig = getErrorConfig('openai');

    // Don't retry on permanent failures
    if (errorConfig.permanent.includes(error.code)) {
      return false;
    }

    // Don't retry on validation errors
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return false;
    }

    // Retry on configured retryable errors
    if (errorConfig.retryable.includes(error.code)) {
      return true;
    }

    // Retry on network-related errors
    const message = error.message?.toLowerCase() || '';
    return message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection');
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