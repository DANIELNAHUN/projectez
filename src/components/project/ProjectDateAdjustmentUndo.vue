<template>
  <div v-if="visible"
    class="fixed bottom-4 right-4 z-40 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg animate-slide-up">
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <i class="pi pi-check-circle text-green-500 text-lg"></i>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Fechas ajustadas correctamente
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {{ adjustedTasks }} tareas fueron actualizadas
          </p>
          <div class="mt-3 flex items-center space-x-2">
            <button @click="handleUndo" :disabled="isUndoing"
              class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="isUndoing" class="flex items-center">
                <LoadingSpinner size="xs" class="mr-1" />
                Deshaciendo...
              </span>
              <span v-else>Deshacer</span>
            </button>
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <button @click="handleDismiss"
              class="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Cerrar
            </button>
          </div>
        </div>
        <div class="ml-4 flex-shrink-0">
          <button @click="handleDismiss" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Progress bar for auto-dismiss -->
    <div v-if="!isUndoing && autoDismissProgress > 0"
      class="h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
      <div class="h-full bg-blue-500 transition-all duration-100 ease-linear"
        :style="{ width: `${autoDismissProgress}%` }"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import { useNotifications } from '../../services/notificationService.js'
import { useErrorHandler } from '../../composables/useErrorHandler.js'

export default {
  name: 'ProjectDateAdjustmentUndo',
  components: {
    LoadingSpinner
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    undoData: {
      type: Object,
      required: true
    },
    autoDismissTime: {
      type: Number,
      default: 10000 // 10 seconds
    }
  },
  emits: ['undo', 'dismiss'],
  setup(props, { emit }) {
    const store = useStore()
    const { operationSuccess, operationError } = useNotifications()
    const { handleError } = useErrorHandler()

    // State
    const isUndoing = ref(false)
    const autoDismissProgress = ref(100)
    let autoDismissTimer = null
    let progressTimer = null

    // Computed
    const adjustedTasks = computed(() => {
      return props.undoData?.adjustedTasks || 0
    })

    // Methods
    const handleUndo = async () => {
      if (isUndoing.value) return

      isUndoing.value = true
      clearTimers()

      try {
        // Restore original project start date
        await store.dispatch('projects/adjustProjectDates', {
          projectId: props.undoData.project.id,
          newStartDate: new Date(props.undoData.originalStartDate)
        })

        operationSuccess('undo', 'Ajuste de fechas')
        emit('undo', props.undoData)
        handleDismiss()
      } catch (error) {
        operationError('undo', 'el ajuste de fechas', error)
        handleError(error, 'Undoing project date adjustment')
      } finally {
        isUndoing.value = false
      }
    }

    const handleDismiss = () => {
      clearTimers()
      emit('dismiss')
    }

    const clearTimers = () => {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer)
        autoDismissTimer = null
      }
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
    }

    const startAutoDismiss = () => {
      if (props.autoDismissTime <= 0) return

      autoDismissProgress.value = 100

      // Progress bar animation
      const progressInterval = 100 // Update every 100ms
      const progressDecrement = (100 / props.autoDismissTime) * progressInterval

      progressTimer = setInterval(() => {
        autoDismissProgress.value -= progressDecrement
        if (autoDismissProgress.value <= 0) {
          clearInterval(progressTimer)
          progressTimer = null
        }
      }, progressInterval)

      // Auto dismiss
      autoDismissTimer = setTimeout(() => {
        handleDismiss()
      }, props.autoDismissTime)
    }

    // Lifecycle
    onMounted(() => {
      if (props.visible) {
        startAutoDismiss()
      }
    })

    onUnmounted(() => {
      clearTimers()
    })

    // Watch for visibility changes
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        startAutoDismiss()
      } else {
        clearTimers()
      }
    })

    return {
      // State
      isUndoing,
      autoDismissProgress,

      // Computed
      adjustedTasks,

      // Methods
      handleUndo,
      handleDismiss
    }
  }
}
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>