const state = {
  currentView: 'month', // 'day', 'week', 'month'
  selectedDate: new Date(),
  events: [], // Calendar events derived from tasks
  draggedTask: null,
  isLoading: false,
  error: null
}

const mutations = {
  SET_LOADING(state, loading) {
    state.isLoading = loading
  },
  
  SET_ERROR(state, error) {
    state.error = error
  },
  
  SET_CURRENT_VIEW(state, view) {
    state.currentView = view
  },
  
  SET_SELECTED_DATE(state, date) {
    state.selectedDate = date instanceof Date ? date : new Date(date)
  },
  
  SET_EVENTS(state, events) {
    state.events = events
  },
  
  SET_DRAGGED_TASK(state, task) {
    state.draggedTask = task
  },
  
  UPDATE_EVENT(state, updatedEvent) {
    const index = state.events.findIndex(e => e.id === updatedEvent.id)
    if (index !== -1) {
      state.events.splice(index, 1, updatedEvent)
    }
  }
}

const actions = {
  setCurrentView({ commit }, view) {
    if (['day', 'week', 'month'].includes(view)) {
      commit('SET_CURRENT_VIEW', view)
    }
  },
  
  setSelectedDate({ commit }, date) {
    commit('SET_SELECTED_DATE', date)
  },
  
  async loadCalendarEvents({ commit, rootGetters }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // Get current project
      const currentProject = rootGetters['projects/currentProject']
      
      // Get tasks for the current project, or all tasks if no project is selected
      let allTasks = []
      if (currentProject) {
        // Get tasks for the specific project
        allTasks = rootGetters['tasks/tasksByProject'](currentProject.id) || []
      } else {
        // Get all tasks if no project is selected
        allTasks = rootGetters['tasks/allTasks'] || []
      }
      
      // Convert tasks to calendar events
      const events = allTasks.map(task => ({
        id: task.id,
        title: task.title,
        start: task.startDate,
        end: task.endDate,
        status: task.status,
        priority: task.priority,
        type: task.type,
        assignedTo: task.assignedTo,
        progress: task.progress,
        projectId: task.projectId,
        description: task.description,
        deliverable: task.deliverable,
        allDay: false, // Tasks are not all-day events by default
        task: task // Keep reference to original task
      }))
      
      commit('SET_EVENTS', events)
    } catch (error) {
      console.warn('Error loading calendar events:', error)
      commit('SET_ERROR', error.message)
      // Set empty events array on error
      commit('SET_EVENTS', [])
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async updateTaskDates({ commit, dispatch }, { taskId, newStartDate, newEndDate }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // Get the task from the tasks store
      const task = this.getters['tasks/getTaskById'](taskId)
      if (!task) {
        throw new Error('Task not found')
      }
      
      // Update the task with new dates
      const updatedTask = {
        ...task,
        startDate: newStartDate,
        endDate: newEndDate,
        updatedAt: new Date()
      }
      
      // Update in tasks store
      await dispatch('tasks/updateTask', updatedTask, { root: true })
      
      // Reload calendar events to reflect changes
      await dispatch('loadCalendarEvents')
      
      return updatedTask
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  setDraggedTask({ commit }, task) {
    commit('SET_DRAGGED_TASK', task)
  },
  
  clearDraggedTask({ commit }) {
    commit('SET_DRAGGED_TASK', null)
  },
  
  // Navigate calendar dates
  navigateToToday({ commit }) {
    commit('SET_SELECTED_DATE', new Date())
  },
  
  navigatePrevious({ commit, state }) {
    const currentDate = new Date(state.selectedDate)
    let newDate
    
    switch (state.currentView) {
      case 'day':
        newDate = new Date(currentDate.setDate(currentDate.getDate() - 1))
        break
      case 'week':
        newDate = new Date(currentDate.setDate(currentDate.getDate() - 7))
        break
      case 'month':
        newDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1))
        break
      default:
        newDate = currentDate
    }
    
    commit('SET_SELECTED_DATE', newDate)
  },
  
  navigateNext({ commit, state }) {
    const currentDate = new Date(state.selectedDate)
    let newDate
    
    switch (state.currentView) {
      case 'day':
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
        break
      case 'week':
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 7))
        break
      case 'month':
        newDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
        break
      default:
        newDate = currentDate
    }
    
    commit('SET_SELECTED_DATE', newDate)
  }
}

const getters = {
  currentView: state => state.currentView,
  selectedDate: state => state.selectedDate,
  events: state => state.events,
  draggedTask: state => state.draggedTask,
  isLoading: state => state.isLoading,
  error: state => state.error,
  
  // Get events for a specific date
  getEventsForDate: state => date => {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    return state.events.filter(event => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      
      // Check if the event spans the target date
      return eventStart <= targetDate && eventEnd >= targetDate
    })
  },
  
  // Get events for a date range
  getEventsForDateRange: state => (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return state.events.filter(event => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      
      // Check if event overlaps with the date range
      return eventStart <= end && eventEnd >= start
    })
  },
  
  // Get events for current view period
  getCurrentViewEvents: (state, getters) => {
    const selectedDate = new Date(state.selectedDate)
    let startDate, endDate
    
    switch (state.currentView) {
      case 'day':
        startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(selectedDate)
        endDate.setHours(23, 59, 59, 999)
        break
        
      case 'week':
        // Get start of week (Monday)
        const dayOfWeek = selectedDate.getDay()
        const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        startDate = new Date(selectedDate.setDate(diff))
        startDate.setHours(0, 0, 0, 0)
        
        // Get end of week (Sunday)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
        
      case 'month':
        // Get start of month
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        
        // Get end of month
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
        
      default:
        startDate = new Date(selectedDate)
        endDate = new Date(selectedDate)
    }
    
    return getters.getEventsForDateRange(startDate, endDate)
  },
  
  // Format selected date for display
  formattedSelectedDate: state => {
    const date = state.selectedDate
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }
    
    switch (state.currentView) {
      case 'day':
        return date.toLocaleDateString('es-ES', options)
      case 'week':
        const startOfWeek = new Date(date)
        const dayOfWeek = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        startOfWeek.setDate(diff)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        
        return `${startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
      case 'month':
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      default:
        return date.toLocaleDateString('es-ES')
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}