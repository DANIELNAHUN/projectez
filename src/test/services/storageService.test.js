import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from '../../services/storageService.js'
import { mockLocalStorage, mockProject, mockTask, mockTeamMember } from '../utils.js'

describe('StorageService', () => {
  let storageService
  let mockStorage

  beforeEach(() => {
    mockStorage = mockLocalStorage()
    storageService = new StorageService()
  })

  describe('initialization', () => {
    it('should initialize storage with default values', () => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_projects',
        JSON.stringify([])
      )
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_settings',
        JSON.stringify({
          maxNestingLevel: 100,
          defaultView: 'projects',
          theme: 'light',
          language: 'es'
        })
      )
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_user_preferences',
        JSON.stringify({
          lastOpenProject: null,
          calendarView: 'month',
          sidebarCollapsed: false
        })
      )
    })

    it('should not overwrite existing data during initialization', () => {
      const existingProjects = [mockProject()]
      mockStorage.pm_projects = JSON.stringify(existingProjects)
      
      const newStorageService = new StorageService()
      
      expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
        'pm_projects',
        JSON.stringify([])
      )
    })

    it('should throw error if localStorage is not available', () => {
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      expect(() => new StorageService()).toThrow('No se pudo inicializar el almacenamiento local')
    })
  })

  describe('generic localStorage operations', () => {
    it('should get item from localStorage', () => {
      const testData = { test: 'value' }
      mockStorage.testKey = JSON.stringify(testData)

      const result = storageService.getItem('testKey')
      
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent item', () => {
      const result = storageService.getItem('nonExistentKey')
      
      expect(result).toBeNull()
    })

    it('should handle JSON parse errors', () => {
      mockStorage.invalidJson = 'invalid json'

      expect(() => storageService.getItem('invalidJson')).toThrow('Error al leer datos del almacenamiento')
    })

    it('should set item in localStorage', () => {
      const testData = { test: 'value' }
      
      const result = storageService.setItem('testKey', testData)
      
      expect(result).toBe(true)
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify(testData)
      )
    })

    it('should handle quota exceeded error', () => {
      window.localStorage.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded')
        error.name = 'QuotaExceededError'
        throw error
      })

      expect(() => storageService.setItem('testKey', {})).toThrow(
        'Espacio de almacenamiento agotado'
      )
    })

    it('should remove item from localStorage', () => {
      const result = storageService.removeItem('testKey')
      
      expect(result).toBe(true)
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('testKey')
    })
  })

  describe('project operations', () => {
    it('should get all projects', () => {
      const projects = [mockProject(), mockProject({ id: 'project-2' })]
      mockStorage.pm_projects = JSON.stringify(projects.map(p => p))

      const result = storageService.getAllProjects()
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('project-1')
      expect(result[1].id).toBe('project-2')
    })

    it('should return empty array when no projects exist', () => {
      mockStorage.pm_projects = JSON.stringify([])

      const result = storageService.getAllProjects()
      
      expect(result).toEqual([])
    })

    it('should get specific project by id', () => {
      const project = mockProject()
      mockStorage.pm_projects = JSON.stringify([project])

      const result = storageService.getProject('project-1')
      
      expect(result.id).toBe('project-1')
      expect(result.name).toBe('Test Project')
    })

    it('should return null for non-existent project', () => {
      mockStorage.pm_projects = JSON.stringify([])

      const result = storageService.getProject('non-existent')
      
      expect(result).toBeNull()
    })

    it('should save new project', () => {
      const project = mockProject()
      mockStorage.pm_projects = JSON.stringify([])

      const result = storageService.saveProject(project)
      
      expect(result.id).toBe('project-1')
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_projects',
        expect.stringContaining('"id":"project-1"')
      )
    })

    it('should update existing project', () => {
      const existingProject = mockProject()
      const updatedProject = { ...existingProject, name: 'Updated Project' }
      mockStorage.pm_projects = JSON.stringify([existingProject])

      const result = storageService.saveProject(updatedProject)
      
      expect(result.name).toBe('Updated Project')
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should delete project', () => {
      const project = mockProject()
      mockStorage.pm_projects = JSON.stringify([project])

      const result = storageService.deleteProject('project-1')
      
      expect(result).toBe(true)
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_projects',
        JSON.stringify([])
      )
    })

    it('should throw error when deleting non-existent project', () => {
      mockStorage.pm_projects = JSON.stringify([])

      expect(() => storageService.deleteProject('non-existent')).toThrow(
        'Proyecto no encontrado'
      )
    })
  })

  describe('task operations', () => {
    beforeEach(() => {
      const project = mockProject({
        tasks: [mockTask()]
      })
      mockStorage.pm_projects = JSON.stringify([project])
    })

    it('should get tasks for project', () => {
      const result = storageService.getTasksForProject('project-1')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('task-1')
      expect(result[0].projectId).toBe('project-1')
    })

    it('should throw error for non-existent project', () => {
      expect(() => storageService.getTasksForProject('non-existent')).toThrow(
        'Proyecto no encontrado'
      )
    })

    it('should save new task', () => {
      const newTask = mockTask({ id: 'task-2', title: 'New Task' })

      const result = storageService.saveTask(newTask, 'project-1')
      
      expect(result.id).toBe('task-2')
      expect(result.projectId).toBe('project-1')
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should update existing task', () => {
      const updatedTask = mockTask({ title: 'Updated Task' })

      const result = storageService.saveTask(updatedTask, 'project-1')
      
      expect(result.title).toBe('Updated Task')
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should delete task', () => {
      const result = storageService.deleteTask('task-1', 'project-1')
      
      expect(result).toBe(true)
    })

    it('should throw error when deleting non-existent task', () => {
      expect(() => storageService.deleteTask('non-existent', 'project-1')).toThrow(
        'Tarea no encontrada'
      )
    })
  })

  describe('team member operations', () => {
    beforeEach(() => {
      const project = mockProject({
        teamMembers: [mockTeamMember()]
      })
      mockStorage.pm_projects = JSON.stringify([project])
    })

    it('should get team members for project', () => {
      const result = storageService.getTeamMembersForProject('project-1')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('member-1')
      expect(result[0].name).toBe('John Doe')
    })

    it('should save new team member', () => {
      const newMember = mockTeamMember({ id: 'member-2', name: 'Jane Doe' })

      const result = storageService.saveTeamMember(newMember, 'project-1')
      
      expect(result.id).toBe('member-2')
      expect(result.name).toBe('Jane Doe')
    })

    it('should delete team member and remove assignments', () => {
      const project = mockProject({
        teamMembers: [mockTeamMember()],
        tasks: [mockTask({ assignedTo: 'member-1' })]
      })
      mockStorage.pm_projects = JSON.stringify([project])

      const result = storageService.deleteTeamMember('member-1', 'project-1')
      
      expect(result).toBe(true)
      
      // Verify task assignment was removed
      const updatedProject = storageService.getProject('project-1')
      expect(updatedProject.tasks[0].assignedTo).toBeNull()
    })
  })

  describe('settings operations', () => {
    it('should get settings', () => {
      const result = storageService.getSettings()
      
      expect(result).toEqual({
        maxNestingLevel: 100,
        defaultView: 'projects',
        theme: 'light',
        language: 'es'
      })
    })

    it('should save settings', () => {
      const newSettings = { maxNestingLevel: 50, theme: 'dark' }

      const result = storageService.saveSettings(newSettings)
      
      expect(result.maxNestingLevel).toBe(50)
      expect(result.theme).toBe('dark')
      expect(result.defaultView).toBe('projects') // Should preserve existing
    })
  })

  describe('user preferences operations', () => {
    it('should get user preferences', () => {
      const result = storageService.getUserPreferences()
      
      expect(result).toEqual({
        lastOpenProject: null,
        calendarView: 'month',
        sidebarCollapsed: false
      })
    })

    it('should save user preferences', () => {
      const newPreferences = { calendarView: 'week', sidebarCollapsed: true }

      const result = storageService.saveUserPreferences(newPreferences)
      
      expect(result.calendarView).toBe('week')
      expect(result.sidebarCollapsed).toBe(true)
      expect(result.lastOpenProject).toBeNull() // Should preserve existing
    })
  })

  describe('data management operations', () => {
    it('should export data', () => {
      const projects = [mockProject()]
      mockStorage.pm_projects = JSON.stringify(projects)

      const result = storageService.exportData()
      const parsedResult = JSON.parse(result)
      
      expect(parsedResult.projects).toEqual(projects)
      expect(parsedResult.version).toBe('1.0')
      expect(parsedResult.exportDate).toBeDefined()
    })

    it('should import data', () => {
      const importData = {
        projects: [mockProject()],
        settings: { maxNestingLevel: 50 },
        userPreferences: { calendarView: 'week' }
      }

      const result = storageService.importData(JSON.stringify(importData))
      
      expect(result).toBe(true)
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_projects',
        JSON.stringify(importData.projects)
      )
    })

    it('should handle invalid import data', () => {
      expect(() => storageService.importData('invalid json')).toThrow(
        'Error al importar los datos'
      )
    })

    it('should clear all data', () => {
      const result = storageService.clearAllData()
      
      expect(result).toBe(true)
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('pm_projects')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('pm_settings')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('pm_user_preferences')
    })
  })

  describe('storage health check', () => {
    it('should return healthy status when storage works', () => {
      mockStorage.pm_projects = JSON.stringify([mockProject()])

      const result = storageService.checkStorageHealth()
      
      expect(result.healthy).toBe(true)
      expect(result.projectCount).toBe(1)
      expect(result.approximateDataSize).toBeGreaterThan(0)
      expect(result.lastCheck).toBeDefined()
    })

    it('should return unhealthy status when storage fails', () => {
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage failed')
      })

      const result = storageService.checkStorageHealth()
      
      expect(result.healthy).toBe(false)
      expect(result.error).toBe('Storage failed')
      expect(result.lastCheck).toBeDefined()
    })
  })
})