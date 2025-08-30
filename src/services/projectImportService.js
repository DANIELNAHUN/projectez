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
   * Import project with comprehensive error handling and recovery
   * @param {string} jsonData - JSON string containing project data
   * @param {Object} options - Import options
   * @returns {Object} Import result with success status and details
   */
  static importProjectSafe(jsonData, options = {}) {
    const { 
      newStartDate = null, 
      validateOnly = false,
      skipValidation = false,
      autoFix = true 
    } = options;
    
    const result = {
      success: false,
      project: null,
      errors: [],
      warnings: [],
      validation: null,
      fixes: [],
      importTime: 0
    };

    const startTime = Date.now();

    try {
      // Enhanced JSON validation
      if (!skipValidation) {
        result.validation = this.validateProjectJSON(jsonData);
        result.warnings = [...result.validation.warnings];

        if (!result.validation.isValid) {
          result.errors = [...result.validation.errors];
          
          // Try to auto-fix common issues if enabled
          if (autoFix) {
            const fixResult = this.attemptAutoFix(jsonData, result.validation.errors);
            if (fixResult.success) {
              result.fixes = fixResult.fixes;
              result.warnings.push('Se aplicaron correcciones automáticas al proyecto');
              jsonData = fixResult.fixedData;
              
              // Re-validate after fixes
              result.validation = this.validateProjectJSON(jsonData);
              if (result.validation.isValid) {
                result.errors = [];
              }
            }
          }
          
          if (result.errors.length > 0) {
            return result;
          }
        }
      }

      // If validation only, return here
      if (validateOnly) {
        result.success = true;
        result.importTime = Date.now() - startTime;
        return result;
      }

      // Enhanced import with error recovery
      try {
        result.project = this.importProject(jsonData, newStartDate);
        result.success = true;
        
        // Validate imported project structure
        if (result.project) {
          const postImportValidation = this.validateImportedProject(result.project);
          if (postImportValidation.warnings.length > 0) {
            result.warnings.push(...postImportValidation.warnings);
          }
        }
        
      } catch (importError) {
        // Try recovery strategies
        const recoveryResult = this.attemptImportRecovery(jsonData, importError, options);
        
        if (recoveryResult.success) {
          result.project = recoveryResult.project;
          result.success = true;
          result.warnings.push('Se aplicó recuperación automática durante la importación');
          result.fixes.push(...recoveryResult.fixes);
        } else {
          throw importError;
        }
      }

    } catch (error) {
      result.errors.push(this.getEnhancedErrorMessage(error));
      
      // Add recovery suggestions
      const suggestions = this.getRecoverySuggestions(error);
      if (suggestions.length > 0) {
        result.suggestions = suggestions;
      }
    }

    result.importTime = Date.now() - startTime;
    return result;
  }

  /**
   * Attempt to auto-fix common JSON issues
   * @param {string} jsonData - Original JSON data
   * @param {Array} errors - Validation errors
   * @returns {Object} Fix result
   */
  static attemptAutoFix(jsonData, errors) {
    const result = {
      success: false,
      fixedData: jsonData,
      fixes: []
    };

    try {
      let data = JSON.parse(jsonData);
      let hasChanges = false;

      // Fix missing required fields
      if (!data.id) {
        data.id = 'imported_project_' + Date.now();
        result.fixes.push('Se generó un ID único para el proyecto');
        hasChanges = true;
      }

      if (!data.name || data.name.trim() === '') {
        data.name = 'Proyecto Importado';
        result.fixes.push('Se asignó un nombre por defecto al proyecto');
        hasChanges = true;
      }

      if (!data.status) {
        data.status = 'active';
        result.fixes.push('Se asignó estado "activo" por defecto');
        hasChanges = true;
      }

      // Fix task issues
      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks = data.tasks.map((task, index) => {
          let taskFixed = { ...task };
          
          if (!taskFixed.id) {
            taskFixed.id = `task_${Date.now()}_${index}`;
            result.fixes.push(`Se generó ID para la tarea en posición ${index + 1}`);
            hasChanges = true;
          }
          
          if (!taskFixed.title || taskFixed.title.trim() === '') {
            taskFixed.title = `Tarea ${index + 1}`;
            result.fixes.push(`Se asignó título por defecto a la tarea en posición ${index + 1}`);
            hasChanges = true;
          }
          
          if (!taskFixed.status) {
            taskFixed.status = 'pending';
            result.fixes.push(`Se asignó estado "pendiente" a la tarea "${taskFixed.title}"`);
            hasChanges = true;
          }
          
          return taskFixed;
        });
      }

      // Fix team member issues
      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        data.teamMembers = data.teamMembers.map((member, index) => {
          let memberFixed = { ...member };
          
          if (!memberFixed.id) {
            memberFixed.id = `member_${Date.now()}_${index}`;
            result.fixes.push(`Se generó ID para el miembro del equipo en posición ${index + 1}`);
            hasChanges = true;
          }
          
          if (!memberFixed.name || memberFixed.name.trim() === '') {
            memberFixed.name = `Miembro ${index + 1}`;
            result.fixes.push(`Se asignó nombre por defecto al miembro en posición ${index + 1}`);
            hasChanges = true;
          }
          
          return memberFixed;
        });
      }

      if (hasChanges) {
        result.fixedData = JSON.stringify(data);
        result.success = true;
      }

    } catch (error) {
      console.error('Error during auto-fix:', error);
    }

    return result;
  }

  /**
   * Attempt import recovery strategies
   * @param {string} jsonData - JSON data
   * @param {Error} error - Import error
   * @param {Object} options - Import options
   * @returns {Object} Recovery result
   */
  static attemptImportRecovery(jsonData, error, options) {
    const result = {
      success: false,
      project: null,
      fixes: []
    };

    try {
      const data = JSON.parse(jsonData);
      
      // Strategy 1: Import with minimal data
      if (error.message.includes('date') || error.message.includes('invalid')) {
        try {
          // Remove problematic date fields and let the system generate new ones
          const cleanData = this.cleanDateFields(data);
          result.project = this.createProjectFromData(cleanData);
          result.fixes.push('Se removieron fechas inválidas y se generaron nuevas');
          result.success = true;
          return result;
        } catch (cleanError) {
          console.error('Clean date strategy failed:', cleanError);
        }
      }

      // Strategy 2: Import without team members
      if (error.message.includes('team') || error.message.includes('member')) {
        try {
          const dataWithoutTeam = { ...data, teamMembers: [] };
          result.project = this.createProjectFromData(dataWithoutTeam);
          result.fixes.push('Se importó el proyecto sin los miembros del equipo debido a errores');
          result.success = true;
          return result;
        } catch (teamError) {
          console.error('No team strategy failed:', teamError);
        }
      }

      // Strategy 3: Import with basic structure only
      try {
        const basicData = {
          id: data.id || 'recovered_project_' + Date.now(),
          name: data.name || 'Proyecto Recuperado',
          description: data.description || '',
          status: 'active',
          tasks: [],
          teamMembers: []
        };
        
        result.project = this.createProjectFromData(basicData);
        result.fixes.push('Se importó solo la estructura básica del proyecto');
        result.success = true;
      } catch (basicError) {
        console.error('Basic recovery strategy failed:', basicError);
      }

    } catch (parseError) {
      console.error('Recovery failed - cannot parse JSON:', parseError);
    }

    return result;
  }

  /**
   * Clean problematic date fields from project data
   * @param {Object} data - Project data
   * @returns {Object} Cleaned data
   */
  static cleanDateFields(data) {
    const cleaned = { ...data };
    
    // Remove invalid project dates
    if (cleaned.startDate) {
      const startDate = new Date(cleaned.startDate);
      if (isNaN(startDate.getTime())) {
        delete cleaned.startDate;
      }
    }
    
    if (cleaned.endDate) {
      const endDate = new Date(cleaned.endDate);
      if (isNaN(endDate.getTime())) {
        delete cleaned.endDate;
      }
    }
    
    // Clean task dates
    if (cleaned.tasks && Array.isArray(cleaned.tasks)) {
      cleaned.tasks = cleaned.tasks.map(task => {
        const cleanTask = { ...task };
        
        if (cleanTask.startDate) {
          const startDate = new Date(cleanTask.startDate);
          if (isNaN(startDate.getTime())) {
            delete cleanTask.startDate;
          }
        }
        
        if (cleanTask.endDate) {
          const endDate = new Date(cleanTask.endDate);
          if (isNaN(endDate.getTime())) {
            delete cleanTask.endDate;
          }
        }
        
        return cleanTask;
      });
    }
    
    return cleaned;
  }

  /**
   * Validate imported project after creation
   * @param {Object} project - Imported project
   * @returns {Object} Validation result
   */
  static validateImportedProject(project) {
    const result = {
      isValid: true,
      warnings: []
    };

    if (!project.tasks || project.tasks.length === 0) {
      result.warnings.push('El proyecto no tiene tareas');
    }

    if (!project.teamMembers || project.teamMembers.length === 0) {
      result.warnings.push('El proyecto no tiene miembros del equipo');
    }

    if (!project.startDate) {
      result.warnings.push('El proyecto no tiene fecha de inicio definida');
    }

    return result;
  }

  /**
   * Get enhanced error message with context
   * @param {Error} error - Original error
   * @returns {string} Enhanced error message
   */
  static getEnhancedErrorMessage(error) {
    const message = error.message || 'Error desconocido';
    
    if (message.includes('JSON')) {
      return 'El archivo no tiene un formato JSON válido. Verifica que el archivo no esté corrupto.';
    }
    
    if (message.includes('date')) {
      return 'Error en las fechas del proyecto. Algunas fechas pueden tener formato inválido.';
    }
    
    if (message.includes('validation')) {
      return 'Los datos del proyecto no cumplen con los requisitos de validación.';
    }
    
    return `Error durante la importación: ${message}`;
  }

  /**
   * Get recovery suggestions for specific errors
   * @param {Error} error - Import error
   * @returns {Array} Array of suggestion strings
   */
  static getRecoverySuggestions(error) {
    const suggestions = [];
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('json')) {
      suggestions.push('Verifica que el archivo sea un JSON válido');
      suggestions.push('Intenta abrir el archivo en un editor de texto para verificar su contenido');
      suggestions.push('Asegúrate de que el archivo no esté truncado o corrupto');
    }
    
    if (message.includes('date')) {
      suggestions.push('Verifica que las fechas estén en formato ISO (YYYY-MM-DD)');
      suggestions.push('Intenta importar sin especificar nueva fecha de inicio');
      suggestions.push('Revisa que las fechas de las tareas sean coherentes');
    }
    
    if (message.includes('validation')) {
      suggestions.push('Revisa que todos los campos requeridos estén presentes');
      suggestions.push('Verifica que los IDs sean únicos');
      suggestions.push('Asegúrate de que los valores estén en los rangos permitidos');
    }
    
    // General suggestions
    suggestions.push('Intenta exportar un proyecto existente para ver el formato correcto');
    suggestions.push('Contacta al soporte si el problema persiste');
    
    return suggestions;
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