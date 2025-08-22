<template>
  <div class="error-boundary">
    <!-- Error State -->
    <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="max-w-md w-full mx-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <!-- Error Icon -->
          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full">
            <i class="pi pi-exclamation-triangle text-2xl text-red-600 dark:text-red-400"></i>
          </div>

          <!-- Error Title -->
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
            {{ errorTitle }}
          </h1>

          <!-- Error Message -->
          <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
            {{ errorMessage }}
          </p>

          <!-- Error Details (collapsible) -->
          <div v-if="showDetails" class="mb-6">
            <button
              @click="detailsExpanded = !detailsExpanded"
              class="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Detalles Técnicos
              </span>
              <i :class="[
                'pi transition-transform',
                detailsExpanded ? 'pi-chevron-up' : 'pi-chevron-down'
              ]"></i>
            </button>
            
            <div v-if="detailsExpanded" class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="space-y-2 text-sm">
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">Error:</span>
                  <code class="block mt-1 p-2 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs break-all">
                    {{ errorDetails.message }}
                  </code>
                </div>
                
                <div v-if="errorDetails.stack">
                  <span class="font-medium text-gray-700 dark:text-gray-300">Stack Trace:</span>
                  <code class="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-xs whitespace-pre-wrap">
                    {{ errorDetails.stack }}
                  </code>
                </div>
                
                <div v-if="errorDetails.componentStack">
                  <span class="font-medium text-gray-700 dark:text-gray-300">Component Stack:</span>
                  <code class="block mt-1 p-2 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs whitespace-pre-wrap">
                    {{ errorDetails.componentStack }}
                  </code>
                </div>
              </div>
            </div>
          </div>

          <!-- Recovery Actions -->
          <div class="space-y-3">
            <button
              @click="handleReload"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <i class="pi pi-refresh mr-2"></i>
              Recargar Aplicación
            </button>

            <button
              v-if="canRetry"
              @click="handleRetry"
              :disabled="isRetrying"
              class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              <i v-if="isRetrying" class="pi pi-spin pi-spinner mr-2"></i>
              <i v-else class="pi pi-replay mr-2"></i>
              {{ isRetrying ? 'Reintentando...' : 'Reintentar' }}
            </button>

            <button
              @click="handleExportData"
              class="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
            >
              <i class="pi pi-download mr-2"></i>
              Exportar Datos
            </button>

            <button
              @click="handleReportError"
              class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              <i class="pi pi-send mr-2"></i>
              Reportar Error
            </button>
          </div>

          <!-- Additional Info -->
          <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
              Error ID: {{ errorId }}<br>
              Timestamp: {{ errorTimestamp }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Normal Content -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script>
import { ref, computed, onErrorCaptured, onMounted } from 'vue'
import { useErrorHandler } from '../../composables/useErrorHandler.js'
import { useStorageError } from '../../composables/useStorageError.js'
import { useNotifications } from '../../services/notificationService.js'

export default {
  name: 'ErrorBoundary',
  props: {
    fallbackComponent: {
      type: Object,
      default: null
    },
    onError: {
      type: Function,
      default: null
    },
    showDetails: {
      type: Boolean,
      default: true
    },
    canRetry: {
      type: Boolean,
      default: true
    },
    maxRetries: {
      type: Number,
      default: 3
    }
  },
  emits: ['error', 'retry', 'recover'],
  setup(props, { emit }) {
    const { handleError, ERROR_TYPES, ERROR_SEVERITY } = useErrorHandler()
    const { exportData } = useStorageError()
    const { error: showErrorToast } = useNotifications()

    // State
    const hasError = ref(false)
    const errorDetails = ref(null)
    const errorId = ref(null)
    const errorTimestamp = ref(null)
    const detailsExpanded = ref(false)
    const isRetrying = ref(false)
    const retryCount = ref(0)

    // Computed
    const errorTitle = computed(() => {
      if (!errorDetails.value) return 'Error Inesperado'
      
      const error = errorDetails.value
      
      if (error.name === 'ChunkLoadError') {
        return 'Error de Carga'
      }
      
      if (error.message?.includes('storage') || error.message?.includes('quota')) {
        return 'Error de Almacenamiento'
      }
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        return 'Error de Conexión'
      }
      
      return 'Error de Aplicación'
    })

    const errorMessage = computed(() => {
      if (!errorDetails.value) return 'Ha ocurrido un error inesperado.'
      
      const error = errorDetails.value
      
      if (error.name === 'ChunkLoadError') {
        return 'No se pudo cargar parte de la aplicación. Esto puede deberse a una actualización reciente.'
      }
      
      if (error.message?.includes('quota')) {
        return 'El almacenamiento local está lleno. Exporta tus datos y limpia el almacenamiento.'
      }
      
      if (error.message?.includes('storage')) {
        return 'Hay un problema con el almacenamiento de datos. Tus datos pueden estar en riesgo.'
      }
      
      if (error.message?.includes('network')) {
        return 'Hay un problema de conexión. Verifica tu conexión a internet.'
      }
      
      return 'Ha ocurrido un error inesperado. Puedes intentar recargar la aplicación.'
    })

    // Error capture
    onErrorCaptured((error, instance, info) => {
      console.error('Error captured by boundary:', error, info)
      
      captureError(error, {
        componentStack: info,
        instance
      })
      
      return false // Prevent error from propagating
    })

    // Global error handler
    const setupGlobalErrorHandlers = () => {
      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason)
        captureError(event.reason, {
          type: 'unhandledrejection'
        })
        event.preventDefault()
      })

      // JavaScript errors
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error)
        captureError(event.error, {
          type: 'javascript',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })

      // Resource loading errors
      window.addEventListener('error', (event) => {
        if (event.target !== window) {
          console.error('Resource loading error:', event.target)
          captureError(new Error(`Failed to load resource: ${event.target.src || event.target.href}`), {
            type: 'resource',
            element: event.target.tagName
          })
        }
      }, true)
    }

    // Capture error
    const captureError = (error, context = {}) => {
      errorId.value = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      errorTimestamp.value = new Date().toLocaleString()
      
      errorDetails.value = {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: error.stack,
        componentStack: context.componentStack,
        ...context
      }
      
      hasError.value = true
      
      // Handle error through error handler
      handleError(error, 'ErrorBoundary', {
        severity: ERROR_SEVERITY.HIGH,
        addToGlobal: true
      })
      
      // Call custom error handler
      if (props.onError) {
        props.onError(error, context)
      }
      
      // Emit error event
      emit('error', {
        error,
        context,
        errorId: errorId.value,
        timestamp: errorTimestamp.value
      })
    }

    // Recovery actions
    const handleReload = () => {
      window.location.reload()
    }

    const handleRetry = async () => {
      if (retryCount.value >= props.maxRetries) {
        showErrorToast(
          'Límite de Reintentos',
          `Se ha alcanzado el límite máximo de ${props.maxRetries} reintentos.`
        )
        return
      }

      isRetrying.value = true
      retryCount.value++

      try {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Reset error state
        hasError.value = false
        errorDetails.value = null
        
        emit('retry', {
          attempt: retryCount.value,
          errorId: errorId.value
        })
        
      } catch (retryError) {
        console.error('Retry failed:', retryError)
        captureError(retryError, { type: 'retry' })
      } finally {
        isRetrying.value = false
      }
    }

    const handleExportData = async () => {
      try {
        await exportData()
      } catch (exportError) {
        console.error('Export failed:', exportError)
        showErrorToast(
          'Error de Exportación',
          'No se pudieron exportar los datos.'
        )
      }
    }

    const handleReportError = () => {
      // Create error report
      const report = {
        errorId: errorId.value,
        timestamp: errorTimestamp.value,
        userAgent: navigator.userAgent,
        url: window.location.href,
        error: errorDetails.value,
        retryCount: retryCount.value
      }

      // Copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
        showErrorToast(
          'Reporte Copiado',
          'El reporte de error se ha copiado al portapapeles.'
        )
      }).catch(() => {
        // Fallback: show in console
        console.log('Error Report:', report)
        showErrorToast(
          'Reporte Generado',
          'El reporte de error se ha mostrado en la consola del navegador.'
        )
      })
    }

    // Setup
    onMounted(() => {
      setupGlobalErrorHandlers()
    })

    return {
      // State
      hasError,
      errorDetails,
      errorId,
      errorTimestamp,
      detailsExpanded,
      isRetrying,
      retryCount,
      
      // Computed
      errorTitle,
      errorMessage,
      
      // Methods
      handleReload,
      handleRetry,
      handleExportData,
      handleReportError,
      captureError
    }
  }
}
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
}

code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
}

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>