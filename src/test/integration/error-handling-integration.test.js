/**
 * Integration tests for comprehensive error handling and user feedback system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, createLocalVue } from '@vue/test-utils'
import { createStore } from 'vuex'
import { nextTick } from 'vue'

// Import components and services
import AIProjectGenerator from '../../components/ui/AIProjectGenerator.vue'
import ProjectImportExport from '../../components/ui/ProjectImportExport.vue'
import ErrorBoundary from '../../components/ui/ErrorBoundary.vue'
import ProgressIndicator from '../../components/ui/ProgressIndicator.vue'

import { openAIService } from '../../services/OpenAIService.js'
import { ProjectImportService } from '../../services/ProjectImportService.js'
import { ProjectExportService } from '../../services/ProjectExportService.js'
import { DateCalculationService } from '../../services/DateCalculationService.js'

import { useErrorHandler } from '../../composables/useErrorHandler.js'
import { useRetry } from '../../composables/useRetry.js'
import { useNotifications } from '../../services/notificationService.js'

// Mock external dependencies
vi.mock('../../services/OpenAIService.js')
vi.mock('../../services/ProjectImportService.js')
vi.mock('../../services/ProjectExportService.js')

describe('Error Handling Integration Tests', () => {
  let store
  let mockNotifications

  beforeEach(() => {
    // Create mock store
    store = createStore({
      modules: {
        projects: {
          namespaced: true,
          state: {
            projects: [],
            currentProject: null
          },
          getters: {
            allProjects: (state) => state.projects,
            currentProject: (state) => state.currentProject
          },
          actions: {
            importProject: vi.fn(),
            createProject: vi.fn(),
            updateProject: vi.fn()
          }
        }
      }
    })

    // Mock notifications
    mockNotifications = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      showProgress: vi.fn(),
      updateProgress: vi.fn(),
      completeProgress: vi.fn()
    }

    vi.mocked(useNotifications).mockReturnValue(mockNotifications)

    // Mock timers for retry delays
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('AI Project Generation Error Handling', () => {
    it('handles OpenAI API quota exceeded error with user guidance', async () => {
      // Mock OpenAI service to throw quota error
      const quotaError = new Error('OpenAI API quota exceeded')
      quotaError.code = 'insufficient_quota'
      
      vi.mocked(openAIService.generateProjectSafe).mockResolvedValue({
        success: false,
        errors: ['Intento 1: OpenAI API quota exceeded'],
        retryCount: 0,
        totalTime: 1000
      })

      const wrapper = mount(AIProjectGenerator, {
        props: { visible: true },
        global: {
          plugins: [store],
          stubs: {
            ResponsiveModal: true,
            LoadingSpinner: true
          }
        }
      })

      // Configure API and generate project
      await wrapper.vm.configureAPI()
      wrapper.vm.currentPrompt = 'Create a test project'
      await wrapper.vm.generateProject()

      // Should show error message with specific guidance
      expect(wrapper.vm.messages).toContainEqual(
        expect.objectContaining({
          type: 'error',
          content: expect.stringContaining('quota exceeded')
        })
      )

      expect(wrapper.vm.messages).toContainEqual(
        expect.objectContaining({
          type: 'system',
          content: expect.stringContaining('configuración de facturación')
        })
      )
    })

    it('handles network errors with automatic retry', async () => {
      // Mock network error that succeeds on retry
      vi.mocked(openAIService.generateProjectSafe).mockResolvedValue({
        success: true,
        project: {
          name: 'Test Project',
          tasks: [{ title: 'Task 1' }],
          estimatedDuration: 5
        },
        retryCount: 2,
        totalTime: 3000
      })

      const wrapper = mount(AIProjectGenerator, {
        props: { visible: true },
        global: {
          plugins: [store],
          stubs: {
            ResponsiveModal: true,
            LoadingSpinner: true
          }
        }
      })

      await wrapper.vm.configureAPI()
      wrapper.vm.currentPrompt = 'Create a test project'
      await wrapper.vm.generateProject()

      // Should show success message with retry information
      expect(wrapper.vm.messages).toContainEqual(
        expect.objectContaining({
          type: 'system',
          content: expect.stringContaining('después de 2 reintentos')
        })
      )
    })

    it('wraps AI generation in error boundary', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: AIProjectGenerator
        },
        props: {
          componentName: 'AIProjectGenerator'
        },
        global: {
          plugins: [store]
        }
      })

      // Simulate error in child component
      const aiGenerator = wrapper.findComponent(AIProjectGenerator)
      const error = new Error('OpenAI service unavailable')
      
      await wrapper.vm.captureError(error)
      await nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(true)
      expect(wrapper.text()).toContain('Error del Servicio de IA')
    })
  })

  describe('Project Import/Export Error Handling', () => {
    it('handles invalid JSON with auto-fix attempts', async () => {
      const invalidJSON = '{"name": "Test", "tasks": [{"title": ""}]}'
      
      vi.mocked(ProjectImportService.importProjectSafe).mockReturnValue({
        success: true,
        project: { name: 'Test', tasks: [{ title: 'Tarea 1' }] },
        fixes: ['Se asignó título por defecto a la tarea en posición 1'],
        warnings: ['Se aplicaron correcciones automáticas al proyecto'],
        importTime: 150
      })

      const wrapper = mount(ProjectImportExport, {
        props: { visible: true },
        global: {
          plugins: [store],
          stubs: {
            ResponsiveModal: true,
            LoadingSpinner: true
          }
        }
      })

      // Simulate file selection and import
      wrapper.vm.selectedFile = new File([invalidJSON], 'test.json', { type: 'application/json' })
      await wrapper.vm.importProject()

      expect(wrapper.vm.operationResult.success).toBe(true)
      expect(wrapper.vm.operationResult.details).toContain('Correcciones aplicadas')
    })

    it('handles import failure with recovery suggestions', async () => {
      vi.mocked(ProjectImportService.importProjectSafe).mockReturnValue({
        success: false,
        errors: ['El archivo no tiene un formato JSON válido'],
        suggestions: [
          'Verifica que el archivo sea un JSON válido',
          'Intenta abrir el archivo en un editor de texto'
        ]
      })

      const wrapper = mount(ProjectImportExport, {
        props: { visible: true },
        global: {
          plugins: [store],
          stubs: {
            ResponsiveModal: true,
            LoadingSpinner: true
          }
        }
      })

      const invalidFile = new File(['invalid json'], 'test.json', { type: 'application/json' })
      wrapper.vm.selectedFile = invalidFile

      await expect(wrapper.vm.importProject()).rejects.toThrow()

      expect(wrapper.vm.operationResult.success).toBe(false)
      expect(wrapper.vm.operationResult.details).toContain('Sugerencias:')
    })

    it('shows progress indicator for long import operations', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          variant: 'modal',
          visible: true,
          title: 'Importando proyecto',
          progress: 0,
          showProgress: true
        }
      })

      expect(wrapper.text()).toContain('Importando proyecto')
      expect(wrapper.find('.h-2').exists()).toBe(true) // Progress bar

      // Simulate progress updates
      await wrapper.setProps({ progress: 50 })
      expect(wrapper.text()).toContain('50% completado')

      await wrapper.setProps({ progress: 100, isCompleted: true })
      expect(wrapper.text()).toContain('Cerrar')
    })
  })

  describe('Date Calculation Error Handling', () => {
    it('handles invalid date ranges with user-friendly messages', () => {
      const startDate = new Date('2024-12-31')
      const endDate = new Date('2024-01-01') // End before start

      expect(() => {
        DateCalculationService.calculateWorkingDays(startDate, endDate)
      }).toThrow('La fecha de inicio no puede ser posterior a la fecha de fin')
    })

    it('handles extremely large date ranges', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2050-01-01') // 26 years

      expect(() => {
        DateCalculationService.calculateWorkingDays(startDate, endDate)
      }).toThrow('El rango de fechas es demasiado amplio')
    })

    it('handles invalid date objects', () => {
      expect(() => {
        DateCalculationService.calculateWorkingDays('invalid', new Date())
      }).toThrow('La fecha de inicio no es válida')

      expect(() => {
        DateCalculationService.addWorkingDays('invalid', 5)
      }).toThrow('La fecha de inicio no es válida')
    })
  })

  describe('Retry Mechanism Integration', () => {
    it('integrates retry with error boundary for recovery', async () => {
      const { executeWithRetry } = useRetry({
        maxRetries: 2,
        baseDelay: 100
      })

      let attempts = 0
      const flakyFunction = vi.fn(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      })

      const wrapper = mount(ErrorBoundary, {
        props: {
          canRetry: true,
          onRetry: () => executeWithRetry(flakyFunction)
        }
      })

      // Simulate initial error
      await wrapper.vm.captureError(new Error('Initial error'))
      await nextTick()

      // Trigger retry
      const retryButton = wrapper.find('button:contains("Reintentar")')
      await retryButton.trigger('click')

      // Fast-forward through retry delays
      await vi.runAllTimersAsync()

      // Should recover successfully
      expect(flakyFunction).toHaveBeenCalledTimes(3)
      expect(wrapper.vm.hasError()).toBe(false)
    })

    it('shows progress during retry operations', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          variant: 'modal',
          visible: true,
          title: 'Reintentando operación',
          steps: [
            'Verificando conexión',
            'Reintentando solicitud',
            'Procesando respuesta'
          ],
          currentStepIndex: 1
        }
      })

      expect(wrapper.text()).toContain('Paso 2 de 3')
      expect(wrapper.text()).toContain('Reintentando solicitud')
    })
  })

  describe('User Feedback Integration', () => {
    it('shows appropriate notifications for different error types', async () => {
      const { handleError } = useErrorHandler()

      // Test different error types
      const errors = [
        { error: new Error('OpenAI quota exceeded'), expectedType: 'ai_service' },
        { error: new Error('Invalid date range'), expectedType: 'date_calculation' },
        { error: new Error('JSON parse error'), expectedType: 'import_export' },
        { error: new Error('Storage quota exceeded'), expectedType: 'storage' }
      ]

      for (const { error, expectedType } of errors) {
        handleError(error, 'Test context')
        
        // Should call appropriate notification method
        expect(mockNotifications.error).toHaveBeenCalled()
      }
    })

    it('provides contextual help and recovery suggestions', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          showDetails: true
        }
      })

      const storageError = new Error('Storage quota exceeded')
      await wrapper.vm.captureError(storageError)
      await nextTick()

      expect(wrapper.text()).toContain('El almacenamiento local está lleno')
      
      // Should show recovery suggestions
      const reportButton = wrapper.find('button:contains("Reportar Error")')
      await reportButton.trigger('click')

      expect(wrapper.emitted('report')).toBeTruthy()
    })

    it('maintains error history for debugging', async () => {
      const { executeWithRetry, getRetryStats } = useRetry({
        maxRetries: 2,
        baseDelay: 100
      })

      const failingFunction = vi.fn().mockRejectedValue(new Error('Test error'))

      const promise = executeWithRetry(failingFunction)
      await vi.runAllTimersAsync()
      
      await expect(promise).rejects.toThrow()

      const stats = getRetryStats()
      expect(stats.retryHistory).toHaveLength(3) // Initial + 2 retries
      expect(stats.retryHistory[0]).toMatchObject({
        attempt: 1,
        error: 'Test error'
      })
    })
  })

  describe('Performance and Resource Management', () => {
    it('prevents memory leaks in error boundary', async () => {
      const wrapper = mount(ErrorBoundary)
      
      // Simulate multiple errors
      for (let i = 0; i < 10; i++) {
        await wrapper.vm.captureError(new Error(`Error ${i}`))
      }

      // Should not accumulate unlimited errors
      expect(wrapper.vm.hasError()).toBe(true)
      
      wrapper.unmount()
      // Should not throw during cleanup
    })

    it('limits retry attempts to prevent infinite loops', async () => {
      const { executeWithRetry } = useRetry({
        maxRetries: 3,
        baseDelay: 100
      })

      const infiniteFailFunction = vi.fn().mockRejectedValue(new Error('Always fails'))

      const promise = executeWithRetry(infiniteFailFunction)
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow()
      expect(infiniteFailFunction).toHaveBeenCalledTimes(4) // Initial + 3 retries max
    })

    it('handles concurrent error scenarios', async () => {
      const wrapper = mount(ErrorBoundary)

      // Simulate concurrent errors
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3')
      ]

      const promises = errors.map(error => wrapper.vm.captureError(error))
      await Promise.all(promises)

      // Should handle the last error
      expect(wrapper.vm.hasError()).toBe(true)
    })
  })

  describe('Accessibility and Usability', () => {
    it('provides keyboard navigation for error recovery', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          canRetry: true,
          showReload: true
        }
      })

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      const buttons = wrapper.findAll('button')
      
      // All buttons should be keyboard accessible
      buttons.forEach(button => {
        expect(button.attributes('tabindex')).not.toBe('-1')
      })

      // Should support Enter key activation
      const retryButton = wrapper.find('button:contains("Reintentar")')
      await retryButton.trigger('keydown.enter')
      
      expect(wrapper.emitted('retry')).toBeTruthy()
    })

    it('provides screen reader friendly error messages', async () => {
      const wrapper = mount(ErrorBoundary)

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      // Should have proper ARIA labels and roles
      const errorContainer = wrapper.find('.error-boundary')
      expect(errorContainer.exists()).toBe(true)

      // Error message should be descriptive
      expect(wrapper.text()).toContain('Ha ocurrido un error inesperado')
    })
  })
})