/**
 * Vuex plugin for automatic data persistence to localStorage
 * Implements automatic saving on state changes and error handling
 */

import { storageService } from '../../services/storageService.js'
import { initializationService } from '../../services/initializationService.js'

const PERSISTENCE_DEBOUNCE_TIME = 500 // ms

export function createPersistencePlugin() {
  let saveTimeout = null
  let isInitializing = false

  /**
   * Initialize store from localStorage data
   */
  async function initializeStoreFromStorage(store) {
    isInitializing = true

    try {
      // Use the initialization service for complete app startup
      const initResult = await initializationService.initialize(store)
      
      if (!initResult.success) {
        // Attempt recovery
        console.log('Initial initialization failed, attempting recovery...')
        const recoveryResult = await initializationService.attemptRecovery(store, new Error(initResult.errors[0]?.error || 'Unknown initialization error'))
        
        if (!recoveryResult.success) {
          throw new Error(`Initialization and recovery failed: ${recoveryResult.error}`)
        }
        
        console.log('Recovery successful')
      }

      // Log initialization summary for debugging
      const summary = initializationService.getInitializationSummary(initResult)
      console.log('Initialization summary:', summary)

    } catch (error) {
      console.error('Error initializing store from storage:', error)
      
      // Set error in all relevant modules
      store.commit('projects/SET_ERROR', 'Error al cargar los datos guardados')
      store.commit('tasks/SET_ERROR', 'Error al cargar las tareas')
      store.commit('calendar/SET_ERROR', 'Error al cargar el calendario')
      store.commit('gantt/SET_ERROR', 'Error al cargar el diagrama de Gantt')
    } finally {
      isInitializing = false
    }
  }

  return (store) => {
    // Initialize store from localStorage on startup
    initializeStoreFromStorage(store)

    // Subscribe to mutations for automatic saving
    store.subscribe((mutation, state) => {
      // Skip saving during initialization
      if (isInitializing) return

      // Skip saving for loading and error mutations
      if (mutation.type.includes('SET_LOADING') || mutation.type.includes('SET_ERROR')) {
        return
      }

      // Debounce saves to avoid excessive localStorage writes
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      saveTimeout = setTimeout(() => {
        try {
          persistStateToStorage(mutation, state)
        } catch (error) {
          console.error('Error persisting state:', error)
          // Dispatch error to the appropriate module
          const moduleName = mutation.type.split('/')[0]
          if (moduleName && store.hasModule(moduleName)) {
            store.commit(`${moduleName}/SET_ERROR`, error.message)
          }
        }
      }, PERSISTENCE_DEBOUNCE_TIME)
    })
  }
}



/**
 * Persist relevant state changes to localStorage
 */
function persistStateToStorage(mutation, state) {
  const { type, payload } = mutation
  const [moduleName, mutationType] = type.split('/')

  switch (moduleName) {
    case 'projects':
      handleProjectsPersistence(mutationType, payload, state.projects)
      break
    
    case 'tasks':
      handleTasksPersistence(mutationType, payload, state.tasks)
      break
    
    case 'calendar':
      handleCalendarPersistence(mutationType, payload, state.calendar)
      break
    
    case 'gantt':
      // Gantt data is derived from tasks, no direct persistence needed
      break
  }
}

/**
 * Handle projects module persistence
 */
function handleProjectsPersistence(mutationType, payload, projectsState) {
  switch (mutationType) {
    case 'SET_CURRENT_PROJECT':
      // Save current project preference
      if (payload && payload.id) {
        storageService.saveUserPreferences({ lastOpenProject: payload.id })
      }
      break
    
    case 'ADD_PROJECT':
    case 'UPDATE_PROJECT':
      // Project is already saved to localStorage by the action
      // This is just for consistency
      break
    
    case 'DELETE_PROJECT':
      // Project is already deleted from localStorage by the action
      // Clear current project preference if it was the deleted one
      const preferences = storageService.getUserPreferences()
      if (preferences.lastOpenProject === payload) {
        storageService.saveUserPreferences({ lastOpenProject: null })
      }
      break
  }
}

/**
 * Handle tasks module persistence
 */
function handleTasksPersistence(mutationType, payload, tasksState) {
  switch (mutationType) {
    case 'SET_MAX_NESTING_LEVEL':
      // Save max nesting level to settings
      storageService.saveSettings({ maxNestingLevel: payload })
      break
    
    case 'ADD_TASK':
    case 'UPDATE_TASK':
    case 'DELETE_TASK':
      // Tasks are already saved to localStorage by the actions
      // This is just for consistency
      break
  }
}

/**
 * Handle calendar module persistence
 */
function handleCalendarPersistence(mutationType, payload, calendarState) {
  switch (mutationType) {
    case 'SET_CURRENT_VIEW':
      // Save calendar view preference
      storageService.saveUserPreferences({ calendarView: payload })
      break
  }
}

/**
 * Error recovery utilities
 */
export const persistenceUtils = {
  /**
   * Check if localStorage is available and working
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  },

  /**
   * Get storage usage information
   */
  getStorageInfo() {
    try {
      const projects = storageService.getAllProjects()
      const settings = storageService.getSettings()
      const preferences = storageService.getUserPreferences()
      
      const totalSize = JSON.stringify({ projects, settings, preferences }).length
      
      return {
        available: true,
        projectCount: projects.length,
        approximateSize: totalSize,
        sizeFormatted: formatBytes(totalSize)
      }
    } catch (error) {
      return {
        available: false,
        error: error.message
      }
    }
  },

  /**
   * Attempt to recover from storage errors
   */
  async attemptRecovery(store) {
    try {
      // Check storage health
      const healthCheck = storageService.checkStorageHealth()
      
      if (!healthCheck.healthy) {
        throw new Error(healthCheck.error)
      }

      // Try to reinitialize using the initialization service directly
      const initResult = await initializationService.initialize(store)
      
      if (!initResult.success) {
        throw new Error(initResult.errors[0]?.error || 'Reinitialization failed')
      }
      
      return { success: true }
    } catch (error) {
      console.error('Recovery attempt failed:', error)
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Considera exportar tus datos y limpiar el almacenamiento local'
      }
    }
  },

  /**
   * Export all data for backup
   */
  exportData() {
    try {
      return storageService.exportData()
    } catch (error) {
      throw new Error(`Error al exportar datos: ${error.message}`)
    }
  },

  /**
   * Import data from backup
   */
  async importData(jsonData, store) {
    try {
      storageService.importData(jsonData)
      
      // Reinitialize store with imported data using the initialization service
      const initResult = await initializationService.initialize(store)
      
      if (!initResult.success) {
        throw new Error(initResult.errors[0]?.error || 'Failed to initialize after import')
      }
      
      return { success: true }
    } catch (error) {
      throw new Error(`Error al importar datos: ${error.message}`)
    }
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}