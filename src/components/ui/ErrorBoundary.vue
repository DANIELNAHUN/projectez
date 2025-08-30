<template>
  <div>
    <!-- Normal content when no error -->
    <slot v-if="!hasError" />
    
    <!-- Error fallback UI -->
    <div v-else class="error-boundary">
      <div class="min-h-[200px] flex items-center justify-center p-6">
        <div class="max-w-md w-full">
          <!-- Error Icon -->
          <div class="text-center mb-6">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
              <i class="pi pi-exclamation-triangle text-2xl text-red-600 dark:text-red-400"></i>
            </div>
          </div>
          
          <!-- Error Content -->
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {{ errorTitle }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {{ errorMessage }}
            </p>
            
            <!-- Error Details (collapsible) -->
            <div v-if="showDetails" class="mb-6">
              <button
                @click="detailsExpanded = !detailsExpanded"
                class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center mx-auto"
              >
                <i :class="['pi', detailsExpanded ? 'pi-chevron-up' : 'pi-chevron-down', 'mr-1']"></i>
                {{ detailsExpanded ? 'Ocultar detalles' : 'Ver detalles técnicos' }}
              </button>
              
              <div v-if="detailsExpanded" class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
                <div class="text-xs font-mono text-gray-700 dark:text-gray-300">
                  <div class="mb-2">
                    <strong>Error:</strong> {{ error?.message || 'Error desconocido' }}
                  </div>
                  <div v-if="error?.stack" class="mb-2">
                    <strong>Stack:</strong>
                    <pre class="mt-1 whitespace-pre-wrap text-xs">{{ formatStack(error.stack) }}</pre>
                  </div>
                  <div class="mb-2">
                    <strong>Componente:</strong> {{ componentName || 'Desconocido' }}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {{ errorTimestamp }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                @click="retry"
                :disabled="!canRetry || isRetrying"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LoadingSpinner v-if="isRetrying" size="xs" color="white" class="mr-2" />
                <i v-else class="pi pi-refresh mr-2"></i>
                {{ isRetrying ? 'Reintentando...' : 'Reintentar' }}
              </button>
              
              <button
                @click="reportError"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i class="pi pi-send mr-2"></i>
                Reportar Error
              </button>
              
              <button
                v-if="showReload"
                @click="reloadPage"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i class="pi pi-refresh mr-2"></i>
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onErrorCaptured, onMounted } from 'vue'
import { useErrorHandler } from '../../composables/useErrorHandler.js'
import { useNotifications } from '../../services/notificationService.js'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  // Custom error title
  title: {
    type: String,
    default: ''
  },
  
  // Custom error message
  message: {
    type: String,
    default: ''
  },
  
  // Whether to show technical details
  showDetails: {
    type: Boolean,
    default: true
  },
  
  // Whether retry is possible
  canRetry: {
    type: Boolean,
    default: true
  },
  
  // Whether to show reload page option
  showReload: {
    type: Boolean,
    default: true
  },
  
  // Custom retry handler
  onRetry: {
    type: Function,
    default: null
  },
  
  // Component name for debugging
  componentName: {
    type: String,
    default: ''
  },
  
  // Fallback component to render instead of error UI
  fallbackComponent: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['error', 'retry', 'report'])

// Composables
const { handleError } = useErrorHandler()
const { error: showErrorNotification } = useNotifications()

// State
const hasError = ref(false)
const error = ref(null)
const errorTimestamp = ref('')
const detailsExpanded = ref(false)
const isRetrying = ref(false)
const retryCount = ref(0)
const maxRetries = ref(3)

// Computed
const errorTitle = computed(() => {
  if (props.title) return props.title
  
  if (error.value) {
    const errorType = determineErrorType(error.value)
    const titles = {
      ai_service: 'Error del Servicio de IA',
      date_calculation: 'Error de Cálculo de Fechas',
      import_export: 'Error de Importación/Exportación',
      validation: 'Error de Validación',
      storage: 'Error de Almacenamiento',
      network: 'Error de Conexión',
      component: 'Error del Componente'
    }
    return titles[errorType] || 'Error Inesperado'
  }
  
  return 'Error Inesperado'
})

const errorMessage = computed(() => {
  if (props.message) return props.message
  
  if (error.value) {
    return getUserFriendlyMessage(error.value)
  }
  
  return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
})

// Error capture
onErrorCaptured((err, instance, info) => {
  console.error('Error captured by ErrorBoundary:', err, info)
  
  captureError(err, {
    componentInfo: info,
    componentName: props.componentName || instance?.$options.name || 'Unknown'
  })
  
  return false // Prevent error from propagating
})

// Methods
const captureError = (err, context = {}) => {
  hasError.value = true
  error.value = err
  errorTimestamp.value = new Date().toLocaleString('es-ES')
  retryCount.value = 0
  
  // Handle error through global error handler
  handleError(err, `ErrorBoundary: ${props.componentName || 'Unknown'}`, {
    addToGlobal: true,
    context: context
  })
  
  // Emit error event
  emit('error', {
    error: err,
    context,
    timestamp: errorTimestamp.value
  })
}

const determineErrorType = (err) => {
  const message = err.message?.toLowerCase() || ''
  
  if (message.includes('openai') || message.includes('ai service')) {
    return 'ai_service'
  }
  
  if (message.includes('date') || message.includes('working day')) {
    return 'date_calculation'
  }
  
  if (message.includes('import') || message.includes('export') || message.includes('json')) {
    return 'import_export'
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation'
  }
  
  if (message.includes('storage') || message.includes('quota')) {
    return 'storage'
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'network'
  }
  
  return 'component'
}

const getUserFriendlyMessage = (err) => {
  const message = err.message?.toLowerCase() || ''
  
  if (message.includes('openai')) {
    if (message.includes('quota')) {
      return 'Se ha agotado la cuota de la API de OpenAI. Verifica tu configuración de facturación.'
    }
    if (message.includes('api key')) {
      return 'La clave API de OpenAI no es válida. Verifica tu configuración.'
    }
    if (message.includes('rate limit')) {
      return 'Se ha excedido el límite de solicitudes. Intenta nuevamente en unos minutos.'
    }
    return 'Error en el servicio de IA. Verifica tu configuración y conexión.'
  }
  
  if (message.includes('date') || message.includes('working day')) {
    return 'Error en el cálculo de fechas. Verifica que las fechas sean válidas y estén en el rango correcto.'
  }
  
  if (message.includes('json')) {
    return 'Error al procesar el archivo JSON. Verifica que el formato sea correcto.'
  }
  
  if (message.includes('storage') || message.includes('quota')) {
    return 'Error de almacenamiento. El espacio local puede estar lleno. Considera exportar y limpiar datos.'
  }
  
  if (message.includes('network')) {
    return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.'
  }
  
  return 'Ha ocurrido un error inesperado. Los detalles técnicos están disponibles abajo.'
}

const formatStack = (stack) => {
  if (!stack) return 'No disponible'
  
  // Limit stack trace to first 5 lines for readability
  const lines = stack.split('\n').slice(0, 5)
  return lines.join('\n')
}

const retry = async () => {
  if (!props.canRetry || isRetrying.value || retryCount.value >= maxRetries.value) {
    return
  }
  
  isRetrying.value = true
  retryCount.value++
  
  try {
    // Custom retry handler
    if (props.onRetry) {
      await props.onRetry()
    }
    
    // Reset error state
    hasError.value = false
    error.value = null
    detailsExpanded.value = false
    
    emit('retry', { attempt: retryCount.value })
    
    showErrorNotification(
      'Reintento Exitoso',
      'El componente se ha recuperado correctamente.',
      { type: 'success', duration: 3000 }
    )
    
  } catch (retryError) {
    console.error('Retry failed:', retryError)
    
    if (retryCount.value >= maxRetries.value) {
      showErrorNotification(
        'Reintento Fallido',
        `Se agotaron los ${maxRetries.value} intentos. Considera recargar la página.`,
        { persistent: true }
      )
    } else {
      showErrorNotification(
        'Reintento Fallido',
        `Intento ${retryCount.value} de ${maxRetries.value} falló. Puedes intentar nuevamente.`
      )
    }
  } finally {
    isRetrying.value = false
  }
}

const reportError = () => {
  const errorReport = {
    error: {
      message: error.value?.message,
      stack: error.value?.stack,
      name: error.value?.name
    },
    component: props.componentName,
    timestamp: errorTimestamp.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
    retryCount: retryCount.value
  }
  
  // Copy to clipboard
  navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
    showErrorNotification(
      'Reporte Copiado',
      'Los detalles del error se han copiado al portapapeles.',
      { type: 'success' }
    )
  }).catch(() => {
    // Fallback: show in console
    console.log('Error Report:', errorReport)
    showErrorNotification(
      'Reporte Generado',
      'Los detalles del error están disponibles en la consola del navegador.',
      { type: 'info' }
    )
  })
  
  emit('report', errorReport)
}

const reloadPage = () => {
  window.location.reload()
}

// Global error handler for unhandled promise rejections
const handleUnhandledRejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  captureError(new Error(event.reason), {
    type: 'unhandled_rejection'
  })
}

onMounted(() => {
  // Listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
})

// Expose methods for parent components
defineExpose({
  captureError,
  retry,
  hasError: () => hasError.value,
  clearError: () => {
    hasError.value = false
    error.value = null
  }
})
</script>

<style scoped>
.error-boundary {
  min-height: 200px;
}

pre {
  font-size: 10px;
  line-height: 1.4;
  max-height: 150px;
  overflow-y: auto;
}
</style>