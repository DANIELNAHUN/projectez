<template>
  <ResponsiveModal
    v-model:visible="isVisible"
    title="Configuración de IA"
    subtitle="Gestiona tus proveedores de inteligencia artificial"
    size="lg"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Provider Status Overview -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Estado de los proveedores
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="provider in providerInfo"
            :key="provider.key"
            :class="[
              'p-4 rounded-lg border-2 transition-all duration-200',
              provider.configured
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
            ]"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900 dark:text-gray-100">
                {{ provider.name }}
              </h4>
              <div class="flex items-center">
                <i
                  :class="[
                    'pi text-sm mr-2',
                    provider.configured
                      ? 'pi-check-circle text-green-600 dark:text-green-400'
                      : 'pi-times-circle text-gray-400'
                  ]"
                ></i>
                <span
                  :class="[
                    'text-xs font-medium px-2 py-1 rounded-full',
                    provider.configured
                      ? 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  ]"
                >
                  {{ provider.configured ? 'Configurado' : 'No configurado' }}
                </span>
              </div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {{ provider.description }}
            </p>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Modelos: {{ provider.models.join(', ') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Current Provider Selection -->
      <div v-if="hasConfiguredProviders" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Proveedor activo
        </h3>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <i class="pi pi-star text-blue-600 dark:text-blue-400 mr-2"></i>
            <span class="font-medium text-blue-800 dark:text-blue-200">
              {{ currentProviderName }}
            </span>
          </div>
          <select
            v-model="selectedActiveProvider"
            @change="changeActiveProvider"
            class="px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-blue-900/30 dark:text-blue-100"
          >
            <option
              v-for="provider in configuredProviders"
              :key="provider"
              :value="provider"
            >
              {{ getProviderDisplayName(provider) }}
            </option>
          </select>
        </div>
      </div>

      <!-- API Configuration Forms -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Configurar APIs
        </h3>
        
        <!-- OpenAI Configuration -->
        <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <h4 class="font-semibold text-gray-900 dark:text-gray-100">OpenAI</h4>
              <i
                v-if="providerStatus.openai"
                class="pi pi-check-circle text-green-600 dark:text-green-400 ml-2"
              ></i>
            </div>
            <button
              v-if="providerStatus.openai"
              @click="testProvider('openai')"
              :disabled="testingProvider === 'openai'"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <LoadingSpinner v-if="testingProvider === 'openai'" size="xs" class="mr-1" />
              {{ testingProvider === 'openai' ? 'Probando...' : 'Probar conexión' }}
            </button>
          </div>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Clave API de OpenAI
              </label>
              <input
                v-model="apiKeys.openai"
                type="password"
                placeholder="sk-..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <button
              @click="configureProvider('openai')"
              :disabled="!apiKeys.openai.trim() || configuringProvider === 'openai'"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LoadingSpinner v-if="configuringProvider === 'openai'" size="xs" color="white" class="mr-2" />
              {{ configuringProvider === 'openai' ? 'Configurando...' : 'Configurar OpenAI' }}
            </button>
          </div>
        </div>

        <!-- Gemini Configuration -->
        <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <h4 class="font-semibold text-gray-900 dark:text-gray-100">Google Gemini</h4>
              <i
                v-if="providerStatus.gemini"
                class="pi pi-check-circle text-green-600 dark:text-green-400 ml-2"
              ></i>
            </div>
            <button
              v-if="providerStatus.gemini"
              @click="testProvider('gemini')"
              :disabled="testingProvider === 'gemini'"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <LoadingSpinner v-if="testingProvider === 'gemini'" size="xs" class="mr-1" />
              {{ testingProvider === 'gemini' ? 'Probando...' : 'Probar conexión' }}
            </button>
          </div>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Clave API de Gemini
              </label>
              <input
                v-model="apiKeys.gemini"
                type="password"
                placeholder="AIza..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <button
              @click="configureProvider('gemini')"
              :disabled="!apiKeys.gemini.trim() || configuringProvider === 'gemini'"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LoadingSpinner v-if="configuringProvider === 'gemini'" size="xs" color="white" class="mr-2" />
              {{ configuringProvider === 'gemini' ? 'Configurando...' : 'Configurar Gemini' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Configuration Management -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Gestión de configuración
        </h3>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="clearStoredConfiguration"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <i class="pi pi-trash mr-2"></i>
            Limpiar configuración guardada
          </button>
          <button
            @click="reloadConfiguration"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <i class="pi pi-refresh mr-2"></i>
            Recargar configuración
          </button>
        </div>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="space-y-2">
        <h4 class="font-medium text-gray-900 dark:text-gray-100">Resultados de pruebas</h4>
        <div
          v-for="result in testResults"
          :key="result.provider + '_' + result.message"
          :class="[
            'p-3 rounded-lg text-sm',
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          ]"
        >
          <div class="flex items-center">
            <i
              :class="[
                'pi mr-2',
                result.success ? 'pi-check-circle' : 'pi-times-circle'
              ]"
            ></i>
            <strong v-if="result.provider !== 'system'">{{ getProviderDisplayName(result.provider) }}:</strong>
            <span class="ml-2">{{ result.message || result.error }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <button
          @click="testAllProviders"
          :disabled="!hasConfiguredProviders || testingAll"
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LoadingSpinner v-if="testingAll" size="xs" class="mr-2" />
          <i v-else class="pi pi-play mr-2"></i>
          {{ testingAll ? 'Probando...' : 'Probar todos' }}
        </button>
        
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cerrar
        </button>
      </div>
    </template>
  </ResponsiveModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ResponsiveModal from './ResponsiveModal.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { aiService } from '../../services/aiService.js'
import { useAIConfiguration } from '../../composables/useAIConfiguration.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'configuration-updated'])
const aiConfig = useAIConfiguration()

// Reactive state
const isVisible = ref(props.visible)
const configuringProvider = ref(null)
const testingProvider = ref(null)
const testingAll = ref(false)
const selectedActiveProvider = ref('')

const apiKeys = ref({
  openai: '',
  gemini: ''
})

const testResults = ref([])

// Computed properties
const providerInfo = computed(() => {
  const status = aiConfig.getStatus()
  return Object.entries(status.providerInfo).map(([key, data]) => ({
    key,
    ...data
  }))
})

const providerStatus = computed(() => {
  const status = aiConfig.getStatus()
  return {
    openai: status.configuredProviders.includes('openai'),
    gemini: status.configuredProviders.includes('gemini')
  }
})

const configuredProviders = computed(() => {
  const status = aiConfig.getStatus()
  return status.configuredProviders
})

const hasConfiguredProviders = computed(() => {
  return configuredProviders.value.length > 0
})

const currentProviderName = computed(() => {
  return getProviderDisplayName(aiConfig.currentProvider.value)
})

// Watch for prop changes
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

watch(isVisible, (newValue) => {
  emit('update:visible', newValue)
  if (newValue) {
    refreshStatus()
  }
})

// Methods
const handleClose = () => {
  isVisible.value = false
  clearApiKeys()
}

const clearApiKeys = () => {
  apiKeys.value.openai = ''
  apiKeys.value.gemini = ''
}

const refreshStatus = () => {
  const status = aiConfig.getStatus()
  selectedActiveProvider.value = status.currentProvider
  testResults.value = []
}

const getProviderDisplayName = (provider) => {
  const info = providerInfo.value.find(p => p.key === provider)
  return info ? info.name : provider
}

const configureProvider = async (provider) => {
  const apiKey = apiKeys.value[provider]
  if (!apiKey.trim()) return

  configuringProvider.value = provider
  
  try {
    const config = {
      defaultProvider: provider
    }
    
    if (provider === 'openai') {
      config.openaiKey = apiKey.trim()
    } else if (provider === 'gemini') {
      config.geminiKey = apiKey.trim()
    }
    
    // Configure using the composable
    const result = await aiConfig.configureAI(config, true)
    
    if (result.success) {
      testResults.value = testResults.value.filter(r => r.provider !== provider)
      
      let successMessage = `${getProviderDisplayName(provider)} configurado correctamente`
      if (result.persisted) {
        successMessage += ' y guardado para futuras sesiones'
      } else {
        successMessage += ' (configuración temporal)'
      }
      
      testResults.value.push({
        provider,
        success: true,
        message: successMessage
      })
      
      // Clear the API key from memory for security
      apiKeys.value[provider] = ''
      
      // Refresh status
      refreshStatus()
      
      // Emit configuration update
      emit('configuration-updated', { provider, success: true })
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    testResults.value = testResults.value.filter(r => r.provider !== provider)
    testResults.value.push({
      provider,
      success: false,
      error: `Error al configurar: ${error.message}`
    })
  } finally {
    configuringProvider.value = null
  }
}

// Load stored API keys from localStorage
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

// Save API keys to localStorage
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

// Clear stored API keys
const clearStoredAPIKeys = () => {
  try {
    localStorage.removeItem('ai_api_config')
    return true
  } catch (error) {
    console.error('Error clearing stored API keys:', error)
    return false
  }
}

const testProvider = async (provider) => {
  testingProvider.value = provider
  
  try {
    // Set the provider temporarily for testing
    const originalProvider = aiService.getCurrentProvider()
    aiService.setProvider(provider)
    
    const result = await aiService.testConnection()
    
    // Restore original provider
    if (originalProvider !== provider) {
      aiService.setProvider(originalProvider)
    }
    
    testResults.value = testResults.value.filter(r => r.provider !== provider)
    testResults.value.push({
      provider,
      success: result.success,
      message: result.success ? result.message : result.error
    })
  } catch (error) {
    testResults.value = testResults.value.filter(r => r.provider !== provider)
    testResults.value.push({
      provider,
      success: false,
      error: error.message
    })
  } finally {
    testingProvider.value = null
  }
}

const testAllProviders = async () => {
  if (!hasConfiguredProviders.value) return
  
  testingAll.value = true
  testResults.value = []
  
  try {
    const result = await aiConfig.testAllProviders()
    
    if (result.success) {
      testResults.value = Object.entries(result.results).map(([provider, providerResult]) => ({
        provider,
        success: providerResult.success,
        message: providerResult.success ? providerResult.message : providerResult.error
      }))
    } else {
      testResults.value.push({
        provider: 'system',
        success: false,
        error: `Error al probar proveedores: ${result.error}`
      })
    }
  } catch (error) {
    console.error('Error testing all providers:', error)
    testResults.value.push({
      provider: 'system',
      success: false,
      error: 'Error inesperado al probar proveedores'
    })
  } finally {
    testingAll.value = false
  }
}

const changeActiveProvider = () => {
  const result = aiConfig.switchProvider(selectedActiveProvider.value)
  
  if (result.success) {
    testResults.value.push({
      provider: selectedActiveProvider.value,
      success: true,
      message: `Cambiado a ${getProviderDisplayName(selectedActiveProvider.value)}`
    })
    
    emit('configuration-updated', { 
      provider: selectedActiveProvider.value, 
      success: true, 
      action: 'switch' 
    })
  } else {
    testResults.value.push({
      provider: selectedActiveProvider.value,
      success: false,
      error: `Error al cambiar proveedor: ${result.error}`
    })
  }
}

const clearStoredConfiguration = () => {
  const result = aiConfig.clearStoredConfiguration()
  
  if (result.success) {
    let message = 'Configuración guardada eliminada correctamente'
    
    if (result.reloaded) {
      message += `. Recargado desde ${result.newSource === 'env' ? 'variables de entorno' : 'configuración por defecto'}`
    }
    
    testResults.value.push({
      provider: 'system',
      success: true,
      message
    })
    
    // Refresh status
    refreshStatus()
  } else {
    testResults.value.push({
      provider: 'system',
      success: false,
      error: `Error al eliminar la configuración guardada: ${result.error}`
    })
  }
}

const reloadConfiguration = () => {
  testResults.value = []
  const result = aiConfig.loadConfiguration()
  refreshStatus()
  
  if (result.success) {
    const sourceLabel = result.source === 'stored' ? 'configuración personalizada' : 'variables de entorno'
    testResults.value.push({
      provider: 'system',
      success: true,
      message: `Configuración recargada desde ${sourceLabel}`
    })
  } else {
    testResults.value.push({
      provider: 'system',
      success: false,
      error: `Error al recargar configuración: ${result.error}`
    })
  }
}

// Initialize component
onMounted(() => {
  const result = aiConfig.loadConfiguration()
  
  if (result.success) {
    const sourceLabel = result.source === 'stored' ? 'almacenamiento local' : 'variables de entorno'
    testResults.value.push({
      provider: 'system',
      success: true,
      message: `Configuración cargada desde ${sourceLabel}`
    })
  } else if (result.error !== 'No API keys found') {
    testResults.value.push({
      provider: 'system',
      success: false,
      error: `Error al cargar configuración: ${result.error}`
    })
  }
  
  refreshStatus()
})
</script>