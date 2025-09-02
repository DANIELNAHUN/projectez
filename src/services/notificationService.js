/**
 * Enhanced notification service with comprehensive user feedback
 */

import { useToast } from '../composables/useToast.js'

class NotificationService {
  constructor() {
    this.notificationQueue = []
    this.isProcessingQueue = false
  }

  // Get toast instance
  getToast() {
    return useToast()
  }

  // Success notifications
  success(title, message, options = {}) {
    const toast = this.getToast()
    return toast.success(title, message, {
      icon: 'pi pi-check-circle',
      duration: 4000,
      ...options
    })
  }

  // Error notifications with enhanced features
  error(title, message, options = {}) {
    const toast = this.getToast()
    return toast.error(title, message, {
      icon: 'pi pi-exclamation-triangle',
      duration: 8000,
      persistent: options.persistent || false,
      actions: options.actions || null,
      ...options
    })
  }

  // Warning notifications
  warning(title, message, options = {}) {
    const toast = this.getToast()
    return toast.warning(title, message, {
      icon: 'pi pi-exclamation-circle',
      duration: 6000,
      ...options
    })
  }

  // Info notifications
  info(title, message, options = {}) {
    const toast = this.getToast()
    return toast.info(title, message, {
      icon: 'pi pi-info-circle',
      duration: 5000,
      ...options
    })
  }

  // Operation-specific notifications
  operationSuccess(operation, entity = '') {
    const messages = {
      create: `${entity} creado exitosamente`,
      update: `${entity} actualizado exitosamente`,
      delete: `${entity} eliminado exitosamente`,
      save: `${entity} guardado exitosamente`,
      import: `${entity} importado exitosamente`,
      export: `${entity} exportado exitosamente`,
      restore: `${entity} restaurado exitosamente`
    }

    const message = messages[operation] || `Operación completada exitosamente`
    return this.success('Operación Exitosa', message)
  }

  operationError(operation, entity = '', error = null) {
    const messages = {
      create: `Error al crear ${entity}`,
      update: `Error al actualizar ${entity}`,
      delete: `Error al eliminar ${entity}`,
      save: `Error al guardar ${entity}`,
      import: `Error al importar ${entity}`,
      export: `Error al exportar ${entity}`,
      restore: `Error al restaurar ${entity}`,
      load: `Error al cargar ${entity}`
    }

    const title = messages[operation] || 'Error en la operación'
    const message = error?.message || 'Ocurrió un error inesperado'
    
    return this.error(title, message, {
      persistent: operation === 'save' || operation === 'import'
    })
  }

  // Validation notifications
  validationError(errors, context = 'formulario') {
    if (Array.isArray(errors)) {
      const errorCount = errors.length
      const message = `Se encontraron ${errorCount} error${errorCount > 1 ? 'es' : ''} en el ${context}`
      
      return this.error('Errores de Validación', message, {
        actions: [
          {
            label: 'Ver Detalles',
            action: () => this.showValidationDetails(errors)
          }
        ]
      })
    } else {
      return this.error('Error de Validación', errors.message || 'Datos inválidos')
    }
  }

  showValidationDetails(errors) {
    const errorList = errors.map((error, index) => 
      `${index + 1}. ${error.field ? `${error.field}: ` : ''}${error.message}`
    ).join('\n')

    return this.info('Detalles de Validación', errorList, {
      duration: 10000
    })
  }

  // Storage-related notifications
  storageQuotaExceeded() {
    return this.error(
      'Almacenamiento Lleno',
      'El espacio de almacenamiento local está lleno. Exporta y limpia datos antiguos.',
      {
        persistent: true,
        actions: [
          {
            label: 'Exportar Datos',
            action: () => this.triggerDataExport()
          },
          {
            label: 'Limpiar Datos',
            action: () => this.triggerDataCleanup()
          }
        ]
      }
    )
  }

  storageError(error) {
    const isQuotaError = error.message?.toLowerCase().includes('quota')
    
    if (isQuotaError) {
      return this.storageQuotaExceeded()
    }

    return this.error(
      'Error de Almacenamiento',
      'No se pudieron guardar los datos. Intenta exportar como respaldo.',
      {
        actions: [
          {
            label: 'Exportar Respaldo',
            action: () => this.triggerDataExport()
          }
        ]
      }
    )
  }

  // Progress notifications
  showProgress(title, message, progress = 0) {
    return this.info(title, message, {
      persistent: true,
      showProgress: true,
      progress,
      closable: false
    })
  }

  updateProgress(toastId, progress, message = null) {
    const toast = this.getToast()
    const toastInstance = toast.toasts.find(t => t.id === toastId)
    if (toastInstance && toastInstance.instance) {
      toastInstance.instance.updateProgress(progress, message)
    }
  }

  completeProgress(toastId, successMessage = 'Operación completada') {
    const toast = this.getToast()
    toast.close(toastId)
    return this.success('Completado', successMessage)
  }

  // Batch operations
  batchOperationStart(operation, count) {
    const message = `Procesando ${count} elemento${count > 1 ? 's' : ''}...`
    return this.showProgress(`${operation} en Lote`, message, 0)
  }

  batchOperationProgress(toastId, completed, total, operation) {
    const progress = Math.round((completed / total) * 100)
    const message = `${completed} de ${total} ${operation}${completed > 1 ? 's' : ''} procesado${completed > 1 ? 's' : ''}`
    this.updateProgress(toastId, progress, message)
  }

  batchOperationComplete(toastId, operation, successCount, errorCount = 0) {
    const toast = this.getToast()
    toast.close(toastId)
    
    if (errorCount === 0) {
      return this.success(
        'Operación Completada',
        `${successCount} ${operation}${successCount > 1 ? 's' : ''} procesado${successCount > 1 ? 's' : ''} exitosamente`
      )
    } else {
      return this.warning(
        'Operación Completada con Errores',
        `${successCount} exitoso${successCount > 1 ? 's' : ''}, ${errorCount} error${errorCount > 1 ? 'es' : ''}`
      )
    }
  }

  // Confirmation notifications
  confirmAction(title, message, onConfirm, onCancel = null) {
    return this.warning(title, message, {
      persistent: true,
      actions: [
        {
          label: 'Confirmar',
          action: () => {
            if (onConfirm) onConfirm()
          },
          style: 'danger'
        },
        {
          label: 'Cancelar',
          action: () => {
            if (onCancel) onCancel()
          }
        }
      ]
    })
  }

  // System notifications
  systemMaintenance(message = 'El sistema está en mantenimiento') {
    return this.warning('Mantenimiento del Sistema', message, {
      persistent: true,
      icon: 'pi pi-wrench'
    })
  }

  connectionLost() {
    return this.error(
      'Conexión Perdida',
      'Se perdió la conexión. Algunos datos pueden no guardarse.',
      {
        persistent: true,
        icon: 'pi pi-wifi'
      }
    )
  }

  connectionRestored() {
    return this.success(
      'Conexión Restaurada',
      'La conexión se ha restablecido correctamente.',
      {
        icon: 'pi pi-wifi'
      }
    )
  }

  // Queue management for multiple notifications
  addToQueue(notification) {
    this.notificationQueue.push(notification)
    this.processQueue()
  }

  async processQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift()
      
      // Show notification
      const { type, title, message, options } = notification
      this[type](title, message, options)
      
      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    this.isProcessingQueue = false
  }

  // Helper methods for common actions
  triggerDataExport() {
    // This would trigger the data export functionality
    // Implementation depends on the storage service
    console.log('Triggering data export...')
    // Could emit an event or call a service method
    window.dispatchEvent(new CustomEvent('trigger-data-export'))
  }

  triggerDataCleanup() {
    // This would trigger the data cleanup functionality
    console.log('Triggering data cleanup...')
    window.dispatchEvent(new CustomEvent('trigger-data-cleanup'))
  }

  // Clear all notifications
  clearAll() {
    const toast = this.getToast()
    toast.closeAll()
    this.notificationQueue = []
  }
}

// Create singleton instance
export const notificationService = new NotificationService()

// Export composable for use in components
export function useNotifications() {
  return {
    notify: notificationService,
    
    // Convenience methods
    success: (title, message, options) => notificationService.success(title, message, options),
    error: (title, message, options) => notificationService.error(title, message, options),
    warning: (title, message, options) => notificationService.warning(title, message, options),
    info: (title, message, options) => notificationService.info(title, message, options),
    
    // Operation shortcuts
    operationSuccess: (operation, entity) => notificationService.operationSuccess(operation, entity),
    operationError: (operation, entity, error) => notificationService.operationError(operation, entity, error),
    operationWarning: (message) => notificationService.warning('Advertencia', message),
    
    // Validation shortcuts
    validationError: (errors, context) => notificationService.validationError(errors, context),
    
    // Storage shortcuts
    storageError: (error) => notificationService.storageError(error),
    
    // Progress shortcuts
    showProgress: (title, message, progress) => notificationService.showProgress(title, message, progress),
    updateProgress: (toastId, progress, message) => notificationService.updateProgress(toastId, progress, message),
    completeProgress: (toastId, message) => notificationService.completeProgress(toastId, message)
  }
}