import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import ProjectDetail from '../../views/ProjectDetail.vue'

// Mock the router
const mockRouter = {
  go: vi.fn(),
  push: vi.fn()
}

// Mock the route
const mockRoute = {
  params: { id: 'test-project-1' }
}

// Mock the services
vi.mock('../../services/notificationService.js', () => ({
  useNotifications: () => ({
    operationSuccess: vi.fn(),
    operationError: vi.fn(),
    operationWarning: vi.fn()
  })
}))

vi.mock('../../composables/useErrorHandler.js', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))

vi.mock('../../services/dateCalculationService.js', () => ({
  DateCalculationService: {
    calculateWorkingDays: vi.fn((start, end) => {
      const diffTime = Math.abs(end - start)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }),
    addWorkingDays: vi.fn((date, days) => {
      const result = new Date(date)
      result.setDate(result.getDate() + days)
      return result
    }),
    subtractWorkingDays: vi.fn((date, days) => {
      const result = new Date(date)
      result.setDate(result.getDate() - days)
      return result
    }),
    isWorkingDay: vi.fn(() => true),
    validateDateRange: vi.fn(() => true)
  }
}))

describe('Project Date Adjustment Integration', () => {
  let store
  let wrapper
  let mockProject

  beforeEach(() => {
    // Mock project data
    mockProject = {
      id: 'test-project-1',
      name: 'Test Project',
      description: 'A test project for date adjustment',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      status: 'active',
      createdAt: new Date('2023-12-01'),
      tasks: [
        {
          id: 'task1',
          title: 'Task 1',
          description: 'First task',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          duration: 5,
          status: 'active'
        },
        {
          id: 'task2',
          title: 'Task 2',
          description: 'Second task',
          startDate: new Date('2024-01-06'),
          endDate: new Date('2024-01-10'),
          duration: 5,
          status: 'completed'
        },
        {
          id: 'task3',
          title: 'Task 3',
          description: 'Third task',
          startDate: new Date('2024-01-11'),
          endDate: new Date('2024-01-15'),
          duration: 5,
          status: 'active'
        }
      ]
    }

    // Create mock store
    store = createStore({
      modules: {
        projects: {
          namespaced: true,
          state: {
            currentProject: mockProject,
            loading: false,
            error: null
          },
          getters: {
            currentProject: state => state.currentProject,
            isLoading: state => state.loading,
            error: state => state.error
          },
          actions: {
            setCurrentProject: vi.fn().mockResolvedValue(mockProject),
            validateProjectDateAdjustment: vi.fn().mockResolvedValue({
              isValid: true,
              errors: [],
              warnings: [],
              daysDifference: 7,
              affectedTasks: 3
            }),
            adjustProjectDates: vi.fn().mockResolvedValue({
              success: true,
              project: {
                ...mockProject,
                startDate: new Date('2024-01-08'),
                tasks: mockProject.tasks.map(task => ({
                  ...task,
                  startDate: new Date(task.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                  endDate: new Date(task.endDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                }))
              },
              adjustedTasks: 3
            })
          }
        }
      }
    })
  })

  const createWrapper = () => {
    return mount(ProjectDetail, {
      global: {
        plugins: [store],
        mocks: {
          $router: mockRouter,
          $route: mockRoute
        },
        stubs: {
          TeamManager: { template: '<div>Team Manager</div>' },
          TaskManager: { template: '<div>Task Manager</div>' },
          ResponsiveModal: {
            template: '<div v-if="visible"><slot></slot><slot name="footer"></slot></div>',
            props: ['visible', 'title', 'subtitle', 'size', 'persistent'],
            emits: ['update:visible', 'close']
          },
          LoadingSpinner: { template: '<div>Loading...</div>' }
        }
      }
    })
  }

  it('displays project information correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Test Project')
    expect(wrapper.text()).toContain('A test project for date adjustment')
    expect(wrapper.text()).toContain('1 de enero de 2024')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('Tareas Totales')
  })

  it('shows adjust dates button in project overview', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const adjustButton = wrapper.find('button[title="Ajustar fechas del proyecto"]')
    expect(adjustButton.exists()).toBe(true)
    expect(adjustButton.text()).toContain('Ajustar Fechas')
  })

  it('opens date adjustment dialog when button is clicked', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const adjustButton = wrapper.find('button[title="Ajustar fechas del proyecto"]')
    await adjustButton.trigger('click')

    expect(wrapper.vm.showDateAdjustmentDialog).toBe(true)
  })

  it('shows pencil icon next to start date for quick access', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const pencilButton = wrapper.find('button[title="Ajustar fecha de inicio"]')
    expect(pencilButton.exists()).toBe(true)
    expect(pencilButton.find('.pi-pencil').exists()).toBe(true)
  })

  it('opens date adjustment dialog when pencil icon is clicked', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const pencilButton = wrapper.find('button[title="Ajustar fecha de inicio"]')
    await pencilButton.trigger('click')

    expect(wrapper.vm.showDateAdjustmentDialog).toBe(true)
  })

  it('displays task statistics correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('3') // Total tasks
    expect(wrapper.text()).toContain('1') // Completed tasks
    expect(wrapper.text()).toContain('2') // Pending tasks
  })

  it('handles date adjustment confirmation correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const adjustmentData = {
      project: {
        ...mockProject,
        startDate: new Date('2024-01-08')
      },
      adjustedTasks: 3,
      originalStartDate: new Date('2024-01-01'),
      newStartDate: new Date('2024-01-08')
    }

    // Simulate date adjustment confirmation
    await wrapper.vm.handleDateAdjustmentConfirmed(adjustmentData)

    expect(wrapper.vm.undoData).toEqual(adjustmentData)
    expect(wrapper.vm.showUndoToast).toBe(true)
    expect(wrapper.vm.showDateAdjustmentDialog).toBe(false)
  })

  it('handles date adjustment cancellation correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    // Open dialog first
    wrapper.vm.showDateAdjustmentDialog = true
    await wrapper.vm.$nextTick()

    // Cancel
    await wrapper.vm.handleDateAdjustmentCancelled()

    expect(wrapper.vm.showDateAdjustmentDialog).toBe(false)
  })

  it('handles undo correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const undoData = {
      project: mockProject,
      adjustedTasks: 3,
      originalStartDate: new Date('2024-01-01'),
      newStartDate: new Date('2024-01-08')
    }

    // Set up undo state
    wrapper.vm.undoData = undoData
    wrapper.vm.showUndoToast = true
    await wrapper.vm.$nextTick()

    // Perform undo
    await wrapper.vm.handleUndo(undoData)

    expect(wrapper.vm.showUndoToast).toBe(false)
    expect(wrapper.vm.undoData).toBe(null)
    expect(store._modules.root._children.projects._rawModule.actions.setCurrentProject).toHaveBeenCalledWith(
      expect.any(Object),
      'test-project-1'
    )
  })

  it('complete workflow: adjust dates and undo', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    // Step 1: Open date adjustment dialog
    const adjustButton = wrapper.find('button[title="Ajustar fechas del proyecto"]')
    await adjustButton.trigger('click')
    expect(wrapper.vm.showDateAdjustmentDialog).toBe(true)

    // Step 2: Simulate date adjustment confirmation
    const adjustmentData = {
      project: {
        ...mockProject,
        startDate: new Date('2024-01-08')
      },
      adjustedTasks: 3,
      originalStartDate: new Date('2024-01-01'),
      newStartDate: new Date('2024-01-08')
    }

    await wrapper.vm.handleDateAdjustmentConfirmed(adjustmentData)

    // Verify adjustment state
    expect(wrapper.vm.showDateAdjustmentDialog).toBe(false)
    expect(wrapper.vm.showUndoToast).toBe(true)
    expect(wrapper.vm.undoData).toEqual(adjustmentData)

    // Step 3: Perform undo
    await wrapper.vm.handleUndo(adjustmentData)

    // Verify undo state
    expect(wrapper.vm.showUndoToast).toBe(false)
    expect(wrapper.vm.undoData).toBe(null)

    // Verify store actions were called
    expect(store._modules.root._children.projects._rawModule.actions.setCurrentProject).toHaveBeenCalledTimes(2)
  })

  it('disables adjust dates button when project is loading', async () => {
    // Set loading state
    store.state.projects.loading = true
    store.state.projects.currentProject = null

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const adjustButton = wrapper.find('button[title="Ajustar fechas del proyecto"]')
    expect(adjustButton.attributes('disabled')).toBeDefined()
  })

  it('disables adjust dates button when no current project', async () => {
    // Set no current project
    store.state.projects.currentProject = null

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const adjustButton = wrapper.find('button[title="Ajustar fechas del proyecto"]')
    expect(adjustButton.attributes('disabled')).toBeDefined()
  })

  it('shows project not found when project does not exist', async () => {
    // Set no current project and no loading
    store.state.projects.currentProject = null
    store.state.projects.loading = false

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Proyecto no encontrado')
    expect(wrapper.text()).toContain('El proyecto que buscas no existe o ha sido eliminado')
  })

  it('shows error state when there is an error', async () => {
    // Set error state
    store.state.projects.error = 'Failed to load project'
    store.state.projects.loading = false

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Failed to load project')
    expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true)
  })

  it('refreshes project data after date adjustment', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const adjustmentData = {
      project: mockProject,
      adjustedTasks: 3,
      originalStartDate: new Date('2024-01-01'),
      newStartDate: new Date('2024-01-08')
    }

    await wrapper.vm.handleDateAdjustmentConfirmed(adjustmentData)

    // Should call setCurrentProject to refresh data
    expect(store._modules.root._children.projects._rawModule.actions.setCurrentProject).toHaveBeenCalledWith(
      expect.any(Object),
      'test-project-1'
    )
  })
})