import { describe, it, expect, beforeEach, vi } from 'vitest'
import calendarModule from '../../store/modules/calendar.js'

// Mock the storage service
vi.mock('../../services/storageService.js', () => ({
  storageService: {
    getAllTasks: vi.fn(() => []),
    saveTask: vi.fn(),
    getProject: vi.fn(),
    saveProject: vi.fn()
  }
}))

describe('Calendar Navigation', () => {
  let store
  let mockRootGetters

  beforeEach(() => {
    // Create a mock store with the calendar module
    store = {
      state: { ...calendarModule.state },
      commit: vi.fn((mutation, payload) => {
        // Apply mutations to state for testing
        if (calendarModule.mutations[mutation]) {
          calendarModule.mutations[mutation](store.state, payload)
        }
      }),
      dispatch: vi.fn(),
      getters: {}
    }

    // Mock root getters
    mockRootGetters = {
      'projects/currentProject': {
        id: 'project-1',
        name: 'Test Project'
      },
      'tasks/tasksByProject': vi.fn(() => [
        {
          id: 'task-1',
          title: 'Primera tarea',
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-20T00:00:00.000Z',
          projectId: 'project-1'
        },
        {
          id: 'task-2',
          title: 'Segunda tarea',
          startDate: '2024-01-10T00:00:00.000Z',
          endDate: '2024-01-12T00:00:00.000Z',
          projectId: 'project-1'
        },
        {
          id: 'task-3',
          title: 'Tercera tarea',
          startDate: '2024-01-25T00:00:00.000Z',
          endDate: '2024-01-30T00:00:00.000Z',
          projectId: 'project-1'
        }
      ]),
      'tasks/allTasks': vi.fn(() => [])
    }

    // Setup getters
    Object.keys(calendarModule.getters).forEach(key => {
      store.getters[key] = calendarModule.getters[key](store.state, store.getters, {}, mockRootGetters)
    })
  })

  describe('navigateToEarliestTask', () => {
    it('should navigate to the earliest task date when project has tasks', async () => {
      const context = {
        commit: store.commit,
        state: store.state,
        rootGetters: mockRootGetters
      }

      await calendarModule.actions.navigateToEarliestTask(context)

      // Should have committed SET_SELECTED_DATE with the earliest date (2024-01-10)
      expect(store.commit).toHaveBeenCalledWith('SET_SELECTED_DATE', new Date('2024-01-10T00:00:00.000Z'))
    })

    it('should not navigate when no current project', async () => {
      mockRootGetters['projects/currentProject'] = null
      
      const context = {
        commit: store.commit,
        state: store.state,
        rootGetters: mockRootGetters
      }

      await calendarModule.actions.navigateToEarliestTask(context)

      // Should not have committed SET_SELECTED_DATE
      expect(store.commit).not.toHaveBeenCalledWith('SET_SELECTED_DATE', expect.any(Date))
    })

    it('should not navigate when project has no tasks with valid dates', async () => {
      mockRootGetters['tasks/tasksByProject'] = vi.fn(() => [
        {
          id: 'task-1',
          title: 'Tarea sin fecha',
          projectId: 'project-1'
        }
      ])

      const context = {
        commit: store.commit,
        state: store.state,
        rootGetters: mockRootGetters
      }

      await calendarModule.actions.navigateToEarliestTask(context)

      // Should not have committed SET_SELECTED_DATE
      expect(store.commit).not.toHaveBeenCalledWith('SET_SELECTED_DATE', expect.any(Date))
    })
  })

  describe('getEarliestTaskDate getter', () => {
    it('should return the earliest task date for current project', () => {
      const earliestDate = store.getters.getEarliestTaskDate
      expect(earliestDate).toEqual(new Date('2024-01-10T00:00:00.000Z'))
    })

    it('should return null when no current project', () => {
      mockRootGetters['projects/currentProject'] = null
      
      // Recreate getter with updated mock
      const earliestDate = calendarModule.getters.getEarliestTaskDate(store.state, store.getters, {}, mockRootGetters)
      expect(earliestDate).toBeNull()
    })

    it('should return null when project has no tasks with valid dates', () => {
      mockRootGetters['tasks/tasksByProject'] = vi.fn(() => [])
      
      // Recreate getter with updated mock
      const earliestDate = calendarModule.getters.getEarliestTaskDate(store.state, store.getters, {}, mockRootGetters)
      expect(earliestDate).toBeNull()
    })
  })

  describe('onProjectChange action', () => {
    it('should call loadCalendarEventsAndNavigate when projectId is provided', async () => {
      const context = {
        dispatch: vi.fn()
      }

      await calendarModule.actions.onProjectChange(context, 'project-1')

      expect(context.dispatch).toHaveBeenCalledWith('loadCalendarEventsAndNavigate')
    })

    it('should call loadCalendarEvents when no projectId is provided', async () => {
      const context = {
        dispatch: vi.fn()
      }

      await calendarModule.actions.onProjectChange(context, null)

      expect(context.dispatch).toHaveBeenCalledWith('loadCalendarEvents')
    })
  })
})