// Integration example for localStorage service with Vue components
// This shows how the storage service would be used in the application

import { storageService } from '../services/storageService.js';
import { Project, Task, TeamMember, Deliverable } from '../models/index.js';

/**
 * Example integration functions that would be used in Vue components
 */

// Project management functions
export const projectManager = {
  async createProject(projectData) {
    try {
      const project = new Project(projectData);
      return await storageService.saveProject(project);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async updateProject(projectId, updates) {
    try {
      const project = storageService.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }
      
      Object.assign(project, updates);
      return await storageService.saveProject(project);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  async deleteProject(projectId) {
    try {
      return await storageService.deleteProject(projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  async getAllProjects() {
    try {
      return storageService.getAllProjects();
    } catch (error) {
      console.error('Error loading projects:', error);
      throw error;
    }
  }
};

// Task management functions
export const taskManager = {
  async createTask(projectId, taskData) {
    try {
      const task = new Task({ ...taskData, projectId });
      return await storageService.saveTask(task, projectId);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(projectId, taskId, updates) {
    try {
      const tasks = storageService.getTasksForProject(projectId);
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error('Tarea no encontrada');
      }
      
      Object.assign(task, updates);
      return await storageService.saveTask(task, projectId);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(projectId, taskId) {
    try {
      return await storageService.deleteTask(taskId, projectId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async getTasksForProject(projectId) {
    try {
      return storageService.getTasksForProject(projectId);
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
  }
};

// Team management functions
export const teamManager = {
  async addTeamMember(projectId, memberData) {
    try {
      const member = new TeamMember(memberData);
      return await storageService.saveTeamMember(member, projectId);
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  },

  async updateTeamMember(projectId, memberId, updates) {
    try {
      const members = storageService.getTeamMembersForProject(projectId);
      const member = members.find(m => m.id === memberId);
      
      if (!member) {
        throw new Error('Miembro del equipo no encontrado');
      }
      
      Object.assign(member, updates);
      return await storageService.saveTeamMember(member, projectId);
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  },

  async removeTeamMember(projectId, memberId) {
    try {
      return await storageService.deleteTeamMember(memberId, projectId);
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },

  async getTeamMembers(projectId) {
    try {
      return storageService.getTeamMembersForProject(projectId);
    } catch (error) {
      console.error('Error loading team members:', error);
      throw error;
    }
  }
};

// Settings and preferences functions
export const settingsManager = {
  async getSettings() {
    try {
      return storageService.getSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  },

  async updateSettings(updates) {
    try {
      return storageService.saveSettings(updates);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  async getUserPreferences() {
    try {
      return storageService.getUserPreferences();
    } catch (error) {
      console.error('Error loading preferences:', error);
      throw error;
    }
  },

  async updateUserPreferences(updates) {
    try {
      return storageService.saveUserPreferences(updates);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }
};

// Data management functions
export const dataManager = {
  async exportAllData() {
    try {
      return storageService.exportData();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  async importData(jsonData) {
    try {
      return storageService.importData(jsonData);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  async clearAllData() {
    try {
      return storageService.clearAllData();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },

  async checkStorageHealth() {
    try {
      return storageService.checkStorageHealth();
    } catch (error) {
      console.error('Error checking storage health:', error);
      throw error;
    }
  }
};