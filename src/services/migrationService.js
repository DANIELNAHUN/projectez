/**
 * Data migration service for handling localStorage data versioning
 */

import { storageService } from './storageService.js'

const CURRENT_VERSION = '1.0.0'
const VERSION_KEY = 'pm_data_version'

/**
 * Migration definitions
 * Each migration should have a version and an up function
 */
const migrations = [
  {
    version: '1.0.0',
    description: 'Initial data structure',
    up: (data) => {
      // Initial migration - ensure all required keys exist
      if (!data.projects) data.projects = []
      if (!data.settings) {
        data.settings = {
          maxNestingLevel: 100,
          defaultView: 'projects',
          theme: 'light',
          language: 'es'
        }
      }
      if (!data.userPreferences) {
        data.userPreferences = {
          lastOpenProject: null,
          calendarView: 'month',
          sidebarCollapsed: false
        }
      }
      return data
    }
  }
  // Future migrations would be added here
  // {
  //   version: '1.1.0',
  //   description: 'Add new field to projects',
  //   up: (data) => {
  //     data.projects.forEach(project => {
  //       if (!project.newField) {
  //         project.newField = 'defaultValue'
  //       }
  //     })
  //     return data
  //   }
  // }
]

export class MigrationService {
  constructor() {
    this.currentVersion = CURRENT_VERSION
    this.migrations = migrations
  }

  /**
   * Get the current data version from localStorage
   */
  getCurrentDataVersion() {
    try {
      return localStorage.getItem(VERSION_KEY) || '0.0.0'
    } catch (error) {
      console.warn('Could not read data version:', error)
      return '0.0.0'
    }
  }

  /**
   * Set the current data version in localStorage
   */
  setCurrentDataVersion(version) {
    try {
      localStorage.setItem(VERSION_KEY, version)
      return true
    } catch (error) {
      console.error('Could not set data version:', error)
      return false
    }
  }

  /**
   * Check if migration is needed
   */
  needsMigration() {
    const currentVersion = this.getCurrentDataVersion()
    return this.compareVersions(currentVersion, this.currentVersion) < 0
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations() {
    const currentVersion = this.getCurrentDataVersion()
    
    return this.migrations.filter(migration => 
      this.compareVersions(currentVersion, migration.version) < 0
    ).sort((a, b) => this.compareVersions(a.version, b.version))
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    const pendingMigrations = this.getPendingMigrations()
    
    if (pendingMigrations.length === 0) {
      console.log('No migrations needed')
      return { success: true, migrationsRun: 0 }
    }

    console.log(`Running ${pendingMigrations.length} migration(s)...`)

    try {
      // Create backup before migration
      const backupData = this.createBackup()
      
      // Get current data
      let data = {
        projects: storageService.getItem(storageService.storageKeys.projects) || [],
        settings: storageService.getItem(storageService.storageKeys.settings) || {},
        userPreferences: storageService.getItem(storageService.storageKeys.userPreferences) || {}
      }

      // Run each migration
      for (const migration of pendingMigrations) {
        console.log(`Running migration ${migration.version}: ${migration.description}`)
        
        try {
          data = migration.up(data)
          console.log(`Migration ${migration.version} completed successfully`)
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error)
          
          // Restore backup on failure
          this.restoreBackup(backupData)
          
          throw new Error(`Migration ${migration.version} failed: ${error.message}`)
        }
      }

      // Save migrated data
      storageService.setItem(storageService.storageKeys.projects, data.projects)
      storageService.setItem(storageService.storageKeys.settings, data.settings)
      storageService.setItem(storageService.storageKeys.userPreferences, data.userPreferences)

      // Update version
      this.setCurrentDataVersion(this.currentVersion)

      console.log(`All migrations completed successfully. Updated to version ${this.currentVersion}`)

      return {
        success: true,
        migrationsRun: pendingMigrations.length,
        finalVersion: this.currentVersion
      }

    } catch (error) {
      console.error('Migration process failed:', error)
      
      return {
        success: false,
        error: error.message,
        migrationsRun: 0
      }
    }
  }

  /**
   * Create a backup of current data
   */
  createBackup() {
    try {
      const backup = {
        version: this.getCurrentDataVersion(),
        timestamp: new Date().toISOString(),
        data: {
          projects: storageService.getItem(storageService.storageKeys.projects),
          settings: storageService.getItem(storageService.storageKeys.settings),
          userPreferences: storageService.getItem(storageService.storageKeys.userPreferences)
        }
      }

      // Store backup in localStorage with a temporary key
      localStorage.setItem('pm_migration_backup', JSON.stringify(backup))
      
      return backup
    } catch (error) {
      console.error('Could not create backup:', error)
      throw new Error('Failed to create migration backup')
    }
  }

  /**
   * Restore data from backup
   */
  restoreBackup(backupData) {
    try {
      if (!backupData || !backupData.data) {
        throw new Error('Invalid backup data')
      }

      const { data } = backupData

      if (data.projects) {
        storageService.setItem(storageService.storageKeys.projects, data.projects)
      }
      if (data.settings) {
        storageService.setItem(storageService.storageKeys.settings, data.settings)
      }
      if (data.userPreferences) {
        storageService.setItem(storageService.storageKeys.userPreferences, data.userPreferences)
      }

      // Restore version
      if (backupData.version) {
        this.setCurrentDataVersion(backupData.version)
      }

      console.log('Backup restored successfully')
      return true
    } catch (error) {
      console.error('Could not restore backup:', error)
      return false
    }
  }

  /**
   * Clean up migration backup
   */
  cleanupBackup() {
    try {
      localStorage.removeItem('pm_migration_backup')
    } catch (error) {
      console.warn('Could not cleanup migration backup:', error)
    }
  }

  /**
   * Compare two version strings
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  compareVersions(a, b) {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    
    const maxLength = Math.max(aParts.length, bParts.length)
    
    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || 0
      const bPart = bParts[i] || 0
      
      if (aPart < bPart) return -1
      if (aPart > bPart) return 1
    }
    
    return 0
  }

  /**
   * Get migration history
   */
  getMigrationInfo() {
    return {
      currentVersion: this.getCurrentDataVersion(),
      targetVersion: this.currentVersion,
      needsMigration: this.needsMigration(),
      pendingMigrations: this.getPendingMigrations().map(m => ({
        version: m.version,
        description: m.description
      })),
      availableMigrations: this.migrations.map(m => ({
        version: m.version,
        description: m.description
      }))
    }
  }

  /**
   * Force reset to current version (use with caution)
   */
  forceUpdateVersion() {
    this.setCurrentDataVersion(this.currentVersion)
    console.log(`Version forcefully updated to ${this.currentVersion}`)
  }

  /**
   * Validate data structure
   */
  validateDataStructure() {
    try {
      const projects = storageService.getItem(storageService.storageKeys.projects)
      const settings = storageService.getItem(storageService.storageKeys.settings)
      const userPreferences = storageService.getItem(storageService.storageKeys.userPreferences)

      const issues = []

      // Validate projects
      if (!Array.isArray(projects)) {
        issues.push('Projects data is not an array')
      } else {
        projects.forEach((project, index) => {
          if (!project.id) issues.push(`Project ${index} missing id`)
          if (!project.name) issues.push(`Project ${index} missing name`)
          if (!Array.isArray(project.tasks)) issues.push(`Project ${index} tasks is not an array`)
          if (!Array.isArray(project.teamMembers)) issues.push(`Project ${index} teamMembers is not an array`)
        })
      }

      // Validate settings
      if (typeof settings !== 'object' || settings === null) {
        issues.push('Settings data is not an object')
      } else {
        if (typeof settings.maxNestingLevel !== 'number') {
          issues.push('Settings maxNestingLevel is not a number')
        }
      }

      // Validate user preferences
      if (typeof userPreferences !== 'object' || userPreferences === null) {
        issues.push('User preferences data is not an object')
      }

      return {
        valid: issues.length === 0,
        issues
      }
    } catch (error) {
      return {
        valid: false,
        issues: [`Validation error: ${error.message}`]
      }
    }
  }
}

// Create and export singleton instance
export const migrationService = new MigrationService()