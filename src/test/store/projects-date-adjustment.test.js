import { describe, it, expect, beforeEach, vi } from 'vitest'
import projectsModule from '../../store/modules/projects.js'
import { Project, Task } from '../../models/index.js'

// Mock dependencies
vi.mock('../../services/storageService.js', () => ({
  storageService: {
    getProject: vi.fn(),
    saveProject: vi.fn(),
    getAllProjects: vi.fn(),
    deleteProject: vi.fn(),
    clearAllData: vi.fn()
  }
}))

vi.mock('../../composables/useErrorHandler.js', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    handleStorageError: vi.fn(),
    handleValidationError: vi.fn()
  })
}))

vi.mock('../../services/notificationService.js', () => ({
  useNotifications: () => ({
    operationSuccess: vi.fn(),
    operationWarning: vi.fn()
  })
}))

describe('Projects Store - Date Adjustment', () => {
  let store
  let mockProject
  let mockTask1, mockTask2

  beforeEach(() => {
    // Reset store state
    store = {
      state: {
        projects: [],
        currentProject: null,
        loading: false,
        error: null
      },
      commit: vi.fn(),
      dispatch: vi.fn()
    }

    // Create mock project with tasks
    mockTask1 = new Task({
      id: 'task-1',
      title: 'Task 1',
      startDate: new Date('2024-01-15'),
      duration: 5,
      projectId: 'project-1'
    })
    mockTask1.endDate = mockTask1.calculateEndDate(mockTask1.startDate, mockTask1.duration)

    mockTask2 = new Task({
      id: 'task-2',
      title: 'Task 2', 
      startDate: new Date('2024-01-22'),
      duration: 3,
      projectId: 'project-1'
    })
    mockTask2.endDate = mockTask2.calculateEndDate(mockTask2.startDate, mockTask2.duration)

    mockProject = new Project({
      id: 'project-1',
      name: 'Test Project',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-15'),
      tasks: [mockTask1, mockTask2]
    })

    store.state.projects = [mockProject]
    store.state.currentProject = mockProject
  })

  describe('adjustProjectDates action', () => {
    it('should successfully adjust project dates', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(mockProject.toJSON())
      storageService.saveProject.mockResolvedValue()

      const newStartDate = new Date('2024-01-22')
      const result = await projectsModule.actions.adjustProjectDates(store, {
        projectId: 'project-1',
        newStartDate
      })

      expect(result.success).toBe(true)
      expect(result.adjustedTasks).toBe(2)
      expect(store.commit).toHaveBeenCalledWith('SET_LOADING', true)
      expect(store.commit).toHaveBeenCalledWith('SET_LOADING', false)
      expect(store.commit).toHaveBeenCalledWith('UPDATE_PROJECT', expect.any(Object))
      expect(storageService.saveProject).toHaveBeenCalled()
    })

    it('should handle missing project ID', async () => {
      await expect(
        projectsModule.actions.adjustProjectDates(store, {
          projectId: null,
          newStartDate: new Date('2024-01-22')
        })
      ).rejects.toThrow('Project ID is required')

      expect(store.commit).toHaveBeenCalledWith('SET_ERROR', 'Project ID is required')
    })

    it('should handle missing new start date', async () => {
      await expect(
        projectsModule.actions.adjustProjectDates(store, {
          projectId: 'project-1',
          newStartDate: null
        })
      ).rejects.toThrow('New start date is required')

      expect(store.commit).toHaveBeenCalledWith('SET_ERROR', 'New start date is required')
    })

    it('should handle project not found', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(null)

      await expect(
        projectsModule.actions.adjustProjectDates(store, {
          projectId: 'nonexistent',
          newStartDate: new Date('2024-01-22')
        })
      ).rejects.toThrow('Project with ID nonexistent not found')
    })

    it('should handle invalid start date', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(mockProject.toJSON())

      await expect(
        projectsModule.actions.adjustProjectDates(store, {
          projectId: 'project-1',
          newStartDate: new Date('invalid')
        })
      ).rejects.toThrow('Invalid start date provided')
    })

    it('should show warning when new start date is after end date', async () => {
      const { storageService } = await import('../../services/storageService.js')
      
      storageService.getProject.mockReturnValue(mockProject.toJSON())
      storageService.saveProject.mockResolvedValue()

      const newStartDate = new Date('2024-03-01') // After project end date
      
      const result = await projectsModule.actions.adjustProjectDates(store, {
        projectId: 'project-1',
        newStartDate
      })

      expect(result.success).toBe(true)
      expect(store.commit).toHaveBeenCalledWith('UPDATE_PROJECT', expect.any(Object))
    })

    it('should handle storage errors during save', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(mockProject.toJSON())
      storageService.saveProject.mockRejectedValue(new Error('Storage error'))

      await expect(
        projectsModule.actions.adjustProjectDates(store, {
          projectId: 'project-1',
          newStartDate: new Date('2024-01-22')
        })
      ).rejects.toThrow('Storage error')

      expect(store.commit).toHaveBeenCalledWith('SET_ERROR', 'Failed to adjust project dates: Storage error')
    })
  })

  describe('validateProjectDateAdjustment action', () => {
    it('should validate successful date adjustment', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(mockProject.toJSON())

      const result = await projectsModule.actions.validateProjectDateAdjustment(store, {
        projectId: 'project-1',
        newStartDate: new Date('2024-01-22')
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.affectedTasks).toBe(2)
    })

    it('should return validation errors for missing inputs', async () => {
      const result = await projectsModule.actions.validateProjectDateAdjustment(store, {
        projectId: null,
        newStartDate: null
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Project ID and new start date are required')
    })

    it('should return validation errors for nonexistent project', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(null)

      const result = await projectsModule.actions.validateProjectDateAdjustment(store, {
        projectId: 'nonexistent',
        newStartDate: new Date('2024-01-22')
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Project with ID nonexistent not found')
    })

    it('should return validation errors for invalid date', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(mockProject.toJSON())
      
      const result = await projectsModule.actions.validateProjectDateAdjustment(store, {
        projectId: 'project-1',
        newStartDate: new Date('invalid')
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid start date provided')
    })

    it('should return warnings for non-working day', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(mockProject.toJSON())

      const result = await projectsModule.actions.validateProjectDateAdjustment(store, {
        projectId: 'project-1',
        newStartDate: new Date(2024, 0, 7) // Sunday
      })

      expect(result.warnings).toContain('New start date falls on a non-working day (Sunday)')
    })

    it('should calculate days difference correctly', async () => {
      const { storageService } = await import('../../services/storageService.js')
      storageService.getProject.mockReturnValue(mockProject.toJSON())

      const result = await projectsModule.actions.validateProjectDateAdjustment(store, {
        projectId: 'project-1',
        newStartDate: new Date('2024-01-22') // 6 working days forward (includes both dates)
      })

      expect(result.daysDifference).toBe(6)
    })
  })

  describe('getProjectDateAdjustmentInfo getter', () => {
    it('should return project date adjustment info', () => {
      const info = projectsModule.getters.getProjectDateAdjustmentInfo(store.state)('project-1')

      expect(info).toEqual({
        currentStartDate: mockProject.startDate,
        currentEndDate: mockProject.endDate,
        taskCount: 2,
        hasEndDate: true
      })
    })

    it('should return null for nonexistent project', () => {
      const info = projectsModule.getters.getProjectDateAdjustmentInfo(store.state)('nonexistent')

      expect(info).toBeNull()
    })

    it('should handle project without end date', () => {
      const projectWithoutEndDate = new Project({
        id: 'project-2',
        name: 'Project Without End Date',
        startDate: new Date('2024-01-15'),
        endDate: null,
        tasks: []
      })

      store.state.projects.push(projectWithoutEndDate)

      const info = projectsModule.getters.getProjectDateAdjustmentInfo(store.state)('project-2')

      expect(info.hasEndDate).toBe(false)
      expect(info.currentEndDate).toBeNull()
    })
  })
})