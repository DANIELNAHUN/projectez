// Data models and interfaces for the Personal Project Manager

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
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  }

  generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromJSON(data) {
    return new Task({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
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
    return 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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