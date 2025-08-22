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