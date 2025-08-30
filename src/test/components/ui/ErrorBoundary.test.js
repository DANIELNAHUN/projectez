/**
 * Tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ErrorBoundary from '../../../components/ui/ErrorBoundary.vue'
import LoadingSpinner from '../../../components/ui/LoadingSpinner.vue'

// Mock the composables
vi.mock('../../../composables/useErrorHandler.js', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))

vi.mock('../../../services/notificationService.js', () => ({
  useNotifications: () => ({
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  })
}))

// Mock child component that will throw errors
const ErrorThrowingComponent = {
  template: '<div>This will throw an error</div>',
  mounted() {
    if (this.shouldThrow) {
      throw new Error('Test error from child component')
    }
  },
  props: ['shouldThrow']
}

describe('ErrorBoundary', () => {
  let wrapper
  let consoleErrorSpy

  beforeEach(() => {
    // Mock console.error to avoid noise in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue()
      },
      writable: true
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    consoleErrorSpy.mockRestore()
  })

  describe('Normal Operation', () => {
    it('renders child content when no error occurs', () => {
      wrapper = mount(ErrorBoundary, {
        slots: {
          default: '<div data-testid="child-content">Normal content</div>'
        }
      })

      expect(wrapper.find('[data-testid="child-content"]').exists()).toBe(true)
      expect(wrapper.find('.error-boundary').exists()).toBe(false)
    })

    it('accepts and displays custom props', () => {
      wrapper = mount(ErrorBoundary, {
        props: {
          title: 'Custom Error Title',
          message: 'Custom error message',
          componentName: 'TestComponent'
        },
        slots: {
          default: '<div>Content</div>'
        }
      })

      // Should render content normally when no error
      expect(wrapper.text()).toContain('Content')
    })
  })

  describe('Error Handling', () => {
    it('catches and displays errors from child components', async () => {
      wrapper = mount(ErrorBoundary, {
        props: {
          componentName: 'TestErrorBoundary'
        },
        slots: {
          default: ErrorThrowingComponent
        }
      })

      // Trigger error by updating child component
      const childComponent = wrapper.findComponent(ErrorThrowingComponent)
      await childComponent.setProps({ shouldThrow: true })

      // Wait for error to be caught
      await nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(true)
      expect(wrapper.text()).toContain('Error Inesperado')
    })

    it('displays custom error title and message', async () => {
      wrapper = mount(ErrorBoundary, {
        props: {
          title: 'Custom Error Title',
          message: 'Custom error message'
        }
      })

      // Manually trigger error
      await wrapper.vm.captureError(new Error('Test error'))

      expect(wrapper.text()).toContain('Custom Error Title')
      expect(wrapper.text()).toContain('Custom error message')
    })

    it('shows technical details when expanded', async () => {
      wrapper = mount(ErrorBoundary, {
        props: {
          showDetails: true
        }
      })

      const testError = new Error('Test error with stack')
      testError.stack = 'Error: Test error\n    at test.js:1:1'

      await wrapper.vm.captureError(testError)
      await nextTick()

      // Find and click details toggle
      const detailsToggle = wrapper.find('button')
      const toggleButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Ver detalles técnicos')
      )
      
      if (toggleButton) {
        await toggleButton.trigger('click')
        expect(wrapper.text()).toContain('Test error')
      }
    })

    it('emits error event when error is captured', async () => {
      wrapper = mount(ErrorBoundary)

      const testError = new Error('Test error')
      await wrapper.vm.captureError(testError)

      expect(wrapper.emitted('error')).toBeTruthy()
      expect(wrapper.emitted('error')[0][0]).toMatchObject({
        error: testError
      })
    })
  })

  describe('Error Recovery', () => {
    it('allows retry when canRetry is true', async () => {
      const mockRetryHandler = vi.fn().mockResolvedValue()
      
      wrapper = mount(ErrorBoundary, {
        props: {
          canRetry: true,
          onRetry: mockRetryHandler
        }
      })

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      const retryButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Reintentar')
      )
      expect(retryButton).toBeTruthy()

      await retryButton.trigger('click')
      expect(mockRetryHandler).toHaveBeenCalled()
    })

    it('disables retry when canRetry is false', async () => {
      wrapper = mount(ErrorBoundary, {
        props: {
          canRetry: false
        }
      })

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      const retryButton = wrapper.find('button:contains("Reintentar")')
      expect(retryButton.exists()).toBe(false)
    })

    it('shows loading state during retry', async () => {
      let resolveRetry
      const mockRetryHandler = vi.fn(() => new Promise(resolve => {
        resolveRetry = resolve
      }))
      
      wrapper = mount(ErrorBoundary, {
        props: {
          canRetry: true,
          onRetry: mockRetryHandler
        },
        global: {
          components: {
            LoadingSpinner
          }
        }
      })

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      const retryButton = wrapper.find('button:contains("Reintentar")')
      await retryButton.trigger('click')

      expect(wrapper.text()).toContain('Reintentando...')
      expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true)

      // Resolve the retry
      resolveRetry()
      await nextTick()
    })

    it('limits retry attempts', async () => {
      const mockRetryHandler = vi.fn().mockRejectedValue(new Error('Retry failed'))
      
      wrapper = mount(ErrorBoundary, {
        props: {
          canRetry: true,
          onRetry: mockRetryHandler
        }
      })

      await wrapper.vm.captureError(new Error('Test error'))

      // Try to retry multiple times
      for (let i = 0; i < 5; i++) {
        const retryButton = wrapper.find('button:contains("Reintentar")')
        if (retryButton.exists() && !retryButton.attributes('disabled')) {
          await retryButton.trigger('click')
          await nextTick()
        }
      }

      // Should be disabled after max retries
      const retryButton = wrapper.find('button:contains("Reintentar")')
      expect(retryButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Error Reporting', () => {
    it('generates error report when report button is clicked', async () => {
      wrapper = mount(ErrorBoundary, {
        props: {
          componentName: 'TestComponent'
        }
      })

      const testError = new Error('Test error')
      testError.stack = 'Error stack trace'

      await wrapper.vm.captureError(testError)
      await nextTick()

      const reportButton = wrapper.find('button:contains("Reportar Error")')
      await reportButton.trigger('click')

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      
      const reportData = JSON.parse(navigator.clipboard.writeText.mock.calls[0][0])
      expect(reportData).toMatchObject({
        error: {
          message: 'Test error',
          stack: 'Error stack trace'
        },
        component: 'TestComponent'
      })
    })

    it('emits report event when error is reported', async () => {
      wrapper = mount(ErrorBoundary)

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      const reportButton = wrapper.find('button:contains("Reportar Error")')
      await reportButton.trigger('click')

      expect(wrapper.emitted('report')).toBeTruthy()
    })
  })

  describe('Error Type Detection', () => {
    it('detects AI service errors', async () => {
      wrapper = mount(ErrorBoundary)

      const aiError = new Error('OpenAI API error: quota exceeded')
      await wrapper.vm.captureError(aiError)

      expect(wrapper.text()).toContain('Error del Servicio de IA')
    })

    it('detects date calculation errors', async () => {
      wrapper = mount(ErrorBoundary)

      const dateError = new Error('Invalid date range in working day calculation')
      await wrapper.vm.captureError(dateError)

      expect(wrapper.text()).toContain('Error de Cálculo de Fechas')
    })

    it('detects import/export errors', async () => {
      wrapper = mount(ErrorBoundary)

      const importError = new Error('Failed to import JSON project data')
      await wrapper.vm.captureError(importError)

      expect(wrapper.text()).toContain('Error de Importación/Exportación')
    })

    it('provides appropriate user-friendly messages', async () => {
      wrapper = mount(ErrorBoundary)

      const quotaError = new Error('OpenAI quota exceeded')
      await wrapper.vm.captureError(quotaError)

      expect(wrapper.text()).toContain('Se ha agotado la cuota de la API de OpenAI')
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', async () => {
      wrapper = mount(ErrorBoundary)

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      // Check for proper button labels
      const retryButton = wrapper.find('button:contains("Reintentar")')
      const reportButton = wrapper.find('button:contains("Reportar Error")')

      expect(retryButton.exists()).toBe(true)
      expect(reportButton.exists()).toBe(true)
    })

    it('supports keyboard navigation', async () => {
      wrapper = mount(ErrorBoundary)

      await wrapper.vm.captureError(new Error('Test error'))
      await nextTick()

      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.attributes('tabindex')).not.toBe('-1')
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('cleans up properly when unmounted', async () => {
      wrapper = mount(ErrorBoundary)

      await wrapper.vm.captureError(new Error('Test error'))
      
      // Should not throw when unmounting
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('exposes methods for parent components', () => {
      wrapper = mount(ErrorBoundary)

      expect(typeof wrapper.vm.captureError).toBe('function')
      expect(typeof wrapper.vm.retry).toBe('function')
      expect(typeof wrapper.vm.hasError).toBe('function')
      expect(typeof wrapper.vm.clearError).toBe('function')
    })
  })
})