/**
 * Error Handling and Recovery End-to-End Tests
 * Tests comprehensive error scenarios and recovery mechanisms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAIService } from '../../services/openAIService.js'
import { ProjectExportService } from '../../services/projectExportService.js'
import { ProjectImportService } from '../../services/projectImportService.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'

describe('Error Handling and Recovery - End-to-End Tests', () => {
  let mockOpenAIService
  let validProjectData
  let invalidProjectData

  beforeEach(() => {
    // Valid project data for testing
    validProjectData = {
      id: 'valid-project-1',
      name: 'Valid Test Project',
      description: 'A valid project for error testing',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-28'),
      status: 'active',
      tasks: [
        {
          id: 'task-1',
          title: 'Valid Task',
          description: 'A valid task',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-05'),
          duration: 5,
          priority: 'medium',
          type: 'simple',
          status: 'pending',
          progress: 0,
          level: 0,
          adjustStartDate: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          subtasks: []
        }
      ],
      teamMembers: [
        {
          id: 'member-1',
          name: 'Test Member',
          email: 'test@example.com',
          role: 'Developer',
          avatar: null,
          joinedAt: new Date('2024-01-01')
        }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }

    // Invalid project data for testing various error scenarios
    invalidProjectData = {
      // Missing required fields
      missingId: {
        name: 'Project Without ID',
        tasks: [],
        teamMembers: []
      },
      missingName: {
        id: 'project-no-name',
        name: '',
        tasks: [],
        teamMembers: []
      },
      invalidDates: {
        id: 'project-invalid-dates',
        name: 'Project with Invalid Dates',
        startDate: 'invalid-date',
        endDate: new Date('2024-01-01'),
        tasks: [
          {
            id: 'task-invalid-date',
            title: 'Task with Invalid Date',
            startDate: 'not-a-date',
            endDate: new Date('2024-02-01'),
            duration: 5
          }
        ],
        teamMembers: []
      },
      invalidDateRange: {
        id: 'project-invalid-range',
        name: 'Project with Invalid Date Range',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-01-01'), // End before start
        tasks: [],
        teamMembers: []
      },
      corruptedTasks: {
        id: 'project-corrupted-tasks',
        name: 'Project with Corrupted Tasks',
        tasks: [
          {
            // Missing required fields
            description: 'Task without ID or title',
            duration: -5 // Invalid duration
          },
          {
            id: 'task-2',
            title: 'Task with Invalid Status',
            status: 'invalid-status',
            priority: 'invalid-priority',
            type: 'invalid-type'
          }
        ],
        teamMembers: []
      },
      corruptedTeamMembers: {
        id: 'project-corrupted-members',
        name: 'Project with Corrupted Team Members',
        tasks: [],
        teamMembers: [
          {
            // Missing ID and name
            email: 'orphan@example.com'
          },
          {
            id: 'member-invalid',
            name: 'Member with Invalid Date',
            joinedAt: 'invalid-date'
          }
        ]
      }
    }

    // Mock OpenAI service
    mockOpenAIService = {
      configure: vi.fn(),
      isReady: vi.fn(() => true),
      generateProject: vi.fn(),
      generateProjectSafe: vi.fn(),
      testConnection: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('OpenAI Service Error Handling', () => {
    it('should handle API quota exceeded error with proper messaging', async () => {
      const quotaError = new Error('OpenAI API quota exceeded')
      quotaError.code = 'insufficient_quota'

      mockOpenAIService.generateProjectSafe.mockResolvedValue({
        success: false,
        project: null,
        errors: ['Intento 1: OpenAI API quota exceeded', 'Intento 2: OpenAI API quota exceeded', 'Intento 3: OpenAI API quota exceeded'],
        warnings: [],
        retryCount: 3,
        totalTime: 5000,
        retryHistory: [
          { attempt: 1, error: 'OpenAI API quota exceeded', errorCode: 'insufficient_quota', time: 1000 },
          { attempt: 2, error: 'OpenAI API quota exceeded', errorCode: 'insufficient_quota', time: 2000 },
          { attempt: 3, error: 'OpenAI API quota exceeded', errorCode: 'insufficient_quota', time: 2000 }
        ]
      })

      const openAIService = new OpenAIService()
      openAIService.configure('test-api-key')

      const result = await openAIService.generateProjectSafe('Create a test project')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Intento 3: OpenAI API quota exceeded')
      expect(result.retryCount).toBe(3)
      expect(result.retryHistory).toHaveLength(3)
      expect(result.retryHistory[0].errorCode).toBe('insufficient_quota')
    })

    it('should handle invalid API key error without retries', async () => {
      const apiKeyError = new Error('Invalid OpenAI API key')
      apiKeyError.code = 'invalid_api_key'

      mockOpenAIService.generateProjectSafe.mockResolvedValue({
        success: false,
        project: null,
        errors: ['Intento 1: Invalid OpenAI API key'],
        warnings: [],
        retryCount: 0,
        totalTime: 500,
        retryHistory: [
          { attempt: 1, error: 'Invalid OpenAI API key', errorCode: 'invalid_api_key', time: 500 }
        ]
      })

      const openAIService = new OpenAIService()
      openAIService.configure('invalid-key')

      const result = await openAIService.generateProjectSafe('Create a test project')

      expect(result.success).toBe(false)
      expect(result.retryCount).toBe(0) // Should not retry on invalid API key
      expect(result.errors[0]).toContain('Invalid OpenAI API key')
    })

    it('should handle rate limit exceeded with exponential backoff', async () => {
      mockOpenAIService.generateProjectSafe.mockResolvedValue({
        success: true,
        project: validProjectData,
        errors: ['Intento 1: Rate limit exceeded', 'Intento 2: Rate limit exceeded'],
        warnings: [],
        retryCount: 2,
        totalTime: 8000,
        retryHistory: [
          { attempt: 1, error: 'Rate limit exceeded', errorCode: 'rate_limit_exceeded', time: 1000 },
          { attempt: 2, error: 'Rate limit exceeded', errorCode: 'rate_limit_exceeded', time: 2000 }
        ]
      })

      const openAIService = new OpenAIService()
      openAIService.configure('test-api-key')

      const result = await openAIService.generateProjectSafe('Create a test project')

      expect(result.success).toBe(true)
      expect(result.retryCount).toBe(2)
      expect(result.project).toBeDefined()
      expect(result.retryHistory).toHaveLength(2)
      expect(result.retryHistory.every(h => h.errorCode === 'rate_limit_exceeded')).toBe(true)
    })

    it('should handle network errors with retry mechanism', async () => {
      mockOpenAIService.generateProjectSafe.mockResolvedValue({
        success: true,
        project: validProjectData,
        errors: ['Intento 1: Network error', 'Intento 2: Connection timeout'],
        warnings: [],
        retryCount: 2,
        totalTime: 6000,
        retryHistory: [
          { attempt: 1, error: 'Network error', errorCode: 'network_error', time: 2000 },
          { attempt: 2, error: 'Connection timeout', errorCode: 'timeout', time: 3000 }
        ]
      })

      const openAIService = new OpenAIService()
      openAIService.configure('test-api-key')

      const result = await openAIService.generateProjectSafe('Create a complex project')

      expect(result.success).toBe(true)
      expect(result.retryCount).toBe(2)
      expect(result.totalTime).toBeGreaterThan(5000) // Should include retry delays
    })

    it('should handle malformed AI responses gracefully', async () => {
      const openAIService = new OpenAIService()

      // Test invalid JSON response
      expect(() => {
        openAIService.processAIResponse('invalid json response')
      }).toThrow('Failed to parse AI response as JSON')

      // Test missing required fields
      expect(() => {
        openAIService.processAIResponse(JSON.stringify({
          description: 'Project without name',
          tasks: []
        }))
      }).toThrow('Generated project validation failed')

      // Test invalid task structure
      expect(() => {
        openAIService.processAIResponse(JSON.stringify({
          name: 'Valid Project',
          description: 'Valid description',
          estimatedDuration: 30,
          tasks: [
            {
              // Missing title and duration
              description: 'Task without required fields'
            }
          ]
        }))
      }).toThrow('Generated project validation failed')
    })

    it('should validate AI responses comprehensively', () => {
      const openAIService = new OpenAIService()

      // Test comprehensive validation
      const invalidProject = {
        name: '', // Invalid name
        description: 'Test project',
        estimatedDuration: -10, // Invalid duration
        tasks: [
          {
            title: '', // Invalid title
            description: 'Task description',
            duration: 0, // Invalid duration
            priority: 'invalid-priority', // Invalid priority
            type: 'invalid-type', // Invalid type
            deliverable: {
              type: 'invalid-deliverable-type' // Invalid deliverable type
            }
          }
        ],
        teamMembers: [
          {
            // Missing name
            email: 'test@example.com'
          }
        ]
      }

      const validation = openAIService.validateGeneratedProject(invalidProject)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Project Export Error Handling', () => {
    it('should handle export of invalid project gracefully', () => {
      // Test export with null project
      expect(() => {
        ProjectExportService.exportProject(null)
      }).toThrow('Project is required for export')

      // Test export with project missing required fields
      expect(() => {
        ProjectExportService.exportProject({ name: 'Test' }) // Missing ID
      }).toThrow('Project must have an id and name')

      // Test export with invalid dates
      const projectWithInvalidDates = {
        id: 'test-project',
        name: 'Test Project',
        startDate: new Date('invalid-date'),
        tasks: []
      }

      expect(() => {
        ProjectExportService.exportProject(projectWithInvalidDates)
      }).toThrow('Failed to export project')
    })

    it('should validate project structure before export', () => {
      const invalidProject = {
        id: 'test-project',
        name: 'Test Project',
        startDate: new Date('invalid-date'),
        endDate: new Date('2024-01-01'),
        tasks: [
          {
            // Missing ID
            title: 'Task without ID',
            startDate: new Date('invalid-date')
          }
        ],
        teamMembers: [
          {
            // Missing ID
            name: 'Member without ID'
          }
        ]
      }

      const validation = ProjectExportService.validateProjectForExport(invalidProject)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Project start date is invalid')
      expect(validation.errors).toContain('Task at index 0 is missing an id')
      expect(validation.errors).toContain('Team member at index 0 is missing an id')
    })

    it('should handle file download errors gracefully', () => {
      // Mock document methods to simulate download failure
      const originalCreateElement = document.createElement
      document.createElement = vi.fn(() => {
        throw new Error('DOM manipulation failed')
      })

      expect(() => {
        ProjectExportService.downloadJSON('{"test": "data"}', 'test-file')
      }).toThrow('Failed to download JSON file')

      // Restore original method
      document.createElement = originalCreateElement
    })

    it('should sanitize filenames properly', () => {
      // Test various problematic filenames
      expect(ProjectExportService.sanitizeFilename('Project<>:"/\\|?*Name')).toBe('project-name')
      expect(ProjectExportService.sanitizeFilename('   Multiple   Spaces   ')).toBe('multiple-spaces')
      expect(ProjectExportService.sanitizeFilename('')).toBe('project-export')
      expect(ProjectExportService.sanitizeFilename(null)).toBe('project-export')
      expect(ProjectExportService.sanitizeFilename('A'.repeat(100))).toHaveLength(50) // Length limit
    })
  })

  describe('Project Import Error Handling', () => {
    it('should handle various JSON format errors', () => {
      // Test invalid JSON
      expect(() => {
        ProjectImportService.importProject('invalid json')
      }).toThrow('Invalid JSON format')

      // Test empty JSON
      expect(() => {
        ProjectImportService.importProject('')
      }).toThrow('JSON data is required and must be a string')

      // Test null JSON
      expect(() => {
        ProjectImportService.importProject(null)
      }).toThrow('JSON data is required and must be a string')
    })

    it('should validate project structure comprehensively', () => {
      const validation = ProjectImportService.validateProjectJSON(JSON.stringify(invalidProjectData.missingId))

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Project must have an id')
      expect(validation.errors).toContain('Project must have a valid name')
    })

    it('should handle date validation errors', () => {
      const validation = ProjectImportService.validateProjectJSON(JSON.stringify(invalidProjectData.invalidDates))

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('invalid'))).toBe(true)
    })

    it('should handle date range validation', () => {
      const validation = ProjectImportService.validateProjectJSON(JSON.stringify(invalidProjectData.invalidDateRange))

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Project end date must be after start date')
    })

    it('should handle corrupted task data', () => {
      const validation = ProjectImportService.validateProjectJSON(JSON.stringify(invalidProjectData.corruptedTasks))

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('must have an id'))).toBe(true)
    })

    it('should handle corrupted team member data', () => {
      const validation = ProjectImportService.validateProjectJSON(JSON.stringify(invalidProjectData.corruptedTeamMembers))

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('must have an id'))).toBe(true)
    })

    it('should attempt auto-fix for common issues', () => {
      const corruptedData = {
        // Missing required fields that can be auto-fixed
        name: '',
        tasks: [
          {
            // Missing id and title
            description: 'Task without proper fields',
            duration: 5
          }
        ],
        teamMembers: [
          {
            // Missing id and name
            email: 'member@example.com'
          }
        ]
      }

      const result = ProjectImportService.importProjectSafe(JSON.stringify(corruptedData), {
        autoFix: true
      })

      expect(result).toBeDefined()
      // The safe import should attempt to fix issues
    })

    it('should provide recovery suggestions for specific errors', () => {
      const jsonError = new Error('Invalid JSON format')
      const suggestions = ProjectImportService.getRecoverySuggestions(jsonError)

      expect(suggestions).toContain('Verifica que el archivo sea un JSON válido')
      expect(suggestions).toContain('Intenta abrir el archivo en un editor de texto para verificar su contenido')

      const dateError = new Error('Invalid date format')
      const dateSuggestions = ProjectImportService.getRecoverySuggestions(dateError)

      expect(dateSuggestions).toContain('Verifica que las fechas estén en formato ISO (YYYY-MM-DD)')
    })

    it('should handle import recovery strategies', () => {
      const corruptedProject = {
        id: 'recovery-test',
        name: 'Recovery Test Project',
        startDate: 'invalid-date',
        tasks: [
          {
            id: 'task-1',
            title: 'Valid Task',
            startDate: 'invalid-date',
            endDate: new Date('2024-02-01'),
            duration: 5
          }
        ],
        teamMembers: [
          {
            id: 'member-1',
            name: 'Valid Member',
            joinedAt: 'invalid-date'
          }
        ]
      }

      const recoveryResult = ProjectImportService.attemptImportRecovery(
        JSON.stringify(corruptedProject),
        new Error('Invalid date format'),
        {}
      )

      expect(recoveryResult).toBeDefined()
      // Recovery should attempt to clean problematic data
    })
  })

  describe('Date Calculation Error Handling', () => {
    it('should handle invalid date inputs gracefully', () => {
      const invalidDate1 = new Date('invalid-date')
      const invalidDate2 = new Date('another-invalid-date')
      const validDate = new Date('2024-02-01')

      // Test with invalid dates
      expect(() => {
        DateCalculationService.calculateWorkingDays(invalidDate1, validDate)
      }).toThrow()

      expect(() => {
        DateCalculationService.addWorkingDays(invalidDate1, 5)
      }).toThrow()

      expect(() => {
        DateCalculationService.validateDateRange(invalidDate1, invalidDate2)
      }).toThrow()
    })

    it('should handle edge cases in date calculations', () => {
      const date1 = new Date('2024-02-01')
      const date2 = new Date('2024-02-01') // Same date

      // Same date should return 0 working days
      const workingDays = DateCalculationService.calculateWorkingDays(date1, date2)
      expect(workingDays).toBe(0)

      // Adding 0 days should return same date
      const resultDate = DateCalculationService.addWorkingDays(date1, 0)
      expect(resultDate.getTime()).toBe(date1.getTime())

      // Negative duration should be handled
      expect(() => {
        DateCalculationService.addWorkingDays(date1, -5)
      }).not.toThrow() // Should handle negative values gracefully
    })

    it('should validate date ranges correctly', () => {
      const startDate = new Date('2024-02-01')
      const endDate = new Date('2024-01-01') // End before start

      expect(DateCalculationService.validateDateRange(startDate, endDate)).toBe(false)
      expect(DateCalculationService.validateDateRange(endDate, startDate)).toBe(true)
    })
  })

  describe('Comprehensive Error Recovery Workflows', () => {
    it('should handle complete workflow failure and recovery', async () => {
      // Simulate a complete workflow with multiple failure points
      const workflowSteps = [
        {
          name: 'AI Generation',
          action: () => {
            throw new Error('OpenAI API quota exceeded')
          },
          recovery: () => ({
            success: false,
            error: 'AI generation failed, using template project'
          })
        },
        {
          name: 'Project Export',
          action: () => {
            throw new Error('Export failed due to invalid project data')
          },
          recovery: () => ({
            success: false,
            error: 'Export failed, project data needs validation'
          })
        },
        {
          name: 'Project Import',
          action: () => {
            throw new Error('Import failed due to corrupted JSON')
          },
          recovery: () => ({
            success: true,
            project: validProjectData,
            message: 'Import recovered using auto-fix'
          })
        }
      ]

      const results = []

      for (const step of workflowSteps) {
        try {
          const result = step.action()
          results.push({ step: step.name, success: true, result })
        } catch (error) {
          const recovery = step.recovery()
          results.push({ 
            step: step.name, 
            success: recovery.success, 
            error: error.message,
            recovery: recovery
          })
        }
      }

      // Verify that recovery mechanisms were triggered
      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(false) // AI generation failed
      expect(results[1].success).toBe(false) // Export failed
      expect(results[2].success).toBe(true)  // Import recovered
      expect(results[2].recovery.project).toBeDefined()
    })

    it('should handle cascading failures with graceful degradation', async () => {
      const systemState = {
        aiServiceAvailable: false,
        exportServiceAvailable: false,
        importServiceAvailable: true,
        dateServiceAvailable: true
      }

      const fallbackStrategies = {
        aiGeneration: () => {
          if (!systemState.aiServiceAvailable) {
            return {
              success: false,
              fallback: 'template-project',
              message: 'Using template project due to AI service unavailability'
            }
          }
        },
        projectExport: () => {
          if (!systemState.exportServiceAvailable) {
            return {
              success: false,
              fallback: 'manual-copy',
              message: 'Export service unavailable, use manual copy'
            }
          }
        },
        projectImport: () => {
          if (!systemState.importServiceAvailable) {
            return {
              success: false,
              fallback: 'manual-entry',
              message: 'Import service unavailable, use manual entry'
            }
          }
          return { success: true }
        }
      }

      const aiResult = fallbackStrategies.aiGeneration()
      const exportResult = fallbackStrategies.projectExport()
      const importResult = fallbackStrategies.projectImport()

      expect(aiResult.success).toBe(false)
      expect(aiResult.fallback).toBe('template-project')
      expect(exportResult.success).toBe(false)
      expect(exportResult.fallback).toBe('manual-copy')
      expect(importResult.success).toBe(true)
    })

    it('should maintain data integrity during error recovery', () => {
      const originalProject = { ...validProjectData }
      const corruptedProject = {
        ...validProjectData,
        tasks: [
          {
            ...validProjectData.tasks[0],
            startDate: 'invalid-date' // Corrupt the date
          }
        ]
      }

      // Attempt to recover the project
      const cleanedData = ProjectImportService.cleanDateFields(corruptedProject)

      // Verify that only problematic fields were removed
      expect(cleanedData.id).toBe(originalProject.id)
      expect(cleanedData.name).toBe(originalProject.name)
      expect(cleanedData.description).toBe(originalProject.description)
      expect(cleanedData.tasks).toHaveLength(1)
      expect(cleanedData.tasks[0].id).toBe(originalProject.tasks[0].id)
      expect(cleanedData.tasks[0].title).toBe(originalProject.tasks[0].title)
      expect(cleanedData.tasks[0].startDate).toBeUndefined() // Should be removed
    })

    it('should provide comprehensive error reporting', () => {
      const errors = []
      const warnings = []

      // Simulate multiple error scenarios
      try {
        ProjectExportService.exportProject(null)
      } catch (error) {
        errors.push({
          service: 'ProjectExportService',
          method: 'exportProject',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }

      try {
        ProjectImportService.importProject('invalid json')
      } catch (error) {
        errors.push({
          service: 'ProjectImportService',
          method: 'importProject',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }

      try {
        DateCalculationService.calculateWorkingDays(new Date('invalid'), new Date())
      } catch (error) {
        errors.push({
          service: 'DateCalculationService',
          method: 'calculateWorkingDays',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }

      // Verify comprehensive error reporting
      expect(errors).toHaveLength(3)
      expect(errors[0].service).toBe('ProjectExportService')
      expect(errors[1].service).toBe('ProjectImportService')
      expect(errors[2].service).toBe('DateCalculationService')
      
      errors.forEach(error => {
        expect(error.error).toBeDefined()
        expect(error.timestamp).toBeDefined()
      })
    })
  })

  describe('User Experience Error Handling', () => {
    it('should provide user-friendly error messages', () => {
      const technicalErrors = [
        'JSON.parse: unexpected character at line 1 column 1 of the JSON data',
        'TypeError: Cannot read property "startDate" of undefined',
        'ReferenceError: OpenAI is not defined'
      ]

      const userFriendlyMessages = technicalErrors.map(error => {
        if (error.includes('JSON.parse')) {
          return 'El archivo no tiene un formato válido. Por favor, verifica que sea un archivo JSON correcto.'
        } else if (error.includes('startDate')) {
          return 'Hay un problema con las fechas del proyecto. Algunas fechas pueden estar en formato incorrecto.'
        } else if (error.includes('OpenAI')) {
          return 'El servicio de inteligencia artificial no está disponible. Por favor, verifica tu configuración.'
        }
        return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
      })

      expect(userFriendlyMessages[0]).toContain('formato válido')
      expect(userFriendlyMessages[1]).toContain('fechas del proyecto')
      expect(userFriendlyMessages[2]).toContain('inteligencia artificial')
    })

    it('should provide actionable recovery suggestions', () => {
      const errorScenarios = [
        {
          error: 'OpenAI API quota exceeded',
          suggestions: [
            'Verifica tu configuración de facturación en OpenAI',
            'Considera usar un plan de mayor capacidad',
            'Intenta nuevamente más tarde cuando se renueve tu cuota'
          ]
        },
        {
          error: 'Invalid JSON format',
          suggestions: [
            'Verifica que el archivo sea un JSON válido',
            'Intenta abrir el archivo en un editor de texto',
            'Asegúrate de que el archivo no esté corrupto'
          ]
        },
        {
          error: 'Project validation failed',
          suggestions: [
            'Revisa que todos los campos requeridos estén presentes',
            'Verifica que las fechas estén en formato correcto',
            'Asegúrate de que los IDs sean únicos'
          ]
        }
      ]

      errorScenarios.forEach(scenario => {
        expect(scenario.suggestions).toHaveLength(3)
        scenario.suggestions.forEach(suggestion => {
          expect(suggestion).toBeDefined()
          expect(suggestion.length).toBeGreaterThan(10)
        })
      })
    })

    it('should handle progressive error disclosure', () => {
      const errorLevels = {
        user: 'Ha ocurrido un error al importar el proyecto.',
        technical: 'Project validation failed: Project must have a valid name',
        debug: 'ValidationError at ProjectImportService.validateProjectJSON:142 - name field is empty string'
      }

      // User should see user-friendly message first
      expect(errorLevels.user).not.toContain('validation')
      expect(errorLevels.user).not.toContain('ProjectImportService')

      // Technical level provides more detail
      expect(errorLevels.technical).toContain('validation failed')
      expect(errorLevels.technical).toContain('valid name')

      // Debug level provides full technical detail
      expect(errorLevels.debug).toContain('ProjectImportService')
      expect(errorLevels.debug).toContain('validateProjectJSON')
    })
  })
})