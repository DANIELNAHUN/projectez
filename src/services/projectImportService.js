/**
 * ProjectImportService - Handles project import functionality
 * Provides methods to import projects from JSON format with validation and date adjustment
 */

import { Project, Task, TeamMember, Deliverable } from '../models/index.js';
import { DateCalculationService } from './dateCalculationService.js';

export class ProjectImportService {
  /**
   * Import a project from JSON with validation and optional date adjustment
   * @param {string} jsonData - JSON string containing project data
   * @param {Date} newStartDate - Optional new start date for the project
   * @returns {Project} Imported and validated project instance
   * @throws {Error} If JSON is invalid or import fails
   */
  static importProject(jsonData, newStartDate = null) {
    if (!jsonData || typeof jsonData !== 'string') {
      throw new Error('JSON data is required and must be a string');
    }

    let projectData;
    try {
      projectData = JSON.parse(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validate project structure
    const validation = this.validateProjectJSON(jsonData);
    if (!validation.isValid) {
      throw new Error(`Project validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Create project instance with imported data
      const project = this.createProjectFromData(projectData);

      // Apply date adjustment if new start date is provided
      if (newStartDate) {
        this.adjustImportedProjectDates(project, newStartDate);
      }

      return project;
    } catch (error) {
      throw new Error(`Failed to import project: ${error.message}`);
    }
  }

  /**
   * Validate JSON structure for project import
   * @param {string} jsonData - JSON string to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  static validateProjectJSON(jsonData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if JSON data is provided
    if (!jsonData || typeof jsonData !== 'string') {
      result.errors.push('JSON data is required and must be a string');
      result.isValid = false;
      return result;
    }

    let data;
    try {
      data = JSON.parse(jsonData);
    } catch (error) {
      result.errors.push(`Invalid JSON format: ${error.message}`);
      result.isValid = false;
      return result;
    }

    // Validate required project fields
    if (!data.id) {
      result.errors.push('Project must have an id');
      result.isValid = false;
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      result.errors.push('Project must have a valid name');
      result.isValid = false;
    }

    // Validate date fields
    if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        result.errors.push('Project start date is invalid');
        result.isValid = false;
      }
    }

    if (data.endDate) {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        result.errors.push('Project end date is invalid');
        result.isValid = false;
      }
    }

    // Validate date range
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (!DateCalculationService.validateDateRange(startDate, endDate)) {
          result.errors.push('Project end date must be after start date');
          result.isValid = false;
        }
      }
    }

    // Validate status
    const validStatuses = ['active', 'completed', 'paused'];
    if (data.status && !validStatuses.includes(data.status)) {
      result.warnings.push(`Invalid project status "${data.status}", will default to "active"`);
    }

    // Validate team members array
    if (data.teamMembers && !Array.isArray(data.teamMembers)) {
      result.errors.push('Team members must be an array');
      result.isValid = false;
    } else if (data.teamMembers) {
      data.teamMembers.forEach((member, index) => {
        const memberValidation = this.validateTeamMemberData(member, index);
        result.errors.push(...memberValidation.errors);
        result.warnings.push(...memberValidation.warnings);
        if (!memberValidation.isValid) {
          result.isValid = false;
        }
      });
    }

    // Validate tasks array
    if (data.tasks && !Array.isArray(data.tasks)) {
      result.errors.push('Tasks must be an array');
      result.isValid = false;
    } else if (data.tasks) {
      data.tasks.forEach((task, index) => {
        const taskValidation = this.validateTaskData(task, index);
        result.errors.push(...taskValidation.errors);
        result.warnings.push(...taskValidation.warnings);
        if (!taskValidation.isValid) {
          result.isValid = false;
        }
      });
    }

    return result;
  }

  /**
   * Validate team member data structure
   * @param {Object} member - Team member data
   * @param {number} index - Index in array for error reporting
   * @returns {Object} Validation result
   */
  static validateTeamMemberData(member, index) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!member || typeof member !== 'object') {
      result.errors.push(`Team member at index ${index} must be an object`);
      result.isValid = false;
      return result;
    }

    if (!member.id) {
      result.errors.push(`Team member at index ${index} must have an id`);
      result.isValid = false;
    }

    if (!member.name || typeof member.name !== 'string' || member.name.trim() === '') {
      result.warnings.push(`Team member at index ${index} should have a name`);
    }

    if (member.email && typeof member.email !== 'string') {
      result.warnings.push(`Team member at index ${index} email should be a string`);
    }

    if (member.joinedAt) {
      const joinedDate = new Date(member.joinedAt);
      if (isNaN(joinedDate.getTime())) {
        result.warnings.push(`Team member at index ${index} has invalid joinedAt date`);
      }
    }

    return result;
  }

  /**
   * Validate task data structure
   * @param {Object} task - Task data
   * @param {number} index - Index in array for error reporting
   * @returns {Object} Validation result
   */
  static validateTaskData(task, index) {
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

    if (!task.id) {
      result.errors.push(`Task at index ${index} must have an id`);
      result.isValid = false;
    }

    if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
      result.warnings.push(`Task at index ${index} should have a title`);
    }

    // Validate dates
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      if (isNaN(startDate.getTime())) {
        result.errors.push(`Task at index ${index} has invalid start date`);
        result.isValid = false;
      }
    }

    if (task.endDate) {
      const endDate = new Date(task.endDate);
      if (isNaN(endDate.getTime())) {
        result.errors.push(`Task at index ${index} has invalid end date`);
        result.isValid = false;
      }
    }

    // Validate date range
    if (task.startDate && task.endDate) {
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (!DateCalculationService.validateDateRange(startDate, endDate)) {
          result.errors.push(`Task at index ${index} end date must be after start date`);
          result.isValid = false;
        }
      }
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (task.status && !validStatuses.includes(task.status)) {
      result.warnings.push(`Task at index ${index} has invalid status "${task.status}"`);
    }

    // Validate type
    const validTypes = ['simple', 'with_deliverable'];
    if (task.type && !validTypes.includes(task.type)) {
      result.warnings.push(`Task at index ${index} has invalid type "${task.type}"`);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (task.priority && !validPriorities.includes(task.priority)) {
      result.warnings.push(`Task at index ${index} has invalid priority "${task.priority}"`);
    }

    // Validate progress
    if (task.progress !== undefined && (typeof task.progress !== 'number' || task.progress < 0 || task.progress > 100)) {
      result.warnings.push(`Task at index ${index} progress should be a number between 0 and 100`);
    }

    // Validate duration
    if (task.duration !== undefined && (typeof task.duration !== 'number' || task.duration < 0)) {
      result.warnings.push(`Task at index ${index} duration should be a positive number`);
    }

    // Validate deliverable if present
    if (task.deliverable) {
      const deliverableValidation = this.validateDeliverableData(task.deliverable, index);
      result.errors.push(...deliverableValidation.errors);
      result.warnings.push(...deliverableValidation.warnings);
      if (!deliverableValidation.isValid) {
        result.isValid = false;
      }
    }

    // Validate subtasks recursively
    if (task.subtasks && Array.isArray(task.subtasks)) {
      task.subtasks.forEach((subtask, subtaskIndex) => {
        const subtaskValidation = this.validateTaskData(subtask, `${index}.${subtaskIndex}`);
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
   * Validate deliverable data structure
   * @param {Object} deliverable - Deliverable data
   * @param {number} taskIndex - Task index for error reporting
   * @returns {Object} Validation result
   */
  static validateDeliverableData(deliverable, taskIndex) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!deliverable || typeof deliverable !== 'object') {
      result.errors.push(`Task at index ${taskIndex} deliverable must be an object`);
      result.isValid = false;
      return result;
    }

    // Validate type
    const validTypes = ['presentation', 'file', 'exposition', 'other'];
    if (deliverable.type && !validTypes.includes(deliverable.type)) {
      result.warnings.push(`Task at index ${taskIndex} deliverable has invalid type "${deliverable.type}"`);
    }

    // Validate status
    const validStatuses = ['pending', 'in_review', 'completed'];
    if (deliverable.status && !validStatuses.includes(deliverable.status)) {
      result.warnings.push(`Task at index ${taskIndex} deliverable has invalid status "${deliverable.status}"`);
    }

    // Validate due date
    if (deliverable.dueDate) {
      const dueDate = new Date(deliverable.dueDate);
      if (isNaN(dueDate.getTime())) {
        result.errors.push(`Task at index ${taskIndex} deliverable has invalid due date`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Create project instance from validated data
   * @param {Object} data - Validated project data
   * @returns {Project} Project instance
   */
  static createProjectFromData(data) {
    // Create team members
    const teamMembers = (data.teamMembers || []).map(memberData => 
      new TeamMember({
        id: memberData.id,
        name: memberData.name || '',
        email: memberData.email || '',
        role: memberData.role || '',
        avatar: memberData.avatar || null,
        joinedAt: memberData.joinedAt ? new Date(memberData.joinedAt) : new Date()
      })
    );

    // Create tasks with deliverables and subtasks
    const tasks = (data.tasks || []).map(taskData => this.createTaskFromData(taskData, data.id));

    // Create project
    const project = new Project({
      id: data.id,
      name: data.name,
      description: data.description || '',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status || 'active',
      teamMembers,
      tasks,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: new Date() // Always update to current time on import
    });

    return project;
  }

  /**
   * Create task instance from data (recursive for subtasks)
   * @param {Object} taskData - Task data
   * @param {string} projectId - Project ID
   * @returns {Task} Task instance
   */
  static createTaskFromData(taskData, projectId) {
    // Create deliverable if present
    let deliverable = null;
    if (taskData.deliverable) {
      deliverable = new Deliverable({
        type: taskData.deliverable.type || 'other',
        description: taskData.deliverable.description || '',
        dueDate: taskData.deliverable.dueDate ? new Date(taskData.deliverable.dueDate) : new Date(),
        status: taskData.deliverable.status || 'pending',
        notes: taskData.deliverable.notes || ''
      });
    }

    // Create subtasks recursively
    const subtasks = (taskData.subtasks || []).map(subtaskData => 
      this.createTaskFromData(subtaskData, projectId)
    );

    // Create task
    const task = new Task({
      id: taskData.id,
      projectId: projectId,
      parentTaskId: taskData.parentTaskId || null,
      title: taskData.title || '',
      description: taskData.description || '',
      startDate: taskData.startDate ? new Date(taskData.startDate) : new Date(),
      endDate: taskData.endDate ? new Date(taskData.endDate) : new Date(),
      status: taskData.status || 'pending',
      type: taskData.type || 'simple',
      deliverable,
      assignedTo: taskData.assignedTo || null,
      priority: taskData.priority || 'medium',
      progress: taskData.progress || 0,
      subtasks,
      level: taskData.level || 0,
      duration: taskData.duration || null,
      adjustStartDate: taskData.adjustStartDate || false,
      createdAt: taskData.createdAt ? new Date(taskData.createdAt) : new Date(),
      updatedAt: new Date() // Always update to current time on import
    });

    return task;
  }

  /**
   * Adjust imported project dates to new start date
   * @param {Project} project - Project to adjust
   * @param {Date} newStartDate - New start date
   */
  static adjustImportedProjectDates(project, newStartDate) {
    if (!newStartDate) {
      throw new Error('New start date is required for date adjustment');
    }

    const newStart = newStartDate instanceof Date ? newStartDate : new Date(newStartDate);
    
    if (isNaN(newStart.getTime())) {
      throw new Error('Invalid new start date provided');
    }

    try {
      // Use the project's built-in date adjustment method
      project.adjustProjectDates(newStart);
    } catch (error) {
      throw new Error(`Failed to adjust project dates: ${error.message}`);
    }
  }

  /**
   * Import project with comprehensive error handling
   * @param {string} jsonData - JSON string containing project data
   * @param {Object} options - Import options
   * @returns {Object} Import result with success status and details
   */
  static importProjectSafe(jsonData, options = {}) {
    const { newStartDate = null, validateOnly = false } = options;
    
    const result = {
      success: false,
      project: null,
      errors: [],
      warnings: [],
      validation: null
    };

    try {
      // First validate the JSON structure
      result.validation = this.validateProjectJSON(jsonData);
      result.warnings = result.validation.warnings;

      if (!result.validation.isValid) {
        result.errors = result.validation.errors;
        return result;
      }

      // If validation only, return here
      if (validateOnly) {
        result.success = true;
        return result;
      }

      // Import the project
      result.project = this.importProject(jsonData, newStartDate);
      result.success = true;

    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Generate a unique project ID for imported projects
   * @param {string} originalId - Original project ID
   * @param {string[]} existingIds - Array of existing project IDs to avoid conflicts
   * @returns {string} Unique project ID
   */
  static generateUniqueProjectId(originalId, existingIds = []) {
    if (!existingIds.includes(originalId)) {
      return originalId;
    }

    let counter = 1;
    let newId = `${originalId}_imported_${counter}`;
    
    while (existingIds.includes(newId)) {
      counter++;
      newId = `${originalId}_imported_${counter}`;
    }

    return newId;
  }

  /**
   * Prepare project for import by ensuring unique IDs
   * @param {string} jsonData - JSON string containing project data
   * @param {string[]} existingProjectIds - Array of existing project IDs
   * @param {string[]} existingTaskIds - Array of existing task IDs
   * @returns {string} Modified JSON string with unique IDs
   */
  static prepareProjectForImport(jsonData, existingProjectIds = [], existingTaskIds = []) {
    let data;
    try {
      data = JSON.parse(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Generate unique project ID
    data.id = this.generateUniqueProjectId(data.id, existingProjectIds);

    // Generate unique task IDs
    if (data.tasks && Array.isArray(data.tasks)) {
      data.tasks = this.generateUniqueTaskIds(data.tasks, existingTaskIds, data.id);
    }

    return JSON.stringify(data);
  }

  /**
   * Generate unique task IDs recursively
   * @param {Object[]} tasks - Array of tasks
   * @param {string[]} existingIds - Array of existing task IDs
   * @param {string} projectId - New project ID
   * @returns {Object[]} Tasks with unique IDs
   */
  static generateUniqueTaskIds(tasks, existingIds, projectId) {
    const usedIds = [...existingIds];

    const processTask = (task) => {
      // Generate unique task ID
      let newId = task.id;
      let counter = 1;
      
      while (usedIds.includes(newId)) {
        newId = `${task.id}_imported_${counter}`;
        counter++;
      }
      
      usedIds.push(newId);
      task.id = newId;
      task.projectId = projectId;

      // Process subtasks recursively
      if (task.subtasks && Array.isArray(task.subtasks)) {
        task.subtasks = task.subtasks.map(processTask);
      }

      return task;
    };

    return tasks.map(processTask);
  }
}