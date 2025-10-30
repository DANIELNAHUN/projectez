/**
 * HierarchyResponseParser - Processes AI responses and builds proper task hierarchies
 * Handles nested task structures from AI responses with parent-child relationships
 */

export class HierarchyResponseParser {
  constructor() {
    // Maximum allowed hierarchy depth to prevent infinite nesting
    this.maxHierarchyDepth = 3;
    
    // Validation rules for task relationships
    this.validationRules = {
      maxParentDuration: 365, // Maximum duration for parent tasks in days
      minTaskDuration: 1,     // Minimum duration for any task
      maxSubtasks: 20,        // Maximum subtasks per parent
      maxTotalTasks: 100      // Maximum total tasks in hierarchy
    };
  }

  /**
   * Parse hierarchical response and build task structure with relationships
   * @param {Object} response - AI response containing tasks
   * @param {Object} analysisResult - Optional prompt analysis result for context
   * @returns {Object} Parsed hierarchy with main tasks and relationships
   */
  parseHierarchicalResponse(response, analysisResult = null) {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response object provided');
    }

    if (!response.tasks || !Array.isArray(response.tasks)) {
      throw new Error('Response must contain a tasks array');
    }

    const result = {
      mainTasks: [],
      taskRelationships: new Map(),
      validationResults: {
        isValid: true,
        errors: [],
        warnings: []
      }
    };

    try {
      // Build task hierarchy from the response
      const hierarchyData = this.buildTaskHierarchy(response.tasks);
      
      // Validate the hierarchy structure
      const validation = this.validateHierarchy(hierarchyData);
      result.validationResults = validation;

      if (!validation.isValid) {
        throw new Error(`Hierarchy validation failed: ${validation.errors.join(', ')}`);
      }

      // Extract main tasks and relationships
      result.mainTasks = hierarchyData.tasks;
      result.taskRelationships = hierarchyData.relationships;

      // Add analysis context if available
      if (analysisResult) {
        result.analysisContext = {
          detectedModules: analysisResult.modules || [],
          suggestedLevels: analysisResult.suggestedLevels || 2,
          language: analysisResult.language || 'spanish'
        };
      }

      return result;

    } catch (error) {
      result.validationResults.isValid = false;
      result.validationResults.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Build task hierarchy with parent-child relationships
   * @param {Array} tasks - Raw tasks array from AI response
   * @returns {Object} Hierarchy data with tasks and relationships
   */
  buildTaskHierarchy(tasks) {
    const hierarchyData = {
      tasks: [],
      relationships: new Map(),
      taskCount: 0,
      maxDepth: 0
    };

    // Process each top-level task
    tasks.forEach((task, index) => {
      const processedTask = this.processTaskWithHierarchy(
        task, 
        null, // No parent for top-level tasks
        0,    // Level 0 for main tasks
        hierarchyData,
        index
      );
      
      hierarchyData.tasks.push(processedTask);
    });

    return hierarchyData;
  }

  /**
   * Process a single task and its subtasks recursively
   * @param {Object} task - Task object to process
   * @param {string} parentTaskId - ID of parent task (null for main tasks)
   * @param {number} level - Current hierarchy level (0=main, 1=sub, 2=sub-sub)
   * @param {Object} hierarchyData - Accumulator for hierarchy information
   * @param {number} order - Task order within its level
   * @returns {Object} Processed task with hierarchy metadata
   */
  processTaskWithHierarchy(task, parentTaskId, level, hierarchyData, order) {
    // Validate hierarchy depth
    if (level > this.maxHierarchyDepth) {
      throw new Error(`Maximum hierarchy depth (${this.maxHierarchyDepth}) exceeded`);
    }

    // Update max depth tracking
    hierarchyData.maxDepth = Math.max(hierarchyData.maxDepth, level);

    // Generate unique task ID
    const taskId = this.generateTaskId(level, hierarchyData.taskCount++);

    // Create processed task with hierarchy metadata
    const processedTask = {
      id: taskId,
      parentTaskId: parentTaskId,
      title: task.title || '',
      description: task.description || '',
      duration: this.validateDuration(task.duration),
      priority: task.priority || 'medium',
      type: task.type || 'simple',
      level: level,
      order: order,
      isMainTask: level === 0,
      hasSubtasks: Boolean(task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0),
      subtasks: [],
      // Additional metadata
      originalOrder: order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add deliverable if present
    if (task.deliverable && task.type === 'with_deliverable') {
      processedTask.deliverable = {
        type: task.deliverable.type || 'other',
        description: task.deliverable.description || '',
        status: 'pending'
      };
    }

    // Store parent-child relationship
    if (parentTaskId) {
      hierarchyData.relationships.set(taskId, parentTaskId);
    }

    // Process subtasks recursively
    if (processedTask.hasSubtasks) {
      if (task.subtasks.length > this.validationRules.maxSubtasks) {
        throw new Error(`Task "${task.title}" has too many subtasks (${task.subtasks.length}). Maximum allowed: ${this.validationRules.maxSubtasks}`);
      }

      task.subtasks.forEach((subtask, subtaskIndex) => {
        const processedSubtask = this.processTaskWithHierarchy(
          subtask,
          taskId,
          level + 1,
          hierarchyData,
          subtaskIndex
        );
        
        processedTask.subtasks.push(processedSubtask);
      });

      // Calculate aggregated duration for parent tasks
      processedTask.aggregatedDuration = this.calculateAggregatedDuration(processedTask);
    } else {
      processedTask.aggregatedDuration = processedTask.duration;
    }

    return processedTask;
  }

  /**
   * Calculate aggregated duration for parent tasks based on subtask durations
   * @param {Object} parentTask - Parent task with subtasks
   * @returns {number} Aggregated duration in working days
   */
  calculateAggregatedDuration(parentTask) {
    if (!parentTask.hasSubtasks || !parentTask.subtasks.length) {
      return parentTask.duration;
    }

    // Sum all subtask durations (including their aggregated durations)
    const subtaskDurationSum = parentTask.subtasks.reduce((sum, subtask) => {
      return sum + (subtask.aggregatedDuration || subtask.duration || 0);
    }, 0);

    // Handle duration conflicts between parent and children
    if (parentTask.duration > 0 && subtaskDurationSum > 0) {
      // If parent has explicit duration and it differs significantly from subtask sum
      const difference = Math.abs(parentTask.duration - subtaskDurationSum);
      const threshold = Math.max(parentTask.duration * 0.2, 2); // 20% or 2 days threshold

      if (difference > threshold) {
        console.warn(`Duration conflict detected for task "${parentTask.title}": parent=${parentTask.duration}, subtasks sum=${subtaskDurationSum}. Using subtask sum.`);
      }
    }

    // Use subtask sum if available, otherwise fall back to parent duration
    return subtaskDurationSum > 0 ? subtaskDurationSum : parentTask.duration;
  }

  /**
   * Validate task hierarchy structure integrity
   * @param {Object} hierarchyData - Hierarchy data to validate
   * @returns {Object} Validation result with errors and warnings
   */
  validateHierarchy(hierarchyData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check total task count
    if (hierarchyData.taskCount > this.validationRules.maxTotalTasks) {
      result.errors.push(`Too many tasks in hierarchy: ${hierarchyData.taskCount}. Maximum allowed: ${this.validationRules.maxTotalTasks}`);
      result.isValid = false;
    }

    // Check hierarchy depth
    if (hierarchyData.maxDepth > this.maxHierarchyDepth) {
      result.errors.push(`Hierarchy too deep: ${hierarchyData.maxDepth} levels. Maximum allowed: ${this.maxHierarchyDepth}`);
      result.isValid = false;
    }

    // Validate each task in the hierarchy
    this.validateTasksRecursively(hierarchyData.tasks, result, new Set());

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(hierarchyData.relationships);
    if (circularDeps.length > 0) {
      result.errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate tasks recursively for structure and data integrity
   * @param {Array} tasks - Tasks to validate
   * @param {Object} result - Validation result accumulator
   * @param {Set} seenIds - Set of seen task IDs to detect duplicates
   */
  validateTasksRecursively(tasks, result, seenIds) {
    tasks.forEach(task => {
      // Check for duplicate IDs
      if (seenIds.has(task.id)) {
        result.errors.push(`Duplicate task ID detected: ${task.id}`);
        result.isValid = false;
      }
      seenIds.add(task.id);

      // Validate required fields
      if (!task.title || task.title.trim() === '') {
        result.errors.push(`Task ${task.id} missing required title`);
        result.isValid = false;
      }

      if (!task.duration || task.duration < this.validationRules.minTaskDuration) {
        result.errors.push(`Task ${task.id} has invalid duration: ${task.duration}`);
        result.isValid = false;
      }

      if (task.duration > this.validationRules.maxParentDuration) {
        result.warnings.push(`Task ${task.id} has very long duration: ${task.duration} days`);
      }

      // Validate hierarchy metadata
      if (typeof task.level !== 'number' || task.level < 0) {
        result.errors.push(`Task ${task.id} has invalid level: ${task.level}`);
        result.isValid = false;
      }

      if (typeof task.isMainTask !== 'boolean') {
        result.errors.push(`Task ${task.id} missing isMainTask flag`);
        result.isValid = false;
      }

      if (task.hasSubtasks === undefined || typeof task.hasSubtasks !== 'boolean') {
        result.errors.push(`Task ${task.id} missing hasSubtasks flag`);
        result.isValid = false;
      }

      // Validate subtask consistency
      if (task.hasSubtasks && (!task.subtasks || task.subtasks.length === 0)) {
        result.warnings.push(`Task ${task.id} marked as having subtasks but subtasks array is empty`);
      }

      if (!task.hasSubtasks && task.subtasks && task.subtasks.length > 0) {
        result.warnings.push(`Task ${task.id} has subtasks but not marked as having subtasks`);
      }

      // Validate aggregated duration
      if (task.hasSubtasks && task.aggregatedDuration) {
        const calculatedDuration = this.calculateAggregatedDuration(task);
        if (Math.abs(task.aggregatedDuration - calculatedDuration) > 1) {
          result.warnings.push(`Task ${task.id} aggregated duration mismatch: stored=${task.aggregatedDuration}, calculated=${calculatedDuration}`);
        }
      }

      // Recursively validate subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        this.validateTasksRecursively(task.subtasks, result, seenIds);
      }
    });
  }

  /**
   * Detect circular dependencies in task relationships
   * @param {Map} relationships - Map of task ID to parent task ID
   * @returns {Array} Array of circular dependency chains
   */
  detectCircularDependencies(relationships) {
    const circularDeps = [];
    const visited = new Set();
    const recursionStack = new Set();

    // Check each task for circular dependencies
    for (const [taskId] of relationships) {
      if (!visited.has(taskId)) {
        const path = [];
        if (this.hasCycleDFS(taskId, relationships, visited, recursionStack, path)) {
          circularDeps.push(path.join(' -> '));
        }
      }
    }

    return circularDeps;
  }

  /**
   * Depth-first search to detect cycles in task relationships
   * @param {string} taskId - Current task ID
   * @param {Map} relationships - Task relationships map
   * @param {Set} visited - Set of visited nodes
   * @param {Set} recursionStack - Current recursion stack
   * @param {Array} path - Current path for cycle detection
   * @returns {boolean} True if cycle detected
   */
  hasCycleDFS(taskId, relationships, visited, recursionStack, path) {
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);

    const parentId = relationships.get(taskId);
    if (parentId) {
      if (!visited.has(parentId)) {
        if (this.hasCycleDFS(parentId, relationships, visited, recursionStack, path)) {
          return true;
        }
      } else if (recursionStack.has(parentId)) {
        // Cycle detected
        const cycleStart = path.indexOf(parentId);
        path.splice(0, cycleStart); // Keep only the cycle part
        return true;
      }
    }

    recursionStack.delete(taskId);
    path.pop();
    return false;
  }

  /**
   * Generate unique task ID based on hierarchy level and count
   * @param {number} level - Hierarchy level
   * @param {number} count - Task count
   * @returns {string} Generated task ID
   */
  generateTaskId(level, count) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task_l${level}_${count}_${timestamp}_${random}`;
  }

  /**
   * Validate and normalize task duration
   * @param {number} duration - Raw duration value
   * @returns {number} Validated duration
   */
  validateDuration(duration) {
    if (typeof duration !== 'number' || isNaN(duration)) {
      console.warn(`Invalid duration value: ${duration}. Using default of 1 day.`);
      return 1;
    }

    if (duration < this.validationRules.minTaskDuration) {
      console.warn(`Duration too small: ${duration}. Using minimum of ${this.validationRules.minTaskDuration} day(s).`);
      return this.validationRules.minTaskDuration;
    }

    if (duration > this.validationRules.maxParentDuration) {
      console.warn(`Duration too large: ${duration}. Using maximum of ${this.validationRules.maxParentDuration} days.`);
      return this.validationRules.maxParentDuration;
    }

    return Math.round(duration); // Ensure integer days
  }

  /**
   * Get hierarchy statistics for debugging and analysis
   * @param {Object} hierarchyData - Hierarchy data
   * @returns {Object} Statistics about the hierarchy
   */
  getHierarchyStatistics(hierarchyData) {
    const stats = {
      totalTasks: hierarchyData.taskCount,
      maxDepth: hierarchyData.maxDepth,
      mainTasks: 0,
      subtasks: 0,
      subSubtasks: 0,
      tasksWithSubtasks: 0,
      averageDuration: 0,
      totalDuration: 0
    };

    const calculateStats = (tasks, level) => {
      tasks.forEach(task => {
        if (level === 0) stats.mainTasks++;
        else if (level === 1) stats.subtasks++;
        else if (level === 2) stats.subSubtasks++;

        if (task.hasSubtasks) stats.tasksWithSubtasks++;
        
        stats.totalDuration += task.duration || 0;

        if (task.subtasks && task.subtasks.length > 0) {
          calculateStats(task.subtasks, level + 1);
        }
      });
    };

    calculateStats(hierarchyData.tasks, 0);
    
    if (hierarchyData.taskCount > 0) {
      stats.averageDuration = Math.round(stats.totalDuration / hierarchyData.taskCount * 100) / 100;
    }

    return stats;
  }
}

// Export singleton instance
export const hierarchyResponseParser = new HierarchyResponseParser();