/**
 * Global error handler composable
 */

import { ref, computed, readonly } from 'vue'
import { useToast } from './useToast.js'
import { ValidationError } from '../utils/validation.js'

// Global error state
const globalErrors = ref([])
const isHandlingError = ref(false)

export function useErrorHandler() {
  const { error: showErrorToast, warning: showWarningToast, info: showInfoToast } = useToast()

  // Error types
  const ERROR_TYPES = {
    VALIDATION: 'validation',
    STORAGE: 'storage',
    NETWORK: 'network',
    PERMISSION: 'permission',
    BUSINESS: 'business',
    SYSTEM: 'system',
    USER: 'user'
  }

  // Error severity levels
  const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }

  // Computed properties
  const hasGlobalErrors = computed(() => globalErrors.value.length > 0)
  const criticalErrors = computed(() => 
    globalErrors.value.filter(error => error.severity === ERROR_SEVERITY.CRITICAL)
  )

  // Add error to global state
  const addGlobalError = (error) => {
    const errorId = Date.now() + Math.random()
    const globalError = {
      id: errorId,
      ...error,
      timestamp: new Date(),
      resolved: false
    }
    
    globalErrors.value.push(globalError)
    return errorId
  }

  // Remove error from global state
  const removeGlobalError = (errorId) => {
    const index = globalErrors.value.findIndex(error => error.id === errorId)
    if (index > -1) {
      globalErrors.value.splice(index, 1)
    }
  }

  // Mark error as resolved
  const resolveGlobalError = (errorId) => {
    const error = globalErrors.value.find(error => error.id === errorId)
    if (error) {
      error.resolved = true
    }
  }

  // Clear all global errors
  const clearGlobalErrors = () => {
    globalErrors.value = []
  }

  // Determine error type from error object
  const determineErrorType = (error) => {
    if (error instanceof ValidationError) {
      return ERROR_TYPES.VALIDATION
    }
    
    if (error.message) {
      const message = error.message.toLowerCase()
      
      if (message.includes('storage') || message.includes('localstorage') || message.includes('quota')) {
        return ERROR_TYPES.STORAGE
      }
      
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        return ERROR_TYPES.NETWORK
      }
      
      if (message.includes('permission') || message.includes('access') || message.includes('denied')) {
        return ERROR_TYPES.PERMISSION
      }
      
      if (message.includes('not found') || message.includes('invalid') || message.includes('duplicate')) {
        return ERROR_TYPES.BUSINESS
      }
    }
    
    return ERROR_TYPES.SYSTEM
  }

  // Determine error severity
  const determineErrorSeverity = (error, type) => {
    if (type === ERROR_TYPES.STORAGE && error.message?.includes('quota')) {
      return ERROR_SEVERITY.CRITICAL
    }
    
    if (type === ERROR_TYPES.VALIDATION) {
      return ERROR_SEVERITY.LOW
    }
    
    if (type === ERROR_TYPES.PERMISSION) {
      return ERROR_SEVERITY.HIGH
    }
    
    if (type === ERROR_TYPES.BUSINESS) {
      return ERROR_SEVERITY.MEDIUM
    }
    
    return ERROR_SEVERITY.MEDIUM
  }

  // Get user-friendly error message
  const getUserFriendlyMessage = (error, type) => {
    const defaultMessages = {
      [ERROR_TYPES.VALIDATION]: 'Por favor, revisa los datos ingresados.',
      [ERROR_TYPES.STORAGE]: 'Problema con el almacenamiento de datos. Intenta exportar tus datos como respaldo.',
      [ERROR_TYPES.NETWORK]: 'Problema de conexión. Verifica tu conexión a internet.',
      [ERROR_TYPES.PERMISSION]: 'No tienes permisos suficientes para realizar esta acción.',
      [ERROR_TYPES.BUSINESS]: 'No se pudo completar la operación debido a reglas de negocio.',
      [ERROR_TYPES.SYSTEM]: 'Ocurrió un error inesperado. Intenta nuevamente.',
      [ERROR_TYPES.USER]: 'Acción no válida. Revisa los datos ingresados.'
    }

    // Check for specific error patterns
    if (error.message) {
      const message = error.message.toLowerCase()
      
      if (message.includes('quota') || message.includes('storage full')) {
        return 'El almacenamiento local está lleno. Exporta y limpia datos antiguos para continuar.'
      }
      
      if (message.includes('not found')) {
        return 'El elemento solicitado no fue encontrado. Puede haber sido eliminado.'
      }
      
      if (message.includes('duplicate') || message.includes('already exists')) {
        return 'Ya existe un elemento con esos datos. Usa valores únicos.'
      }
      
      if (message.includes('invalid date')) {
        return 'La fecha ingresada no es válida. Usa el formato correcto.'
      }
      
      if (message.includes('nesting level')) {
        return 'Se ha alcanzado el límite máximo de anidación de tareas.'
      }
    }

    return defaultMessages[type] || defaultMessages[ERROR_TYPES.SYSTEM]
  }

  // Get recovery suggestions
  const getRecoverySuggestions = (error, type) => {
    const suggestions = []

    switch (type) {
      case ERROR_TYPES.STORAGE:
        suggestions.push('Exportar datos como respaldo')
        suggestions.push('Limpiar datos antiguos')
        suggestions.push('Verificar espacio disponible en el navegador')
        break
        
      case ERROR_TYPES.VALIDATION:
        suggestions.push('Revisar los campos marcados en rojo')
        suggestions.push('Verificar que todos los campos requeridos estén completos')
        break
        
      case ERROR_TYPES.BUSINESS:
        suggestions.push('Verificar que los datos cumplan con las reglas de negocio')
        suggestions.push('Contactar al administrador si el problema persiste')
        break
        
      case ERROR_TYPES.PERMISSION:
        suggestions.push('Verificar permisos del navegador')
        suggestions.push('Intentar en modo incógnito')
        break
        
      default:
        suggestions.push('Recargar la página')
        suggestions.push('Intentar nuevamente en unos minutos')
        suggestions.push('Verificar la consola del navegador para más detalles')
    }

    return suggestions
  }

  // Main error handling function
  const handleError = (error, context = '', options = {}) => {
    if (isHandlingError.value) {
      console.warn('Error handler is already processing an error, skipping:', error)
      return
    }

    isHandlingError.value = true

    try {
      console.error(`Error in ${context}:`, error)

      const type = options.type || determineErrorType(error)
      const severity = options.severity || determineErrorSeverity(error, type)
      const userMessage = options.userMessage || getUserFriendlyMessage(error, type)
      const suggestions = options.suggestions || getRecoverySuggestions(error, type)

      // Create error object
      const errorObj = {
        originalError: error,
        type,
        severity,
        context,
        message: error.message || 'Error desconocido',
        userMessage,
        suggestions,
        canRetry: options.canRetry !== false,
        retryAction: options.retryAction || null,
        timestamp: new Date()
      }

      // Add to global errors if it's critical or if specified
      if (severity === ERROR_SEVERITY.CRITICAL || options.addToGlobal) {
        addGlobalError(errorObj)
      }

      // Show appropriate toast notification
      const title = options.title || getErrorTitle(type, severity)
      
      switch (severity) {
        case ERROR_SEVERITY.CRITICAL:
          showErrorToast(title, userMessage, {
            persistent: true,
            actions: suggestions.length > 0 ? [
              {
                label: 'Ver Soluciones',
                action: () => showRecoverySuggestions(suggestions)
              }
            ] : undefined
          })
          break
          
        case ERROR_SEVERITY.HIGH:
          showErrorToast(title, userMessage, {
            duration: 8000
          })
          break
          
        case ERROR_SEVERITY.MEDIUM:
          showWarningToast(title, userMessage)
          break
          
        case ERROR_SEVERITY.LOW:
          showInfoToast(title, userMessage, {
            duration: 3000
          })
          break
      }

      // Call custom error handler if provided
      if (options.onError && typeof options.onError === 'function') {
        options.onError(errorObj)
      }

      return errorObj

    } catch (handlerError) {
      console.error('Error in error handler:', handlerError)
      showErrorToast(
        'Error del Sistema',
        'Ocurrió un error inesperado en el manejo de errores.'
      )
    } finally {
      isHandlingError.value = false
    }
  }

  // Get error title based on type and severity
  const getErrorTitle = (type, severity) => {
    const titles = {
      [ERROR_TYPES.VALIDATION]: 'Error de Validación',
      [ERROR_TYPES.STORAGE]: severity === ERROR_SEVERITY.CRITICAL ? 'Error Crítico de Almacenamiento' : 'Error de Almacenamiento',
      [ERROR_TYPES.NETWORK]: 'Error de Conexión',
      [ERROR_TYPES.PERMISSION]: 'Error de Permisos',
      [ERROR_TYPES.BUSINESS]: 'Error de Operación',
      [ERROR_TYPES.SYSTEM]: severity === ERROR_SEVERITY.CRITICAL ? 'Error Crítico del Sistema' : 'Error del Sistema',
      [ERROR_TYPES.USER]: 'Error de Usuario'
    }

    return titles[type] || 'Error'
  }

  // Show recovery suggestions
  const showRecoverySuggestions = (suggestions) => {
    const suggestionText = suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
    showInfoToast(
      'Sugerencias de Recuperación',
      suggestionText,
      { duration: 10000 }
    )
  }

  // Handle validation errors specifically
  const handleValidationError = (error, context = '') => {
    return handleError(error, context, {
      type: ERROR_TYPES.VALIDATION,
      severity: ERROR_SEVERITY.LOW,
      title: 'Error de Validación'
    })
  }

  // Handle storage errors specifically
  const handleStorageError = (error, context = '') => {
    const isQuotaError = error.message?.toLowerCase().includes('quota')
    
    return handleError(error, context, {
      type: ERROR_TYPES.STORAGE,
      severity: isQuotaError ? ERROR_SEVERITY.CRITICAL : ERROR_SEVERITY.HIGH,
      addToGlobal: true,
      canRetry: !isQuotaError
    })
  }

  // Handle business logic errors
  const handleBusinessError = (error, context = '') => {
    return handleError(error, context, {
      type: ERROR_TYPES.BUSINESS,
      severity: ERROR_SEVERITY.MEDIUM
    })
  }

  // Retry mechanism
  const createRetryHandler = (action, maxRetries = 3, delay = 1000) => {
    return async (...args) => {
      let lastError
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await action(...args)
        } catch (error) {
          lastError = error
          
          if (attempt === maxRetries) {
            handleError(error, `Failed after ${maxRetries} attempts`, {
              canRetry: false
            })
            throw error
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay * attempt))
        }
      }
    }
  }

  return {
    // Constants
    ERROR_TYPES,
    ERROR_SEVERITY,
    
    // State
    globalErrors: readonly(globalErrors),
    isHandlingError: readonly(isHandlingError),
    
    // Computed
    hasGlobalErrors,
    criticalErrors,
    
    // Methods
    handleError,
    handleValidationError,
    handleStorageError,
    handleBusinessError,
    addGlobalError,
    removeGlobalError,
    resolveGlobalError,
    clearGlobalErrors,
    createRetryHandler,
    
    // Utilities
    determineErrorType,
    determineErrorSeverity,
    getUserFriendlyMessage,
    getRecoverySuggestions
  }
}