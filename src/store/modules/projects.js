import { storageService } from '../../services/storageService.js'
import { useErrorHandler } from '../../composables/useErrorHandler.js'
import { useNotifications } from '../../services/notificationService.js'
import { errorRecoveryService } from '../../services/errorRecoveryService.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'

const state = {
  projects: [],
  currentProject: null,
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

  SET_PROJECTS(state, projects) {
    state.projects = projects
  },

  SET_CURRENT_PROJECT(state, project) {
    state.currentProject = project
  },

  ADD_PROJECT(state, project) {
    state.projects.push(project)
  },

  UPDATE_PROJECT(state, updatedProject) {
    const index = state.projects.findIndex(p => p.id === updatedProject.id)
    if (index !== -1) {
      state.projects.splice(index, 1, updatedProject)
    }
    // Update current project if it's the one being updated
    if (state.currentProject && state.currentProject.id === updatedProject.id) {
      state.currentProject = updatedProject
    }
  },

  DELETE_PROJECT(state, projectId) {
    state.projects = state.projects.filter(p => p.id !== projectId)
    // Clear current project if it's the one being deleted
    if (state.currentProject && state.currentProject.id === projectId) {
      state.currentProject = null
    }
  },

  // New mutations for project date adjustments
  ADJUST_PROJECT_DATES(state, { projectId, newStartDate }) {
    const project = state.projects.find(p => p.id === projectId)
    if (project) {
      project.startDate = newStartDate
      project.updatedAt = new Date()
    }
    // Update current project if it's the one being adjusted
    if (state.currentProject && state.currentProject.id === projectId) {
      state.currentProject.startDate = newStartDate
      state.currentProject.updatedAt = new Date()
    }
  },

  ADD_TEAM_MEMBER(state, { projectId, member }) {
    const project = state.projects.find(p => p.id === projectId)
    if (project) {
      project.teamMembers.push(member)
    }
    // Update current project if it's the one being modified
    if (state.currentProject && state.currentProject.id === projectId) {
      state.currentProject.teamMembers.push(member)
    }
  },

  UPDATE_TEAM_MEMBER(state, { projectId, member }) {
    const project = state.projects.find(p => p.id === projectId)
    if (project) {
      const index = project.teamMembers.findIndex(m => m.id === member.id)
      if (index !== -1) {
        project.teamMembers.splice(index, 1, member)
      }
    }
    // Update current project if it's the one being modified
    if (state.currentProject && state.currentProject.id === projectId) {
      const index = state.currentProject.teamMembers.findIndex(m => m.id === member.id)
      if (index !== -1) {
        state.currentProject.teamMembers.splice(index, 1, member)
      }
    }
  },

  REMOVE_TEAM_MEMBER(state, { projectId, memberId }) {
    const project = state.projects.find(p => p.id === projectId)
    if (project) {
      project.teamMembers = project.teamMembers.filter(m => m.id !== memberId)
    }
    // Update current project if it's the one being modified
    if (state.currentProject && state.currentProject.id === projectId) {
      state.currentProject.teamMembers = state.currentProject.teamMembers.filter(m => m.id !== memberId)
    }
  }
}

const actions = {
  async loadProjects({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const projects = storageService.getAllProjects()
      commit('SET_PROJECTS', projects)
    } catch (error) {
      const { handleStorageError } = useErrorHandler()
      handleStorageError(error, 'Loading projects')
      commit('SET_ERROR', error.message)

      // Attempt recovery
      const recovery = await errorRecoveryService.attemptRecovery(error, 'loadProjects')
      if (recovery.success && !recovery.requiresUserAction) {
        // Retry loading if recovery was successful
        try {
          const projects = storageService.getAllProjects()
          commit('SET_PROJECTS', projects)
          commit('SET_ERROR', null)
        } catch (retryError) {
          commit('SET_ERROR', retryError.message)
        }
      }
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createProject({ commit }, projectData) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      // Import Project class
      const { Project } = await import('../../models/index.js')

      const project = new Project({
        ...projectData,
        teamMembers: [],
        tasks: []
      })

      await storageService.saveProject(project)
      commit('ADD_PROJECT', project)

      const { operationSuccess } = useNotifications()
      operationSuccess('create', 'Proyecto')

      return project
    } catch (error) {
      const { handleError, handleStorageError, handleValidationError } = useErrorHandler()

      if (error.name === 'ValidationError') {
        handleValidationError(error, 'Creating project')
      } else if (error.message?.includes('storage') || error.message?.includes('quota')) {
        handleStorageError(error, 'Creating project')
      } else {
        handleError(error, 'Creating project')
      }

      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateProject({ commit }, projectData) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      // Import Project class
      const { Project } = await import('../../models/index.js')

      // CRITICAL FIX: Get existing project data to preserve tasks and other data
      const existingProject = storageService.getProject(projectData.id)
      if (!existingProject) {
        throw new Error(`Project with ID ${projectData.id} not found`)
      }

      // Create a new Project instance with updated data, preserving existing tasks and team members
      const updatedProject = new Project({
        ...existingProject, // Start with existing data
        ...projectData,     // Override with new data from form
        tasks: existingProject.tasks || [], // Preserve existing tasks
        teamMembers: existingProject.teamMembers || [], // Preserve existing team members
        updatedAt: new Date()
      })

      await storageService.saveProject(updatedProject)
      commit('UPDATE_PROJECT', updatedProject)

      // Synchronize tasks if this is the current project
      if (updatedProject.tasks && this.state.tasks) {
        // Import Task class to ensure proper task instances
        const { Task } = await import('../../models/index.js')
        const taskInstances = updatedProject.tasks.map(taskData =>
          taskData instanceof Task ? taskData : Task.fromJSON(taskData)
        )
        this.commit('tasks/SET_TASKS', taskInstances)
      }

      return updatedProject
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async deleteProject({ commit }, projectId) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      await storageService.deleteProject(projectId)
      commit('DELETE_PROJECT', projectId)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async setCurrentProject({ commit }, projectId) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const project = storageService.getProject(projectId)
      commit('SET_CURRENT_PROJECT', project)

      // Ensure tasks store is synchronized with the current project's tasks
      if (project && project.tasks && this.state.tasks) {
        // Import Task class to convert plain objects to Task instances
        const { Task } = await import('../../models/index.js')
        const taskInstances = project.tasks.map(taskData => Task.fromJSON(taskData))
        this.commit('tasks/SET_TASKS', taskInstances)
      }

      return project
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async addTeamMember({ commit }, { projectId, memberData }) {
    commit('SET_ERROR', null)

    try {
      // Import TeamMember class
      const { TeamMember } = await import('../../models/index.js')

      const member = new TeamMember(memberData)

      commit('ADD_TEAM_MEMBER', { projectId, member })

      // Save updated project to storage
      const project = storageService.getProject(projectId)
      project.teamMembers.push(member)
      project.updatedAt = new Date()
      storageService.saveProject(project)

      return member
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },

  async updateTeamMember({ commit }, { projectId, member }) {
    commit('SET_ERROR', null)

    try {
      // Import TeamMember class
      const { TeamMember } = await import('../../models/index.js')

      const updatedMember = new TeamMember(member)

      commit('UPDATE_TEAM_MEMBER', { projectId, member: updatedMember })

      // Save updated project to storage
      const project = storageService.getProject(projectId)
      const index = project.teamMembers.findIndex(m => m.id === updatedMember.id)
      if (index !== -1) {
        project.teamMembers.splice(index, 1, updatedMember)
        project.updatedAt = new Date()
        storageService.saveProject(project)
      }

      return updatedMember
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },

  async removeTeamMember({ commit }, { projectId, memberId }) {
    commit('SET_ERROR', null)

    try {
      commit('REMOVE_TEAM_MEMBER', { projectId, memberId })

      // Save updated project to storage
      const project = storageService.getProject(projectId)
      project.teamMembers = project.teamMembers.filter(m => m.id !== memberId)
      project.updatedAt = new Date()
      storageService.saveProject(project)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },

  async adjustProjectDates({ commit, state }, { projectId, newStartDate }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      // Import Project and DateCalculationService classes
      const { Project } = await import('../../models/index.js')
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')

      // Validate inputs
      if (!projectId) {
        throw new Error('Project ID is required')
      }

      if (!newStartDate) {
        throw new Error('New start date is required')
      }

      // Get the project from storage to ensure we have the latest data
      const projectData = storageService.getProject(projectId)
      if (!projectData) {
        throw new Error(`Project with ID ${projectId} not found`)
      }

      // Create Project instance with current data
      const project = Project.fromJSON(projectData)

      // Validate new start date
      const newStart = newStartDate instanceof Date ? newStartDate : new Date(newStartDate)
      if (isNaN(newStart.getTime())) {
        throw new Error('Invalid start date provided')
      }

      // Additional validation: check if new start date would cause issues
      if (project.endDate && !DateCalculationService.validateDateRange(newStart, project.endDate)) {
        const { operationWarning } = useNotifications()
        operationWarning('La nueva fecha de inicio es posterior a la fecha de fin del proyecto')
      }

      // Store original start date for rollback if needed
      const originalStartDate = new Date(project.startDate)

      try {
        // Adjust project dates
        project.adjustProjectDates(newStart)

        // Recalculate project end date based on adjusted tasks
        project.recalculateProjectEndDate()

        // Save updated project to storage
        await storageService.saveProject(project)

        // Update store state
        commit('UPDATE_PROJECT', project)

        // CRITICAL FIX: Update tasks in the tasks store to keep them synchronized
        // This ensures that when project dates are adjusted, the tasks store reflects the changes
        if (this.state.tasks && project.tasks) {
          // Import Task class to ensure proper task instances
          const { Task } = await import('../../models/index.js')
          const taskInstances = project.tasks.map(taskData =>
            taskData instanceof Task ? taskData : Task.fromJSON(taskData)
          )
          this.commit('tasks/SET_TASKS', taskInstances)
        }

        const { operationSuccess } = useNotifications()
        operationSuccess('update', 'Fechas del proyecto')

        return {
          success: true,
          project: project,
          adjustedTasks: project.tasks.length
        }

      } catch (adjustmentError) {
        // Rollback on failure
        project.startDate = originalStartDate
        throw new Error(`Failed to adjust project dates: ${adjustmentError.message}`)
      }

    } catch (error) {
      const { handleError, handleValidationError } = useErrorHandler()

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        handleValidationError(error, 'Adjusting project dates')
      } else {
        handleError(error, 'Adjusting project dates')
      }

      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async validateProjectDateAdjustment({ state }, { projectId, newStartDate }) {
    try {
      // Import required classes
      const { DateCalculationService } = await import('../../services/dateCalculationService.js')

      // Validate inputs
      if (!projectId || !newStartDate) {
        return {
          isValid: false,
          errors: ['Project ID and new start date are required'],
          warnings: []
        }
      }

      // Get project data
      const projectData = storageService.getProject(projectId)
      if (!projectData) {
        return {
          isValid: false,
          errors: [`Project with ID ${projectId} not found`],
          warnings: []
        }
      }

      const newStart = newStartDate instanceof Date ? newStartDate : new Date(newStartDate)
      if (isNaN(newStart.getTime())) {
        return {
          isValid: false,
          errors: ['Invalid start date provided'],
          warnings: []
        }
      }

      const errors = []
      const warnings = []

      // Check if new start date is after project end date
      if (projectData.endDate) {
        const projectEndDate = new Date(projectData.endDate)
        if (!DateCalculationService.validateDateRange(newStart, projectEndDate)) {
          warnings.push('New start date is after project end date')
        }
      }

      // Check if new start date is a working day
      if (!DateCalculationService.isWorkingDay(newStart)) {
        const dayName = DateCalculationService.getDayName(newStart);
        warnings.push(`New start date falls on a non-working day (${dayName})`)
      }

      // Check if adjustment would cause tasks to have invalid dates
      const originalStart = new Date(projectData.startDate)
      const isMovingForward = newStart >= originalStart
      let daysDifference

      if (isMovingForward) {
        daysDifference = DateCalculationService.calculateWorkingDays(originalStart, newStart)
      } else {
        daysDifference = DateCalculationService.calculateWorkingDays(newStart, originalStart)
      }

      // Validate that all tasks can be adjusted
      if (projectData.tasks && projectData.tasks.length > 0) {
        for (const task of projectData.tasks) {
          try {
            const taskStartDate = new Date(task.startDate)
            let newTaskStartDate

            if (isMovingForward) {
              newTaskStartDate = DateCalculationService.addWorkingDays(taskStartDate, daysDifference)
            } else {
              newTaskStartDate = DateCalculationService.subtractWorkingDays(taskStartDate, daysDifference)
            }

            // Check if new task start date is valid
            if (isNaN(newTaskStartDate.getTime())) {
              errors.push(`Task "${task.title}" would have an invalid start date after adjustment`)
            }
          } catch (taskError) {
            errors.push(`Error validating task "${task.title}": ${taskError.message}`)
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        daysDifference,
        affectedTasks: projectData.tasks ? projectData.tasks.length : 0
      }

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      }
    }
  },

  async importProject({ commit, state }, projectData) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {

      const { ProjectImportService } = await import('../../services/projectImportService.js')

      let project

      if (typeof projectData === 'string') {
        // If projectData is a JSON string, use the import service
        const existingProjectIds = state.projects.map(p => p.id)
        const preparedJson = ProjectImportService.prepareProjectForImport(
          projectData,
          existingProjectIds
        )
        project = ProjectImportService.importProject(preparedJson)
      } else {
        // If projectData is already an object (from AI generation), create project directly
        const { Project } = await import('../../models/index.js')

        // Ensure unique ID
        let projectId = projectData.id
        const existingIds = state.projects.map(p => p.id)
        if (existingIds.includes(projectId)) {
          projectId = ProjectImportService.generateUniqueProjectId(projectId, existingIds)
        }

        // Helper function to process tasks recursively
        const processTasks = async (tasksData, projectId, currentDate, parentTaskId = null) => {
          const { Task } = await import('../../models/index.js')
          const processedTasks = []
          let workingDate = new Date(currentDate)

          for (const taskData of tasksData) {
            try {
              // Initialize dates if they don't exist
              let startDate = taskData.startDate ? new Date(taskData.startDate) : new Date(workingDate)
              let endDate = taskData.endDate ? new Date(taskData.endDate) : null

              // Validate start date
              if (isNaN(startDate.getTime())) {
                startDate = new Date(workingDate)
              }

              // If no end date, calculate it based on duration
              const duration = taskData.duration && taskData.duration > 0 ? taskData.duration : 1
              if (!endDate) {
                endDate = DateCalculationService.addWorkingDays(startDate, duration)
              }

              // Validate end date
              if (isNaN(endDate.getTime())) {
                endDate = DateCalculationService.addWorkingDays(startDate, duration)
              }

              // Process subtasks if they exist
              let subtasks = []
              if (taskData.subtasks && Array.isArray(taskData.subtasks) && taskData.subtasks.length > 0) {
                const taskId = taskData.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
                subtasks = await processTasks(taskData.subtasks, projectId, startDate, taskId)
              }

              const task = new Task({
                ...taskData,
                startDate,
                endDate,
                duration,
                projectId: projectId,
                parentTaskId: parentTaskId,
                subtasks,
                createdAt: new Date(),
                updatedAt: new Date()
              })

              processedTasks.push(task)

              // Move current date forward for next task (sequential scheduling)
              workingDate = new Date(endDate)
              workingDate.setDate(workingDate.getDate() + 1) // Add 1 day gap between tasks

            } catch (taskError) {
              console.warn(`Error processing task "${taskData.title || 'Untitled'}":`, taskError.message)
              // Continue with other tasks even if one fails
            }
          }

          return processedTasks
        }

        // Convert tasks to Task instances and initialize dates if needed
        let processedTasks = []
        if (projectData.tasks && Array.isArray(projectData.tasks)) {
          const projectStartDate = projectData.startDate ? new Date(projectData.startDate) : new Date()
          processedTasks = await processTasks(projectData.tasks, projectId, projectStartDate)
        }

        project = new Project({
          ...projectData,
          id: projectId,
          tasks: processedTasks,
          createdAt: new Date(),
          updatedAt: new Date()
        })

        // Update project end date based on last task
        if (processedTasks.length > 0) {
          const lastTask = processedTasks[processedTasks.length - 1]
          if (lastTask.endDate) {
            project.endDate = new Date(lastTask.endDate)
          }
        }

        // If a start date was provided and it's different from current, adjust all dates
        if (projectData.startDate) {
          const newStartDate = new Date(projectData.startDate)
          const currentStartDate = project.startDate

          // Only adjust if the dates are different
          if (currentStartDate.getTime() !== newStartDate.getTime()) {
            try {
              project.adjustProjectDates(newStartDate)
            } catch (adjustError) {
              console.warn('Failed to adjust project dates, using original dates:', adjustError.message)
              // Continue with import even if date adjustment fails
              // The project will use the dates we calculated during task processing
            }
          }
        }
      }

      // Save to storage
      await storageService.saveProject(project)

      // Update store
      commit('ADD_PROJECT', project)

      const { operationSuccess } = useNotifications()
      operationSuccess('import', 'Proyecto')

      return project
    } catch (error) {
      const { handleError, handleValidationError } = useErrorHandler()

      if (error.message.includes('validation') || error.message.includes('Invalid')) {
        handleValidationError(error, 'Importing project')
      } else {
        handleError(error, 'Importing project')
      }

      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async clearAllProjects({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      // Clear localStorage
      storageService.clearAllData()

      // Clear store state
      commit('SET_PROJECTS', [])
      commit('SET_CURRENT_PROJECT', null)

      return true
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async exportProject({ commit }, projectId) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      // Import ProjectExportService
      const { ProjectExportService } = await import('../../services/projectExportService.js')

      // Get project data
      const projectData = storageService.getProject(projectId)
      if (!projectData) {
        throw new Error(`Project with ID ${projectId} not found`)
      }

      // Export project to JSON
      const jsonData = ProjectExportService.exportProject(projectData)

      // Generate filename
      const filename = `${projectData.name || 'project'}_${new Date().toISOString().split('T')[0]}.json`

      // Download file
      ProjectExportService.downloadJSON(jsonData, filename)

      const { operationSuccess } = useNotifications()
      operationSuccess('export', 'Proyecto')

      return {
        success: true,
        filename,
        size: jsonData.length
      }
    } catch (error) {
      const { handleError } = useErrorHandler()
      handleError(error, 'Exporting project')

      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async generateProjectFromAI({ commit, dispatch }, { prompt, apiKey }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      // Import OpenAIService
      const { OpenAIService } = await import('../../services/openAIService.js')

      // Validate inputs
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Project prompt is required')
      }

      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('OpenAI API key is required')
      }

      // Initialize OpenAI service with API key
      const aiService = new OpenAIService()
      await aiService.initialize(apiKey)

      // Generate project from prompt
      const projectData = await aiService.generateProject(prompt)

      // Validate generated project
      const validation = aiService.validateGeneratedProject(projectData)
      if (!validation.isValid) {
        throw new Error(`Generated project validation failed: ${validation.errors.join(', ')}`)
      }

      // Import the project using existing import functionality
      const importedProject = await dispatch('importProject', projectData)

      const { operationSuccess } = useNotifications()
      operationSuccess('generate', 'Proyecto con IA')

      return {
        success: true,
        project: importedProject,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        taskCount: projectData.tasks ? projectData.tasks.length : 0
      }
    } catch (error) {
      const { handleError } = useErrorHandler()

      if (error.message.includes('API key') || error.message.includes('OpenAI')) {
        handleError(error, 'AI service error')
      } else if (error.message.includes('validation')) {
        handleError(error, 'Generated project validation')
      } else {
        handleError(error, 'Generating project with AI')
      }

      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async validateAIProjectGeneration({ commit }, { prompt, apiKey }) {
    try {
      // Basic validation
      const errors = []
      const warnings = []

      if (!prompt || prompt.trim().length === 0) {
        errors.push('Project prompt is required')
      } else if (prompt.trim().length < 10) {
        warnings.push('Very short prompts may generate basic projects')
      } else if (prompt.trim().length > 2000) {
        warnings.push('Very long prompts may be truncated by the AI service')
      }

      if (!apiKey || apiKey.trim().length === 0) {
        errors.push('OpenAI API key is required')
      } else if (!apiKey.startsWith('sk-')) {
        warnings.push('API key format may be invalid (should start with "sk-")')
      }

      // Check if prompt contains potentially problematic content
      const problematicWords = ['hack', 'illegal', 'malicious', 'virus']
      const lowerPrompt = prompt.toLowerCase()
      const foundProblematic = problematicWords.filter(word => lowerPrompt.includes(word))
      if (foundProblematic.length > 0) {
        warnings.push(`Prompt contains potentially problematic words: ${foundProblematic.join(', ')}`)
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        promptLength: prompt.trim().length,
        estimatedTokens: Math.ceil(prompt.trim().length / 4) // Rough estimate
      }
    } catch (error) {
      commit('SET_ERROR', error.message)
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      }
    }
  },

  clearCurrentProject({ commit }) {
    commit('SET_CURRENT_PROJECT', null)
  },

  // New action to synchronize tasks after project updates
  async synchronizeProjectTasks({ commit }, projectId) {
    try {
      const project = storageService.getProject(projectId)
      if (project && project.tasks && this.state.tasks) {
        // Import Task class to ensure proper task instances
        const { Task } = await import('../../models/index.js')
        const taskInstances = project.tasks.map(taskData => Task.fromJSON(taskData))
        this.commit('tasks/SET_TASKS', taskInstances)
      }
      return true
    } catch (error) {
      console.error('Error synchronizing project tasks:', error)
      return false
    }
  }
}

const getters = {
  allProjects: state => state.projects,
  currentProject: state => state.currentProject,
  isLoading: state => state.loading,
  error: state => state.error,

  getProjectById: state => id => {
    return state.projects.find(project => project.id === id)
  },

  activeProjects: state => {
    return state.projects.filter(project => project.status === 'active')
  },

  completedProjects: state => {
    return state.projects.filter(project => project.status === 'completed')
  },

  projectsCount: state => state.projects.length,

  currentProjectTeamMembers: state => {
    return state.currentProject ? state.currentProject.teamMembers : []
  },

  getProjectDateAdjustmentInfo: state => projectId => {
    const project = state.projects.find(p => p.id === projectId)
    if (!project) return null

    return {
      currentStartDate: project.startDate,
      currentEndDate: project.endDate,
      taskCount: project.tasks ? project.tasks.length : 0,
      hasEndDate: !!project.endDate
    }
  },

  // New getters for date calculation helpers
  getWorkingDaysBetween: () => (startDate, endDate) => {
    try {
      const { DateCalculationService } = require('../../services/dateCalculationService.js')
      return DateCalculationService.calculateWorkingDays(startDate, endDate)
    } catch (error) {
      console.error('Error calculating working days:', error)
      return 0
    }
  },

  addWorkingDaysToDate: () => (startDate, days) => {
    try {
      const { DateCalculationService } = require('../../services/dateCalculationService.js')
      return DateCalculationService.addWorkingDays(startDate, days)
    } catch (error) {
      console.error('Error adding working days:', error)
      return startDate
    }
  },

  isWorkingDay: () => (date) => {
    try {
      const { DateCalculationService } = require('../../services/dateCalculationService.js')
      return DateCalculationService.isWorkingDay(date)
    } catch (error) {
      console.error('Error checking working day:', error)
      return true
    }
  },

  validateDateRange: () => (startDate, endDate) => {
    try {
      const { DateCalculationService } = require('../../services/dateCalculationService.js')
      return DateCalculationService.validateDateRange(startDate, endDate)
    } catch (error) {
      console.error('Error validating date range:', error)
      return false
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