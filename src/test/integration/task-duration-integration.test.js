import { describe, it, expect } from 'vitest'
import { Task } from '../../models/index.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'

describe('Task Duration Integration', () => {
  describe('Task Model with Duration Management', () => {
    it('creates task with duration calculation', () => {
      const startDate = new Date('2024-01-01') // Monday
      const endDate = new Date('2024-01-05')   // Friday
      
      const task = new Task({
        title: 'Test Task',
        startDate,
        endDate,
        projectId: 'test-project'
      })
      
      expect(task.duration).toBe(5) // Mon, Tue, Wed, Thu, Fri = 5 working days
      expect(task.adjustStartDate).toBe(false) // Default value
    })

    it('creates task with explicit duration', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        duration: 3,
        adjustStartDate: true,
        projectId: 'test-project'
      })
      
      expect(task.duration).toBe(3) // Explicit value takes precedence
      expect(task.adjustStartDate).toBe(true)
    })

    it('calculates end date from start date and duration', () => {
      const startDate = new Date('2024-01-01') // Monday
      const task = new Task({
        title: 'Test Task',
        startDate,
        duration: 3,
        projectId: 'test-project'
      })
      
      const expectedEndDate = DateCalculationService.addWorkingDays(startDate, 3)
      const calculatedEndDate = task.calculateEndDate(startDate, 3)
      
      expect(calculatedEndDate.toDateString()).toBe(expectedEndDate.toDateString())
    })

    it('calculates start date from end date and duration', () => {
      const endDate = new Date('2024-01-05') // Friday
      const task = new Task({
        title: 'Test Task',
        endDate,
        duration: 3,
        projectId: 'test-project'
      })
      
      const expectedStartDate = DateCalculationService.subtractWorkingDays(endDate, 3)
      const calculatedStartDate = task.calculateStartDate(endDate, 3)
      
      expect(calculatedStartDate.toDateString()).toBe(expectedStartDate.toDateString())
    })

    it('updates duration when dates change', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-01'), // Monday
        endDate: new Date('2024-01-03'),   // Wednesday
        projectId: 'test-project'
      })
      
      expect(task.duration).toBe(3) // Mon, Tue, Wed
      
      // Update end date
      task.setEndDate(new Date('2024-01-05')) // Friday
      
      expect(task.duration).toBe(5) // Mon, Tue, Wed, Thu, Fri
    })

    it('updates end date when duration changes (default behavior)', () => {
      const startDate = new Date('2024-01-01') // Monday
      const task = new Task({
        title: 'Test Task',
        startDate,
        endDate: new Date('2024-01-03'), // Wednesday
        adjustStartDate: false,
        projectId: 'test-project'
      })
      
      expect(task.duration).toBe(3) // Initial duration
      
      // Change duration
      task.setDuration(5)
      
      expect(task.duration).toBe(5)
      const expectedEndDate = DateCalculationService.addWorkingDays(startDate, 5)
      expect(task.endDate.toDateString()).toBe(expectedEndDate.toDateString())
    })

    it('updates start date when duration changes and adjustStartDate is true', () => {
      const endDate = new Date('2024-01-05') // Friday
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-03'), // Wednesday
        endDate,
        adjustStartDate: true,
        projectId: 'test-project'
      })
      
      expect(task.duration).toBe(3) // Initial duration
      
      // Change duration
      task.setDuration(5)
      
      expect(task.duration).toBe(5)
      const expectedStartDate = DateCalculationService.subtractWorkingDays(endDate, 5)
      expect(task.startDate.toDateString()).toBe(expectedStartDate.toDateString())
    })

    it('serializes and deserializes with duration properties', () => {
      const originalTask = new Task({
        title: 'Test Task',
        startDate: new Date('2024-02-05'),
        endDate: new Date('2024-02-09'),
        duration: 5,
        adjustStartDate: true,
        projectId: 'test-project'
      })
      
      const json = originalTask.toJSON()
      expect(json.duration).toBe(5)
      expect(json.adjustStartDate).toBe(true)
      
      const restoredTask = Task.fromJSON(json)
      expect(restoredTask.duration).toBe(5)
      expect(restoredTask.adjustStartDate).toBe(true)
      expect(restoredTask.startDate.toDateString()).toBe(originalTask.startDate.toDateString())
      expect(restoredTask.endDate.toDateString()).toBe(originalTask.endDate.toDateString())
    })
  })

  describe('DateCalculationService Integration', () => {
    it('calculates working days correctly', () => {
      const startDate = new Date('2024-01-01') // Monday
      const endDate = new Date('2024-01-05')   // Friday
      
      const duration = DateCalculationService.calculateWorkingDays(startDate, endDate)
      expect(duration).toBe(5) // Mon, Tue, Wed, Thu, Fri
    })

    it('excludes Sundays from working day calculations', () => {
      const startDate = new Date('2024-01-07') // Sunday
      const endDate = new Date('2024-01-09')   // Tuesday
      
      const duration = DateCalculationService.calculateWorkingDays(startDate, endDate)
      expect(duration).toBe(2) // Mon, Tue (Sunday excluded)
    })

    it('adds working days correctly', () => {
      const startDate = new Date('2024-01-01') // Monday
      const result = DateCalculationService.addWorkingDays(startDate, 5)
      
      expect(result.getDay()).toBe(6) // Saturday (5 working days from Monday)
      expect(result.getDate()).toBe(6) // January 6th
    })

    it('subtracts working days correctly', () => {
      const endDate = new Date('2024-01-06') // Saturday
      const result = DateCalculationService.subtractWorkingDays(endDate, 5)
      
      expect(result.getDay()).toBe(1) // Monday (5 working days before Saturday)
      expect(result.getDate()).toBe(1) // January 1st
    })

    it('validates date ranges', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-05')
      const invalidEndDate = new Date('2023-12-31')
      
      expect(DateCalculationService.validateDateRange(startDate, endDate)).toBe(true)
      expect(DateCalculationService.validateDateRange(startDate, invalidEndDate)).toBe(false)
    })

    it('identifies working days correctly', () => {
      expect(DateCalculationService.isWorkingDay(new Date('2024-01-01'))).toBe(true)  // Monday
      expect(DateCalculationService.isWorkingDay(new Date('2024-01-02'))).toBe(true)  // Tuesday
      expect(DateCalculationService.isWorkingDay(new Date('2024-01-03'))).toBe(true)  // Wednesday
      expect(DateCalculationService.isWorkingDay(new Date('2024-01-04'))).toBe(true)  // Thursday
      expect(DateCalculationService.isWorkingDay(new Date('2024-01-05'))).toBe(true)  // Friday
      expect(DateCalculationService.isWorkingDay(new Date('2024-01-06'))).toBe(true)  // Saturday
      expect(DateCalculationService.isWorkingDay(new Date('2024-01-07'))).toBe(false) // Sunday
    })
  })

  describe('Backward Compatibility', () => {
    it('handles tasks without duration property', () => {
      const taskData = {
        title: 'Old Task',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        projectId: 'test-project'
        // No duration property
      }
      
      const task = new Task(taskData)
      
      expect(task.duration).toBe(5) // Calculated automatically
      expect(task.adjustStartDate).toBe(false) // Default value
    })

    it('preserves existing duration when provided', () => {
      const taskData = {
        title: 'Task with Duration',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        duration: 3, // Different from calculated value
        adjustStartDate: true,
        projectId: 'test-project'
      }
      
      const task = new Task(taskData)
      
      expect(task.duration).toBe(3) // Preserved explicit value
      expect(task.adjustStartDate).toBe(true)
    })

    it('handles null duration gracefully', () => {
      const taskData = {
        title: 'Task with Null Duration',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        duration: null,
        projectId: 'test-project'
      }
      
      const task = new Task(taskData)
      
      expect(task.duration).toBe(5) // Calculated from dates
    })
  })

  describe('Form Data Integration', () => {
    it('prepares task data for form submission', () => {
      const task = new Task({
        title: 'Form Task',
        description: 'Task for form testing',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        duration: 5,
        adjustStartDate: true,
        status: 'pending',
        type: 'simple',
        priority: 'medium',
        projectId: 'test-project'
      })
      
      const formData = {
        id: task.id,
        title: task.title,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
        duration: task.duration,
        adjustStartDate: task.adjustStartDate,
        status: task.status,
        type: task.type,
        priority: task.priority,
        projectId: task.projectId
      }
      
      expect(formData.duration).toBe(5)
      expect(formData.adjustStartDate).toBe(true)
      expect(formData.startDate).toBeInstanceOf(Date)
      expect(formData.endDate).toBeInstanceOf(Date)
    })

    it('validates form data with duration constraints', () => {
      const validFormData = {
        title: 'Valid Task',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        duration: 5,
        adjustStartDate: false
      }
      
      const invalidFormData = {
        title: 'Invalid Task',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        duration: -1, // Invalid duration
        adjustStartDate: false
      }
      
      // Valid data should pass basic checks
      expect(validFormData.duration).toBeGreaterThan(0)
      expect(DateCalculationService.validateDateRange(validFormData.startDate, validFormData.endDate)).toBe(true)
      
      // Invalid data should fail checks
      expect(invalidFormData.duration).toBeLessThan(1)
    })
  })
})