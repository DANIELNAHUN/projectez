import { storageService } from '../../services/storageService.js'
import { useErrorHandler } from '../../composables/useErrorHandler.js'
import { useNotifications } from '../../services/notificationService.js'
import { errorRecoveryService } from '../../services/errorRecoveryService.js'

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
      
      // Create a new Project instance with updated data
      const updatedProject = new Project({
        ...projectData,
        updatedAt: new Date()
      })
      
      await storageService.saveProject(updatedProject)
      commit('UPDATE_PROJECT', updatedProject)
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
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}