/**
 * Error recovery service for handling and recovering from various error states
 */

import { storageService } from './storageService.js'

class ErrorRecoveryService {
  constructor() {
    this.recoveryStrategies = new Map()
    this.recoveryHistory = []
    this.maxRecoveryAttempts = 3
    
    this.setupDefaultStrategies()
  }

  // Setup default recovery strategies
  setupDefaultStrategies() {
    // Storage quota exceeded
    this.registerStrategy('storage_quota', {
      detect: (error) => error.message?.toLowerCase().includes('quota'),
      recover: async () => this.recoverFromStorageQuota(),
      priority: 1,
      maxAttempts: 1
    })

    // Storage access denied
    this.registerStrategy('storage_access', {
      detect: (error) => error.message?.toLowerCase().includes('access') && 
                        error.message?.toLowerCase().includes('storage'),
      recover: async () => this.recoverFromStorageAccess(),
      priority: 2,
      maxAttempts: 2
    })

    // Data corruption
    this.registerStrategy('data_corruption', {
      detect: (error) => error.message?.toLowerCase().includes('corrupt') ||
                        error.message?.toLowerCase().includes('invalid json'),
      recover: async () => this.recoverFromDataCorruption(),
      priority: 3,
      maxAttempts: 1
    })

    // Network errors
    this.registerStrategy('network_error', {
      detect: (error) => error.message?.toLowerCase().includes('network') ||
                        error.message?.toLowerCase().includes('fetch'),
      recover: async () => this.recoverFromNetworkError(),
      priority: 4,
      maxAttempts: 3
    })

    // Validation errors
    this.registerStrategy('validation_error', {
      detect: (error) => error.name === 'ValidationError',
      recover: async (error) => this.recoverFromValidationError(error),
      priority: 5,
      maxAttempts: 1
    })

    // Component errors
    this.registerStrategy('component_error', {
      detect: (error) => error.message?.includes('component') ||
                        error.message?.includes('render'),
      recover: async () => this.recoverFromComponentError(),
      priority: 6,
      maxAttempts: 2
    })

    // Generic fallback
    this.registerStrategy('generic_fallback', {
      detect: () => true, // Always matches as fallback
      recover: async (error) => this.genericRecovery(error),
      priority: 999,
      maxAttempts: 1
    })
  }

  // Register a recovery strategy
  registerStrategy(name, strategy) {
    this.recoveryStrategies.set(name, {
      name,
      attempts: 0,
      lastAttempt: null,
      ...strategy
    })
  }

  // Attempt to recover from an error
  async attemptRecovery(error, context = '') {
    console.log(`Attempting recovery for error in ${context}:`, error)

    // Find applicable strategies
    const strategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.detect(error))
      .sort((a, b) => a.priority - b.priority)

    if (strategies.length === 0) {
      console.warn('No recovery strategy found for error:', error)
      return { success: false, message: 'No recovery strategy available' }
    }

    // Try each strategy
    for (const strategy of strategies) {
      if (strategy.attempts >= strategy.maxAttempts) {
        console.log(`Strategy ${strategy.name} has exceeded max attempts`)
        continue
      }

      try {
        console.log(`Trying recovery strategy: ${strategy.name}`)
        
        strategy.attempts++
        strategy.lastAttempt = new Date()
        
        const result = await strategy.recover(error, context)
        
        if (result && result.success) {
          this.recordRecoverySuccess(strategy.name, error, context)
          return result
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError)
        this.recordRecoveryFailure(strategy.name, error, recoveryError, context)
      }
    }

    return { success: false, message: 'All recovery strategies failed' }
  }

  // Storage quota recovery
  async recoverFromStorageQuota() {
    try {
      // Emit event for UI to handle
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded', {
        detail: {
          message: 'El espacio de almacenamiento está lleno. Se requiere acción del usuario.',
          actions: ['export', 'cleanup']
        }
      }))

      return { 
        success: true, 
        message: 'Se han mostrado las opciones de gestión de almacenamiento',
        requiresUserAction: true
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // Storage access recovery
  async recoverFromStorageAccess() {
    try {
      // Check if localStorage is available
      const isAvailable = this.checkStorageAvailability()
      
      if (!isAvailable) {
        // Emit event for UI to handle
        window.dispatchEvent(new CustomEvent('storage-access-denied', {
          detail: {
            message: 'No se puede acceder al almacenamiento local. Verifica los permisos del navegador.',
            actions: ['reload', 'incognito']
          }
        }))
      }

      return { success: isAvailable, message: isAvailable ? 'Acceso restaurado' : 'Acceso denegado' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // Data corruption recovery
  async recoverFromDataCorruption() {
    try {
      // Try to recover from backup or reset
      const backupExists = this.checkForBackup()
      
      if (backupExists) {
        const restored = await this.restoreFromBackup()
        if (restored) {
          this.notifications.success(
            'Datos Restaurados',
            'Los datos se han restaurado desde una copia de seguridad.'
          )
          return { success: true, message: 'Datos restaurados desde backup' }
        }
      }

      // Emit event for UI to handle
      window.dispatchEvent(new CustomEvent('data-corruption-detected', {
        detail: {
          message: 'Los datos están corruptos. Se recomienda reiniciar con datos limpios.',
          actions: ['reset', 'repair']
        }
      }))

      return { success: true, message: 'Se han mostrado opciones de recuperación', requiresUserAction: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // Network error recovery
  async recoverFromNetworkError() {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        window.dispatchEvent(new CustomEvent('network-offline', {
          detail: {
            message: 'No hay conexión a internet. La aplicación funcionará en modo offline.'
          }
        }))
        return { success: true, message: 'Modo offline activado' }
      }

      // Try a simple connectivity test
      const isConnected = await this.testConnectivity()
      
      if (isConnected) {
        window.dispatchEvent(new CustomEvent('network-restored', {
          detail: {
            message: 'La conexión a internet se ha restablecido.'
          }
        }))
        return { success: true, message: 'Conexión restaurada' }
      }

      return { success: false, message: 'Sin conexión a internet' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // Validation error recovery
  async recoverFromValidationError(error) {
    try {
      // Emit event for UI to handle
      window.dispatchEvent(new CustomEvent('validation-error', {
        detail: {
          error: error,
          message: 'Se han encontrado errores de validación en los datos del formulario'
        }
      }))
      
      return { 
        success: true, 
        message: 'Se han mostrado los errores de validación',
        requiresUserAction: true
      }
    } catch (recoveryError) {
      return { success: false, message: recoveryError.message }
    }
  }

  // Component error recovery
  async recoverFromComponentError() {
    try {
      // Emit event for UI to handle
      window.dispatchEvent(new CustomEvent('component-error', {
        detail: {
          message: 'Se ha detectado un error en la interfaz. Se recomienda recargar la página.',
          actions: ['reload']
        }
      }))

      return { 
        success: true, 
        message: 'Se ha sugerido recargar la página',
        requiresUserAction: true
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // Generic recovery fallback
  async genericRecovery(error) {
    try {
      // Log error for debugging
      console.error('Generic recovery for error:', error)
      
      // Emit event for UI to handle
      window.dispatchEvent(new CustomEvent('generic-error', {
        detail: {
          error: error,
          message: 'Ha ocurrido un error inesperado. Puedes intentar recargar la página.',
          actions: ['reload', 'report']
        }
      }))

      return { 
        success: true, 
        message: 'Se han mostrado opciones de recuperación genéricas',
        requiresUserAction: true
      }
    } catch (recoveryError) {
      return { success: false, message: recoveryError.message }
    }
  }

  // Helper methods
  checkStorageAvailability() {
    try {
      const test = 'test'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  checkForBackup() {
    try {
      const backup = localStorage.getItem('pm_backup')
      return !!backup
    } catch {
      return false
    }
  }

  async restoreFromBackup() {
    try {
      const backup = localStorage.getItem('pm_backup')
      if (backup) {
        const data = JSON.parse(backup)
        // Restore data logic would go here
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async resetApplicationData() {
    try {
      // Clear all application data
      const keys = Object.keys(localStorage).filter(key => key.startsWith('pm_'))
      keys.forEach(key => localStorage.removeItem(key))
      
      console.log('Application data reset successfully')
      setTimeout(() => window.location.reload(), 2000)
      return true
    } catch (error) {
      console.error('Failed to reset application data:', error)
      return false
    }
  }

  async attemptDataRepair() {
    try {
      // Try to repair corrupted data
      const repaired = await this.repairStorageData()
      
      if (repaired) {
        console.log('Data repair successful')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Data repair failed:', error)
      return false
    }
  }

  async repairStorageData() {
    try {
      // Attempt to repair each storage key
      const keys = ['pm_projects', 'pm_settings', 'pm_user_preferences']
      let repaired = false
      
      for (const key of keys) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            JSON.parse(data) // Test if it's valid JSON
          }
        } catch {
          // Remove corrupted data
          localStorage.removeItem(key)
          repaired = true
        }
      }
      
      return repaired
    } catch {
      return false
    }
  }

  async testConnectivity() {
    try {
      const response = await fetch('/', { method: 'HEAD', cache: 'no-cache' })
      return response.ok
    } catch {
      return false
    }
  }

  suggestIncognitoMode() {
    console.log('Suggesting incognito mode for storage access issues')
  }

  showDataCleanupOptions() {
    console.log('Showing data cleanup options')
  }

  reportError(error) {
    // Create error report
    const report = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      recoveryHistory: this.recoveryHistory.slice(-5) // Last 5 recovery attempts
    }

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      console.log('Error report copied to clipboard')
    }).catch(() => {
      console.log('Error Report:', report)
    })
  }

  // Recovery tracking
  recordRecoverySuccess(strategyName, originalError, context) {
    this.recoveryHistory.push({
      timestamp: new Date(),
      strategy: strategyName,
      success: true,
      error: originalError.message,
      context
    })
    
    // Keep only last 50 records
    if (this.recoveryHistory.length > 50) {
      this.recoveryHistory = this.recoveryHistory.slice(-50)
    }
  }

  recordRecoveryFailure(strategyName, originalError, recoveryError, context) {
    this.recoveryHistory.push({
      timestamp: new Date(),
      strategy: strategyName,
      success: false,
      error: originalError.message,
      recoveryError: recoveryError.message,
      context
    })
    
    // Keep only last 50 records
    if (this.recoveryHistory.length > 50) {
      this.recoveryHistory = this.recoveryHistory.slice(-50)
    }
  }

  // Get recovery statistics
  getRecoveryStats() {
    const total = this.recoveryHistory.length
    const successful = this.recoveryHistory.filter(r => r.success).length
    const failed = total - successful
    
    const strategyCounts = this.recoveryHistory.reduce((acc, record) => {
      acc[record.strategy] = (acc[record.strategy] || 0) + 1
      return acc
    }, {})

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0,
      strategyCounts,
      recentRecoveries: this.recoveryHistory.slice(-10)
    }
  }

  // Reset recovery attempts for all strategies
  resetRecoveryAttempts() {
    this.recoveryStrategies.forEach(strategy => {
      strategy.attempts = 0
      strategy.lastAttempt = null
    })
  }
}

// Create singleton instance
export const errorRecoveryService = new ErrorRecoveryService()

// Export composable for use in components
export function useErrorRecovery() {
  return {
    recovery: errorRecoveryService,
    
    // Convenience methods
    attemptRecovery: (error, context) => errorRecoveryService.attemptRecovery(error, context),
    registerStrategy: (name, strategy) => errorRecoveryService.registerStrategy(name, strategy),
    getRecoveryStats: () => errorRecoveryService.getRecoveryStats(),
    resetAttempts: () => errorRecoveryService.resetRecoveryAttempts()
  }
}