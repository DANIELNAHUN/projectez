import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from '../../services/storageService.js'
import { mockLocalStorage, mockProject, mockTask, mockTeamMember } from '../utils.js'

describe('Data Persistence Integration', () => {
  let storageService
  let mockStorage

  beforeEach(() => {
    mockStorage = mockLocalStorage()
    storageService = new StorageService()
  })

  describe('localStorage operations', () => {
    it('should initialize storage with default structure', () => {
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

    it('should handle localStorage quota exceeded', () => {
      window.localStorage.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded')
        error.name = 'QuotaExceededError'
        throw error
      })

      expect(() => {
        storageService.setItem('test', { large: 'data' })
      }).toThrow('Espacio de almacenamiento agotado')
    })

    it('should handle localStorage access denied', () => {
      window.localStorage.getItem.mockImplementation(() => {
        throw new Error('Access denied')
      })

      expect(() => {
        storageService.getItem('test')
      }).toThrow('Error al leer datos del almacenamiento')
    })

    it('should handle corrupted JSON data', () => {
      mockStorage.pm_projects = 'invalid json data'

      expect(() => {
        storageService.getAllProjects()
      }).toThrow('Error al cargar los proyectos')
    })
  })

  describe('project data persistence', () => {
    it('should persist and restore complete project data', () => {
      const project = mockProject({
        name: 'Test Project',
        description: 'Test Description',
        tasks: [
          mockTask({ title: 'Task 1' }),
          mockTask({ title: 'Task 2' })
        ],
        teamMembers: [
          mockTeamMember({ name: 'John Doe' }),
          mockTeamMember({ name: 'Jane Smith' })
        ]
      })

      // Save project
      storageService.saveProject(project)

      // Verify it was saved to localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_projects',
        expect.stringContaining(project.name)
      )

      // Restore project
      const restoredProject = storageService.getProject(project.id)

      expect(restoredProject).toEqual(expect.objectContaining({
        name: project.name,
        description: project.description
      }))
      expect(restoredProject.tasks).toHaveLength(2)
      expect(restoredProject.teamMembers).toHaveLength(2)
    })

    it('should handle incremental project updates', () => {
      const project = mockProject()
      
      // Initial save
      storageService.saveProject(project)
      
      // Update project
      const updatedProject = {
        ...project,
        name: 'Updated Name',
        description: 'Updated Description'
      }
      storageService.saveProject(updatedProject)

      // Verify update
      const restoredProject = storageService.getProject(project.id)
      expect(restoredProject.name).toBe('Updated Name')
      expect(restoredProject.description).toBe('Updated Description')
      expect(restoredProject.updatedAt).toBeInstanceOf(Date)
    })

    it('should maintain data integrity across multiple operations', () => {
      const projects = [
        mockProject({ id: 'project-1', name: 'Project 1' }),
        mockProject({ id: 'project-2', name: 'Project 2' }),
        mockProject({ id: 'project-3', name: 'Project 3' })
      ]

      // Save all projects
      projects.forEach(project => storageService.saveProject(project))

      // Update one project
      const updatedProject = { ...projects[1], name: 'Updated Project 2' }
      storageService.saveProject(updatedProject)

      // Delete one project
      storageService.deleteProject(projects[2].id)

      // Verify final state
      const allProjects = storageService.getAllProjects()
      expect(allProjects).toHaveLength(2)
      expect(allProjects.find(p => p.id === 'project-1').name).toBe('Project 1')
      expect(allProjects.find(p => p.id === 'project-2').name).toBe('Updated Project 2')
      expect(allProjects.find(p => p.id === 'project-3')).toBeNull()
    })
  })

  describe('task data persistence', () => {
    let project

    beforeEach(() => {
      project = mockProject()
      storageService.saveProject(project)
    })

    it('should persist nested task structures', () => {
      const parentTask = mockTask({
        id: 'parent',
        title: 'Parent Task',
        level: 0,
        parentTaskId: null
      })

      const childTask = mockTask({
        id: 'child',
        title: 'Child Task',
        level: 1,
        parentTaskId: 'parent'
      })

      const grandchildTask = mockTask({
        id: 'grandchild',
        title: 'Grandchild Task',
        level: 2,
        parentTaskId: 'child'
      })

      // Save tasks
      storageService.saveTask(parentTask, project.id)
      storageService.saveTask(childTask, project.id)
      storageService.saveTask(grandchildTask, project.id)

      // Restore and verify hierarchy
      const tasks = storageService.getTasksForProject(project.id)
      
      expect(tasks).toHaveLength(3)
      
      const parent = tasks.find(t => t.id === 'parent')
      const child = tasks.find(t => t.id === 'child')
      const grandchild = tasks.find(t => t.id === 'grandchild')

      expect(parent.level).toBe(0)
      expect(parent.parentTaskId).toBeNull()
      
      expect(child.level).toBe(1)
      expect(child.parentTaskId).toBe('parent')
      
      expect(grandchild.level).toBe(2)
      expect(grandchild.parentTaskId).toBe('child')
    })

    it('should handle task deletion and orphan management', () => {
      const parentTask = mockTask({ id: 'parent', level: 0 })
      const childTask1 = mockTask({ id: 'child1', level: 1, parentTaskId: 'parent' })
      const childTask2 = mockTask({ id: 'child2', level: 1, parentTaskId: 'parent' })

      // Save tasks
      storageService.saveTask(parentTask, project.id)
      storageService.saveTask(childTask1, project.id)
      storageService.saveTask(childTask2, project.id)

      // Delete parent task
      storageService.deleteTask('parent', project.id)

      // Verify parent is deleted but children remain (as orphans)
      const remainingTasks = storageService.getTasksForProject(project.id)
      
      expect(remainingTasks).toHaveLength(2)
      expect(remainingTasks.find(t => t.id === 'parent')).toBeUndefined()
      expect(remainingTasks.find(t => t.id === 'child1')).toBeDefined()
      expect(remainingTasks.find(t => t.id === 'child2')).toBeDefined()
    })

    it('should preserve task assignments and deliverables', () => {
      const member = mockTeamMember({ id: 'member-1' })
      const projectWithMember = {
        ...project,
        teamMembers: [member]
      }
      storageService.saveProject(projectWithMember)

      const taskWithDeliverable = mockTask({
        assignedTo: 'member-1',
        type: 'with_deliverable',
        deliverable: {
          type: 'presentation',
          description: 'Final presentation',
          dueDate: new Date('2024-12-31'),
          status: 'pending'
        }
      })

      storageService.saveTask(taskWithDeliverable, project.id)

      // Restore and verify
      const tasks = storageService.getTasksForProject(project.id)
      const restoredTask = tasks[0]

      expect(restoredTask.assignedTo).toBe('member-1')
      expect(restoredTask.type).toBe('with_deliverable')
      expect(restoredTask.deliverable).toEqual(expect.objectContaining({
        type: 'presentation',
        description: 'Final presentation',
        status: 'pending'
      }))
    })
  })

  describe('settings and preferences persistence', () => {
    it('should persist and restore settings', () => {
      const newSettings = {
        maxNestingLevel: 50,
        defaultView: 'calendar',
        theme: 'dark',
        language: 'en'
      }

      storageService.saveSettings(newSettings)

      const restoredSettings = storageService.getSettings()
      
      expect(restoredSettings).toEqual(expect.objectContaining(newSettings))
    })

    it('should persist and restore user preferences', () => {
      const newPreferences = {
        lastOpenProject: 'project-123',
        calendarView: 'week',
        sidebarCollapsed: true
      }

      storageService.saveUserPreferences(newPreferences)

      const restoredPreferences = storageService.getUserPreferences()
      
      expect(restoredPreferences).toEqual(expect.objectContaining(newPreferences))
    })

    it('should merge settings and preferences correctly', () => {
      // Set initial settings
      const initialSettings = { maxNestingLevel: 100, theme: 'light' }
      storageService.saveSettings(initialSettings)

      // Update only some settings
      const partialUpdate = { theme: 'dark', language: 'es' }
      storageService.saveSettings(partialUpdate)

      const finalSettings = storageService.getSettings()
      
      expect(finalSettings).toEqual(expect.objectContaining({
        maxNestingLevel: 100, // Should be preserved
        theme: 'dark', // Should be updated
        language: 'es' // Should be added
      }))
    })
  })

  describe('data export and import', () => {
    it('should export complete application data', () => {
      const project = mockProject({
        tasks: [mockTask()],
        teamMembers: [mockTeamMember()]
      })
      
      storageService.saveProject(project)
      storageService.saveSettings({ maxNestingLevel: 50 })
      storageService.saveUserPreferences({ calendarView: 'week' })

      const exportedData = storageService.exportData()
      const parsedData = JSON.parse(exportedData)

      expect(parsedData).toHaveProperty('projects')
      expect(parsedData).toHaveProperty('settings')
      expect(parsedData).toHaveProperty('userPreferences')
      expect(parsedData).toHaveProperty('exportDate')
      expect(parsedData).toHaveProperty('version')

      expect(parsedData.projects).toHaveLength(1)
      expect(parsedData.settings.maxNestingLevel).toBe(50)
      expect(parsedData.userPreferences.calendarView).toBe('week')
    })

    it('should import and restore application data', () => {
      const importData = {
        projects: [mockProject()],
        settings: { maxNestingLevel: 75, theme: 'dark' },
        userPreferences: { calendarView: 'day', sidebarCollapsed: true }
      }

      const result = storageService.importData(JSON.stringify(importData))

      expect(result).toBe(true)

      // Verify data was imported
      const projects = storageService.getAllProjects()
      const settings = storageService.getSettings()
      const preferences = storageService.getUserPreferences()

      expect(projects).toHaveLength(1)
      expect(settings.maxNestingLevel).toBe(75)
      expect(settings.theme).toBe('dark')
      expect(preferences.calendarView).toBe('day')
      expect(preferences.sidebarCollapsed).toBe(true)
    })

    it('should handle invalid import data', () => {
      expect(() => {
        storageService.importData('invalid json')
      }).toThrow('Error al importar los datos')

      expect(() => {
        storageService.importData('{}') // Valid JSON but missing data
      }).not.toThrow()
    })
  })

  describe('data migration and versioning', () => {
    it('should handle data structure changes', () => {
      // Simulate old data format
      const oldProjectData = {
        id: 'project-1',
        name: 'Old Project',
        // Missing new fields that might be added in future versions
      }

      mockStorage.pm_projects = JSON.stringify([oldProjectData])

      // Should handle missing fields gracefully
      const projects = storageService.getAllProjects()
      expect(projects).toHaveLength(1)
      expect(projects[0].name).toBe('Old Project')
    })

    it('should maintain backward compatibility', () => {
      // Test with minimal required data
      const minimalProject = {
        id: 'minimal-project',
        name: 'Minimal Project',
        startDate: new Date().toISOString()
      }

      mockStorage.pm_projects = JSON.stringify([minimalProject])

      expect(() => {
        storageService.getAllProjects()
      }).not.toThrow()
    })
  })

  describe('storage health and recovery', () => {
    it('should perform storage health check', () => {
      const project = mockProject()
      storageService.saveProject(project)

      const healthCheck = storageService.checkStorageHealth()

      expect(healthCheck.healthy).toBe(true)
      expect(healthCheck.projectCount).toBe(1)
      expect(healthCheck.approximateDataSize).toBeGreaterThan(0)
      expect(healthCheck.lastCheck).toBeDefined()
    })

    it('should detect storage problems', () => {
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage failed')
      })

      const healthCheck = storageService.checkStorageHealth()

      expect(healthCheck.healthy).toBe(false)
      expect(healthCheck.error).toBe('Storage failed')
      expect(healthCheck.lastCheck).toBeDefined()
    })

    it('should clear all data and reinitialize', () => {
      // Add some data
      const project = mockProject()
      storageService.saveProject(project)

      // Clear all data
      const result = storageService.clearAllData()

      expect(result).toBe(true)
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('pm_projects')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('pm_settings')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('pm_user_preferences')

      // Should reinitialize with defaults
      const projects = storageService.getAllProjects()
      const settings = storageService.getSettings()
      const preferences = storageService.getUserPreferences()

      expect(projects).toEqual([])
      expect(settings.maxNestingLevel).toBe(100)
      expect(preferences.calendarView).toBe('month')
    })
  })

  describe('concurrent access and race conditions', () => {
    it('should handle rapid successive operations', async () => {
      const project = mockProject()
      
      // Simulate rapid updates
      const updates = Array.from({ length: 10 }, (_, i) => ({
        ...project,
        name: `Project Update ${i}`,
        updatedAt: new Date()
      }))

      // Execute updates rapidly
      updates.forEach(update => {
        storageService.saveProject(update)
      })

      // Should have the last update
      const finalProject = storageService.getProject(project.id)
      expect(finalProject.name).toBe('Project Update 9')
    })

    it('should maintain data consistency under stress', () => {
      const projects = Array.from({ length: 100 }, (_, i) => 
        mockProject({ id: `project-${i}`, name: `Project ${i}` })
      )

      // Save all projects
      projects.forEach(project => storageService.saveProject(project))

      // Verify all were saved correctly
      const allProjects = storageService.getAllProjects()
      expect(allProjects).toHaveLength(100)

      // Verify each project is intact
      projects.forEach(originalProject => {
        const savedProject = allProjects.find(p => p.id === originalProject.id)
        expect(savedProject).toBeDefined()
        expect(savedProject.name).toBe(originalProject.name)
      })
    })
  })

  describe('memory management', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now()
      
      // Create large project with many tasks
      const largeTasks = Array.from({ length: 1000 }, (_, i) => 
        mockTask({ id: `task-${i}`, title: `Task ${i}` })
      )
      
      const largeProject = mockProject({
        tasks: largeTasks
      })

      storageService.saveProject(largeProject)
      const restoredProject = storageService.getProject(largeProject.id)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(restoredProject.tasks).toHaveLength(1000)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should not leak memory during repeated operations', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const project = mockProject({ id: `project-${i}` })
        storageService.saveProject(project)
        storageService.getProject(project.id)
        storageService.deleteProject(project.id)
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })
})