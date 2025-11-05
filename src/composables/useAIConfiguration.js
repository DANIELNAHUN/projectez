/**
 * Composable for managing AI configuration
 * Handles loading, saving, and managing API keys for AI providers
 */

import { ref, computed } from 'vue'
import { aiService } from '../services/aiService.js'

const isConfigured = ref(false)
const currentProvider = ref('openai')
const configurationSource = ref('none') // 'env', 'stored', 'none'

export function useAIConfiguration() {
  
  /**
   * Load AI configuration from multiple sources
   * Priority: localStorage > environment variables
   */
  const loadConfiguration = () => {
    // First, try to load from localStorage (user-configured keys)
    const storedConfig = loadStoredAPIKeys()
    
    // Then, load from environment variables as fallback
    const envConfig = {
      openaiKey: import.meta.env.VITE_OPENAI_API_KEY,
      geminiKey: import.meta.env.VITE_GEMINI_API_KEY,
      defaultProvider: import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'openai'
    }
    
    // Determine which configuration to use
    let finalConfig = {}
    let source = 'none'
    
    if (storedConfig.openaiKey || storedConfig.geminiKey) {
      // Use stored configuration
      finalConfig = {
        defaultProvider: storedConfig.defaultProvider || envConfig.defaultProvider,
        openaiKey: storedConfig.openaiKey,
        geminiKey: storedConfig.geminiKey
      }
      source = 'stored'
    } else if (envConfig.openaiKey || envConfig.geminiKey) {
      // Use environment configuration
      finalConfig = envConfig
      source = 'env'
    }
    
    // Configure the service if we have any keys
    if (finalConfig.openaiKey || finalConfig.geminiKey) {
      try {
        aiService.configure(finalConfig)
        
        if (aiService.isReady()) {
          isConfigured.value = true
          currentProvider.value = aiService.getCurrentProvider()
          configurationSource.value = source
          
          console.log(`AI configured from ${source}:`, {
            providers: aiService.getProviderStatus().configured,
            current: currentProvider.value
          })
          
          return {
            success: true,
            source,
            providers: aiService.getProviderStatus().configured
          }
        }
      } catch (error) {
        console.error('Error configuring AI service:', error)
        return {
          success: false,
          error: error.message
        }
      }
    }
    
    return {
      success: false,
      error: 'No API keys found'
    }
  }

  /**
   * Configure AI with new API keys
   * @param {Object} config - Configuration object
   * @param {boolean} persist - Whether to persist to localStorage
   */
  const configureAI = async (config, persist = true) => {
    try {
      // Configure the service
      aiService.configure(config)
      
      // Test the connection
      const testResult = await aiService.testConnection()
      
      if (testResult.success) {
        // Save to localStorage if requested
        if (persist) {
          const saved = saveAPIKeysToStorage(config)
          if (saved) {
            configurationSource.value = 'stored'
          }
        }
        
        isConfigured.value = true
        currentProvider.value = aiService.getCurrentProvider()
        
        return {
          success: true,
          message: testResult.message,
          persisted: persist && saveAPIKeysToStorage(config)
        }
      } else {
        // Return the specific error from the test
        return {
          success: false,
          error: testResult.error || 'Error desconocido al probar la conexión'
        }
      }
    } catch (error) {
      // Log the full error for debugging
      console.error('Error in configureAI:', error)
      
      // Return a more detailed error message
      let errorMessage = error.message || 'Error desconocido'
      
      // Handle specific error types
      if (errorMessage.includes('404')) {
        errorMessage = 'Modelo no encontrado. Verifica que tu API key sea válida y tenga acceso al modelo requerido.'
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = 'API key inválida o sin permisos. Verifica tu clave API.'
      } else if (errorMessage.includes('429')) {
        errorMessage = 'Límite de velocidad excedido. Espera unos minutos antes de intentar nuevamente.'
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        errorMessage = 'Error del servidor. Intenta nuevamente en unos minutos.'
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Switch to a different AI provider
   * @param {string} provider - Provider name
   */
  const switchProvider = (provider) => {
    try {
      aiService.setProvider(provider)
      currentProvider.value = provider
      return {
        success: true,
        provider
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Clear stored configuration
   */
  const clearStoredConfiguration = () => {
    try {
      const cleared = clearStoredAPIKeys()
      
      if (cleared) {
        // Reload from environment variables
        const reloadResult = loadConfiguration()
        
        return {
          success: true,
          reloaded: reloadResult.success,
          newSource: reloadResult.source || 'none'
        }
      } else {
        return {
          success: false,
          error: 'Failed to clear stored configuration'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Test all configured providers
   */
  const testAllProviders = async () => {
    try {
      const results = await aiService.testAllConnections()
      return {
        success: true,
        results
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get current configuration status
   */
  const getStatus = () => {
    const providerStatus = aiService.getProviderStatus()
    
    return {
      isConfigured: isConfigured.value,
      currentProvider: currentProvider.value,
      configurationSource: configurationSource.value,
      availableProviders: providerStatus.available,
      configuredProviders: providerStatus.configured,
      providerInfo: aiService.getProviderInfo()
    }
  }

  // Helper functions
  const loadStoredAPIKeys = () => {
    try {
      const stored = localStorage.getItem('ai_api_config')
      if (stored) {
        const config = JSON.parse(stored)
        return {
          openaiKey: config.openaiKey || null,
          geminiKey: config.geminiKey || null,
          defaultProvider: config.defaultProvider || null
        }
      }
    } catch (error) {
      console.error('Error loading stored API keys:', error)
    }
    return {}
  }

  const saveAPIKeysToStorage = (config) => {
    try {
      const toStore = {
        openaiKey: config.openaiKey || null,
        geminiKey: config.geminiKey || null,
        defaultProvider: config.defaultProvider || null,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('ai_api_config', JSON.stringify(toStore))
      return true
    } catch (error) {
      console.error('Error saving API keys to storage:', error)
      return false
    }
  }

  const clearStoredAPIKeys = () => {
    try {
      localStorage.removeItem('ai_api_config')
      return true
    } catch (error) {
      console.error('Error clearing stored API keys:', error)
      return false
    }
  }

  // Computed properties
  const hasStoredConfiguration = computed(() => {
    return configurationSource.value === 'stored'
  })

  const hasEnvironmentConfiguration = computed(() => {
    return configurationSource.value === 'env'
  })

  const configurationSourceLabel = computed(() => {
    switch (configurationSource.value) {
      case 'stored':
        return 'Configuración personalizada'
      case 'env':
        return 'Variables de entorno'
      default:
        return 'Sin configurar'
    }
  })

  return {
    // State
    isConfigured,
    currentProvider,
    configurationSource,
    
    // Computed
    hasStoredConfiguration,
    hasEnvironmentConfiguration,
    configurationSourceLabel,
    
    // Methods
    loadConfiguration,
    configureAI,
    switchProvider,
    clearStoredConfiguration,
    testAllProviders,
    getStatus
  }
}