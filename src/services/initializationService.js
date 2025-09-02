/**
 * Application initialization service
 * Handles app startup, data loading, and error recovery
 */

import { storageService } from './storageService.js'
import { migrationService } from './migrationService.js'

export class InitializationService {
  constructor() {
    this.initializationSteps = [
      { name: 'Storage Check', fn: this.checkStorage },
      { name: 'Data Migration', fn: this.runMigrations },
      { name: 'Data Validation', fn: this.validateData },
      { name: 'Store Initialization', fn: this.initializeStore }
    ]
  }

  /**
   * Initialize the application
   */
  async initialize(store) {
    const startTime = Date.now()
    const results = {
      success: false,
      steps: [],
      totalTime: 0,
      errors: []
    }

    console.log('Starting application initialization...')

    try {
      for (const step of this.initializationSteps) {
        const stepStartTime = Date.now()
        
        try {
          console.log(`Running step: ${step.name}`)
          const stepResult = await step.fn.call(this, store)
          
          const stepTime = Date.now() - stepStartTime
          results.steps.push({
            name: step.name,
            success: true,
            time: stepTime,
            result: stepResult
          })
          
          console.log(`Step ${step.name} completed in ${stepTime}ms`)
        } catch (error) {
          const stepTime = Date.now() - stepStartTime
          console.error(`Step ${step.name} failed:`, error)
          
          results.steps.push({
            name: step.name,
            success: false,
            time: stepTime,
            error: error.message
          })
          
          results.errors.push({
            step: step.name,
            error: error.message
          })
          
          // Some steps are critical, others can be skipped
          if (this.isCriticalStep(step.name)) {
            throw error
          }
        }
      }

      results.success = true
      results.totalTime = Date.now() - startTime
      
      console.log(`Application initialization completed successfully in ${results.totalTime}ms`)
      console.clear()
      
      return results
    } catch (error) {
      results.success = false
      results.totalTime = Date.now() - startTime
      results.errors.push({
        step: 'Initialization',
        error: error.message
      })
      
      console.error('Application initialization failed:', error)
      
      return results
    }
  }

  /**
   * Check if localStorage is available and working
   */
  async checkStorage() {
    try {
      // Test basic localStorage functionality
      const testKey = '__init_test__'
      const testValue = { test: true, timestamp: Date.now() }
      
      localStorage.setItem(testKey, JSON.stringify(testValue))
      const retrieved = JSON.parse(localStorage.getItem(testKey))
      localStorage.removeItem(testKey)
      
      if (!retrieved || retrieved.test !== true) {
        throw new Error('localStorage read/write test failed')
      }

      // Check storage health
      const healthCheck = storageService.checkStorageHealth()
      if (!healthCheck.healthy) {
        throw new Error(healthCheck.error)
      }

      return {
        available: true,
        healthy: healthCheck.healthy,
        projectCount: healthCheck.projectCount,
        dataSize: healthCheck.approximateDataSize
      }
    } catch (error) {
      throw new Error(`Storage check failed: ${error.message}`)
    }
  }

  /**
   * Run data migrations if needed
   */
  async runMigrations() {
    try {
      const migrationInfo = migrationService.getMigrationInfo()
      
      if (!migrationInfo.needsMigration) {
        return {
          needed: false,
          currentVersion: migrationInfo.currentVersion,
          targetVersion: migrationInfo.targetVersion
        }
      }

      console.log(`Running ${migrationInfo.pendingMigrations.length} migration(s)...`)
      
      const migrationResult = await migrationService.runMigrations()
      
      if (!migrationResult.success) {
        throw new Error(migrationResult.error)
      }

      // Clean up migration backup after successful migration
      migrationService.cleanupBackup()

      return {
        needed: true,
        migrationsRun: migrationResult.migrationsRun,
        finalVersion: migrationResult.finalVersion,
        previousVersion: migrationInfo.currentVersion
      }
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`)
    }
  }

  /**
   * Validate data structure
   */
  async validateData() {
    try {
      const validation = migrationService.validateDataStructure()
      
      if (!validation.valid) {
        console.warn('Data validation issues found:', validation.issues)
        
        // For now, we'll continue with warnings
        // In the future, we might want to attempt automatic fixes
        return {
          valid: false,
          issues: validation.issues,
          action: 'continued_with_warnings'
        }
      }

      return {
        valid: true,
        issues: []
      }
    } catch (error) {
      throw new Error(`Data validation failed: ${error.message}`)
    }
  }

  /**
   * Initialize the Vuex store with data
   */
  async initializeStore(store) {
    try {
      const results = {}

      // Load projects
      await store.dispatch('projects/loadProjects')
      results.projectsLoaded = store.getters['projects/projectsCount']

      // Load user preferences and apply them
      const preferences = storageService.getUserPreferences()
      
      // Set calendar view from preferences
      if (preferences.calendarView) {
        store.commit('calendar/SET_CURRENT_VIEW', preferences.calendarView)
        results.calendarView = preferences.calendarView
      }

      // Set last open project if exists and valid
      if (preferences.lastOpenProject) {
        try {
          await store.dispatch('projects/setCurrentProject', preferences.lastOpenProject)
          
          // Load tasks for the current project
          await store.dispatch('tasks/loadTasks', preferences.lastOpenProject)
          results.tasksLoaded = store.getters['tasks/tasksCount']
          
          // Load calendar events
          await store.dispatch('calendar/loadCalendarEvents')
          results.calendarEventsLoaded = store.getters['calendar/events'].length
          
          // Load gantt data
          await store.dispatch('gantt/loadGanttData', preferences.lastOpenProject)
          results.ganttTasksLoaded = store.getters['gantt/ganttTasks'].length
          
          results.lastProjectRestored = preferences.lastOpenProject
        } catch (error) {
          console.warn('Could not restore last open project:', error)
          
          // Clear invalid preference
          storageService.saveUserPreferences({ lastOpenProject: null })
          results.lastProjectError = error.message
        }
      }

      // Load settings and apply to tasks store
      const settings = storageService.getSettings()
      if (settings.maxNestingLevel) {
        store.commit('tasks/SET_MAX_NESTING_LEVEL', settings.maxNestingLevel)
        results.maxNestingLevel = settings.maxNestingLevel
      }

      return results
    } catch (error) {
      throw new Error(`Store initialization failed: ${error.message}`)
    }
  }

  /**
   * Determine if a step is critical for app functionality
   */
  isCriticalStep(stepName) {
    const criticalSteps = ['Storage Check', 'Store Initialization']
    return criticalSteps.includes(stepName)
  }

  /**
   * Get initialization summary for debugging
   */
  getInitializationSummary(results) {
    if (!results) return 'No initialization results available'

    const summary = {
      success: results.success,
      totalTime: `${results.totalTime}ms`,
      steps: results.steps.map(step => ({
        name: step.name,
        success: step.success,
        time: `${step.time}ms`,
        ...(step.error && { error: step.error })
      })),
      ...(results.errors.length > 0 && { errors: results.errors })
    }

    return summary
  }

  /**
   * Attempt recovery from initialization failure
   */
  async attemptRecovery(store, error) {
    console.log('Attempting recovery from initialization failure...')

    try {
      // Try to clear corrupted data and reinitialize
      if (error.message.includes('Migration') || error.message.includes('validation')) {
        console.log('Attempting data recovery...')
        
        // Try to restore from backup if available
        const backupData = localStorage.getItem('pm_migration_backup')
        if (backupData) {
          const backup = JSON.parse(backupData)
          migrationService.restoreBackup(backup)
          console.log('Restored from migration backup')
        }
        
        // Retry initialization
        return await this.initialize(store)
      }

      // If storage is completely broken, initialize with empty state
      if (error.message.includes('Storage')) {
        console.log('Initializing with empty state...')
        
        storageService.initializeStorage()
        return await this.initialize(store)
      }

      throw error
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError)
      
      return {
        success: false,
        recovery: false,
        error: recoveryError.message,
        originalError: error.message
      }
    }
  }
}

// Create and export singleton instance
export const initializationService = new InitializationService()