// localStorage service for data persistence

import { Project, Task, TeamMember, Deliverable } from '../models/index.js';
import { validateProject, validateTask, validateTeamMember, ValidationError } from '../utils/validation.js';

/**
 * Storage service for managing localStorage operations
 */
export class StorageService {
  constructor() {
    this.storageKeys = {
      projects: 'pm_projects',
      settings: 'pm_settings',
      userPreferences: 'pm_user_preferences'
    };
    
    this.defaultSettings = {
      maxNestingLevel: 100,
      defaultView: 'projects',
      theme: 'light',
      language: 'es'
    };

    this.defaultUserPreferences = {
      lastOpenProject: null,
      calendarView: 'month',
      sidebarCollapsed: false
    };

    this.initializeStorage();
  }

  /**
   * Initialize storage with default values if not exists
   */
  initializeStorage() {
    try {
      if (!this.getItem(this.storageKeys.projects)) {
        this.setItem(this.storageKeys.projects, []);
      }

      if (!this.getItem(this.storageKeys.settings)) {
        this.setItem(this.storageKeys.settings, this.defaultSettings);
      }

      if (!this.getItem(this.storageKeys.userPreferences)) {
        this.setItem(this.storageKeys.userPreferences, this.defaultUserPreferences);
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw new Error('No se pudo inicializar el almacenamiento local');
    }
  }

  /**
   * Generic localStorage operations with error handling
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      throw new Error(`Error al leer datos del almacenamiento: ${key}`);
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      if (error.name === 'QuotaExceededError') {
        throw new Error('Espacio de almacenamiento agotado. Considera eliminar proyectos antiguos.');
      }
      throw new Error(`Error al guardar datos: ${key}`);
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      throw new Error(`Error al eliminar datos: ${key}`);
    }
  }

  /**
   * Project operations
   */
  getAllProjects() {
    try {
      const projectsData = this.getItem(this.storageKeys.projects) || [];
      return projectsData.map(data => Project.fromJSON(data));
    } catch (error) {
      console.error('Error loading projects:', error);
      throw new Error('Error al cargar los proyectos');
    }
  }

  getProject(projectId) {
    try {
      const projects = this.getAllProjects();
      return projects.find(project => project.id === projectId) || null;
    } catch (error) {
      console.error('Error loading project:', error);
      throw new Error('Error al cargar el proyecto');
    }
  }

  saveProject(project) {
    try {
      // Validate project before saving
      validateProject(project);

      // Validate and preserve hierarchical task relationships
      if (project.tasks && project.tasks.length > 0) {
        this.validateAndPreserveTaskHierarchy(project.tasks);
      }

      const projects = this.getAllProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      project.updatedAt = new Date();

      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }

      const projectsData = projects.map(p => p.toJSON());
      this.setItem(this.storageKeys.projects, projectsData);
      
      return project;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error saving project:', error);
      throw new Error('Error al guardar el proyecto');
    }
  }

  deleteProject(projectId) {
    try {
      const projects = this.getAllProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      
      if (projects.length === filteredProjects.length) {
        throw new Error('Proyecto no encontrado');
      }

      const projectsData = filteredProjects.map(p => p.toJSON());
      this.setItem(this.storageKeys.projects, projectsData);
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Error al eliminar el proyecto');
    }
  }

  /**
   * Task operations
   */
  getTasksForProject(projectId) {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }
      
      return project.tasks.map(taskData => Task.fromJSON(taskData));
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw new Error('Error al cargar las tareas');
    }
  }

  saveTask(task, projectId) {
    try {
      const settings = this.getSettings();
      validateTask(task, settings.maxNestingLevel);

      const project = this.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      task.updatedAt = new Date();
      task.projectId = projectId;

      const existingTaskIndex = project.tasks.findIndex(t => t.id === task.id);
      
      if (existingTaskIndex >= 0) {
        project.tasks[existingTaskIndex] = task.toJSON();
      } else {
        project.tasks.push(task.toJSON());
      }

      // Ensure hierarchy integrity after task modification
      this.validateAndPreserveTaskHierarchy(project.tasks);

      this.saveProject(project);
      return task;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error saving task:', error);
      throw new Error('Error al guardar la tarea');
    }
  }

  deleteTask(taskId, projectId) {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      const originalTaskCount = project.tasks.length;
      project.tasks = project.tasks.filter(t => t.id !== taskId);
      
      if (project.tasks.length === originalTaskCount) {
        throw new Error('Tarea no encontrada');
      }

      this.saveProject(project);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Error al eliminar la tarea');
    }
  }  /**
 
  * Team member operations
   */
  getTeamMembersForProject(projectId) {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }
      
      return project.teamMembers.map(memberData => TeamMember.fromJSON(memberData));
    } catch (error) {
      console.error('Error loading team members:', error);
      throw new Error('Error al cargar los miembros del equipo');
    }
  }

  saveTeamMember(member, projectId) {
    try {
      validateTeamMember(member);

      const project = this.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      const existingMemberIndex = project.teamMembers.findIndex(m => m.id === member.id);
      
      if (existingMemberIndex >= 0) {
        project.teamMembers[existingMemberIndex] = member.toJSON();
      } else {
        project.teamMembers.push(member.toJSON());
      }

      this.saveProject(project);
      return member;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error saving team member:', error);
      throw new Error('Error al guardar el miembro del equipo');
    }
  }

  deleteTeamMember(memberId, projectId) {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      const originalMemberCount = project.teamMembers.length;
      project.teamMembers = project.teamMembers.filter(m => m.id !== memberId);
      
      if (project.teamMembers.length === originalMemberCount) {
        throw new Error('Miembro del equipo no encontrado');
      }

      // Remove assignments from tasks
      project.tasks.forEach(task => {
        if (task.assignedTo === memberId) {
          task.assignedTo = null;
        }
      });

      this.saveProject(project);
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw new Error('Error al eliminar el miembro del equipo');
    }
  }

  /**
   * Settings operations
   */
  getSettings() {
    try {
      return this.getItem(this.storageKeys.settings) || this.defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }

  saveSettings(settings) {
    try {
      const currentSettings = this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      this.setItem(this.storageKeys.settings, updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Error al guardar la configuración');
    }
  }

  /**
   * User preferences operations
   */
  getUserPreferences() {
    try {
      return this.getItem(this.storageKeys.userPreferences) || this.defaultUserPreferences;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return this.defaultUserPreferences;
    }
  }

  saveUserPreferences(preferences) {
    try {
      const currentPreferences = this.getUserPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      this.setItem(this.storageKeys.userPreferences, updatedPreferences);
      return updatedPreferences;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw new Error('Error al guardar las preferencias');
    }
  }

  /**
   * Data management operations
   */
  exportData() {
    try {
      const data = {
        projects: this.getItem(this.storageKeys.projects),
        settings: this.getItem(this.storageKeys.settings),
        userPreferences: this.getItem(this.storageKeys.userPreferences),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Error al exportar los datos');
    }
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.projects) {
        this.setItem(this.storageKeys.projects, data.projects);
      }
      
      if (data.settings) {
        this.setItem(this.storageKeys.settings, data.settings);
      }
      
      if (data.userPreferences) {
        this.setItem(this.storageKeys.userPreferences, data.userPreferences);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Error al importar los datos. Verifica que el formato sea correcto.');
    }
  }

  clearAllData() {
    try {
      this.removeItem(this.storageKeys.projects);
      this.removeItem(this.storageKeys.settings);
      this.removeItem(this.storageKeys.userPreferences);
      this.initializeStorage();
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Error al limpiar los datos');
    }
  }

  /**
   * Validate and preserve hierarchical task relationships during save operations
   * @param {Array} tasks - Array of tasks to validate
   */
  validateAndPreserveTaskHierarchy(tasks) {
    try {
      const taskMap = new Map();
      const parentChildMap = new Map();
      
      // First pass: build task map and identify relationships
      tasks.forEach(task => {
        taskMap.set(task.id, task);
        
        if (task.parentTaskId) {
          if (!parentChildMap.has(task.parentTaskId)) {
            parentChildMap.set(task.parentTaskId, []);
          }
          parentChildMap.get(task.parentTaskId).push(task.id);
        }
      });
      
      // Second pass: validate hierarchy integrity
      tasks.forEach(task => {
        // Validate parent-child relationships
        if (task.parentTaskId && !taskMap.has(task.parentTaskId)) {
          console.warn(`Task ${task.id} references non-existent parent ${task.parentTaskId}. Removing parent reference.`);
          task.parentTaskId = null;
          task.level = 0;
          task.isMainTask = true;
        }
        
        // Validate subtasks array consistency
        if (task.subtasks && Array.isArray(task.subtasks)) {
          const validSubtasks = task.subtasks.filter(subtask => {
            if (typeof subtask === 'object' && subtask.id) {
              return taskMap.has(subtask.id);
            }
            return false;
          });
          
          if (validSubtasks.length !== task.subtasks.length) {
            console.warn(`Task ${task.id} has invalid subtasks. Cleaning up subtasks array.`);
            task.subtasks = validSubtasks;
          }
          
          // Update hasSubtasks flag
          task.hasSubtasks = validSubtasks.length > 0;
        }
        
        // Validate level consistency
        if (task.parentTaskId) {
          const parent = taskMap.get(task.parentTaskId);
          if (parent && typeof parent.level === 'number') {
            const expectedLevel = parent.level + 1;
            if (task.level !== expectedLevel) {
              console.warn(`Task ${task.id} level mismatch. Expected ${expectedLevel}, got ${task.level}. Correcting.`);
              task.level = expectedLevel;
            }
          }
        }
        
        // Validate isMainTask flag
        const shouldBeMainTask = !task.parentTaskId;
        if (task.isMainTask !== shouldBeMainTask) {
          console.warn(`Task ${task.id} isMainTask flag mismatch. Correcting.`);
          task.isMainTask = shouldBeMainTask;
        }
        
        // Recalculate aggregated duration for parent tasks
        if (task.hasSubtasks && parentChildMap.has(task.id)) {
          const childIds = parentChildMap.get(task.id);
          const childTasks = childIds.map(id => taskMap.get(id)).filter(Boolean);
          
          if (childTasks.length > 0) {
            const aggregatedDuration = childTasks.reduce((sum, child) => {
              return sum + (child.aggregatedDuration || child.duration || 0);
            }, 0);
            
            if (aggregatedDuration > 0) {
              task.aggregatedDuration = aggregatedDuration;
            }
          }
        } else if (!task.hasSubtasks) {
          // For leaf tasks, aggregated duration should equal duration
          task.aggregatedDuration = task.duration || 1;
        }
      });
      
      // Third pass: detect and resolve circular dependencies
      this.detectAndResolveCircularDependencies(tasks, taskMap, parentChildMap);
      
    } catch (error) {
      console.warn('Error validating task hierarchy:', error.message);
      // Continue with save operation even if hierarchy validation fails
    }
  }

  /**
   * Detect and resolve circular dependencies in task hierarchy
   * @param {Array} tasks - Array of tasks
   * @param {Map} taskMap - Map of task ID to task object
   * @param {Map} parentChildMap - Map of parent ID to child IDs
   */
  detectAndResolveCircularDependencies(tasks, taskMap, parentChildMap) {
    const visited = new Set();
    const recursionStack = new Set();
    
    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        const path = [];
        if (this.hasCycleDFS(task.id, taskMap, visited, recursionStack, path)) {
          console.warn(`Circular dependency detected in task hierarchy: ${path.join(' -> ')}`);
          
          // Resolve by breaking the cycle at the last task in the path
          const lastTaskId = path[path.length - 1];
          const lastTask = taskMap.get(lastTaskId);
          if (lastTask) {
            console.warn(`Breaking cycle by removing parent reference from task ${lastTaskId}`);
            lastTask.parentTaskId = null;
            lastTask.level = 0;
            lastTask.isMainTask = true;
          }
        }
      }
    });
  }

  /**
   * Depth-first search to detect cycles in task hierarchy
   * @param {string} taskId - Current task ID
   * @param {Map} taskMap - Map of task ID to task object
   * @param {Set} visited - Set of visited nodes
   * @param {Set} recursionStack - Current recursion stack
   * @param {Array} path - Current path for cycle detection
   * @returns {boolean} True if cycle detected
   */
  hasCycleDFS(taskId, taskMap, visited, recursionStack, path) {
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);

    const task = taskMap.get(taskId);
    if (task && task.parentTaskId) {
      const parentId = task.parentTaskId;
      
      if (!visited.has(parentId)) {
        if (this.hasCycleDFS(parentId, taskMap, visited, recursionStack, path)) {
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
   * Storage health check
   */
  checkStorageHealth() {
    try {
      // Test write operation
      const testKey = 'pm_health_check';
      const testData = { test: true, timestamp: Date.now() };
      
      this.setItem(testKey, testData);
      const retrieved = this.getItem(testKey);
      this.removeItem(testKey);
      
      if (!retrieved || retrieved.test !== true) {
        throw new Error('Storage read/write test failed');
      }

      // Check available space (approximate)
      const projects = this.getAllProjects();
      const dataSize = JSON.stringify(projects).length;
      
      return {
        healthy: true,
        projectCount: projects.length,
        approximateDataSize: dataSize,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error('Storage health check failed:', error);
      return {
        healthy: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
}

// Create and export singleton instance
export const storageService = new StorageService();