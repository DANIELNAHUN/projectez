const state = {
  timelineStart: null,
  timelineEnd: null,
  zoomLevel: 'days', // 'days', 'weeks', 'months'
  ganttTasks: [], // Tasks formatted for Gantt display
  projectDuration: 0, // Duration in days
  loading: false,
  error: null
}

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  
  SET_ERROR(state, error) {
    state.error = error
  },
  
  SET_TIMELINE_START(state, date) {
    state.timelineStart = new Date(date)
  },
  
  SET_TIMELINE_END(state, date) {
    state.timelineEnd = new Date(date)
  },
  
  SET_ZOOM_LEVEL(state, level) {
    state.zoomLevel = level
  },
  
  SET_GANTT_TASKS(state, tasks) {
    state.ganttTasks = tasks
  },
  
  SET_PROJECT_DURATION(state, duration) {
    state.projectDuration = duration
  },
  
  UPDATE_GANTT_TASK(state, updatedTask) {
    const index = state.ganttTasks.findIndex(t => t.id === updatedTask.id)
    if (index !== -1) {
      state.ganttTasks.splice(index, 1, updatedTask)
    }
  }
}

const actions = {
  loadGanttData({ commit, rootGetters }, projectId) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const tasks = rootGetters['tasks/tasksByProject'](projectId)
      
      if (tasks.length === 0) {
        commit('SET_GANTT_TASKS', [])
        commit('SET_PROJECT_DURATION', 0)
        commit('SET_TIMELINE_START', new Date())
        commit('SET_TIMELINE_END', new Date())
        commit('SET_LOADING', false)
        return
      }
      
      // Calculate project timeline
      const startDates = tasks.map(t => new Date(t.startDate))
      const endDates = tasks.map(t => new Date(t.endDate))
      
      const projectStart = new Date(Math.min(...startDates))
      const projectEnd = new Date(Math.max(...endDates))
      
      // Add some padding to the timeline
      const paddedStart = new Date(projectStart)
      paddedStart.setDate(paddedStart.getDate() - 7)
      
      const paddedEnd = new Date(projectEnd)
      paddedEnd.setDate(paddedEnd.getDate() + 7)
      
      commit('SET_TIMELINE_START', paddedStart)
      commit('SET_TIMELINE_END', paddedEnd)
      
      // Calculate project duration in days
      const duration = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24))
      commit('SET_PROJECT_DURATION', duration)
      
      // Convert tasks to Gantt format
      const ganttTasks = tasks.map(task => {
        const startDate = new Date(task.startDate)
        const endDate = new Date(task.endDate)
        const taskDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
        
        // Find subtasks to determine if this is a parent task
        const subtasks = tasks.filter(t => t.parentTaskId === task.id)
        const hasSubtasks = subtasks.length > 0
        
        // If it's a parent task, calculate the span from earliest start to latest end of children
        let actualStart = startDate
        let actualEnd = endDate
        let actualDuration = taskDuration
        
        if (hasSubtasks) {
          const childStartDates = subtasks.map(t => new Date(t.startDate))
          const childEndDates = subtasks.map(t => new Date(t.endDate))
          
          actualStart = new Date(Math.min(startDate, ...childStartDates))
          actualEnd = new Date(Math.max(endDate, ...childEndDates))
          actualDuration = Math.ceil((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) + 1
        }
        
        return {
          id: task.id,
          title: task.title,
          start: actualStart,
          end: actualEnd,
          duration: actualDuration,
          progress: task.progress,
          status: task.status,
          level: task.level || 0,
          parentTaskId: task.parentTaskId,
          assignedTo: task.assignedTo,
          priority: task.priority,
          type: task.type,
          hasSubtasks: hasSubtasks,
          // Calculate position and width for rendering
          startOffset: Math.ceil((actualStart - paddedStart) / (1000 * 60 * 60 * 24)),
          width: actualDuration,
          color: getGanttTaskColor(task.status, task.priority, hasSubtasks)
        }
      })
      
      // Sort tasks to display hierarchy properly
      const sortTasksHierarchically = (tasks) => {
        const sorted = []
        const taskMap = new Map(tasks.map(task => [task.id, task]))
        const processed = new Set()
        
        const addTaskAndChildren = (task) => {
          if (processed.has(task.id)) return
          
          processed.add(task.id)
          sorted.push(task)
          
          // Find and add children
          const children = tasks
            .filter(t => t.parentTaskId === task.id)
            .sort((a, b) => a.start - b.start)
          
          children.forEach(child => addTaskAndChildren(child))
        }
        
        // Start with root tasks (no parent)
        const rootTasks = tasks
          .filter(task => !task.parentTaskId)
          .sort((a, b) => a.start - b.start)
        
        rootTasks.forEach(task => addTaskAndChildren(task))
        
        return sorted
      }
      
      const sortedGanttTasks = sortTasksHierarchically(ganttTasks)
      
      commit('SET_GANTT_TASKS', sortedGanttTasks)
      
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  setZoomLevel({ commit, dispatch }, { level, projectId }) {
    commit('SET_ZOOM_LEVEL', level)
    // Reload data to recalculate positions based on new zoom
    if (projectId) {
      dispatch('loadGanttData', projectId)
    }
  },
  
  updateTaskDates({ commit, dispatch, rootGetters }, { taskId, newStart, newEnd, projectId, type = 'move' }) {
    commit('SET_ERROR', null)
    
    try {
      // Update the task in the tasks store
      dispatch('tasks/updateTask', {
        id: taskId,
        startDate: newStart,
        endDate: newEnd
      }, { root: true })
      
      // If this task has a parent, check if we need to update parent dates
      const task = rootGetters['tasks/getTaskById'](taskId)
      if (task && task.parentTaskId) {
        dispatch('updateParentTaskDates', { parentId: task.parentTaskId, projectId })
      }
      
      // If this task has children, update their dates if it's a move operation
      if (type === 'move') {
        const childTasks = rootGetters['tasks/tasksByProject'](projectId)
          .filter(t => t.parentTaskId === taskId)
        
        if (childTasks.length > 0) {
          const originalTask = rootGetters['tasks/getTaskById'](taskId)
          const originalStart = new Date(originalTask.startDate)
          const daysDelta = Math.ceil((newStart - originalStart) / (1000 * 60 * 60 * 24))
          
          // Move all child tasks by the same delta
          childTasks.forEach(childTask => {
            const childNewStart = new Date(childTask.startDate)
            const childNewEnd = new Date(childTask.endDate)
            
            childNewStart.setDate(childNewStart.getDate() + daysDelta)
            childNewEnd.setDate(childNewEnd.getDate() + daysDelta)
            
            dispatch('tasks/updateTask', {
              id: childTask.id,
              startDate: childNewStart,
              endDate: childNewEnd
            }, { root: true })
          })
        }
      }
      
      // Reload Gantt data to recalculate timeline and positions
      dispatch('loadGanttData', projectId)
      
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  updateParentTaskDates({ dispatch, rootGetters }, { parentId, projectId }) {
    try {
      // Get all child tasks of the parent
      const childTasks = rootGetters['tasks/tasksByProject'](projectId)
        .filter(t => t.parentTaskId === parentId)
      
      if (childTasks.length === 0) return
      
      // Calculate the span of all child tasks
      const childStartDates = childTasks.map(t => new Date(t.startDate))
      const childEndDates = childTasks.map(t => new Date(t.endDate))
      
      const earliestStart = new Date(Math.min(...childStartDates))
      const latestEnd = new Date(Math.max(...childEndDates))
      
      // Update the parent task to span all children
      dispatch('tasks/updateTask', {
        id: parentId,
        startDate: earliestStart,
        endDate: latestEnd
      }, { root: true })
      
      // Check if this parent also has a parent
      const parentTask = rootGetters['tasks/getTaskById'](parentId)
      if (parentTask && parentTask.parentTaskId) {
        dispatch('updateParentTaskDates', { 
          parentId: parentTask.parentTaskId, 
          projectId 
        })
      }
      
    } catch (error) {
      console.error('Error updating parent task dates:', error)
    }
  },
  
  recalculateTimeline({ commit, state }) {
    if (state.ganttTasks.length === 0) {
      commit('SET_TIMELINE_START', new Date())
      commit('SET_TIMELINE_END', new Date())
      commit('SET_PROJECT_DURATION', 0)
      return
    }
    
    const startDates = state.ganttTasks.map(t => t.start)
    const endDates = state.ganttTasks.map(t => t.end)
    
    const projectStart = new Date(Math.min(...startDates))
    const projectEnd = new Date(Math.max(...endDates))
    
    // Add padding based on project duration
    const projectDuration = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24))
    const paddingDays = Math.max(3, Math.min(14, Math.ceil(projectDuration * 0.1))) // 10% padding, min 3 days, max 14 days
    
    const paddedStart = new Date(projectStart)
    paddedStart.setDate(paddedStart.getDate() - paddingDays)
    
    const paddedEnd = new Date(projectEnd)
    paddedEnd.setDate(paddedEnd.getDate() + paddingDays)
    
    commit('SET_TIMELINE_START', paddedStart)
    commit('SET_TIMELINE_END', paddedEnd)
    commit('SET_PROJECT_DURATION', projectDuration)
  },
  
  optimizeTaskScheduling({ dispatch, rootGetters }, projectId) {
    // Simple task scheduling optimization
    // This could be enhanced with more sophisticated algorithms
    try {
      const tasks = rootGetters['tasks/tasksByProject'](projectId)
      const rootTasks = tasks.filter(t => !t.parentTaskId)
      
      // Sort root tasks by priority and dependencies
      const optimizedTasks = rootTasks.sort((a, b) => {
        // High priority tasks first
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1)
        }
        
        // Then by original start date
        return new Date(a.startDate) - new Date(b.startDate)
      })
      
      // Reschedule tasks to avoid overlaps (simplified version)
      let currentDate = new Date()
      
      optimizedTasks.forEach(task => {
        const taskDuration = Math.ceil((new Date(task.endDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24))
        const newStart = new Date(currentDate)
        const newEnd = new Date(currentDate)
        newEnd.setDate(newEnd.getDate() + taskDuration)
        
        dispatch('tasks/updateTask', {
          id: task.id,
          startDate: newStart,
          endDate: newEnd
        }, { root: true })
        
        // Move to next available date
        currentDate = new Date(newEnd)
        currentDate.setDate(currentDate.getDate() + 1)
      })
      
      // Reload Gantt data
      dispatch('loadGanttData', projectId)
      
    } catch (error) {
      console.error('Error optimizing task scheduling:', error)
    }
  }
}

const getters = {
  timelineStart: state => state.timelineStart,
  timelineEnd: state => state.timelineEnd,
  zoomLevel: state => state.zoomLevel,
  ganttTasks: state => state.ganttTasks,
  projectDuration: state => state.projectDuration,
  isLoading: state => state.loading,
  error: state => state.error,
  
  timelineDays: state => {
    if (!state.timelineStart || !state.timelineEnd) return []
    
    const days = []
    const current = new Date(state.timelineStart)
    const end = new Date(state.timelineEnd)
    
    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  },
  
  timelineWeeks: state => {
    if (!state.timelineStart || !state.timelineEnd) return []
    
    const weeks = []
    const current = new Date(state.timelineStart)
    const end = new Date(state.timelineEnd)
    
    // Start from the beginning of the week
    current.setDate(current.getDate() - current.getDay())
    
    while (current <= end) {
      weeks.push(new Date(current))
      current.setDate(current.getDate() + 7)
    }
    
    return weeks
  },
  
  timelineMonths: state => {
    if (!state.timelineStart || !state.timelineEnd) return []
    
    const months = []
    const current = new Date(state.timelineStart.getFullYear(), state.timelineStart.getMonth(), 1)
    const end = new Date(state.timelineEnd)
    
    while (current <= end) {
      months.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }
    
    return months
  },
  
  rootGanttTasks: state => {
    return state.ganttTasks.filter(task => !task.parentTaskId)
  },
  
  getGanttSubtasks: state => parentId => {
    return state.ganttTasks.filter(task => task.parentTaskId === parentId)
  },
  
  ganttTaskHierarchy: state => {
    const buildHierarchy = (parentId = null) => {
      return state.ganttTasks
        .filter(task => task.parentTaskId === parentId)
        .map(task => ({
          ...task,
          children: buildHierarchy(task.id)
        }))
    }
    
    return buildHierarchy()
  },
  
  totalTimelineWidth: state => {
    if (!state.timelineStart || !state.timelineEnd) return 0
    
    const totalDays = Math.ceil((state.timelineEnd - state.timelineStart) / (1000 * 60 * 60 * 24))
    
    switch (state.zoomLevel) {
      case 'days': return totalDays * 30 // 30px per day
      case 'weeks': return Math.ceil(totalDays / 7) * 100 // 100px per week
      case 'months': return Math.ceil(totalDays / 30) * 150 // 150px per month
      default: return totalDays * 30
    }
  },
  
  formattedProjectDuration: state => {
    if (state.projectDuration === 0) return '0 días'
    if (state.projectDuration === 1) return '1 día'
    if (state.projectDuration < 7) return `${state.projectDuration} días`
    if (state.projectDuration < 30) {
      const weeks = Math.floor(state.projectDuration / 7)
      const days = state.projectDuration % 7
      return `${weeks} semana${weeks > 1 ? 's' : ''}${days > 0 ? ` y ${days} día${days > 1 ? 's' : ''}` : ''}`
    }
    
    const months = Math.floor(state.projectDuration / 30)
    const remainingDays = state.projectDuration % 30
    return `${months} mes${months > 1 ? 'es' : ''}${remainingDays > 0 ? ` y ${remainingDays} día${remainingDays > 1 ? 's' : ''}` : ''}`
  },
  
  projectStats: state => {
    const tasks = state.ganttTasks
    if (tasks.length === 0) return null
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const pendingTasks = tasks.filter(t => t.status === 'pending').length
    const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length
    
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      cancelledTasks,
      overallProgress
    }
  },
  
  criticalPath: state => {
    // Simple critical path calculation - tasks with no slack time
    const tasks = state.ganttTasks
    if (tasks.length === 0) return []
    
    // For now, return tasks that are on the longest path
    // This is a simplified version - a full critical path algorithm would be more complex
    const rootTasks = tasks.filter(t => !t.parentTaskId)
    let longestPath = []
    let maxDuration = 0
    
    const calculatePath = (task, currentPath = []) => {
      const newPath = [...currentPath, task]
      const children = tasks.filter(t => t.parentTaskId === task.id)
      
      if (children.length === 0) {
        // Leaf task - calculate total duration of path
        const pathDuration = newPath.reduce((sum, t) => sum + t.duration, 0)
        if (pathDuration > maxDuration) {
          maxDuration = pathDuration
          longestPath = newPath
        }
      } else {
        children.forEach(child => calculatePath(child, newPath))
      }
    }
    
    rootTasks.forEach(task => calculatePath(task))
    
    return longestPath
  }
}

// Helper function to determine Gantt task color
function getGanttTaskColor(status, priority, hasSubtasks = false) {
  // Parent tasks have a darker shade
  const opacity = hasSubtasks ? 0.8 : 1
  
  if (status === 'completed') return hasSubtasks ? '#059669' : '#10b981' // green
  if (status === 'cancelled') return hasSubtasks ? '#4b5563' : '#6b7280' // gray
  if (status === 'in_progress') return hasSubtasks ? '#2563eb' : '#3b82f6' // blue
  
  switch (priority) {
    case 'high': return hasSubtasks ? '#dc2626' : '#ef4444' // red
    case 'medium': return hasSubtasks ? '#d97706' : '#f59e0b' // yellow
    case 'low': return hasSubtasks ? '#7c3aed' : '#8b5cf6' // purple
    default: return hasSubtasks ? '#4f46e5' : '#6366f1' // indigo
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}