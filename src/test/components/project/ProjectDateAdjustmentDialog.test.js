import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import ProjectDateAdjustmentDialog from '../../../components/project/ProjectDateAdjustmentDialog.vue'

// Mock the services
vi.mock('../../../services/notificationService.js', () => ({
  useNotifications: () => ({
    operationSuccess: vi.fn(),
    operationError: vi.fn(),
    operationWarning: vi.fn()
  })
}))

vi.mock('../../../composables/useErrorHandler.js', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))

describe('ProjectDateAdjustmentDialog', () => {
  let store
  let wrapper
  let mockProject

  beforeEach(() => {
    // Create mock store
    store = createStore({
      modules: {
        projects: {
          namespaced: true,
          actions: {
            validateProjectDateAdjustment: vi.fn().mockResolvedValue({
              isValid: true,
              errors: [],
              warnings: [],
              daysDifference: 5,
              affectedTasks: 3
            }),
            adjustProjectDates: vi.fn().mockResolvedValue({
              success: true,
              project: { id: '1', name: 'Test Project' },
              adjustedTasks: 3
            })
          }
        }
      }
    })

    // Mock project data
    mockProject = {
      id: '1',
      name: 'Test Project',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      tasks: [
        {
          id: 'task1',
          title: 'Task 1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05')
        },
        {
          id: 'task2',
          title: 'Task 2',
          startDate: new Date('2024-01-06'),
          endDate: new Date('2024-01-10')
        }
      ]
    }
  })

  const createWrapper = (props = {}) => {
    return mount(ProjectDateAdjustmentDialog, {
      props: {
        visible: true,
        project: mockProject,
        ...props
      },
      global: {
        plugins: [store],
        stubs: {
          ResponsiveModal: {
            template: '<div><slot></slot><slot name="footer"></slot></div>',
            props: ['visible', 'title', 'subtitle', 'size', 'persistent'],
            emits: ['update:visible', 'close']
          },
          LoadingSpinner: { template: '<div>Loading...</div>' }
        }
      }
    })
  }

  it('renders correctly when visible', () => {
    wrapper = createWrapper()
    
    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Información Actual del Proyecto')
    expect(wrapper.text()).toContain('Nueva Fecha de Inicio')
  })

  it('displays current project information', () => {
    wrapper = createWrapper()
    
    expect(wrapper.text()).toContain('2 tareas')
    expect(wrapper.text()).toContain('31 de diciembre de 2023')
  })

  it('validates new start date and shows preview', async () => {
    wrapper = createWrapper()
    
    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2024-01-10')
    await dateInput.trigger('change')

    // Wait for validation
    await wrapper.vm.$nextTick()
    
    expect(store._modules.root._children.projects._rawModule.actions.validateProjectDateAdjustment).toHaveBeenCalledWith(
      expect.any(Object),
      {
        projectId: '1',
        newStartDate: new Date('2024-01-10')
      }
    )
  })

  it('shows validation errors when date is invalid', async () => {
    wrapper = createWrapper()
    
    // Mock validation failure after component is created
    const mockValidation = vi.fn().mockResolvedValueOnce({
      isValid: false,
      errors: ['Invalid date range'],
      warnings: []
    })
    wrapper.vm.$store.dispatch = mockValidation

    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2023-01-01')
    await dateInput.trigger('change')

    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.text-red-600').exists()).toBe(true)
  })

  it('shows impact preview when validation succeeds', async () => {
    wrapper = createWrapper()
    
    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2024-01-10')
    await dateInput.trigger('change')

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Vista Previa del Impacto')
    expect(wrapper.text()).toContain('5 días')
    expect(wrapper.text()).toContain('3 tareas serán ajustadas')
  })

  it('shows warnings in impact preview', async () => {
    wrapper = createWrapper()
    
    // Set impact preview with warnings directly
    wrapper.vm.impactPreview = {
      isValid: true,
      errors: [],
      warnings: ['New start date falls on a non-working day'],
      daysDifference: 5,
      affectedTasks: 3
    }
    wrapper.vm.validationError = ''
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.bg-yellow-50').exists()).toBe(true)
  })

  it('confirms date adjustment when button is clicked', async () => {
    wrapper = createWrapper()
    
    // Set valid date first
    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2024-01-10')
    await dateInput.trigger('change')
    await wrapper.vm.$nextTick()

    // Click confirm button
    const confirmButton = wrapper.find('button:last-child')
    await confirmButton.trigger('click')

    expect(store._modules.root._children.projects._rawModule.actions.adjustProjectDates).toHaveBeenCalledWith(
      expect.any(Object),
      {
        projectId: '1',
        newStartDate: new Date('2024-01-10')
      }
    )
  })

  it('emits confirmed event with adjustment data', async () => {
    wrapper = createWrapper()
    
    // Set valid date and confirm
    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2024-01-10')
    await dateInput.trigger('change')
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.find('button:last-child')
    await confirmButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirmed')).toBeTruthy()
    expect(wrapper.emitted('confirmed')[0][0]).toEqual({
      project: { id: '1', name: 'Test Project' },
      adjustedTasks: 3,
      originalStartDate: mockProject.startDate,
      newStartDate: new Date('2024-01-10')
    })
  })

  it('cancels and resets form when cancelled', async () => {
    wrapper = createWrapper()
    
    // Set some data
    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2024-01-10')
    
    // Click cancel button
    const cancelButton = wrapper.find('button:first-child')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('cancelled')).toBeTruthy()
    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')[0][0]).toBe(false)
  })

  it('disables confirm button when validation fails', async () => {
    wrapper = createWrapper()
    
    // Set validation error directly
    wrapper.vm.validationError = 'Invalid date'
    wrapper.vm.impactPreview = null
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.find('button:last-child')
    expect(confirmButton.attributes('disabled')).toBeDefined()
  })

  it('shows loading state during processing', async () => {
    // Mock slow adjustment
    store._modules.root._children.projects._rawModule.actions.adjustProjectDates.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    wrapper = createWrapper()
    
    // Set valid date and confirm
    const dateInput = wrapper.find('input[type="date"]')
    await dateInput.setValue('2024-01-10')
    await dateInput.trigger('change')
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.find('button:last-child')
    await confirmButton.trigger('click')

    expect(wrapper.text()).toContain('Ajustando fechas...')
    expect(confirmButton.attributes('disabled')).toBeDefined()
  })

  it('prevents closing during processing', async () => {
    wrapper = createWrapper()
    
    // Set processing state directly
    wrapper.vm.isProcessing = true
    await wrapper.vm.$nextTick()

    const cancelButton = wrapper.find('button:first-child')
    expect(cancelButton.attributes('disabled')).toBeDefined()
  })
})