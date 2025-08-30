import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import ProjectDateAdjustmentUndo from '../../../components/project/ProjectDateAdjustmentUndo.vue'

// Mock the services
vi.mock('../../../services/notificationService.js', () => ({
  useNotifications: () => ({
    operationSuccess: vi.fn(),
    operationError: vi.fn()
  })
}))

vi.mock('../../../composables/useErrorHandler.js', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))

describe('ProjectDateAdjustmentUndo', () => {
  let store
  let wrapper
  let mockUndoData

  beforeEach(() => {
    // Mock timers
    vi.useFakeTimers()

    // Create mock store
    store = createStore({
      modules: {
        projects: {
          namespaced: true,
          actions: {
            adjustProjectDates: vi.fn().mockResolvedValue({
              success: true,
              project: { id: '1', name: 'Test Project' },
              adjustedTasks: 3
            })
          }
        }
      }
    })

    // Mock undo data
    mockUndoData = {
      project: { id: '1', name: 'Test Project' },
      adjustedTasks: 3,
      originalStartDate: new Date('2024-01-01'),
      newStartDate: new Date('2024-01-10')
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createWrapper = (props = {}) => {
    return mount(ProjectDateAdjustmentUndo, {
      props: {
        visible: true,
        undoData: mockUndoData,
        autoDismissTime: 5000,
        ...props
      },
      global: {
        plugins: [store],
        stubs: {
          LoadingSpinner: { template: '<div>Loading...</div>' }
        }
      }
    })
  }

  it('renders correctly when visible', () => {
    wrapper = createWrapper()
    
    expect(wrapper.text()).toContain('Fechas ajustadas correctamente')
    expect(wrapper.text()).toContain('3 tareas fueron actualizadas')
    expect(wrapper.find('button').text()).toContain('Deshacer')
  })

  it('does not render when not visible', () => {
    wrapper = createWrapper({ visible: false })
    
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('displays correct number of adjusted tasks', () => {
    const customUndoData = {
      ...mockUndoData,
      adjustedTasks: 5
    }
    
    wrapper = createWrapper({ undoData: customUndoData })
    
    expect(wrapper.text()).toContain('5 tareas fueron actualizadas')
  })

  it('handles undo action correctly', async () => {
    wrapper = createWrapper()
    
    const undoButton = wrapper.find('button')
    await undoButton.trigger('click')

    expect(store._modules.root._children.projects._rawModule.actions.adjustProjectDates).toHaveBeenCalledWith(
      expect.any(Object),
      {
        projectId: '1',
        newStartDate: new Date('2024-01-01') // Original start date
      }
    )
  })

  it('emits undo event when undo is successful', async () => {
    wrapper = createWrapper()
    
    const undoButton = wrapper.find('button')
    await undoButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('undo')).toBeTruthy()
    expect(wrapper.emitted('undo')[0][0]).toEqual(mockUndoData)
  })

  it('shows loading state during undo', async () => {
    // Mock slow undo
    store._modules.root._children.projects._rawModule.actions.adjustProjectDates.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    wrapper = createWrapper()
    
    const undoButton = wrapper.find('button')
    await undoButton.trigger('click')

    expect(wrapper.text()).toContain('Deshaciendo...')
    expect(undoButton.attributes('disabled')).toBeDefined()
  })

  it('dismisses when close button is clicked', async () => {
    wrapper = createWrapper()
    
    const closeButton = wrapper.find('button:last-child')
    await closeButton.trigger('click')

    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('dismisses when X button is clicked', async () => {
    wrapper = createWrapper()
    
    const xButton = wrapper.find('.pi-times').element.parentElement
    await xButton.click()

    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('auto-dismisses after specified time', async () => {
    wrapper = createWrapper({ autoDismissTime: 1000 })
    
    // Fast-forward time
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('shows progress bar during auto-dismiss countdown', async () => {
    wrapper = createWrapper({ autoDismissTime: 1000 })
    
    // Check initial progress
    expect(wrapper.find('.bg-blue-500').exists()).toBe(true)
    
    // Fast-forward half the time
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    
    // Progress should be around 50%
    const progressBar = wrapper.find('.bg-blue-500')
    const width = progressBar.element.style.width
    expect(parseInt(width)).toBeLessThan(100)
    expect(parseInt(width)).toBeGreaterThan(0)
  })

  it('clears timers when component is unmounted', () => {
    wrapper = createWrapper()
    
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    
    wrapper.unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('does not auto-dismiss when autoDismissTime is 0', async () => {
    wrapper = createWrapper({ autoDismissTime: 0 })
    
    // Fast-forward time
    vi.advanceTimersByTime(10000)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('dismiss')).toBeFalsy()
  })

  it('stops auto-dismiss when undo is clicked', async () => {
    wrapper = createWrapper({ autoDismissTime: 1000 })
    
    const undoButton = wrapper.find('button')
    await undoButton.trigger('click')
    
    // Fast-forward past auto-dismiss time
    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()

    // Should not auto-dismiss because undo was clicked
    expect(wrapper.emitted('dismiss')).toBeFalsy()
  })

  it('handles undo error gracefully', async () => {
    // Mock undo failure
    store._modules.root._children.projects._rawModule.actions.adjustProjectDates.mockRejectedValueOnce(
      new Error('Undo failed')
    )

    wrapper = createWrapper()
    
    const undoButton = wrapper.find('button')
    await undoButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Should not emit undo event on error
    expect(wrapper.emitted('undo')).toBeFalsy()
    
    // Should still be visible (not dismissed)
    expect(wrapper.emitted('dismiss')).toBeFalsy()
  })

  it('prevents multiple undo clicks', async () => {
    wrapper = createWrapper()
    
    const undoButton = wrapper.find('button')
    
    // Click multiple times quickly
    await undoButton.trigger('click')
    await undoButton.trigger('click')
    await undoButton.trigger('click')

    // Should only call the action once
    expect(store._modules.root._children.projects._rawModule.actions.adjustProjectDates).toHaveBeenCalledTimes(1)
  })
})