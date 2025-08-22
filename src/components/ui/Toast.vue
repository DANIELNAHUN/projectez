<template>
  <Teleport to="body">
    <div 
      v-if="visible"
      :class="[
        'fixed z-100 transition-all duration-300 ease-in-out',
        positionClasses,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      ]"
    >
      <div 
        :class="[
          'max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
          'transform transition-all duration-300 ease-in-out',
          visible ? 'scale-100' : 'scale-95'
        ]"
      >
        <div class="p-4">
          <div class="flex items-start">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <i 
                :class="[
                  iconClasses,
                  'text-xl'
                ]"
              ></i>
            </div>
            
            <!-- Content -->
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ title }}
              </p>
              <p v-if="message" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ message }}
              </p>
            </div>
            
            <!-- Close button -->
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="close"
                class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <span class="sr-only">Cerrar</span>
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>
          
          <!-- Action button -->
          <div v-if="actionText && actionHandler" class="mt-3">
            <button
              @click="handleAction"
              :class="[
                'text-sm font-medium rounded-md px-3 py-2 transition-colors duration-200',
                actionButtonClasses
              ]"
            >
              {{ actionText }}
            </button>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div 
          v-if="showProgress && duration > 0"
          class="h-1 bg-gray-200 dark:bg-gray-700"
        >
          <div 
            :class="[
              'h-full transition-all ease-linear',
              progressBarClasses
            ]"
            :style="{ 
              width: `${progressPercentage}%`,
              transitionDuration: `${duration}ms`
            }"
          ></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-left', 'top-center', 'top-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ].includes(value)
  },
  duration: {
    type: Number,
    default: 5000
  },
  persistent: {
    type: Boolean,
    default: false
  },
  showProgress: {
    type: Boolean,
    default: true
  },
  actionText: {
    type: String,
    default: ''
  },
  actionHandler: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['close', 'action'])

const visible = ref(false)
const progressPercentage = ref(100)
let timeoutId = null
let progressInterval = null

const positionClasses = computed(() => {
  const positions = {
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2 sm:top-6',
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
    'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2 sm:bottom-6',
    'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6'
  }
  
  return positions[props.position]
})

const iconClasses = computed(() => {
  const icons = {
    success: 'pi pi-check-circle text-green-500',
    error: 'pi pi-times-circle text-red-500',
    warning: 'pi pi-exclamation-triangle text-yellow-500',
    info: 'pi pi-info-circle text-blue-500'
  }
  
  return icons[props.type]
})

const actionButtonClasses = computed(() => {
  const classes = {
    success: 'text-green-800 bg-green-100 hover:bg-green-200 dark:text-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50',
    error: 'text-red-800 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50',
    warning: 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50',
    info: 'text-blue-800 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
  }
  
  return classes[props.type]
})

const progressBarClasses = computed(() => {
  const classes = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }
  
  return classes[props.type]
})

const show = () => {
  visible.value = true
  
  if (!props.persistent && props.duration > 0) {
    // Start progress bar animation
    if (props.showProgress) {
      progressPercentage.value = 0
      
      // Update progress every 100ms
      const progressStep = 100 / (props.duration / 100)
      progressInterval = setInterval(() => {
        progressPercentage.value += progressStep
        if (progressPercentage.value >= 100) {
          clearInterval(progressInterval)
        }
      }, 100)
    }
    
    // Auto close after duration
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
}

const close = () => {
  visible.value = false
  
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  
  // Wait for animation to complete before emitting close
  setTimeout(() => {
    emit('close')
  }, 300)
}

const handleAction = () => {
  if (props.actionHandler) {
    props.actionHandler()
  }
  emit('action')
  close()
}

onMounted(() => {
  // Show toast after mount
  setTimeout(() => {
    show()
  }, 100)
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})

// Expose methods for parent components
defineExpose({
  show,
  close
})
</script>