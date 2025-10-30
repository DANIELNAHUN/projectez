/**
 * TaskHierarchyBuilder - Specialized utility for building task hierarchies
 * Implements buildTaskHierarchy method and parent-child relationship logic
 */

export class TaskHierarchyBuilder {
  constructor() {
    // Configuration for hierarchy building
    this.config = {
      maxDepth: 3,           // Maximum hierarchy levels (0=main, 1=sub, 2=sub-sub)
      maxSubtasks: 20,       // Maximum subtasks per parent
      generateIds: true,     // Whether to generate new IDs
      preserveOrder: true    // Whether to preserve original task order
    };
  }

  /**
   * Build task hierarchy with parent-child relationships
   * @param {Array} tasks - Raw tasks array from AI response
   * @param {Object} options - Building options
   * @returns {Object} Built hierarchy with tasks and metadata
   */
  buildTaskHierarchy(tasks, options = {}) {
    if (!Array.isArray(tasks)) {
      throw new Error('Tasks must be an array');
    }

    const config = { ...this.config, ...options };
    
    const hierarchy = {
      tasks: [],
      relationships: new Map(),
      metadata: {
        totalTasks: 0,
        maxDepth: 0,
        mainTaskCount: 0,
        subtaskCount: 0,
        tasksByLevel: new Map()
      }
    };

    // Process each top-level task
    tasks.forEach((task, index) => {
      const builtTask = this.buildTaskWithRelationships(
        task,
        null,     // No parent for main tasks
        0,        // Level 0 for main tasks
        index,    // Original order
        hierarchy,
        config
      );
      
      hierarchy.tasks.push(builtTask);
      hierarchy.metadata.mainTaskCount++;
    });

    // Finalize metadata
    this.finalizeHierarchyMetadata(hierarchy);

    return hierarchy;
  }

  /**
   * Build a single task with its relationships and subtasks
   * @param {Object} task - Original task object
   * @param {string} parentTaskId - Parent task ID (null for main tasks)
   * @param {number} level - Current hierarchy level
   * @param {number} order - Task order within its level
   * @param {Object} hierarchy - Hierarchy accumulator
   * @param {Object} config - Building configuration
   * @returns {Object} Built task with hierarchy metadata
   */
  buildTaskWithRelationships(task, parentTaskId, level, order, hierarchy, config) {
    // Validate hierarchy depth
    if (level > config.maxDepth) {
      throw new Error(`Maximum hierarchy depth exceeded: ${level} > ${config.maxDepth}`);
    }

    // Update metadata
    hierarchy.metadata.maxDepth = Math.max(hierarchy.metadata.maxDepth, level);
    hierarchy.metadata.totalTasks++;

    // Track tasks by level
    if (!hierarchy.metadata.tasksByLevel.has(level)) {
      hierarchy.metadata.tasksByLevel.set(level, 0);
    }
    hierarchy.metadata.tasksByLevel.set(level, hierarchy.metadata.tasksByLevel.get(level) + 1);

    // Generate or preserve task ID
    const taskId = config.generateIds ? 
      this.generateHierarchicalTaskId(level, hierarchy.metadata.totalTasks) :
      task.id || this.generateHierarchicalTaskId(level, hierarchy.metadata.totalTasks);

    // Build the task with hierarchy metadata
    const builtTask = {
      // Core task properties
      id: taskId,
      title: task.title || '',
      description: task.description || '',
      duration: this.normalizeDuration(task.duration),
      priority: task.priority || 'medium',
      type: task.type || 'simple',
      status: task.status || 'pending',

      // Hierarchy properties
      parentTaskId: parentTaskId,
      level: level,
      isMainTask: level === 0,
      hasSubtasks: this.hasValidSubtasks(task),
      originalOrder: config.preserveOrder ? order : undefined,

      // Relationship metadata
      childTaskIds: [],
      subtasks: [],

      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add optional properties
    if (task.deliverable && task.type === 'with_deliverable') {
      builtTask.deliverable = this.buildDeliverable(task.deliverable);
    }

    if (task.dependencies && Array.isArray(task.dependencies)) {
      builtTask.dependencies = [...task.dependencies];
    }

    // Store parent-child relationship
    if (parentTaskId) {
      hierarchy.relationships.set(taskId, parentTaskId);
    }

    // Process subtasks if present
    if (builtTask.hasSubtasks) {
      this.processSubtasks(task, builtTask, level, hierarchy, config);
    }

    return builtTask;
  }

  /**
   * Process subtasks for a parent task
   * @param {Object} originalTask - Original task with subtasks
   * @param {Object} builtTask - Built parent task
   * @param {number} level - Current level
   * @param {Object} hierarchy - Hierarchy accumulator
   * @param {Object} config - Building configuration
   */
  processSubtasks(originalTask, builtTask, level, hierarchy, config) {
    if (!originalTask.subtasks || !Array.isArray(originalTask.subtasks)) {
      return;
    }

    // Validate subtask count
    if (originalTask.subtasks.length > config.maxSubtasks) {
      throw new Error(`Too many subtasks for task "${originalTask.title}": ${originalTask.subtasks.length} > ${config.maxSubtasks}`);
    }

    // Process each subtask
    originalTask.subtasks.forEach((subtask, subtaskIndex) => {
      const builtSubtask = this.buildTaskWithRelationships(
        subtask,
        builtTask.id,
        level + 1,
        subtaskIndex,
        hierarchy,
        config
      );

      // Add to parent's subtasks and child IDs
      builtTask.subtasks.push(builtSubtask);
      builtTask.childTaskIds.push(builtSubtask.id);

      // Update subtask count
      hierarchy.metadata.subtaskCount++;
    });
  }

  /**
   * Assign parentTaskId to subtasks and sub-subtasks
   * @param {Array} tasks - Tasks array to process
   * @param {string} parentId - Parent task ID to assign
   * @returns {Array} Tasks with assigned parent IDs
   */
  assignParentTaskIds(tasks, parentId = null) {
    return tasks.map(task => {
      const updatedTask = {
        ...task,
        parentTaskId: parentId
      };

      // Recursively assign parent IDs to subtasks
      if (task.subtasks && Array.isArray(task.subtasks)) {
        updatedTask.subtasks = this.assignParentTaskIds(task.subtasks, task.id);
      }

      return updatedTask;
    });
  }

  /**
   * Calculate level for each task in the hierarchy (0=main, 1=sub, 2=sub-sub)
   * @param {Array} tasks - Tasks to process
   * @param {number} startLevel - Starting level (default 0)
   * @returns {Array} Tasks with calculated levels
   */
  calculateTaskLevels(tasks, startLevel = 0) {
    return tasks.map(task => {
      const updatedTask = {
        ...task,
        level: startLevel,
        isMainTask: startLevel === 0
      };

      // Recursively calculate levels for subtasks
      if (task.subtasks && Array.isArray(task.subtasks)) {
        updatedTask.subtasks = this.calculateTaskLevels(task.subtasks, startLevel + 1);
        updatedTask.hasSubtasks = true;
      } else {
        updatedTask.hasSubtasks = false;
      }

      return updatedTask;
    });
  }

  /**
   * Flatten hierarchical tasks into a single array with level information
   * @param {Array} tasks - Hierarchical tasks
   * @param {Array} result - Accumulator for flattened tasks
   * @returns {Array} Flattened tasks with hierarchy metadata
   */
  flattenHierarchy(tasks, result = []) {
    tasks.forEach(task => {
      // Add current task to result
      const flatTask = {
        ...task,
        subtasks: [] // Remove nested subtasks from flat representation
      };
      result.push(flatTask);

      // Recursively flatten subtasks
      if (task.subtasks && Array.isArray(task.subtasks)) {
        this.flattenHierarchy(task.subtasks, result);
      }
    });

    return result;
  }

  /**
   * Rebuild hierarchy from flattened tasks using parentTaskId relationships
   * @param {Array} flatTasks - Flattened tasks with parentTaskId
   * @returns {Array} Rebuilt hierarchical tasks
   */
  rebuildHierarchyFromFlat(flatTasks) {
    if (!Array.isArray(flatTasks)) {
      throw new Error('Flat tasks must be an array');
    }

    // Create maps for efficient lookup
    const taskMap = new Map();
    const childrenMap = new Map();

    // First pass: create task map and children map
    flatTasks.forEach(task => {
      taskMap.set(task.id, { ...task, subtasks: [] });
      
      if (task.parentTaskId) {
        if (!childrenMap.has(task.parentTaskId)) {
          childrenMap.set(task.parentTaskId, []);
        }
        childrenMap.get(task.parentTaskId).push(task.id);
      }
    });

    // Second pass: build hierarchy
    const rootTasks = [];
    
    flatTasks.forEach(task => {
      const builtTask = taskMap.get(task.id);
      
      // Add children to this task
      const childIds = childrenMap.get(task.id) || [];
      builtTask.subtasks = childIds.map(childId => taskMap.get(childId));
      builtTask.hasSubtasks = builtTask.subtasks.length > 0;
      builtTask.childTaskIds = childIds;

      // If this is a root task (no parent), add to root tasks
      if (!task.parentTaskId) {
        rootTasks.push(builtTask);
      }
    });

    return rootTasks;
  }

  /**
   * Generate hierarchical task ID with level information
   * @param {number} level - Task level
   * @param {number} count - Task count
   * @returns {string} Generated task ID
   */
  generateHierarchicalTaskId(level, count) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `task_l${level}_${count}_${timestamp}_${random}`;
  }

  /**
   * Check if task has valid subtasks
   * @param {Object} task - Task to check
   * @returns {boolean} True if task has valid subtasks
   */
  hasValidSubtasks(task) {
    return task.subtasks && 
           Array.isArray(task.subtasks) && 
           task.subtasks.length > 0 &&
           task.subtasks.every(subtask => subtask && typeof subtask === 'object');
  }

  /**
   * Normalize task duration to valid range
   * @param {number} duration - Raw duration
   * @returns {number} Normalized duration
   */
  normalizeDuration(duration) {
    if (typeof duration !== 'number' || isNaN(duration) || duration < 1) {
      return 1; // Default to 1 day
    }
    
    if (duration > 365) {
      return 365; // Cap at 1 year
    }
    
    return Math.round(duration);
  }

  /**
   * Build deliverable object with validation
   * @param {Object} deliverable - Raw deliverable data
   * @returns {Object} Built deliverable
   */
  buildDeliverable(deliverable) {
    const validTypes = ['presentation', 'file', 'exposition', 'other'];
    
    return {
      type: validTypes.includes(deliverable.type) ? deliverable.type : 'other',
      description: deliverable.description || '',
      status: 'pending',
      notes: deliverable.notes || ''
    };
  }

  /**
   * Finalize hierarchy metadata after building
   * @param {Object} hierarchy - Hierarchy object to finalize
   */
  finalizeHierarchyMetadata(hierarchy) {
    // Calculate additional statistics
    hierarchy.metadata.averageSubtasksPerParent = hierarchy.metadata.mainTaskCount > 0 ?
      Math.round(hierarchy.metadata.subtaskCount / hierarchy.metadata.mainTaskCount * 100) / 100 : 0;

    // Convert level map to object for serialization
    hierarchy.metadata.tasksByLevelArray = Array.from(hierarchy.metadata.tasksByLevel.entries());
    
    // Add timestamp
    hierarchy.metadata.builtAt = new Date().toISOString();
  }

  /**
   * Validate hierarchy structure after building
   * @param {Object} hierarchy - Built hierarchy
   * @returns {Object} Validation result
   */
  validateBuiltHierarchy(hierarchy) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check basic structure
    if (!hierarchy.tasks || !Array.isArray(hierarchy.tasks)) {
      result.errors.push('Hierarchy must have tasks array');
      result.isValid = false;
      return result;
    }

    // Validate each task recursively
    const seenIds = new Set();
    this.validateTasksInHierarchy(hierarchy.tasks, result, seenIds);

    // Validate relationships consistency
    this.validateRelationshipConsistency(hierarchy, result);

    return result;
  }

  /**
   * Validate tasks in hierarchy recursively
   * @param {Array} tasks - Tasks to validate
   * @param {Object} result - Validation result accumulator
   * @param {Set} seenIds - Set of seen task IDs
   */
  validateTasksInHierarchy(tasks, result, seenIds) {
    tasks.forEach(task => {
      // Check for duplicate IDs
      if (seenIds.has(task.id)) {
        result.errors.push(`Duplicate task ID: ${task.id}`);
        result.isValid = false;
      }
      seenIds.add(task.id);

      // Validate required fields
      if (!task.title || task.title.trim() === '') {
        result.errors.push(`Task ${task.id} missing title`);
        result.isValid = false;
      }

      if (typeof task.level !== 'number' || task.level < 0) {
        result.errors.push(`Task ${task.id} has invalid level: ${task.level}`);
        result.isValid = false;
      }

      // Validate hierarchy consistency
      if (task.level === 0 && task.parentTaskId) {
        result.errors.push(`Main task ${task.id} should not have parent`);
        result.isValid = false;
      }

      if (task.level > 0 && !task.parentTaskId) {
        result.errors.push(`Subtask ${task.id} missing parent ID`);
        result.isValid = false;
      }

      // Validate subtasks
      if (task.hasSubtasks && (!task.subtasks || task.subtasks.length === 0)) {
        result.warnings.push(`Task ${task.id} marked as having subtasks but none found`);
      }

      // Recursively validate subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        this.validateTasksInHierarchy(task.subtasks, result, seenIds);
      }
    });
  }

  /**
   * Validate relationship consistency in hierarchy
   * @param {Object} hierarchy - Hierarchy to validate
   * @param {Object} result - Validation result accumulator
   */
  validateRelationshipConsistency(hierarchy, result) {
    // Check that all relationships in the map correspond to actual tasks
    const allTaskIds = new Set();
    this.collectAllTaskIds(hierarchy.tasks, allTaskIds);

    hierarchy.relationships.forEach((parentId, childId) => {
      if (!allTaskIds.has(childId)) {
        result.errors.push(`Relationship references non-existent child task: ${childId}`);
        result.isValid = false;
      }
      
      if (!allTaskIds.has(parentId)) {
        result.errors.push(`Relationship references non-existent parent task: ${parentId}`);
        result.isValid = false;
      }
    });
  }

  /**
   * Collect all task IDs from hierarchy
   * @param {Array} tasks - Tasks to collect IDs from
   * @param {Set} idSet - Set to collect IDs into
   */
  collectAllTaskIds(tasks, idSet) {
    tasks.forEach(task => {
      idSet.add(task.id);
      if (task.subtasks && task.subtasks.length > 0) {
        this.collectAllTaskIds(task.subtasks, idSet);
      }
    });
  }
}

// Export singleton instance
export const taskHierarchyBuilder = new TaskHierarchyBuilder();