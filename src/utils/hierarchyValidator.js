/**
 * HierarchyValidator - Comprehensive validation utilities for task hierarchies
 * Provides additional validation methods beyond the basic hierarchy validation
 */

export class HierarchyValidator {
  constructor() {
    this.maxHierarchyDepth = 3;
    this.validationRules = {
      maxParentDuration: 365,
      minTaskDuration: 1,
      maxSubtasks: 20,
      maxTotalTasks: 100,
      maxTitleLength: 200,
      maxDescriptionLength: 1000
    };
  }

  /**
   * Comprehensive hierarchy structure validation
   * @param {Object} hierarchyData - Hierarchy data to validate
   * @returns {Object} Detailed validation result
   */
  validateHierarchy(hierarchyData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: this.getValidationStatistics(hierarchyData)
    };

    // Basic structure validation
    this.validateBasicStructure(hierarchyData, result);
    
    // Task integrity validation
    this.validateTaskIntegrity(hierarchyData.tasks, result, new Set());
    
    // Relationship validation
    this.validateRelationships(hierarchyData, result);
    
    // Circular dependency detection
    const circularDeps = this.detectCircularDependencies(hierarchyData.relationships);
    if (circularDeps.length > 0) {
      result.errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
      result.isValid = false;
    }

    // Depth validation
    this.validateHierarchyDepth(hierarchyData, result);

    return result;
  }

  /**
   * Validate basic hierarchy structure
   * @param {Object} hierarchyData - Hierarchy data
   * @param {Object} result - Validation result accumulator
   */
  validateBasicStructure(hierarchyData, result) {
    // Check required properties
    if (!hierarchyData || typeof hierarchyData !== 'object') {
      result.errors.push('Invalid hierarchy data: must be an object');
      result.isValid = false;
      return;
    }

    if (!Array.isArray(hierarchyData.tasks)) {
      result.errors.push('Invalid hierarchy data: tasks must be an array');
      result.isValid = false;
      return;
    }

    if (!(hierarchyData.relationships instanceof Map)) {
      result.errors.push('Invalid hierarchy data: relationships must be a Map');
      result.isValid = false;
      return;
    }

    // Check task count limits
    if (hierarchyData.taskCount > this.validationRules.maxTotalTasks) {
      result.errors.push(`Too many tasks: ${hierarchyData.taskCount}. Maximum allowed: ${this.validationRules.maxTotalTasks}`);
      result.isValid = false;
    }

    // Check for empty hierarchy
    if (hierarchyData.tasks.length === 0) {
      result.warnings.push('Hierarchy contains no tasks');
    }
  }

  /**
   * Validate task integrity recursively
   * @param {Array} tasks - Tasks to validate
   * @param {Object} result - Validation result accumulator
   * @param {Set} seenIds - Set of seen task IDs
   */
  validateTaskIntegrity(tasks, result, seenIds) {
    tasks.forEach((task, index) => {
      this.validateSingleTask(task, result, seenIds, index);
      
      // Recursively validate subtasks
      if (task.subtasks && Array.isArray(task.subtasks)) {
        this.validateTaskIntegrity(task.subtasks, result, seenIds);
      }
    });
  }

  /**
   * Validate a single task
   * @param {Object} task - Task to validate
   * @param {Object} result - Validation result accumulator
   * @param {Set} seenIds - Set of seen task IDs
   * @param {number} index - Task index in its array
   */
  validateSingleTask(task, result, seenIds, index) {
    const taskRef = `Task ${task.id || `at index ${index}`}`;

    // Check for duplicate IDs
    if (task.id && seenIds.has(task.id)) {
      result.errors.push(`${taskRef}: Duplicate task ID detected`);
      result.isValid = false;
    }
    if (task.id) seenIds.add(task.id);

    // Validate required fields
    if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
      result.errors.push(`${taskRef}: Missing or invalid title`);
      result.isValid = false;
    }

    if (task.title && task.title.length > this.validationRules.maxTitleLength) {
      result.warnings.push(`${taskRef}: Title too long (${task.title.length} chars). Maximum: ${this.validationRules.maxTitleLength}`);
    }

    if (task.description && task.description.length > this.validationRules.maxDescriptionLength) {
      result.warnings.push(`${taskRef}: Description too long (${task.description.length} chars). Maximum: ${this.validationRules.maxDescriptionLength}`);
    }

    // Validate duration
    if (typeof task.duration !== 'number' || task.duration < this.validationRules.minTaskDuration) {
      result.errors.push(`${taskRef}: Invalid duration (${task.duration}). Must be >= ${this.validationRules.minTaskDuration}`);
      result.isValid = false;
    }

    if (task.duration > this.validationRules.maxParentDuration) {
      result.warnings.push(`${taskRef}: Very long duration (${task.duration} days)`);
    }

    // Validate hierarchy metadata
    if (typeof task.level !== 'number' || task.level < 0) {
      result.errors.push(`${taskRef}: Invalid level (${task.level})`);
      result.isValid = false;
    }

    if (typeof task.isMainTask !== 'boolean') {
      result.errors.push(`${taskRef}: Missing isMainTask flag`);
      result.isValid = false;
    }

    if (typeof task.hasSubtasks !== 'boolean') {
      result.errors.push(`${taskRef}: Missing hasSubtasks flag`);
      result.isValid = false;
    }

    // Validate subtask consistency
    const hasSubtasksArray = task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0;
    
    if (task.hasSubtasks && !hasSubtasksArray) {
      result.warnings.push(`${taskRef}: Marked as having subtasks but subtasks array is empty`);
    }

    if (!task.hasSubtasks && hasSubtasksArray) {
      result.warnings.push(`${taskRef}: Has subtasks but not marked as having subtasks`);
    }

    // Validate subtask count
    if (hasSubtasksArray && task.subtasks.length > this.validationRules.maxSubtasks) {
      result.errors.push(`${taskRef}: Too many subtasks (${task.subtasks.length}). Maximum: ${this.validationRules.maxSubtasks}`);
      result.isValid = false;
    }

    // Validate aggregated duration
    if (task.hasSubtasks && typeof task.aggregatedDuration === 'number') {
      const expectedDuration = this.calculateExpectedAggregatedDuration(task);
      const difference = Math.abs(task.aggregatedDuration - expectedDuration);
      
      if (difference > 1) {
        result.warnings.push(`${taskRef}: Aggregated duration mismatch. Expected: ${expectedDuration}, Actual: ${task.aggregatedDuration}`);
      }
    }

    // Validate parent-child level consistency
    if (task.subtasks && Array.isArray(task.subtasks)) {
      task.subtasks.forEach(subtask => {
        if (subtask.level !== task.level + 1) {
          result.errors.push(`${taskRef}: Subtask level inconsistency. Parent level: ${task.level}, Subtask level: ${subtask.level}`);
          result.isValid = false;
        }

        if (subtask.parentTaskId !== task.id) {
          result.errors.push(`${taskRef}: Subtask parent ID mismatch. Expected: ${task.id}, Actual: ${subtask.parentTaskId}`);
          result.isValid = false;
        }
      });
    }
  }

  /**
   * Validate task relationships
   * @param {Object} hierarchyData - Hierarchy data
   * @param {Object} result - Validation result accumulator
   */
  validateRelationships(hierarchyData, result) {
    const allTaskIds = new Set();
    
    // Collect all task IDs
    const collectTaskIds = (tasks) => {
      tasks.forEach(task => {
        if (task.id) allTaskIds.add(task.id);
        if (task.subtasks && Array.isArray(task.subtasks)) {
          collectTaskIds(task.subtasks);
        }
      });
    };
    
    collectTaskIds(hierarchyData.tasks);

    // Validate relationships
    hierarchyData.relationships.forEach((parentId, childId) => {
      if (!allTaskIds.has(childId)) {
        result.errors.push(`Invalid relationship: Child task ${childId} not found in hierarchy`);
        result.isValid = false;
      }

      if (!allTaskIds.has(parentId)) {
        result.errors.push(`Invalid relationship: Parent task ${parentId} not found in hierarchy`);
        result.isValid = false;
      }
    });

    // Check for orphaned relationships
    const relationshipChildIds = new Set(hierarchyData.relationships.keys());
    const actualChildIds = new Set();
    
    const collectChildIds = (tasks) => {
      tasks.forEach(task => {
        if (task.subtasks && Array.isArray(task.subtasks)) {
          task.subtasks.forEach(subtask => {
            if (subtask.id) actualChildIds.add(subtask.id);
          });
          collectChildIds(task.subtasks);
        }
      });
    };
    
    collectChildIds(hierarchyData.tasks);

    // Check for missing relationships
    actualChildIds.forEach(childId => {
      if (!relationshipChildIds.has(childId)) {
        result.warnings.push(`Missing relationship entry for child task: ${childId}`);
      }
    });

    // Check for extra relationships
    relationshipChildIds.forEach(childId => {
      if (!actualChildIds.has(childId)) {
        result.warnings.push(`Extra relationship entry for non-existent child: ${childId}`);
      }
    });
  }

  /**
   * Validate hierarchy depth constraints
   * @param {Object} hierarchyData - Hierarchy data
   * @param {Object} result - Validation result accumulator
   */
  validateHierarchyDepth(hierarchyData, result) {
    if (hierarchyData.maxDepth > this.maxHierarchyDepth) {
      result.errors.push(`Hierarchy too deep: ${hierarchyData.maxDepth} levels. Maximum allowed: ${this.maxHierarchyDepth}`);
      result.isValid = false;
    }

    // Validate actual depth matches reported depth
    const actualMaxDepth = this.calculateActualMaxDepth(hierarchyData.tasks);
    if (actualMaxDepth !== hierarchyData.maxDepth) {
      result.warnings.push(`Reported max depth (${hierarchyData.maxDepth}) doesn't match actual max depth (${actualMaxDepth})`);
    }
  }

  /**
   * Calculate actual maximum depth of hierarchy
   * @param {Array} tasks - Tasks array
   * @param {number} currentDepth - Current depth level
   * @returns {number} Maximum depth found
   */
  calculateActualMaxDepth(tasks, currentDepth = 0) {
    let maxDepth = currentDepth;
    
    tasks.forEach(task => {
      if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        const subtaskDepth = this.calculateActualMaxDepth(task.subtasks, currentDepth + 1);
        maxDepth = Math.max(maxDepth, subtaskDepth);
      }
    });
    
    return maxDepth;
  }

  /**
   * Detect circular dependencies in task relationships
   * @param {Map} relationships - Task relationships map
   * @returns {Array} Array of circular dependency chains
   */
  detectCircularDependencies(relationships) {
    const circularDeps = [];
    const visited = new Set();
    const recursionStack = new Set();

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
   * Depth-first search for cycle detection
   * @param {string} taskId - Current task ID
   * @param {Map} relationships - Relationships map
   * @param {Set} visited - Visited nodes
   * @param {Set} recursionStack - Current recursion stack
   * @param {Array} path - Current path
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
        const cycleStart = path.indexOf(parentId);
        path.splice(0, cycleStart);
        return true;
      }
    }

    recursionStack.delete(taskId);
    path.pop();
    return false;
  }

  /**
   * Calculate expected aggregated duration for a task
   * @param {Object} task - Task with subtasks
   * @returns {number} Expected aggregated duration
   */
  calculateExpectedAggregatedDuration(task) {
    if (!task.hasSubtasks || !task.subtasks || task.subtasks.length === 0) {
      return task.duration || 0;
    }

    return task.subtasks.reduce((sum, subtask) => {
      return sum + (subtask.aggregatedDuration || subtask.duration || 0);
    }, 0);
  }

  /**
   * Get validation statistics
   * @param {Object} hierarchyData - Hierarchy data
   * @returns {Object} Validation statistics
   */
  getValidationStatistics(hierarchyData) {
    const stats = {
      totalTasks: hierarchyData.taskCount || 0,
      maxDepth: hierarchyData.maxDepth || 0,
      mainTasks: 0,
      subtasks: 0,
      subSubtasks: 0,
      tasksWithSubtasks: 0,
      totalDuration: 0,
      averageDuration: 0,
      relationshipCount: hierarchyData.relationships ? hierarchyData.relationships.size : 0
    };

    if (hierarchyData.tasks && Array.isArray(hierarchyData.tasks)) {
      this.calculateTaskStatistics(hierarchyData.tasks, stats, 0);
      
      if (stats.totalTasks > 0) {
        stats.averageDuration = Math.round(stats.totalDuration / stats.totalTasks * 100) / 100;
      }
    }

    return stats;
  }

  /**
   * Calculate task statistics recursively
   * @param {Array} tasks - Tasks array
   * @param {Object} stats - Statistics accumulator
   * @param {number} level - Current level
   */
  calculateTaskStatistics(tasks, stats, level) {
    tasks.forEach(task => {
      if (level === 0) stats.mainTasks++;
      else if (level === 1) stats.subtasks++;
      else if (level === 2) stats.subSubtasks++;

      if (task.hasSubtasks) stats.tasksWithSubtasks++;
      
      stats.totalDuration += task.duration || 0;

      if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        this.calculateTaskStatistics(task.subtasks, stats, level + 1);
      }
    });
  }

  /**
   * Validate maximum hierarchy depth constraint
   * @param {Array} tasks - Tasks to validate
   * @param {number} currentLevel - Current hierarchy level
   * @param {number} maxAllowedDepth - Maximum allowed depth
   * @returns {Object} Validation result
   */
  validateMaxDepth(tasks, currentLevel = 0, maxAllowedDepth = this.maxHierarchyDepth) {
    const result = {
      isValid: true,
      errors: [],
      maxDepthFound: currentLevel
    };

    if (currentLevel > maxAllowedDepth) {
      result.isValid = false;
      result.errors.push(`Maximum hierarchy depth exceeded: ${currentLevel} > ${maxAllowedDepth}`);
      return result;
    }

    tasks.forEach(task => {
      if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        const subtaskResult = this.validateMaxDepth(task.subtasks, currentLevel + 1, maxAllowedDepth);
        
        if (!subtaskResult.isValid) {
          result.isValid = false;
          result.errors.push(...subtaskResult.errors);
        }
        
        result.maxDepthFound = Math.max(result.maxDepthFound, subtaskResult.maxDepthFound);
      }
    });

    return result;
  }
}

// Export singleton instance
export const hierarchyValidator = new HierarchyValidator();