import { describe, it, expect, beforeEach } from 'vitest'
import { Project, Task } from '../../models/index.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'

describe('Project Date Adjustment', () => {
  let project
  let task1, task2, task3

  beforeEach(() => {
    // Create test project with tasks
    const startDate = new Date('2024-01-15') // Monday
    const endDate = new Date('2024-02-15')
    
    project = new Project({
      id: 'test-project',
      name: 'Test Project',
      startDate,
      endDate,
      tasks: []
    })

    // Create test tasks
    task1 = new Task({
      id: 'task-1',
      title: 'Task 1',
      startDate: new Date('2024-01-15'),
      duration: 5,
      projectId: project.id
    })
    task1.endDate = task1.calculateEndDate(task1.startDate, task1.duration)

    task2 = new Task({
      id: 'task-2', 
      title: 'Task 2',
      startDate: new Date('2024-01-22'),
      duration: 3,
      projectId: project.id
    })
    task2.endDate = task2.calculateEndDate(task2.startDate, task2.duration)

    task3 = new Task({
      id: 'task-3',
      title: 'Task 3', 
      startDate: new Date('2024-01-25'),
      duration: 7,
      projectId: project.id
    })
    task3.endDate = task3.calculateEndDate(task3.startDate, task3.duration)

    project.tasks = [task1, task2, task3]
  })

  describe('validateDateAdjustment', () => {
    it('should validate successful date adjustment forward', () => {
      const newStartDate = new Date('2024-01-22') // Moving forward 5 working days
      const result = project.validateDateAdjustment(newStartDate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.daysDifference).toBe(6) // Includes both start and end dates
      expect(result.affectedTasks).toBe(3)
    })

    it('should validate successful date adjustment backward', () => {
      const newStartDate = new Date('2024-01-08') // Moving backward 5 working days
      const result = project.validateDateAdjustment(newStartDate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.daysDifference).toBe(6) // Includes both start and end dates
      expect(result.affectedTasks).toBe(3)
    })

    it('should return error for missing start date', () => {
      const result = project.validateDateAdjustment(null)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('New start date is required')
    })

    it('should return error for invalid start date', () => {
      const result = project.validateDateAdjustment(new Date('invalid'))

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid start date provided')
    })

    it('should return warning for non-working day', () => {
      const newStartDate = new Date(2024, 0, 7) // Sunday (day 0)
      const result = project.validateDateAdjustment(newStartDate)

      expect(result.warnings).toContain('New start date falls on a non-working day (Sunday)')
    })

    it('should return warning when new start date is after end date', () => {
      const newStartDate = new Date('2024-03-01') // After project end date
      const result = project.validateDateAdjustment(newStartDate)

      expect(result.warnings).toContain('New start date is after project end date')
    })
  })

  describe('adjustProjectDates', () => {
    it('should adjust project dates forward successfully', () => {
      const originalTask1Start = new Date(task1.startDate)
      const originalTask2Start = new Date(task2.startDate)
      const newStartDate = new Date('2024-01-22') // Moving forward 5 working days

      const result = project.adjustProjectDates(newStartDate)

      expect(result.success).toBe(true)
      expect(result.adjustedTasks).toBe(3)
      expect(result.failedTasks).toHaveLength(0)
      expect(result.isMovingForward).toBe(true)
      expect(result.daysDifference).toBe(6)

      // Check project start date updated
      expect(project.startDate).toEqual(newStartDate)

      // Check tasks moved forward by 6 working days (the actual difference calculated)
      const expectedTask1Start = DateCalculationService.addWorkingDays(originalTask1Start, 6)
      const expectedTask2Start = DateCalculationService.addWorkingDays(originalTask2Start, 6)
      
      expect(task1.startDate).toEqual(expectedTask1Start)
      expect(task2.startDate).toEqual(expectedTask2Start)

      // Check task durations maintained
      expect(task1.duration).toBe(5)
      expect(task2.duration).toBe(3)
      expect(task3.duration).toBe(7)
    })

    it('should adjust project dates backward successfully', () => {
      const originalTask1Start = new Date(task1.startDate)
      const originalTask2Start = new Date(task2.startDate)
      const newStartDate = new Date('2024-01-08') // Moving backward 5 working days

      const result = project.adjustProjectDates(newStartDate)

      expect(result.success).toBe(true)
      expect(result.adjustedTasks).toBe(3)
      expect(result.failedTasks).toHaveLength(0)
      expect(result.isMovingForward).toBe(false)
      expect(result.daysDifference).toBe(6)

      // Check project start date updated
      expect(project.startDate).toEqual(newStartDate)

      // Check tasks moved backward by 6 working days (the actual difference calculated)
      const expectedTask1Start = DateCalculationService.subtractWorkingDays(originalTask1Start, 6)
      const expectedTask2Start = DateCalculationService.subtractWorkingDays(originalTask2Start, 6)
      
      expect(task1.startDate).toEqual(expectedTask1Start)
      expect(task2.startDate).toEqual(expectedTask2Start)

      // Check task durations maintained
      expect(task1.duration).toBe(5)
      expect(task2.duration).toBe(3)
      expect(task3.duration).toBe(7)
    })

    it('should throw error for missing start date', () => {
      expect(() => {
        project.adjustProjectDates(null)
      }).toThrow('New start date is required')
    })

    it('should throw error for invalid start date', () => {
      expect(() => {
        project.adjustProjectDates(new Date('invalid'))
      }).toThrow('Invalid start date provided')
    })

    it('should maintain task end dates correctly after adjustment', () => {
      const newStartDate = new Date('2024-01-22')
      
      project.adjustProjectDates(newStartDate)

      // Verify end dates are calculated correctly based on new start dates and durations
      task1.endDate = task1.calculateEndDate(task1.startDate, task1.duration)
      task2.endDate = task2.calculateEndDate(task2.startDate, task2.duration)
      task3.endDate = task3.calculateEndDate(task3.startDate, task3.duration)

      expect(DateCalculationService.calculateWorkingDays(task1.startDate, task1.endDate)).toBe(task1.duration + 1)
      expect(DateCalculationService.calculateWorkingDays(task2.startDate, task2.endDate)).toBe(task2.duration + 1)
      expect(DateCalculationService.calculateWorkingDays(task3.startDate, task3.endDate)).toBe(task3.duration + 1)
    })

    it('should update project and task timestamps', () => {
      const beforeUpdate = new Date()
      const newStartDate = new Date('2024-01-22')
      
      project.adjustProjectDates(newStartDate)

      expect(project.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
      expect(task1.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
      expect(task2.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
      expect(task3.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('recalculateProjectEndDate', () => {
    it('should recalculate project end date based on latest task', () => {
      // Adjust project dates first
      const newStartDate = new Date('2024-01-22')
      project.adjustProjectDates(newStartDate)
      
      // Recalculate project end date
      project.recalculateProjectEndDate()

      // Find the latest task end date
      const latestEndDate = project.tasks.reduce((latest, task) => {
        return task.endDate > latest ? task.endDate : latest
      }, project.tasks[0].endDate)

      expect(project.endDate).toEqual(latestEndDate)
    })

    it('should handle empty task list', () => {
      project.tasks = []
      const originalEndDate = new Date(project.endDate)
      
      project.recalculateProjectEndDate()

      // End date should remain unchanged when no tasks
      expect(project.endDate).toEqual(originalEndDate)
    })
  })

  describe('integration with DateCalculationService', () => {
    it('should handle working day calculations correctly', () => {
      const newStartDate = new Date('2024-01-16') // Tuesday, 1 working day forward
      
      project.adjustProjectDates(newStartDate)

      // Task 1 should move from Monday (15th) to Tuesday (16th)
      expect(task1.startDate).toEqual(new Date('2024-01-16'))
      
      // Task 2 should move from Monday (22nd) to Tuesday (23rd) 
      expect(task2.startDate).toEqual(new Date('2024-01-23'))
    })

    it('should skip weekends correctly in date calculations', () => {
      const newStartDate = new Date('2024-01-19') // Friday, 4 working days forward
      
      project.adjustProjectDates(newStartDate)

      // Task 1 should move from Monday (15th) to Friday (19th)
      expect(task1.startDate).toEqual(new Date('2024-01-19'))
      
      // Task 2 should move from Monday (22nd) to Friday (26th), skipping weekend
      expect(task2.startDate).toEqual(new Date('2024-01-26'))
    })
  })
})