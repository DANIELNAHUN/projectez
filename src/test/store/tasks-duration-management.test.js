import { describe, it, expect, beforeEach, vi } from 'vitest'
import tasksModule from '../../store/modules/tasks.js'
import { Task } from '../../models/index.js'

// Mock dependencies
vi.mock('../../services/storageService.js', () => ({
  storageService: {
    getTasksForProject: vi.fn(),
    getAllProjects: vi.fn(),
    saveTask: vi.fn(),
    deleteTask: vi.fn()
  }
}))

vi.mock('../../services/dateCalculationService.js', () => ({
  DateCalculationService: {
    calculateWorkingDays: vi.fn(),
    addWorkingDays: vi.fn(),
    subtractWorkingDays: vi.fn(),
    validateDateRange: vi.fn(),
    isWorkingDay: vi.fn()
  }
}))

describe('Tasks Store - Duration Management', () => {
  let store
  let mockTask

  beforeEach(() => {
    // Reset store state
    store = {
      state: {
        tasks: [],
        currentTask: null,
        taskFilter: {
          status: null,
          assignedTo: null,
          projectId: null
        },
        maxNestingLevel: 100,
        loading: false,
        error: null
      },
      commit: vi.fn(),
      dispatch: vi.fn()
    }

    mockTask = new Task({
      id: 'task-1',
      title: 'Test Task',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-19'),
      duration: 5,
      adjustStartDate: false,
      projectId: 'project-1'
    })

    store.state.tasks = [mockTask]
  })

  describe('UPDATE_TASK_DURATION mutation', () => {
    it('should update task duration', () => {
      tasksModule.mutations.UPDATE_TASK_DURATION(store.state, {
        taskId: 'task-1',
        duration: 7
      })

      const updatedTask = store.state.tasks.find(t => t.id === 'task-1')
      expect(updatedTask.duration).toBe(7)
      expect(updatedTask.updatedAt).toBeInstanceOf(Date)
    })

    it('should update current task duration if it matches', () => {
      store.state.currentTask = mockTask

      tasksModule.mutations.UPDATE_TASK_DURATION(store.state, {
        taskId: 'task-1',
        duration: 7
      })

      expect(store.state.currentTask.duration).toBe(7)
      expect(store.state.currentTask.updatedAt).toBeInstanceOf(Date)
    })

    it('should not update non-existent task', () => {
      tasksModule.mutations.UPDATE_TASK_DURATION(store.state, {
        taskId: 'nonexistent',
        duration: 7
      })

      const originalTask = store.state.tasks.find(t => t.id === 'task-1')
      expect(originalTask.duration).toBe(5) // Should remain unchanged
    })
  })

  describe('UPDATE_TASK_DATES mutation', () => {
    it('should update task start date', () => {
      const newStartDate = new Date('2024-01-16')

      tasksModule.mutations.UPDATE_TASK_DATES(store.state, {
        taskId: 'task-1',
        startDate: newStartDate,
        endDate: null
      })

      const updatedTask = store.state.tasks.find(t => t.id === 'task-1')
      expect(updatedTask.startDate).toEqual(newStartDate)
      expect(updatedTask.updatedAt).toBeInstanceOf(Date)
    })

    it('should update task end date', () => {
      const newEndDate = new Date('2024-01-22')

      tasksModule.mutations.UPDATE_TASK_DATES(store.state, {
        taskId: 'task-1',
        startDate: null,
        endDate: newEndDate
      })

      const updatedTask = store.state.tasks.find(t => t.id === 'task-1')
      expect(updatedTask.endDate).toEqual(newEndDate)
      expect(updatedTask.updatedAt).toBeInstanceOf(Date)
    })

    it('should update both dates', () => {
      const newStartDate = new Date('2024-01-16')
      const newEndDate = new Date('2024-01-22')

      tasksModule.mutations.UPDATE_TASK_DATES(store.state, {
        taskId: 'task-1',
        startDate: newStartDate,
        endDate: newEndDate
      })

      const updatedTask = store.state.tasks.find(t => t.id === 'task-1')
      expect(updatedTask.startDate).toEqual(newStartDate)
      expect(updatedTask.endDate).toEqual(newEndDate)
    })
  })

  describe('TOGGLE_ADJUST_START_DATE mutation', () => {
    it('should toggle adjustStartDate flag', () => {
      tasksModule.mutations.TOGGLE_ADJUST_START_DATE(store.state, {
        taskId: 'task-1',
        adjustStartDate: true
      })

      const updatedTask = store.state.tasks.find(t => t.id === 'task-1')
      expect(updatedTask.adjustStartDate).toBe(true)
      expect(updatedTask.updatedAt).toBeInstanceOf(Date)
    })

    it('should update current task if it matches', () => {
      store.state.currentTask = mockTask

      tasksModule.mutations.TOGGLE_ADJUST_START_DATE(store.state, {
        taskId: 'task-1',
        adjustStartDate: true
      })

      expect(store.state.currentTask.adjustStartDate).toBe(true)
    })
  })

  describe('updateTaskDuration action', () => {
    it('should successfully update task duration', async () => {
      const { storageService } = await import('../../services/storageService.js')
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')
      
      storageService.saveTask.mockResolvedValue()
      DateCalculationService.addWorkingDays.mockReturnValue(new Date('2024-01-22'))

      const result = await tasksModule.actions.updateTaskDuration(store, {
        taskId: 'task-1',
        duration: 7,
        recalculateDate: true
      })

      expect(store.commit).toHaveBeenCalledWith('UPDATE_TASK_DURATION', {
        taskId: 'task-1',
        duration: 7
      })
      expect(store.commit).toHaveBeenCalledWith('UPDATE_TASK_DATES', {
        taskId: 'task-1',
        startDate: null,
        endDate: new Date('2024-01-22')
      })
      expect(storageService.saveTask).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Task)
    })

    it('should handle adjustStartDate flag', async () => {
      const { storageService } = await import('../../services/storageService.js')
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')
      
      // Set up task with adjustStartDate flag
      mockTask.adjustStartDate = true
      mockTask.endDate = new Date('2024-01-19')
      
      storageService.saveTask.mockResolvedValue()
      DateCalculationService.subtractWorkingDays.mockReturnValue(new Date('2024-01-10'))

      await tasksModule.actions.updateTaskDuration(store, {
        taskId: 'task-1',
        duration: 7,
        recalculateDate: true
      })

      expect(store.commit).toHaveBeenCalledWith('UPDATE_TASK_DATES', {
        taskId: 'task-1',
        startDate: new Date('2024-01-10'),
        endDate: null
      })
    })

    it('should handle missing task ID', async () => {
      await expect(
        tasksModule.actions.updateTaskDuration(store, {
          taskId: null,
          duration: 7
        })
      ).rejects.toThrow('Task ID is required')

      expect(store.commit).toHaveBeenCalledWith('SET_ERROR', 'Task ID is required')
    })

    it('should handle invalid duration', async () => {
      await expect(
        tasksModule.actions.updateTaskDuration(store, {
          taskId: 'task-1',
          duration: -1
        })
      ).rejects.toThrow('Duration must be a non-negative number')
    })

    it('should handle task not found', async () => {
      await expect(
        tasksModule.actions.updateTaskDuration(store, {
          taskId: 'nonexistent',
          duration: 7
        })
      ).rejects.toThrow('Task not found')
    })
  })

  describe('updateTaskDates action', () => {
    it('should successfully update task dates', async () => {
      const { storageService } = await import('../../services/storageService.js')
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')
      
      const newStartDate = new Date('2024-01-16')
      const newEndDate = new Date('2024-01-22')
      
      storageService.saveTask.mockResolvedValue()
      DateCalculationService.validateDateRange.mockReturnValue(true)
      DateCalculationService.calculateWorkingDays.mockReturnValue(5)

      const result = await tasksModule.actions.updateTaskDates(store, {
        taskId: 'task-1',
        startDate: newStartDate,
        endDate: newEndDate,
        recalculateDuration: true
      })

      expect(store.commit).toHaveBeenCalledWith('UPDATE_TASK_DATES', {
        taskId: 'task-1',
        startDate: newStartDate,
        endDate: newEndDate
      })
      expect(store.commit).toHaveBeenCalledWith('UPDATE_TASK_DURATION', {
        taskId: 'task-1',
        duration: 5
      })
      expect(result).toBeInstanceOf(Task)
    })

    it('should handle invalid date range', async () => {
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')
      
      DateCalculationService.validateDateRange.mockReturnValue(false)

      await expect(
        tasksModule.actions.updateTaskDates(store, {
          taskId: 'task-1',
          startDate: new Date('2024-01-22'),
          endDate: new Date('2024-01-16')
        })
      ).rejects.toThrow('End date must be after start date')
    })

    it('should handle invalid dates', async () => {
      await expect(
        tasksModule.actions.updateTaskDates(store, {
          taskId: 'task-1',
          startDate: new Date('invalid'),
          endDate: new Date('2024-01-22')
        })
      ).rejects.toThrow('Invalid date provided')
    })
  })

  describe('toggleAdjustStartDate action', () => {
    it('should successfully toggle adjustStartDate flag', async () => {
      const { storageService } = await import('../../services/storageService.js')
      
      storageService.saveTask.mockResolvedValue()

      const result = await tasksModule.actions.toggleAdjustStartDate(store, {
        taskId: 'task-1',
        adjustStartDate: true
      })

      expect(store.commit).toHaveBeenCalledWith('TOGGLE_ADJUST_START_DATE', {
        taskId: 'task-1',
        adjustStartDate: true
      })
      expect(storageService.saveTask).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Task)
    })

    it('should handle missing task ID', async () => {
      await expect(
        tasksModule.actions.toggleAdjustStartDate(store, {
          taskId: null,
          adjustStartDate: true
        })
      ).rejects.toThrow('Task ID is required')
    })

    it('should handle task not found', async () => {
      await expect(
        tasksModule.actions.toggleAdjustStartDate(store, {
          taskId: 'nonexistent',
          adjustStartDate: true
        })
      ).rejects.toThrow('Task not found')
    })
  })

  describe('calculateTaskDuration action', () => {
    it('should successfully calculate task duration', async () => {
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')
      
      DateCalculationService.validateDateRange.mockReturnValue(true)
      DateCalculationService.calculateWorkingDays.mockReturnValue(5)

      const result = await tasksModule.actions.calculateTaskDuration(store, {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-19')
      })

      expect(result.isValid).toBe(true)
      expect(result.duration).toBe(5)
      expect(result.startDate).toBeInstanceOf(Date)
      expect(result.endDate).toBeInstanceOf(Date)
    })

    it('should handle missing dates', async () => {
      const result = await tasksModule.actions.calculateTaskDuration(store, {
        startDate: null,
        endDate: new Date('2024-01-19')
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Both start date and end date are required')
    })

    it('should handle invalid date range', async () => {
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')
      
      DateCalculationService.validateDateRange.mockReturnValue(false)

      const result = await tasksModule.actions.calculateTaskDuration(store, {
        startDate: new Date('2024-01-22'),
        endDate: new Date('2024-01-16')
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('End date must be after start date')
    })
  })

  describe('duration-related getters', () => {
    beforeEach(() => {
      // Add more tasks for testing
      const task2 = new Task({
        id: 'task-2',
        title: 'Task 2',
        startDate: new Date('2024-01-22'),
        endDate: new Date('2024-01-26'),
        duration: 5,
        projectId: 'project-1'
      })

      const task3 = new Task({
        id: 'task-3',
        title: 'Task 3',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
        duration: 0, // Task without duration
        projectId: 'project-2'
      })

      store.state.tasks.push(task2, task3)
    })

    describe('getTaskDurationInfo getter', () => {
      it('should return task duration info', () => {
        const info = tasksModule.getters.getTaskDurationInfo(store.state)('task-1')

        expect(info).toEqual({
          duration: 5,
          startDate: mockTask.startDate,
          endDate: mockTask.endDate,
          adjustStartDate: false,
          hasValidDates: true
        })
      })

      it('should return null for nonexistent task', () => {
        const info = tasksModule.getters.getTaskDurationInfo(store.state)('nonexistent')
        expect(info).toBeNull()
      })
    })

    describe('tasksWithDuration getter', () => {
      it('should return tasks with duration', () => {
        const tasksWithDuration = tasksModule.getters.tasksWithDuration(store.state)
        expect(tasksWithDuration).toHaveLength(2)
        expect(tasksWithDuration.every(task => task.duration > 0)).toBe(true)
      })
    })

    describe('tasksWithoutDuration getter', () => {
      it('should return tasks without duration', () => {
        const tasksWithoutDuration = tasksModule.getters.tasksWithoutDuration(store.state)
        expect(tasksWithoutDuration).toHaveLength(1)
        expect(tasksWithoutDuration[0].id).toBe('task-3')
      })
    })

    describe('getTasksByDateRange getter', () => {
      it('should return tasks within date range', () => {
        const tasksInRange = tasksModule.getters.getTasksByDateRange(store.state)(
          new Date('2024-01-10'),
          new Date('2024-01-30')
        )

        expect(tasksInRange).toHaveLength(2)
        expect(tasksInRange.map(t => t.id)).toContain('task-1')
        expect(tasksInRange.map(t => t.id)).toContain('task-2')
      })

      it('should return empty array for non-overlapping range', () => {
        const tasksInRange = tasksModule.getters.getTasksByDateRange(store.state)(
          new Date('2024-03-01'),
          new Date('2024-03-31')
        )

        expect(tasksInRange).toHaveLength(0)
      })
    })

    describe('calculateTotalProjectDuration getter', () => {
      it('should calculate total project duration', () => {
        // Mock require to return our mocked service
        const originalRequire = global.require
        global.require = vi.fn((path) => {
          if (path === '../../services/dateCalculationService.js') {
            return {
              DateCalculationService: {
                calculateWorkingDays: vi.fn().mockReturnValue(10)
              }
            }
          }
          return originalRequire(path)
        })

        const totalDuration = tasksModule.getters.calculateTotalProjectDuration(store.state)('project-1')
        
        expect(totalDuration).toBe(10)
        
        // Restore original require
        global.require = originalRequire
      })

      it('should return 0 for project with no tasks', () => {
        const totalDuration = tasksModule.getters.calculateTotalProjectDuration(store.state)('nonexistent-project')
        expect(totalDuration).toBe(0)
      })

      it('should handle tasks without dates', () => {
        // Add task without dates
        const taskWithoutDates = new Task({
          id: 'task-no-dates',
          title: 'Task without dates',
          projectId: 'project-no-dates'
        })
        store.state.tasks.push(taskWithoutDates)

        const totalDuration = tasksModule.getters.calculateTotalProjectDuration(store.state)('project-no-dates')
        expect(totalDuration).toBe(0)
      })

      it('should handle DateCalculationService errors', () => {
        // Mock require to throw an error
        const originalRequire = global.require
        global.require = vi.fn((path) => {
          if (path === '../../services/dateCalculationService.js') {
            return {
              DateCalculationService: {
                calculateWorkingDays: vi.fn().mockImplementation(() => {
                  throw new Error('Service error')
                })
              }
            }
          }
          return originalRequire(path)
        })

        const totalDuration = tasksModule.getters.calculateTotalProjectDuration(store.state)('project-1')
        expect(totalDuration).toBe(0)
        
        // Restore original require
        global.require = originalRequire
      })
    })
  })
})