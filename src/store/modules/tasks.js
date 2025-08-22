import { storageService } from '../../services/storageService.js'

// Initialize max nesting level from localStorage
const getInitialMaxNestingLevel = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('pm_settings') || '{}')
    return settings.maxNestingLevel || 100
  } catch {
    return 100
  }
}

const state = {
  tasks: [],
  currentTask: null,
  taskFilter: {
    status: null,
    assignedTo: null,
    projectId: null
  },
  maxNestingLevel: getInitialMaxNestingLevel(),
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
  
  SET_TASKS(state, tasks) {
    state.tasks = tasks
  },
  
  SET_CURRENT_TASK(state, task) {
    state.currentTask = task
  },
  
  SET_TASK_FILTER(state, filter) {
    state.taskFilter = { ...state.taskFilter, ...filter }
  },
  
  SET_MAX_NESTING_LEVEL(state, level) {
    state.maxNestingLevel = level
  },
  
  ADD_TASK(state, task) {
    state.tasks.push(task)
  },
  
  UPDATE_TASK(state, updatedTask) {
    const index = state.tasks.findIndex(t => t.id === updatedTask.id)
    if (index !== -1) {
      state.tasks.splice(index, 1, updatedTask)
    }
    // Update current task if it's the one being updated
    if (state.currentTask && state.currentTask.id === updatedTask.id) {
      state.currentTask = updatedTask
    }
  },
  
  DELETE_TASK(state, taskId) {
    // Remove the task and all its subtasks
    const removeTaskAndSubtasks = (tasks, id) => {
      return tasks.filter(task => {
        if (task.id === id) {
          return false
        }
        if (task.parentTaskId === id) {
          return false
        }
        return true
      })
    }
    
    state.tasks = removeTaskAndSubtasks(state.tasks, taskId)
    
    // Clear current task if it's the one being deleted
    if (state.currentTask && state.currentTask.id === taskId) {
      state.currentTask = null
    }
  },
  
  MOVE_TASK(state, { taskId, newParentId, newLevel }) {
    const task = state.tasks.find(t => t.id === taskId)
    if (task) {
      task.parentTaskId = newParentId
      task.level = newLevel
    }
  },
  
  UPDATE_TASK_PROGRESS(state, { taskId, progress }) {
    const task = state.tasks.find(t => t.id === taskId)
    if (task) {
      task.progress = progress
      task.updatedAt = new Date()
    }
  }
}

const actions = {
  async loadTasks({ commit }, projectId = null) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // Import Task class
      const { Task } = await import('../../models/index.js')
      
      let tasks = []
      if (projectId) {
        tasks = storageService.getTasksForProject(projectId)
      } else {
        // Get all tasks from all projects
        const projects = storageService.getAllProjects()
        tasks = projects.flatMap(project => 
          project.tasks.map(taskData => Task.fromJSON({ ...taskData, projectId: project.id }))
        )
      }
      commit('SET_TASKS', tasks)
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async createTask({ commit, state }, taskData) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // Import Task class
      const { Task } = await import('../../models/index.js')
      
      // Calculate task level based on parent
      let level = 0
      if (taskData.parentTaskId && taskData.parentTaskId !== null && taskData.parentTaskId !== '') {
        const parentTask = state.tasks.find(t => t.id === taskData.parentTaskId)
        if (parentTask) {
          level = parentTask.level + 1
          
          // Check nesting level limit (level is 0-based, maxNestingLevel is 1-based)
          if (level >= state.maxNestingLevel) {
            throw new Error(`Maximum nesting level of ${state.maxNestingLevel} exceeded. Current level would be ${level + 1}`)
          }
        } else {
          throw new Error('Parent task not found')
        }
      }
      
      const task = new Task({
        ...taskData,
        level,
        subtasks: [],
        progress: taskData.progress || 0
      })
      
      storageService.saveTask(task, taskData.projectId)
      commit('ADD_TASK', task)
      return task
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async updateTask({ commit }, task) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // Import Task class
      const { Task } = await import('../../models/index.js')
      
      const updatedTask = new Task({
        ...task,
        updatedAt: new Date()
      })
      
      storageService.saveTask(updatedTask, task.projectId)
      commit('UPDATE_TASK', updatedTask)
      return updatedTask
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async deleteTask({ commit, state }, { taskId, handleSubtasks = 'delete' }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error('Task not found')
      }
      
      // Handle subtasks based on the strategy
      const subtasks = state.tasks.filter(t => t.parentTaskId === taskId)
      
      if (handleSubtasks === 'promote' && subtasks.length > 0) {
        // Promote subtasks to the parent level
        for (const subtask of subtasks) {
          const updatedSubtask = {
            ...subtask,
            parentTaskId: task.parentTaskId,
            level: task.level,
            updatedAt: new Date()
          }
          storageService.saveTask(updatedSubtask, subtask.projectId)
          commit('UPDATE_TASK', updatedSubtask)
        }
      } else {
        // Delete all subtasks recursively
        const deleteRecursively = (parentId) => {
          const children = state.tasks.filter(t => t.parentTaskId === parentId)
          for (const child of children) {
            deleteRecursively(child.id)
            storageService.deleteTask(child.id, child.projectId)
          }
        }
        
        deleteRecursively(taskId)
      }
      
      storageService.deleteTask(taskId, task.projectId)
      commit('DELETE_TASK', taskId)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async setCurrentTask({ commit, state }, taskId) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error('Task not found')
      }
      commit('SET_CURRENT_TASK', task)
      return task
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async moveTask({ commit, state }, { taskId, newParentId }) {
    commit('SET_ERROR', null)
    
    try {
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error('Task not found')
      }
      
      // Calculate new level
      let newLevel = 0
      if (newParentId) {
        const newParent = state.tasks.find(t => t.id === newParentId)
        if (newParent) {
          newLevel = newParent.level + 1
          
          // Check nesting level limit (level is 0-based, maxNestingLevel is 1-based)
          if (newLevel >= state.maxNestingLevel) {
            throw new Error(`Maximum nesting level of ${state.maxNestingLevel} exceeded. New level would be ${newLevel + 1}`)
          }
        }
      }
      
      // Import Task class
      const { Task } = await import('../../models/index.js')
      
      // Update task
      const updatedTask = new Task({
        ...task,
        parentTaskId: newParentId,
        level: newLevel,
        updatedAt: new Date()
      })
      
      storageService.saveTask(updatedTask, task.projectId)
      commit('UPDATE_TASK', updatedTask)
      
      // Update all subtasks levels recursively
      const updateSubtaskLevels = (parentId, baseLevel) => {
        const subtasks = state.tasks.filter(t => t.parentTaskId === parentId)
        for (const subtask of subtasks) {
          const newSubtaskLevel = baseLevel + 1
          if (newSubtaskLevel < state.maxNestingLevel) {
            const updatedSubtask = new Task({
              ...subtask,
              level: newSubtaskLevel,
              updatedAt: new Date()
            })
            storageService.saveTask(updatedSubtask, subtask.projectId)
            commit('UPDATE_TASK', updatedSubtask)
            updateSubtaskLevels(subtask.id, newSubtaskLevel)
          }
        }
      }
      
      updateSubtaskLevels(taskId, newLevel)
      
      return updatedTask
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  updateTaskProgress({ commit }, { taskId, progress }) {
    commit('UPDATE_TASK_PROGRESS', { taskId, progress })
  },
  
  setTaskFilter({ commit }, filter) {
    commit('SET_TASK_FILTER', filter)
  },
  
  async setMaxNestingLevel({ commit }, level) {
    try {
      // Validate level
      if (level < 1 || level > 100) {
        throw new Error('Nesting level must be between 1 and 100')
      }
      
      commit('SET_MAX_NESTING_LEVEL', level)
      
      // Persist to localStorage
      const settings = JSON.parse(localStorage.getItem('pm_settings') || '{}')
      settings.maxNestingLevel = level
      localStorage.setItem('pm_settings', JSON.stringify(settings))
      
      return level
    } catch (error) {
      throw new Error(`Failed to set max nesting level: ${error.message}`)
    }
  }
}

const getters = {
  allTasks: state => state.tasks,
  currentTask: state => state.currentTask,
  taskFilter: state => state.taskFilter,
  maxNestingLevel: state => state.maxNestingLevel,
  isLoading: state => state.loading,
  error: state => state.error,
  
  getTaskById: state => id => {
    return state.tasks.find(task => task.id === id)
  },
  
  filteredTasks: state => {
    let tasks = state.tasks
    
    if (state.taskFilter.status) {
      tasks = tasks.filter(task => task.status === state.taskFilter.status)
    }
    
    if (state.taskFilter.assignedTo) {
      tasks = tasks.filter(task => task.assignedTo === state.taskFilter.assignedTo)
    }
    
    if (state.taskFilter.projectId) {
      tasks = tasks.filter(task => task.projectId === state.taskFilter.projectId)
    }
    
    return tasks
  },
  
  tasksByProject: state => projectId => {
    return state.tasks.filter(task => task.projectId === projectId)
  },
  
  rootTasks: state => projectId => {
    return state.tasks.filter(task => 
      task.projectId === projectId && !task.parentTaskId
    )
  },
  
  getSubtasks: state => parentId => {
    return state.tasks.filter(task => task.parentTaskId === parentId)
  },
  
  taskHierarchy: state => projectId => {
    const tasks = state.tasks.filter(task => task.projectId === projectId)
    
    const buildHierarchy = (parentId = null, level = 0) => {
      return tasks
        .filter(task => task.parentTaskId === parentId)
        .map(task => ({
          ...task,
          children: buildHierarchy(task.id, level + 1)
        }))
    }
    
    return buildHierarchy()
  },
  
  tasksByStatus: state => status => {
    return state.tasks.filter(task => task.status === status)
  },
  
  tasksByAssignee: state => assigneeId => {
    return state.tasks.filter(task => task.assignedTo === assigneeId)
  },
  
  overdueTasks: state => {
    const now = new Date()
    return state.tasks.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'cancelled' && 
      new Date(task.endDate) < now
    )
  },
  
  tasksCount: state => state.tasks.length,
  
  completedTasksCount: state => {
    return state.tasks.filter(task => task.status === 'completed').length
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}