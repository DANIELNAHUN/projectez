/**
 * Retry mechanism composable with exponential backoff and error handling
 */

import { ref, computed } from 'vue'
import { useErrorHandler } from './useErrorHandler.js'
import { useNotifications } from '../services/notificationService.js'

export function useRetry(options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBase = 2,
    jitter = true,
    retryCondition = null, // Function to determine if error should be retried
    onRetry = null, // Callback before each retry
    onMaxRetriesReached = null // Callback when max retries reached
  } = options

  const { handleError } = useErrorHandler()
  const { error: showErrorNotification, info: showInfoNotification } = useNotifications()

  // State
  const isRetrying = ref(false)
  const retryCount = ref(0)
  const lastError = ref(null)
  const retryHistory = ref([])

  // Computed
  const canRetry = computed(() => {
    return retryCount.value < maxRetries && !isRetrying.value
  })

  const nextRetryDelay = computed(() => {
    if (retryCount.value >= maxRetries) return 0
    
    let delay = baseDelay * Math.pow(exponentialBase, retryCount.value)
    delay = Math.min(delay, maxDelay)
    
    // Add jitter to prevent thundering herd
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }
    
    return Math.round(delay)
  })

  // Default retry condition - don't retry on certain error types
  const defaultRetryCondition = (error) => {
    const message = error.message?.toLowerCase() || ''
    
    // Don't retry on validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return false
    }
    
    // Don't retry on authentication errors
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return false
    }
    
    // Don't retry on quota exceeded (permanent failure)
    if (message.includes('quota exceeded') && !message.includes('rate limit')) {
      return false
    }
    
    // Don't retry on malformed requests
    if (message.includes('bad request') || message.includes('malformed')) {
      return false
    }
    
    // Retry on network, timeout, and temporary service errors
    return true
  }

  // Execute function with retry logic
  const executeWithRetry = async (fn, context = '') => {
    if (typeof fn !== 'function') {
      throw new Error('First argument must be a function')
    }

    // Reset state
    retryCount.value = 0
    lastError.value = null
    retryHistory.value = []
    isRetrying.value = false

    const startTime = Date.now()

    while (retryCount.value <= maxRetries) {
      try {
        // Execute the function
        const result = await fn()
        
        // Success - log retry history if there were retries
        if (retryCount.value > 0) {
          console.log(`Operation succeeded after ${retryCount.value} retries`, {
            context,
            totalTime: Date.now() - startTime,
            retryHistory: retryHistory.value
          })
          
          showInfoNotification(
            'Operación Recuperada',
            `La operación se completó exitosamente después de ${retryCount.value} intento${retryCount.value > 1 ? 's' : ''}.`,
            { duration: 3000 }
          )
        }
        
        return result

      } catch (error) {
        lastError.value = error
        
        // Log retry attempt
        retryHistory.value.push({
          attempt: retryCount.value + 1,
          error: error.message,
          timestamp: new Date().toISOString()
        })

        // Check if we should retry
        const shouldRetry = retryCondition ? retryCondition(error) : defaultRetryCondition(error)
        
        if (!shouldRetry || retryCount.value >= maxRetries) {
          // Handle final error
          const errorContext = `${context} (failed after ${retryCount.value} retries)`
          handleError(error, errorContext, {
            retryHistory: retryHistory.value,
            totalTime: Date.now() - startTime
          })
          
          if (onMaxRetriesReached) {
            onMaxRetriesReached(error, retryCount.value)
          }
          
          throw error
        }

        retryCount.value++
        isRetrying.value = true

        // Call retry callback
        if (onRetry) {
          await onRetry(error, retryCount.value)
        }

        // Show retry notification for user feedback
        if (retryCount.value === 1) {
          showInfoNotification(
            'Reintentando Operación',
            `La operación falló, reintentando automáticamente... (${retryCount.value}/${maxRetries})`,
            { duration: 2000 }
          )
        }

        // Wait before retry
        const delay = nextRetryDelay.value
        console.log(`Retrying in ${delay}ms (attempt ${retryCount.value}/${maxRetries})`, {
          error: error.message,
          context
        })

        await new Promise(resolve => setTimeout(resolve, delay))
        isRetrying.value = false
      }
    }
  }

  // Create a retry wrapper for a specific function
  const createRetryWrapper = (fn, wrapperOptions = {}) => {
    const mergedOptions = { ...options, ...wrapperOptions }
    
    return async (...args) => {
      return executeWithRetry(() => fn(...args), mergedOptions.context || fn.name)
    }
  }

  // Manual retry function (for user-triggered retries)
  const manualRetry = async (fn, context = '') => {
    if (!canRetry.value) {
      throw new Error('Cannot retry: maximum retries reached or already retrying')
    }

    return executeWithRetry(fn, context)
  }

  // Reset retry state
  const reset = () => {
    retryCount.value = 0
    lastError.value = null
    retryHistory.value = []
    isRetrying.value = false
  }

  // Get retry statistics
  const getRetryStats = () => {
    return {
      retryCount: retryCount.value,
      maxRetries,
      canRetry: canRetry.value,
      isRetrying: isRetrying.value,
      lastError: lastError.value,
      retryHistory: [...retryHistory.value],
      nextRetryDelay: nextRetryDelay.value
    }
  }

  // Specific retry functions for common operations
  const retryApiCall = createRetryWrapper(async (apiCall) => {
    return await apiCall()
  }, {
    context: 'API Call',
    retryCondition: (error) => {
      const message = error.message?.toLowerCase() || ''
      // Retry on network errors, timeouts, and 5xx server errors
      return message.includes('network') || 
             message.includes('timeout') || 
             message.includes('fetch') ||
             message.includes('500') ||
             message.includes('502') ||
             message.includes('503') ||
             message.includes('504')
    }
  })

  const retryStorageOperation = createRetryWrapper(async (storageOp) => {
    return await storageOp()
  }, {
    context: 'Storage Operation',
    maxRetries: 2, // Fewer retries for storage operations
    retryCondition: (error) => {
      const message = error.message?.toLowerCase() || ''
      // Don't retry on quota exceeded, but retry on temporary storage issues
      return !message.includes('quota') && message.includes('storage')
    }
  })

  const retryFileOperation = createRetryWrapper(async (fileOp) => {
    return await fileOp()
  }, {
    context: 'File Operation',
    maxRetries: 2,
    retryCondition: (error) => {
      const message = error.message?.toLowerCase() || ''
      // Retry on temporary file access issues
      return message.includes('file') && !message.includes('not found')
    }
  })

  return {
    // State
    isRetrying: computed(() => isRetrying.value),
    retryCount: computed(() => retryCount.value),
    lastError: computed(() => lastError.value),
    canRetry,
    nextRetryDelay,

    // Methods
    executeWithRetry,
    createRetryWrapper,
    manualRetry,
    reset,
    getRetryStats,

    // Specialized retry functions
    retryApiCall,
    retryStorageOperation,
    retryFileOperation
  }
}

// Utility function to create a retry decorator
export function withRetry(fn, options = {}) {
  const { executeWithRetry } = useRetry(options)
  
  return async (...args) => {
    return executeWithRetry(() => fn(...args), options.context || fn.name)
  }
}

// Utility function for conditional retry
export function retryIf(condition, fn, options = {}) {
  const retryOptions = {
    ...options,
    retryCondition: (error) => {
      const shouldRetry = typeof condition === 'function' ? condition(error) : condition
      return shouldRetry && (options.retryCondition ? options.retryCondition(error) : true)
    }
  }
  
  return withRetry(fn, retryOptions)
}