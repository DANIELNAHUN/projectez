<template>
  <ResponsiveModal
    v-model:visible="isVisible"
    title="Generador de Proyectos con IA"
    subtitle="Describe tu proyecto y la IA creará una estructura completa"
    size="2xl"
    :persistent="isGenerating"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- API Configuration -->
      <div v-if="!isConfigured" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex items-start">
          <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3"></i>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Configuración de IA requerida
            </h4>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              Para usar el generador de proyectos con IA, configura al menos una API.
            </p>
            
            <!-- Provider Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Proveedor de IA
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="provider in availableProviders"
                  :key="provider.key"
                  @click="selectedProvider = provider.key"
                  :class="[
                    'p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200',
                    selectedProvider === provider.key
                      ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200'
                      : 'border-yellow-300 dark:border-yellow-600 bg-white dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:border-yellow-400'
                  ]"
                >
                  <div class="font-semibold">{{ provider.name }}</div>
                  <div class="text-xs opacity-75 mt-1">{{ provider.description }}</div>
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  {{ selectedProviderInfo.label }}
                </label>
                <input
                  v-model="apiKey"
                  type="password"
                  :placeholder="selectedProviderInfo.placeholder"
                  class="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-100"
                  @keyup.enter="configureAPI"
                />
              </div>
              <button
                @click="configureAPI"
                :disabled="!apiKey.trim() || isConfiguring"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LoadingSpinner v-if="isConfiguring" size="xs" color="white" class="mr-2" />
                {{ isConfiguring ? 'Configurando...' : 'Configurar API' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Status (when configured) -->
      <div v-if="isConfigured" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <i class="pi pi-check-circle text-green-600 dark:text-green-400 mr-2"></i>
            <span class="text-sm font-medium text-green-800 dark:text-green-200">
              {{ currentProviderName }} configurado
            </span>
          </div>
          <div class="flex space-x-2">
            <button
              @click="showProviderSelector = !showProviderSelector"
              class="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              <i class="pi pi-refresh mr-1"></i>
              Cambiar
            </button>
            <button
              @click="showAIConfig = true"
              class="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              <i class="pi pi-cog mr-1"></i>
              Configurar
            </button>
          </div>
        </div>
        
        <!-- Provider Selector -->
        <div v-if="showProviderSelector" class="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="provider in configuredProviders"
              :key="provider"
              @click="switchProvider(provider)"
              :class="[
                'p-2 text-sm rounded border transition-colors',
                currentProvider === provider
                  ? 'border-green-500 bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-200'
                  : 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-800/20'
              ]"
            >
              {{ getProviderDisplayName(provider) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Interface -->
      <div v-if="isConfigured" class="space-y-4">
        <!-- Complexity Level Selector -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nivel de complejidad del proyecto
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="level in complexityLevels"
              :key="level.value"
              @click="selectedComplexity = level.value"
              :class="[
                'p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200',
                selectedComplexity === level.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              ]"
            >
              <div class="font-semibold">{{ level.label }}</div>
              <div class="text-xs opacity-75 mt-1">{{ level.description }}</div>
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="h-64 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <!-- Welcome Message -->
            <div v-if="messages.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
              <i class="pi pi-comments text-3xl mb-3"></i>
              <p class="text-lg font-medium mb-2">¡Hola! Soy tu asistente de IA</p>
              <p class="text-sm">Describe el proyecto que quieres crear y yo generaré una estructura completa con tareas, fechas y equipo.</p>
            </div>

            <!-- Messages -->
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="[
                'flex',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                :class="[
                  'max-w-[80%] px-4 py-2 rounded-lg',
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'error'
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                ]"
              >
                <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
                <span class="text-xs opacity-75 mt-1 block">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>

            <!-- Loading indicator -->
            <div v-if="isGenerating" class="flex justify-start">
              <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <LoadingSpinner size="sm" text="Generando proyecto..." />
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="border-t border-gray-200 dark:border-gray-700 p-4">
            <div class="flex space-x-3">
              <input
                v-model="currentPrompt"
                type="text"
                placeholder="Describe tu proyecto (ej: 'Crear una aplicación web de e-commerce con carrito de compras')"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                @keyup.enter="generateProject"
                :disabled="isGenerating"
              />
              <button
                @click="generateProject"
                :disabled="!currentPrompt.trim() || isGenerating"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i class="pi pi-send mr-2"></i>
                Generar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Preview -->
      <div v-if="generatedProject" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Vista previa del proyecto generado
          </h3>
          <button
            @click="clearGenerated"
            class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i class="pi pi-times mr-1"></i>
            Limpiar
          </button>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <!-- Project Info -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-gray-100">{{ generatedProject.name }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ generatedProject.description }}</p>
            <div class="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <i class="pi pi-calendar mr-1"></i>
              Duración estimada: {{ generatedProject.estimatedDuration }} días laborales
            </div>
          </div>

          <!-- Tasks Summary -->
          <div>
            <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Tareas ({{ generatedProject.tasks.length }})
            </h5>
            <div class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              <div
                v-for="task in generatedProject.tasks"
                :key="task.title"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-700 dark:text-gray-300">{{ task.title }}</span>
                <span class="text-gray-500 dark:text-gray-400">{{ task.duration }}d</span>
              </div>
            </div>
          </div>

          <!-- Team Members -->
          <div v-if="generatedProject.teamMembers && generatedProject.teamMembers.length > 0">
            <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Equipo ({{ generatedProject.teamMembers.length }})
            </h5>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="member in generatedProject.teamMembers"
                :key="member.name"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
              >
                {{ member.name }} - {{ member.role }}
              </span>
            </div>
          </div>
        </div>

        <!-- Import Options -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 class="font-medium text-blue-900 dark:text-blue-100 mb-3">
            Opciones de importación
          </h5>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Fecha de inicio del proyecto
              </label>
              <input
                v-model="importStartDate"
                type="date"
                class="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-blue-900/30 dark:text-blue-100"
              />
            </div>
            <div class="flex items-center">
              <input
                v-model="includeTeamMembers"
                type="checkbox"
                id="includeTeam"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="includeTeam" class="ml-2 text-sm text-blue-800 dark:text-blue-200">
                Incluir miembros del equipo sugeridos
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex justify-between">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        
        <div class="flex space-x-3">
          <button
            v-if="generatedProject"
            @click="regenerateProject"
            :disabled="isGenerating"
            class="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-refresh mr-2"></i>
            Regenerar
          </button>
          
          <button
            v-if="generatedProject"
            @click="confirmImport"
            :disabled="isImporting"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LoadingSpinner v-if="isImporting" size="xs" color="white" class="mr-2" />
            <i v-else class="pi pi-check mr-2"></i>
            {{ isImporting ? 'Importando...' : 'Importar Proyecto' }}
          </button>
        </div>
      </div>
    </template>
  </ResponsiveModal>

  <!-- Confirmation Dialog -->
  <ResponsiveModal
    v-model:visible="showConfirmDialog"
    title="Confirmar importación"
    size="md"
  >
    <div class="space-y-4">
      <p class="text-gray-700 dark:text-gray-300">
        ¿Estás seguro de que quieres importar este proyecto? Se creará un nuevo proyecto con todas las tareas y configuraciones generadas por la IA.
      </p>
      
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div class="text-sm">
          <div><strong>Proyecto:</strong> {{ generatedProject?.name }}</div>
          <div><strong>Tareas:</strong> {{ generatedProject?.tasks?.length || 0 }}</div>
          <div><strong>Duración:</strong> {{ generatedProject?.estimatedDuration }} días</div>
          <div v-if="includeTeamMembers && generatedProject?.teamMembers?.length">
            <strong>Equipo:</strong> {{ generatedProject.teamMembers.length }} miembros
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <button
          @click="showConfirmDialog = false"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          @click="importProject"
          :disabled="isImporting"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LoadingSpinner v-if="isImporting" size="xs" color="white" class="mr-2" />
          {{ isImporting ? 'Importando...' : 'Confirmar' }}
        </button>
      </div>
    </template>
  </ResponsiveModal>

  <!-- AI Configuration Modal -->
  <AIConfigurationModal
    v-model:visible="showAIConfig"
    @configuration-updated="handleConfigurationUpdate"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import ResponsiveModal from './ResponsiveModal.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import AIConfigurationModal from './AIConfigurationModal.vue'
import { aiService } from '../../services/aiService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'project-imported'])

const store = useStore()

// Reactive state
const isVisible = ref(props.visible)
const isConfigured = ref(false)
const isConfiguring = ref(false)
const isGenerating = ref(false)
const isImporting = ref(false)
const showConfirmDialog = ref(false)
const showProviderSelector = ref(false)
const showAIConfig = ref(false)

const apiKey = ref('')
const selectedProvider = ref('openai')
const currentProvider = ref('openai')
const currentPrompt = ref('')
const selectedComplexity = ref('medium')
const messages = ref([])
const generatedProject = ref(null)
const importStartDate = ref('')
const includeTeamMembers = ref(true)

// Provider configuration
const availableProviders = [
  {
    key: 'openai',
    name: 'OpenAI',
    description: 'GPT-3.5 Turbo',
    label: 'Clave API de OpenAI',
    placeholder: 'sk-...'
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro',
    label: 'Clave API de Gemini',
    placeholder: 'AIza...'
  }
]

// Complexity levels configuration
const complexityLevels = [
  {
    value: 'basic',
    label: 'Básico',
    description: '3-8 tareas principales'
  },
  {
    value: 'medium',
    label: 'Intermedio',
    description: '5-15 tareas con subtareas'
  },
  {
    value: 'detailed',
    label: 'Detallado',
    description: '10-20 tareas completas'
  }
]

// Computed properties
const canGenerate = computed(() => {
  return isConfigured.value && currentPrompt.value.trim() && !isGenerating.value
})

const selectedProviderInfo = computed(() => {
  return availableProviders.find(p => p.key === selectedProvider.value) || availableProviders[0]
})

const configuredProviders = computed(() => {
  const status = aiService.getProviderStatus()
  return status.configured
})

const currentProviderName = computed(() => {
  const provider = availableProviders.find(p => p.key === currentProvider.value)
  return provider ? provider.name : 'Desconocido'
})

// Watch for prop changes
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

watch(isVisible, (newValue) => {
  emit('update:visible', newValue)
})

// Methods
const handleClose = () => {
  if (isGenerating.value || isImporting.value) return
  isVisible.value = false
  clearMessages()
}

const configureAPI = async () => {
  if (!apiKey.value.trim()) return

  isConfiguring.value = true
  try {
    // Configure the selected provider
    const config = {}
    if (selectedProvider.value === 'openai') {
      config.openaiKey = apiKey.value.trim()
      config.defaultProvider = 'openai'
    } else if (selectedProvider.value === 'gemini') {
      config.geminiKey = apiKey.value.trim()
      config.defaultProvider = 'gemini'
    }
    
    aiService.configure(config)
    
    // Test the connection
    const testResult = await aiService.testConnection()
    
    if (testResult.success) {
      isConfigured.value = true
      currentProvider.value = selectedProvider.value
      addMessage('system', `✅ ${selectedProviderInfo.value.name} configurado correctamente. ¡Ya puedes generar proyectos!`)
      apiKey.value = '' // Clear the API key from memory for security
      showProviderSelector.value = false
    } else {
      throw new Error(testResult.error)
    }
  } catch (error) {
    addMessage('error', `Error al configurar ${selectedProviderInfo.value.name}: ${error.message}`)
  } finally {
    isConfiguring.value = false
  }
}

const switchProvider = async (provider) => {
  try {
    aiService.setProvider(provider)
    currentProvider.value = provider
    showProviderSelector.value = false
    addMessage('system', `🔄 Cambiado a ${getProviderDisplayName(provider)}`)
  } catch (error) {
    addMessage('error', `Error al cambiar proveedor: ${error.message}`)
  }
}

const getProviderDisplayName = (provider) => {
  const info = availableProviders.find(p => p.key === provider)
  return info ? info.name : provider
}

const handleConfigurationUpdate = (event) => {
  // Refresh the configuration status
  isConfigured.value = aiService.isReady()
  
  if (isConfigured.value) {
    currentProvider.value = aiService.getCurrentProvider()
    
    if (event.action === 'switch') {
      addMessage('system', `🔄 Cambiado a ${getProviderDisplayName(event.provider)}`)
    } else {
      addMessage('system', `✅ ${getProviderDisplayName(event.provider)} configurado correctamente`)
    }
  }
}

const addMessage = (type, content) => {
  messages.value.push({
    type,
    content,
    timestamp: new Date()
  })
}

const clearMessages = () => {
  messages.value = []
  generatedProject.value = null
}

const clearGenerated = () => {
  generatedProject.value = null
}

const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const generateProject = async () => {
  if (!canGenerate.value) return

  const prompt = currentPrompt.value.trim()
  currentPrompt.value = ''
  
  // Add user message
  addMessage('user', prompt)
  
  isGenerating.value = true
  
  try {
    const options = {
      complexity: selectedComplexity.value,
      includeTeamMembers: includeTeamMembers.value,
      maxTasks: selectedComplexity.value === 'basic' ? 8 : selectedComplexity.value === 'medium' ? 15 : 20
    }

    // Use the unified AI service with fallback
    const result = await aiService.generateProjectWithFallback(prompt, options)
    
    if (result.success) {
      generatedProject.value = result.project
      let successMessage = `✅ ¡Proyecto generado exitosamente con ${getProviderDisplayName(result.provider)}! Se crearon ${result.project.tasks.length} tareas con una duración estimada de ${result.project.estimatedDuration} días laborales.`
      
      // Add attempt information if multiple providers were tried
      if (result.attempts.length > 1) {
        const failedAttempts = result.attempts.filter(a => !a.success).length
        if (failedAttempts > 0) {
          successMessage += ` (Completado después de ${failedAttempts} intento${failedAttempts > 1 ? 's' : ''} fallido${failedAttempts > 1 ? 's' : ''})`
        }
      }
      
      addMessage('system', successMessage)
      
      // Set default start date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      importStartDate.value = tomorrow.toISOString().split('T')[0]
      
    } else {
      // Enhanced error reporting with provider information
      const primaryError = result.errors.length > 0 ? result.errors[result.errors.length - 1] : 'Error desconocido'
      addMessage('error', `❌ Error al generar el proyecto: ${primaryError}`)
      
      // Show attempt information
      if (result.attempts.length > 0) {
        const totalTime = result.attempts.reduce((sum, attempt) => sum + attempt.time, 0)
        addMessage('system', `Se probaron ${result.attempts.length} proveedor${result.attempts.length > 1 ? 'es' : ''}. Tiempo total: ${Math.round(totalTime / 1000)}s`)
      }
      
      // Show specific guidance based on error type
      if (result.errors.some(e => e.includes('quota') || e.includes('QUOTA'))) {
        addMessage('system', '💡 Sugerencia: Verifica tu configuración de facturación')
      } else if (result.errors.some(e => e.includes('api key') || e.includes('API_KEY'))) {
        addMessage('system', '💡 Sugerencia: Verifica que tus claves API sean válidas')
      } else if (result.errors.some(e => e.includes('rate limit') || e.includes('RATE_LIMIT'))) {
        addMessage('system', '💡 Sugerencia: Espera unos minutos antes de intentar nuevamente')
      }
    }
  } catch (error) {
    addMessage('error', `❌ Error inesperado: ${error.message}`)
    
    // Log detailed error for debugging
    console.error('AI Project Generation Error:', {
      error: error.message,
      stack: error.stack,
      prompt: prompt.substring(0, 100) + '...',
      options,
      provider: currentProvider.value
    })
  } finally {
    isGenerating.value = false
  }
}

const regenerateProject = () => {
  if (messages.value.length > 0) {
    // Find the last user message and regenerate
    const lastUserMessage = [...messages.value].reverse().find(msg => msg.type === 'user')
    if (lastUserMessage) {
      currentPrompt.value = lastUserMessage.content
      generateProject()
    }
  }
}

const confirmImport = () => {
  if (!generatedProject.value) return
  showConfirmDialog.value = true
}

const importProject = async () => {
  if (!generatedProject.value) return

  isImporting.value = true
  
  try {
    // Prepare project data for import
    const projectData = {
      ...generatedProject.value,
      startDate: importStartDate.value ? new Date(importStartDate.value) : new Date()
    }

    // If not including team members, remove them
    if (!includeTeamMembers.value) {
      delete projectData.teamMembers
    }

    // Import through the store
    await store.dispatch('projects/importProject', projectData)
    
    // Show success message
    addMessage('system', '✅ ¡Proyecto importado exitosamente!')
    
    // Emit event to parent
    emit('project-imported', projectData)
    
    // Close dialogs
    showConfirmDialog.value = false
    
    // Close main modal after a short delay
    setTimeout(() => {
      isVisible.value = false
    }, 1500)
    
  } catch (error) {
    addMessage('error', `❌ Error al importar el proyecto: ${error.message}`)
    showConfirmDialog.value = false
  } finally {
    isImporting.value = false
  }
}

// Initialize component
onMounted(() => {
  // Load configuration from environment variables
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
  const defaultProvider = import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'openai'
  
  if (openaiKey || geminiKey) {
    const config = {
      defaultProvider
    }
    
    if (openaiKey) config.openaiKey = openaiKey
    if (geminiKey) config.geminiKey = geminiKey
    
    try {
      aiService.configure(config)
      
      // Check if any provider is ready
      if (aiService.isReady()) {
        isConfigured.value = true
        currentProvider.value = aiService.getCurrentProvider()
        
        const status = aiService.getProviderStatus()
        const configuredNames = status.configured.map(getProviderDisplayName).join(', ')
        addMessage('system', `✅ ${configuredNames} ya configurado${status.configured.length > 1 ? 's' : ''}. ¡Puedes generar proyectos!`)
      }
    } catch (error) {
      console.error('Error loading AI configuration:', error)
    }
  }
  
  // Set default provider selection
  selectedProvider.value = defaultProvider
})
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark .custom-scrollbar {
  scrollbar-color: #4a5568 #2d3748;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #2d3748;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #718096;
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>