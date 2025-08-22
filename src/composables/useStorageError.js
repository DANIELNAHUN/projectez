/**
 * Composable for handling storage errors and recovery
 */

import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from './useToast.js'
import { persistenceUtils } from '../store/plugins/persistencePlugin.js'
import { migrationService } from '../services/migrationService.js'

export function useStorageError() {
  const store = useStore()
  const { success, error, warning, info } = useToast()
  
  const isRecovering = ref(false)
  const storageInfo = ref(null)
  const lastError = ref(null)

  // Computed properties
  const hasStorageError = computed(() => {
    return store.getters['projects/error'] || 
           store.getters['tasks/error'] || 
           store.getters['calendar/error'] || 
           store.getters['gantt/error']
  })

  const isStorageAvailable = computed(() => {
    return persistenceUtils.isStorageAvailable()
  })

  // Methods
  const checkStorageHealth = async () => {
    try {
      storageInfo.value = persistenceUtils.getStorageInfo()
      return storageInfo.value
    } catch (error) {
      lastError.value = error.message
      return null
    }
  }

  const attemptRecovery = async () => {
    if (isRecovering.value) return

    isRecovering.value = true
    lastError.value = null

    try {
      const result = await persistenceUtils.attemptRecovery(store)
      
      if (result.success) {
        success(
          'Recuperación Exitosa',
          'Los datos se han recuperado correctamente'
        )
        
        // Clear any existing errors
        store.commit('projects/SET_ERROR', null)
        store.commit('tasks/SET_ERROR', null)
        store.commit('calendar/SET_ERROR', null)
        store.commit('gantt/SET_ERROR', null)
        
        return true
      } else {
        lastError.value = result.error
        
        error(
          'Error de Recuperación',
          result.suggestion || 'No se pudieron recuperar los datos'
        )
        
        return false
      }
    } catch (recoveryError) {
      lastError.value = recoveryError.message
      
      error(
        'Error de Recuperación',
        'Error inesperado durante la recuperación'
      )
      
      return false
    } finally {
      isRecovering.value = false
    }
  }

  const exportData = () => {
    try {
      const data = persistenceUtils.exportData()
      
      // Create and download file
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = `project-manager-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      success(
        'Exportación Exitosa',
        'Los datos se han exportado correctamente'
      )
      
      return true
    } catch (exportError) {
      lastError.value = exportError.message
      
      error(
        'Error de Exportación',
        exportError.message
      )
      
      return false
    }
  }

  const importData = async (file) => {
    if (!file) return false

    try {
      const text = await file.text()
      const result = await persistenceUtils.importData(text, store)
      
      if (result.success) {
        success(
          'Importación Exitosa',
          'Los datos se han importado correctamente'
        )
        
        return true
      }
    } catch (importError) {
      lastError.value = importError.message
      
      error(
        'Error de Importación',
        importError.message
      )
    }
    
    return false
  }

  const clearAllData = async () => {
    try {
      // Show confirmation dialog would be handled by the component
      // This just performs the actual clearing
      
      await store.dispatch('projects/clearAllProjects')
      
      info(
        'Datos Eliminados',
        'Todos los datos han sido eliminados'
      )
      
      return true
    } catch (clearError) {
      lastError.value = clearError.message
      
      error(
        'Error al Limpiar',
        clearError.message
      )
      
      return false
    }
  }

  const handleStorageError = (error, context = '') => {
    lastError.value = error
    
    let severity = 'error'
    let summary = 'Error de Almacenamiento'
    let detail = error
    
    // Customize message based on error type
    if (error.includes('QuotaExceededError') || error.includes('espacio de almacenamiento')) {
      severity = 'warn'
      summary = 'Espacio Insuficiente'
      detail = 'El almacenamiento local está lleno. Considera exportar y limpiar datos antiguos.'
    } else if (error.includes('no se pudo')) {
      summary = 'Error de Acceso'
      detail = 'No se puede acceder al almacenamiento local. Verifica los permisos del navegador.'
    }
    
    const message = context ? `${context}: ${detail}` : detail
    
    if (severity === 'error') {
      error(summary, message)
    } else if (severity === 'warn') {
      warning(summary, message)
    } else {
      info(summary, message)
    }
  }

  const getStorageStats = () => {
    return storageInfo.value || {
      available: false,
      projectCount: 0,
      approximateSize: 0,
      sizeFormatted: '0 Bytes'
    }
  }

  const getMigrationInfo = () => {
    try {
      return migrationService.getMigrationInfo()
    } catch (error) {
      return {
        currentVersion: 'unknown',
        targetVersion: 'unknown',
        needsMigration: false,
        pendingMigrations: [],
        error: error.message
      }
    }
  }

  // Initialize storage info
  checkStorageHealth()

  return {
    // State
    isRecovering,
    storageInfo,
    lastError,
    
    // Computed
    hasStorageError,
    isStorageAvailable,
    
    // Methods
    checkStorageHealth,
    attemptRecovery,
    exportData,
    importData,
    clearAllData,
    handleStorageError,
    getStorageStats,
    getMigrationInfo
  }
}