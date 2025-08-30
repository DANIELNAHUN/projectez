<template>
  <div class="progress-indicator">
    <!-- Inline Progress (for small operations) -->
    <div v-if="variant === 'inline'" class="flex items-center space-x-3">
      <LoadingSpinner :size="size" :color="color" />
      <div class="flex-1">
        <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ title }}
        </div>
        <div v-if="description" class="text-xs text-gray-500 dark:text-gray-400">
          {{ description }}
        </div>
        <div v-if="showProgress && progress >= 0" class="mt-1">
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              class="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
            ></div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ Math.round(progress) }}%
          </div>
        </div>
      </div>
      <button
        v-if="cancellable && onCancel"
        @click="handleCancel"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        :disabled="isCompleted"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- Modal Progress (for long operations) -->
    <ResponsiveModal
      v-else-if="variant === 'modal'"
      :visible="visible"
      :title="title"
      :persistent="true"
      size="md"
      @close="handleCancel"
    >
      <div class="space-y-6">
        <!-- Progress Content -->
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
            <LoadingSpinner :size="size" color="blue" />
          </div>
          
          <div class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ currentStep || title }}
          </div>
          
          <div v-if="description" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ description }}
          </div>
          
          <!-- Progress Bar -->
          <div v-if="showProgress && progress >= 0" class="mb-4">
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                :class="[
                  'h-2 rounded-full transition-all duration-500 ease-out',
                  isCompleted ? 'bg-green-600' : 'bg-blue-600'
                ]"
                :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
              ></div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {{ Math.round(progress) }}% completado
            </div>
          </div>
          
          <!-- Steps Progress -->
          <div v-if="steps && steps.length > 0" class="mb-4">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Paso {{ currentStepIndex + 1 }} de {{ steps.length }}
            </div>
            <div class="space-y-2">
              <div
                v-for="(step, index) in steps"
                :key="index"
                :class="[
                  'flex items-center text-sm',
                  index < currentStepIndex ? 'text-green-600 dark:text-green-400' :
                  index === currentStepIndex ? 'text-blue-600 dark:text-blue-400' :
                  'text-gray-400 dark:text-gray-500'
                ]"
              >
                <i 
                  :class="[
                    'mr-2',
                    index < currentStepIndex ? 'pi pi-check-circle' :
                    index === currentStepIndex ? 'pi pi-circle' :
                    'pi pi-circle'
                  ]"
                ></i>
                {{ step }}
              </div>
            </div>
          </div>
          
          <!-- Time Estimate -->
          <div v-if="estimatedTime && !isCompleted" class="text-xs text-gray-500 dark:text-gray-400">
            Tiempo estimado: {{ formatTime(estimatedTime) }}
          </div>
          
          <!-- Completion Message -->
          <div v-if="isCompleted && completionMessage" class="text-sm text-green-600 dark:text-green-400">
            {{ completionMessage }}
          </div>
        </div>
        
        <!-- Error State -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-start">
            <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mt-0.5 mr-3"></i>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Error en la operación
              </h4>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ error.message || 'Ocurrió un error inesperado' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <button
            v-if="cancellable && !isCompleted"
            @click="handleCancel"
            :disabled="!canCancel"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <div class="flex space-x-3">
            <button
              v-if="error && retryable"
              @click="handleRetry"
              class="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <i class="pi pi-refresh mr-2"></i>
              Reintentar
            </button>
            
            <button
              v-if="isCompleted"
              @click="handleClose"
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-md"
            >
              <i class="pi pi-check mr-2"></i>
              Cerrar
            </button>
          </div>
        </div>
      </template>
    </ResponsiveModal>

    <!-- Toast Progress (for background operations) -->
    <div v-else-if="variant === 'toast'" class="toast-progress">
      <!-- This will be handled by the notification service -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ResponsiveModal from './ResponsiveModal.vue'

const props = defineProps({
  // Progress variant
  variant: {
    type: String,
    default: 'inline',
    validator: (value) => ['inline', 'modal', 'toast'].includes(value)
  },
  
  // Visibility (for modal variant)
  visible: {
    type: Boolean,
    default: true
  },
  
  // Progress title
  title: {
    type: String,
    required: true
  },
  
  // Progress description
  description: {
    type: String,
    default: ''
  },
  
  // Current progress (0-100)
  progress: {
    type: Number,
    default: -1
  },
  
  // Whether to show progress bar
  showProgress: {
    type: Boolean,
    default: true
  },
  
  // Current step (for step-based progress)
  currentStep: {
    type: String,
    default: ''
  },
  
  // Array of steps
  steps: {
    type: Array,
    default: () => []
  },
  
  // Current step index
  currentStepIndex: {
    type: Number,
    default: 0
  },
  
  // Estimated time in milliseconds
  estimatedTime: {
    type: Number,
    default: 0
  },
  
  // Whether operation is completed
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  // Completion message
  completionMessage: {
    type: String,
    default: ''
  },
  
  // Error object
  error: {
    type: Object,
    default: null
  },
  
  // Whether operation can be cancelled
  cancellable: {
    type: Boolean,
    default: false
  },
  
  // Whether operation can be retried
  retryable: {
    type: Boolean,
    default: true
  },
  
  // Spinner size
  size: {
    type: String,
    default: 'md'
  },
  
  // Spinner color
  color: {
    type: String,
    default: 'blue'
  },
  
  // Cancel handler
  onCancel: {
    type: Function,
    default: null
  },
  
  // Retry handler
  onRetry: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['cancel', 'retry', 'close', 'update:visible'])

// State
const startTime = ref(Date.now())
const elapsedTime = ref(0)
const canCancel = ref(true)

// Computed
const remainingTime = computed(() => {
  if (props.estimatedTime <= 0 || props.progress <= 0) return 0
  
  const elapsed = elapsedTime.value
  const progressRatio = props.progress / 100
  const estimatedTotal = elapsed / progressRatio
  
  return Math.max(0, estimatedTotal - elapsed)
})

// Watchers
watch(() => props.isCompleted, (completed) => {
  if (completed) {
    canCancel.value = false
  }
})

watch(() => props.visible, (newValue) => {
  emit('update:visible', newValue)
})

// Methods
const formatTime = (milliseconds) => {
  const seconds = Math.ceil(milliseconds / 1000)
  
  if (seconds < 60) {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`
  }
  
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
}

const handleCancel = () => {
  if (props.onCancel) {
    props.onCancel()
  }
  emit('cancel')
}

const handleRetry = () => {
  if (props.onRetry) {
    props.onRetry()
  }
  emit('retry')
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

// Timer for elapsed time
let timer = null

onMounted(() => {
  startTime.value = Date.now()
  
  timer = setInterval(() => {
    elapsedTime.value = Date.now() - startTime.value
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// Expose methods
defineExpose({
  formatTime,
  handleCancel,
  handleRetry,
  handleClose
})
</script>

<style scoped>
.progress-indicator {
  /* Base styles */
}

.toast-progress {
  /* Styles for toast variant if needed */
}
</style>