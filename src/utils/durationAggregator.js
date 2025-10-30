/**
 * DurationAggregator - Handles duration aggregation for hierarchical task structures
 * Calculates aggregatedDuration for parent tasks and validates duration consistency
 */

export class DurationAggregator {
  constructor() {
    // Configuration for duration aggregation
    this.config = {
      // Threshold for duration conflict detection (percentage)
      conflictThreshold: 0.2, // 20% difference triggers warning
      
      // Minimum difference in days to consider a conflict
      minConflictDays: 2,
      
      // Maximum allowed duration for any task
      maxDuration: 365,
      
      // Minimum duration for any task
      minDuration: 1,
      
      // Strategy for handling conflicts
      conflictResolution: 'use_subtasks' // 'use_subtasks', 'use_parent', 'average'
    };

    // Track aggregation statistics
    this.stats = {
      tasksProcessed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      totalAggregatedDuration: 0
    };
  }

  /**
   * Calculate aggregated duration for parent tasks based on subtask durations
   * @param {Object} task - Parent task with subtasks
   * @param {Object} options - Aggregation options
   * @returns {number} Calculated aggregated duration
   */
  calculateAggregatedDuration(task, options = {}) {
    const config = { ...this.config, ...options };
    
    if (!task || typeof task !== 'object') {
      throw new Error('Valid task object is required');
    }

    // Reset stats for this calculation
    this.stats.tasksProcessed++;

    // If task has no subtasks, return its own duration
    if (!task.subtasks || !Array.isArray(task.subtasks) || task.subtasks.length === 0) {
      return this.validateDuration(task.duration || config.minDuration);
    }

    // Calculate subtask duration sum recursively
    const subtaskDurationSum = this.calculateSubtaskDurationSum(task.subtasks, config);
    
    // Handle duration conflicts between parent and children
    const resolvedDuration = this.resolveDurationConflict(
      task,
      subtaskDurationSum,
      config
    );

    this.stats.totalAggregatedDuration += resolvedDuration;
    return resolvedDuration;
  }

  /**
   * Calculate sum of subtask durations recursively
   * @param {Array} subtasks - Array of subtasks
   * @param {Object} config - Configuration options
   * @returns {number} Sum of subtask durations
   */
  calculateSubtaskDurationSum(subtasks, config) {
    let sum = 0;

    subtasks.forEach(subtask => {
      if (subtask.subtasks && subtask.subtasks.length > 0) {
        // Recursively calculate for nested subtasks
        const aggregatedDuration = this.calculateAggregatedDuration(subtask, config);
        sum += aggregatedDuration;
      } else {
        // Use the subtask's own duration
        sum += this.validateDuration(subtask.duration || config.minDuration);
      }
    });

    return sum;
  }

  /**
   * Resolve duration conflicts between parent and subtask durations
   * @param {Object} parentTask - Parent task
   * @param {number} subtaskSum - Sum of subtask durations
   * @param {Object} config - Configuration options
   * @returns {number} Resolved duration
   */
  resolveDurationConflict(parentTask, subtaskSum, config) {
    const parentDuration = this.validateDuration(parentTask.duration || config.minDuration);
    
    // If no subtasks or subtask sum is zero, use parent duration
    if (subtaskSum === 0) {
      return parentDuration;
    }

    // Check for duration conflicts
    const conflict = this.detectDurationConflict(parentDuration, subtaskSum, config);
    
    if (conflict.hasConflict) {
      this.stats.conflictsDetected++;
      
      // Log the conflict
      console.warn(`Duration conflict detected for task "${parentTask.title}":`, {
        parentDuration,
        subtaskSum,
        difference: conflict.difference,
        percentageDiff: conflict.percentageDiff
      });

      // Resolve based on strategy
      const resolvedDuration = this.applyConflictResolution(
        parentDuration,
        subtaskSum,
        config.conflictResolution,
        parentTask
      );

      this.stats.conflictsResolved++;
      return resolvedDuration;
    }

    // No conflict, use subtask sum as it's more accurate
    return subtaskSum;
  }

  /**
   * Detect duration conflicts between parent and subtask durations
   * @param {number} parentDuration - Parent task duration
   * @param {number} subtaskSum - Sum of subtask durations
   * @param {Object} config - Configuration options
   * @returns {Object} Conflict detection result
   */
  detectDurationConflict(parentDuration, subtaskSum, config) {
    const difference = Math.abs(parentDuration - subtaskSum);
    const maxDuration = Math.max(parentDuration, subtaskSum);
    const percentageDiff = maxDuration > 0 ? (difference / maxDuration) : 0;

    // Determine if this is a significant conflict
    const hasConflict = difference >= config.minConflictDays && 
                       percentageDiff >= config.conflictThreshold;

    return {
      hasConflict,
      difference,
      percentageDiff: Math.round(percentageDiff * 100),
      parentDuration,
      subtaskSum
    };
  }

  /**
   * Apply conflict resolution strategy
   * @param {number} parentDuration - Parent task duration
   * @param {number} subtaskSum - Sum of subtask durations
   * @param {string} strategy - Resolution strategy
   * @param {Object} parentTask - Parent task object for context
   * @returns {number} Resolved duration
   */
  applyConflictResolution(parentDuration, subtaskSum, strategy, parentTask) {
    switch (strategy) {
      case 'use_parent':
        console.log(`Using parent duration for task "${parentTask.title}": ${parentDuration} days`);
        return parentDuration;

      case 'use_subtasks':
        console.log(`Using subtask sum for task "${parentTask.title}": ${subtaskSum} days`);
        return subtaskSum;

      case 'average':
        const average = Math.round((parentDuration + subtaskSum) / 2);
        console.log(`Using average duration for task "${parentTask.title}": ${average} days`);
        return average;

      case 'maximum':
        const maximum = Math.max(parentDuration, subtaskSum);
        console.log(`Using maximum duration for task "${parentTask.title}": ${maximum} days`);
        return maximum;

      case 'minimum':
        const minimum = Math.min(parentDuration, subtaskSum);
        console.log(`Using minimum duration for task "${parentTask.title}": ${minimum} days`);
        return minimum;

      default:
        // Default to subtasks as they are typically more detailed
        console.log(`Using default (subtasks) duration for task "${parentTask.title}": ${subtaskSum} days`);
        return subtaskSum;
    }
  }

  /**
   * Add validation to ensure duration consistency across hierarchy levels
   * @param {Array} tasks - Tasks to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateDurationConsistency(tasks, options = {}) {
    const config = { ...this.config, ...options };
    
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        totalTasks: 0,
        tasksWithSubtasks: 0,
        conflictsFound: 0,
        averageDuration: 0,
        totalDuration: 0
      }
    };

    // Validate each task recursively
    this.validateTaskDurationsRecursively(tasks, result, config);

    // Calculate final statistics
    if (result.statistics.totalTasks > 0) {
      result.statistics.averageDuration = Math.round(
        result.statistics.totalDuration / result.statistics.totalTasks * 100
      ) / 100;
    }

    return result;
  }

  /**
   * Validate task durations recursively
   * @param {Array} tasks - Tasks to validate
   * @param {Object} result - Validation result accumulator
   * @param {Object} config - Configuration options
   */
  validateTaskDurationsRecursively(tasks, result, config) {
    tasks.forEach(task => {
      result.statistics.totalTasks++;
      
      // Validate individual task duration
      const taskDuration = this.validateDuration(task.duration);
      result.statistics.totalDuration += taskDuration;

      if (taskDuration !== task.duration) {
        result.warnings.push(`Task "${task.title}" duration adjusted from ${task.duration} to ${taskDuration}`);
      }

      // Check tasks with subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        result.statistics.tasksWithSubtasks++;
        
        // Calculate expected aggregated duration
        const expectedAggregated = this.calculateAggregatedDuration(task, config);
        
        // Check if stored aggregated duration matches calculated
        if (task.aggregatedDuration && 
            Math.abs(task.aggregatedDuration - expectedAggregated) > 1) {
          
          result.warnings.push(
            `Task "${task.title}" aggregated duration mismatch: ` +
            `stored=${task.aggregatedDuration}, calculated=${expectedAggregated}`
          );
          result.statistics.conflictsFound++;
        }

        // Recursively validate subtasks
        this.validateTaskDurationsRecursively(task.subtasks, result, config);
      }
    });
  }

  /**
   * Handle cases where parent and child durations conflict
   * @param {Object} parentTask - Parent task
   * @param {Array} childTasks - Child tasks
   * @param {string} strategy - Conflict handling strategy
   * @returns {Object} Resolution result
   */
  handleDurationConflicts(parentTask, childTasks, strategy = 'use_subtasks') {
    if (!parentTask || !Array.isArray(childTasks)) {
      throw new Error('Valid parent task and child tasks array required');
    }

    const result = {
      originalParentDuration: parentTask.duration,
      childDurationSum: 0,
      resolvedDuration: 0,
      conflictDetected: false,
      resolutionApplied: strategy,
      adjustedTasks: []
    };

    // Calculate child duration sum
    result.childDurationSum = childTasks.reduce((sum, child) => {
      return sum + this.validateDuration(child.duration || 1);
    }, 0);

    // Detect conflict
    const conflict = this.detectDurationConflict(
      parentTask.duration,
      result.childDurationSum,
      this.config
    );

    result.conflictDetected = conflict.hasConflict;

    if (conflict.hasConflict) {
      // Apply resolution strategy
      result.resolvedDuration = this.applyConflictResolution(
        parentTask.duration,
        result.childDurationSum,
        strategy,
        parentTask
      );

      // Update parent task
      parentTask.duration = result.resolvedDuration;
      parentTask.aggregatedDuration = result.resolvedDuration;
      result.adjustedTasks.push({
        taskId: parentTask.id,
        taskTitle: parentTask.title,
        oldDuration: result.originalParentDuration,
        newDuration: result.resolvedDuration
      });
    } else {
      result.resolvedDuration = result.childDurationSum;
      parentTask.aggregatedDuration = result.resolvedDuration;
    }

    return result;
  }

  /**
   * Validate and normalize duration value
   * @param {number} duration - Raw duration value
   * @returns {number} Validated duration
   */
  validateDuration(duration) {
    if (typeof duration !== 'number' || isNaN(duration)) {
      return this.config.minDuration;
    }

    if (duration < this.config.minDuration) {
      return this.config.minDuration;
    }

    if (duration > this.config.maxDuration) {
      return this.config.maxDuration;
    }

    return Math.round(duration); // Ensure integer days
  }

  /**
   * Update aggregated durations for all tasks in hierarchy
   * @param {Array} tasks - Tasks to update
   * @param {Object} options - Update options
   * @returns {Object} Update result with statistics
   */
  updateAggregatedDurations(tasks, options = {}) {
    const config = { ...this.config, ...options };
    
    const result = {
      tasksUpdated: 0,
      conflictsResolved: 0,
      totalDuration: 0,
      updatedTasks: []
    };

    // Reset stats
    this.stats = {
      tasksProcessed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      totalAggregatedDuration: 0
    };

    // Update each task recursively
    this.updateTaskDurationsRecursively(tasks, result, config);

    // Copy stats to result
    result.statistics = { ...this.stats };

    return result;
  }

  /**
   * Update task durations recursively
   * @param {Array} tasks - Tasks to update
   * @param {Object} result - Update result accumulator
   * @param {Object} config - Configuration options
   */
  updateTaskDurationsRecursively(tasks, result, config) {
    tasks.forEach(task => {
      // First, recursively update subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        this.updateTaskDurationsRecursively(task.subtasks, result, config);
        
        // Then calculate aggregated duration for this parent
        const oldAggregated = task.aggregatedDuration;
        const newAggregated = this.calculateAggregatedDuration(task, config);
        
        if (oldAggregated !== newAggregated) {
          task.aggregatedDuration = newAggregated;
          task.updatedAt = new Date().toISOString();
          
          result.tasksUpdated++;
          result.updatedTasks.push({
            taskId: task.id,
            taskTitle: task.title,
            oldAggregated,
            newAggregated
          });
        }
      } else {
        // For leaf tasks, aggregated duration equals task duration
        const validatedDuration = this.validateDuration(task.duration);
        if (task.aggregatedDuration !== validatedDuration) {
          task.aggregatedDuration = validatedDuration;
          task.updatedAt = new Date().toISOString();
          result.tasksUpdated++;
        }
      }

      result.totalDuration += task.aggregatedDuration || task.duration || 0;
    });
  }

  /**
   * Get aggregation statistics
   * @returns {Object} Current aggregation statistics
   */
  getAggregationStatistics() {
    return {
      ...this.stats,
      conflictResolutionRate: this.stats.conflictsDetected > 0 ? 
        Math.round(this.stats.conflictsResolved / this.stats.conflictsDetected * 100) : 0,
      averageDurationPerTask: this.stats.tasksProcessed > 0 ?
        Math.round(this.stats.totalAggregatedDuration / this.stats.tasksProcessed * 100) / 100 : 0
    };
  }

  /**
   * Reset aggregation statistics
   */
  resetStatistics() {
    this.stats = {
      tasksProcessed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      totalAggregatedDuration: 0
    };
  }

  /**
   * Configure duration aggregation settings
   * @param {Object} newConfig - New configuration options
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const durationAggregator = new DurationAggregator();