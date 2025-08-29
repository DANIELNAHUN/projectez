// Data models and interfaces for the Personal Project Manager
import { DateCalculationService } from '../services/dateCalculationService.js';

/**
 * Project interface
 */
export class Project {
  constructor({
    id = null,
    name = '',
    description = '',
    startDate = new Date(),
    endDate = null,
    status = 'active',
    teamMembers = [],
    tasks = [],
    createdAt = new Date(),
    updatedAt = new Date()
  } = {}) {
    this.id = id || this.generateId();
    this.name = name;
    this.description = description;
    this.startDate = startDate instanceof Date ? startDate : new Date(startDate);
    this.endDate = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null;
    this.status = status;
    this.teamMembers = teamMembers;
    this.tasks = tasks;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  }

  generateId() {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Adjust all project dates when project start date changes
   * @param {Date} newStartDate - New project start date
   */
  adjustProjectDates(newStartDate) {
    if (!newStartDate) {
      throw new Error('New start date is required');
    }

    const newStart = newStartDate instanceof Date ? newStartDate : new Date(newStartDate);
    
    if (!DateCalculationService.validateDateRange(newStart, this.endDate)) {
      console.warn('New start date is after project end date');
    }

    // Calculate the difference in working days
    const isMovingForward = newStart >= this.startDate;
    let daysDifference;
    
    if (isMovingForward) {
      daysDifference = DateCalculationService.calculateWorkingDays(this.startDate, newStart);
    } else {
      daysDifference = DateCalculationService.calculateWorkingDays(newStart, this.startDate);
    }

    // Adjust all task dates
    this.tasks.forEach(task => {
      try {
        if (isMovingForward) {
          // Moving project forward in time
          task.startDate = DateCalculationService.addWorkingDays(task.startDate, daysDifference);
        } else {
          // Moving project backward in time
          task.startDate = DateCalculationService.subtractWorkingDays(task.startDate, daysDifference);
        }
        
        // Recalculate end date based on task duration
        task.endDate = task.calculateEndDate(task.startDate, task.duration);
        task.updatedAt = new Date();
      } catch (error) {
        console.warn(`Error adjusting dates for task ${task.id}:`, error.message);
      }
    });

    // Update project start date
    this.startDate = newStart;
    this.updatedAt = new Date();
  }

  /**
   * Recalculate project end date based on latest task end date
   */
  recalculateProjectEndDate() {
    if (this.tasks.length === 0) {
      return;
    }

    const latestEndDate = this.tasks.reduce((latest, task) => {
      return task.endDate > latest ? task.endDate : latest;
    }, this.tasks[0].endDate);

    this.endDate = latestEndDate;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate ? this.endDate.toISOString() : null,
      status: this.status,
      teamMembers: this.teamMembers,
      tasks: this.tasks,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromJSON(data) {
    return new Project({
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }
}

/**
 * Task interface
 */
export class Task {
  constructor({
    id = null,
    projectId = '',
    parentTaskId = null,
    title = '',
    description = '',
    startDate = new Date(),
    endDate = new Date(),
    status = 'pending',
    type = 'simple',
    deliverable = null,
    assignedTo = null,
    priority = 'medium',
    progress = 0,
    subtasks = [],
    level = 0,
    duration = null,
    adjustStartDate = false,
    createdAt = new Date(),
    updatedAt = new Date()
  } = {}) {
    this.id = id || this.generateId();
    this.projectId = projectId;
    this.parentTaskId = parentTaskId;
    this.title = title;
    this.description = description;
    this.startDate = startDate instanceof Date ? startDate : new Date(startDate);
    this.endDate = endDate instanceof Date ? endDate : new Date(endDate);
    this.status = status;
    this.type = type;
    this.deliverable = deliverable;
    this.assignedTo = assignedTo;
    this.priority = priority;
    this.progress = Math.max(0, Math.min(100, progress));
    this.subtasks = subtasks;
    this.level = level;
    this.adjustStartDate = adjustStartDate;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
    
    // Calculate duration if not provided
    this.duration = duration !== null ? duration : this.calculateDuration(this.startDate, this.endDate);
  }

  generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Calculate duration in working days between start and end dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Duration in working days
   */
  calculateDuration(startDate, endDate) {
    try {
      return DateCalculationService.calculateWorkingDays(startDate, endDate);
    } catch (error) {
      console.warn('Error calculating duration:', error.message);
      return 0;
    }
  }

  /**
   * Calculate end date based on start date and duration
   * @param {Date} startDate - Start date
   * @param {number} duration - Duration in working days
   * @returns {Date} Calculated end date
   */
  calculateEndDate(startDate, duration) {
    try {
      return DateCalculationService.addWorkingDays(startDate, duration);
    } catch (error) {
      console.warn('Error calculating end date:', error.message);
      return new Date(startDate);
    }
  }

  /**
   * Calculate start date based on end date and duration
   * @param {Date} endDate - End date
   * @param {number} duration - Duration in working days
   * @returns {Date} Calculated start date
   */
  calculateStartDate(endDate, duration) {
    try {
      return DateCalculationService.subtractWorkingDays(endDate, duration);
    } catch (error) {
      console.warn('Error calculating start date:', error.message);
      return new Date(endDate);
    }
  }

  /**
   * Update duration when dates change
   */
  updateDuration() {
    this.duration = this.calculateDuration(this.startDate, this.endDate);
    this.updatedAt = new Date();
  }

  /**
   * Update end date when duration changes (default behavior)
   */
  updateEndDate() {
    if (!this.adjustStartDate) {
      this.endDate = this.calculateEndDate(this.startDate, this.duration);
      this.updatedAt = new Date();
    }
  }

  /**
   * Update start date when duration changes (if adjustStartDate flag is true)
   */
  updateStartDate() {
    if (this.adjustStartDate) {
      this.startDate = this.calculateStartDate(this.endDate, this.duration);
      this.updatedAt = new Date();
    }
  }

  /**
   * Set new duration and update dates accordingly
   * @param {number} newDuration - New duration in working days
   */
  setDuration(newDuration) {
    this.duration = newDuration;
    if (this.adjustStartDate) {
      this.updateStartDate();
    } else {
      this.updateEndDate();
    }
  }

  /**
   * Set new start date and update duration or end date
   * @param {Date} newStartDate - New start date
   */
  setStartDate(newStartDate) {
    this.startDate = newStartDate instanceof Date ? newStartDate : new Date(newStartDate);
    this.updateDuration();
    this.updatedAt = new Date();
  }

  /**
   * Set new end date and update duration or start date
   * @param {Date} newEndDate - New end date
   */
  setEndDate(newEndDate) {
    this.endDate = newEndDate instanceof Date ? newEndDate : new Date(newEndDate);
    this.updateDuration();
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      parentTaskId: this.parentTaskId,
      title: this.title,
      description: this.description,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      status: this.status,
      type: this.type,
      deliverable: this.deliverable,
      assignedTo: this.assignedTo,
      priority: this.priority,
      progress: this.progress,
      subtasks: this.subtasks,
      level: this.level,
      duration: this.duration,
      adjustStartDate: this.adjustStartDate,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromJSON(data) {
    return new Task({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      duration: data.duration,
      adjustStartDate: data.adjustStartDate || false,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }
}/**
 * 
TeamMember interface
 */
export class TeamMember {
  constructor({
    id = null,
    name = '',
    email = '',
    role = '',
    avatar = null,
    joinedAt = new Date()
  } = {}) {
    this.id = id || this.generateId();
    this.name = name;
    this.email = email;
    this.role = role;
    this.avatar = avatar;
    this.joinedAt = joinedAt instanceof Date ? joinedAt : new Date(joinedAt);
  }

  generateId() {
    return 'member_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      avatar: this.avatar,
      joinedAt: this.joinedAt.toISOString()
    };
  }

  static fromJSON(data) {
    return new TeamMember({
      ...data,
      joinedAt: new Date(data.joinedAt)
    });
  }
}

/**
 * Deliverable interface
 */
export class Deliverable {
  constructor({
    type = 'other',
    description = '',
    dueDate = new Date(),
    status = 'pending',
    notes = ''
  } = {}) {
    this.type = type;
    this.description = description;
    this.dueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
    this.status = status;
    this.notes = notes;
  }

  toJSON() {
    return {
      type: this.type,
      description: this.description,
      dueDate: this.dueDate.toISOString(),
      status: this.status,
      notes: this.notes
    };
  }

  static fromJSON(data) {
    return new Deliverable({
      ...data,
      dueDate: new Date(data.dueDate)
    });
  }
}

// Constants for validation
export const PROJECT_STATUSES = ['active', 'completed', 'paused'];
export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
export const TASK_TYPES = ['simple', 'with_deliverable'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const DELIVERABLE_TYPES = ['presentation', 'file', 'exposition', 'other'];
export const DELIVERABLE_STATUSES = ['pending', 'in_review', 'completed'];