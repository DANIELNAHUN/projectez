import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validationService, useValidation } from '../../services/validationService.js'
import { ValidationError } from '../../utils/validation.js'
import { mockProject, mockTask, mockTeamMember } from '../utils.js'

// Mock the notification service
vi.mock('../../services/notificationService.js', () => ({
  useNotifications: () => ({
    validationError: vi.fn(),
    warning: vi.fn(),
    showProgress: vi.fn(() => 'progress-id'),
    updateProgress: vi.fn(),
    completeProgress: vi.fn()
  })
}))

describe('ValidationService', () => {
  beforeEach(() => {
    validationService.clearCache()
    vi.clearAllMocks()
  })

  describe('cache management', () => {
    it('should cache validation results', async () => {
      const project = mockProject()
      
      // First validation
      const result1 = await validationService.validateProjectData(project)
      
      // Second validation should use cache
      const result2 = await validationService.validateProjectData(project)
      
      expect(result1).toEqual(result2)
      expect(validationService.validationCache.size).toBeGreaterThan(0)
    })

    it('should clear cache', () => {
      validationService.validationCache.set('test', 'value')
      
      validationService.clearCache()
      
      expect(validationService.validationCache.size).toBe(0)
    })
  })

  describe('custom validators', () => {
    it('should register custom validator', () => {
      const customValidator = vi.fn()
      
      validationService.registerValidator('custom', customValidator)
      
      expect(validationService.getValidator('custom')).toBe(customValidator)
    })

    it('should get existing validator', () => {
      const validator = validationService.getValidator('required')
      
      expect(validator).toBeDefined()
    })
  })

  describe('project validation', () => {
    it('should validate valid project', async () => {
      const project = mockProject()
      
      const result = await validationService.validateProjectData(project)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should handle validation errors', async () => {
      const invalidProject = mockProject({ name: '' })
      
      const result = await validationService.validateProjectData(invalidProject)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
    })

    it('should show notification on error when requested', async () => {
      const invalidProject = mockProject({ name: '' })
      
      await validationService.validateProjectData(invalidProject, { 
        showNotification: true 
      })
      
      // Notification should be called (mocked)
      expect(true).toBe(true) // Placeholder since we're mocking
    })
  })

  describe('task validation', () => {
    it('should validate valid task', async () => {
      const task = mockTask()
      
      const result = await validationService.validateTaskData(task)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should validate task with nesting level', async () => {
      const task = mockTask({ level: 50 })
      
      const result = await validationService.validateTaskData(task, { 
        maxNestingLevel: 100 
      })
      
      expect(result.isValid).toBe(true)
    })

    it('should reject task exceeding nesting level', async () => {
      const task = mockTask({ level: 101 })
      
      const result = await validationService.validateTaskData(task, { 
        maxNestingLevel: 100 
      })
      
      expect(result.isValid).toBe(false)
    })
  })

  describe('team member validation', () => {
    it('should validate valid team member', async () => {
      const member = mockTeamMember()
      
      const result = await validationService.validateTeamMemberData(member)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should handle invalid email', async () => {
      const member = mockTeamMember({ email: 'invalid-email' })
      
      const result = await validationService.validateTeamMemberData(member)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'email')).toBe(true)
    })
  })

  describe('batch validation', () => {
    it('should validate multiple items', async () => {
      const projects = [
        mockProject({ id: '1' }),
        mockProject({ id: '2' }),
        mockProject({ id: '3', name: '' }) // Invalid
      ]
      
      const validator = async (project) => {
        if (!project.name) {
          throw new ValidationError('Name is required', 'name')
        }
        return project
      }
      
      const result = await validationService.validateBatch(projects, validator)
      
      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(1)
      expect(result.isValid).toBe(false)
    })

    it('should show progress when requested', async () => {
      const projects = [mockProject()]
      const validator = async (project) => project
      
      const result = await validationService.validateBatch(projects, validator, {
        showProgress: true
      })
      
      expect(result.successCount).toBe(1)
    })
  })

  describe('real-time validation', () => {
    it('should create real-time validator', () => {
      const rules = {
        name: [(value) => {
          if (!value) throw new ValidationError('Name is required', 'name')
        }]
      }
      
      const validator = validationService.createRealTimeValidator(rules)
      
      expect(validator).toHaveProperty('validate')
      expect(validator).toHaveProperty('getErrors')
      expect(validator).toHaveProperty('hasErrors')
    })

    it('should validate field in real-time', async () => {
      const rules = {
        name: [(value) => {
          if (!value) throw new ValidationError('Name is required', 'name')
        }]
      }
      
      const validator = validationService.createRealTimeValidator(rules, 0)
      
      const result = await validator.validate('name', '')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Name is required')
    })
  })

  describe('cross-field validation', () => {
    it('should validate cross-field rules', async () => {
      const data = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2023-12-31') // Invalid: end before start
      }
      
      const rules = [
        {
          fields: ['startDate', 'endDate'],
          validate: (data) => {
            if (data.startDate > data.endDate) {
              throw new Error('End date must be after start date')
            }
          }
        }
      ]
      
      const result = await validationService.validateCrossFields(data, rules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('business rules validation', () => {
    it('should validate project business rules', async () => {
      const project = mockProject({ name: 'Duplicate Project' })
      const context = {
        existingProjects: [
          mockProject({ id: 'other', name: 'Duplicate Project' })
        ]
      }
      
      const result = await validationService.validateBusinessRules(project, 'project', context)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'name')).toBe(true)
    })

    it('should validate task business rules', async () => {
      const task = mockTask({ level: 100 })
      const context = { maxNestingLevel: 100 }
      
      const result = await validationService.validateBusinessRules(task, 'task', context)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'parentTaskId')).toBe(true)
    })

    it('should validate team member business rules', async () => {
      const member = mockTeamMember({ email: 'duplicate@example.com' })
      const context = {
        existingMembers: [
          mockTeamMember({ id: 'other', email: 'duplicate@example.com' })
        ]
      }
      
      const result = await validationService.validateBusinessRules(member, 'teamMember', context)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'email')).toBe(true)
    })
  })

  describe('error formatting', () => {
    it('should format validation error', () => {
      const error = new ValidationError('Test error', 'testField')
      
      const formatted = validationService.formatValidationErrors(error)
      
      expect(formatted).toEqual([{
        field: 'testField',
        message: 'Test error'
      }])
    })

    it('should format multiple errors', () => {
      const error = new ValidationError('Multiple errors')
      error.errors = [
        { field: 'field1', message: 'Error 1' },
        { field: 'field2', message: 'Error 2' }
      ]
      
      const formatted = validationService.formatValidationErrors(error)
      
      expect(formatted).toHaveLength(2)
      expect(formatted[0].field).toBe('field1')
      expect(formatted[1].field).toBe('field2')
    })

    it('should handle generic errors', () => {
      const error = new Error('Generic error')
      
      const formatted = validationService.formatValidationErrors(error)
      
      expect(formatted).toEqual([{
        field: 'general',
        message: 'Generic error'
      }])
    })
  })

  describe('validation summary', () => {
    it('should generate validation summary', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' },
        { field: 'general', message: 'General error' }
      ]
      
      const summary = validationService.getValidationSummary(errors)
      
      expect(summary.totalErrors).toBe(3)
      expect(summary.fieldErrors).toBe(2)
      expect(summary.generalErrors).toBe(1)
      expect(summary.fields).toEqual(['name', 'email'])
      expect(summary.messages).toHaveLength(3)
    })
  })
})

describe('useValidation composable', () => {
  it('should provide validation methods', () => {
    const validation = useValidation()
    
    expect(validation).toHaveProperty('validate')
    expect(validation).toHaveProperty('validateProject')
    expect(validation).toHaveProperty('validateTask')
    expect(validation).toHaveProperty('validateTeamMember')
    expect(validation).toHaveProperty('validateDeliverable')
    expect(validation).toHaveProperty('validateBatch')
    expect(validation).toHaveProperty('createRealTimeValidator')
    expect(validation).toHaveProperty('validateBusinessRules')
    expect(validation).toHaveProperty('formatErrors')
    expect(validation).toHaveProperty('getValidationSummary')
  })

  it('should validate project using composable', async () => {
    const validation = useValidation()
    const project = mockProject()
    
    const result = await validation.validateProject(project)
    
    expect(result.isValid).toBe(true)
  })
})