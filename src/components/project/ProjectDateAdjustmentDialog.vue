<template>
  <ResponsiveModal
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    @close="handleClose"
    title="Ajustar Fechas del Proyecto"
    subtitle="Cambiar la fecha de inicio del proyecto y ajustar todas las tareas"
    size="lg"
    :persistent="isProcessing"
  >
    <div class="space-y-6">
      <!-- Current project info -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Información Actual del Proyecto
        </h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600 dark:text-gray-400">Fecha de inicio actual:</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatDate(project?.startDate) }}
            </p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Tareas afectadas:</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ project?.tasks?.length || 0 }} tareas
            </p>
          </div>
        </div>
      </div>

      <!-- New start date input -->
      <div class="form-group">
        <label for="newStartDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nueva Fecha de Inicio *
        </label>
        <input
          id="newStartDate"
          v-model="newStartDate"
          type="date"
          required
          :min="minDate"
          :class="[
            'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            hasValidationError ? 'border-red-500 dark:border-red-400' : ''
          ]"
          @change="validateAndPreview"
        />
        <p v-if="hasValidationError" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ validationError }}
        </p>
      </div>

      <!-- Impact preview -->
      <div v-if="impactPreview && !hasValidationError" class="space-y-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
          Vista Previa del Impacto
        </h4>
        
        <!-- Summary -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-start">
            <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-0.5 mr-3"></i>
            <div class="flex-1">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                <strong>{{ Math.abs(impactPreview.daysDifference) }} días</strong>
                {{ impactPreview.daysDifference > 0 ? 'hacia adelante' : 'hacia atrás' }}
              </p>
              <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {{ impactPreview.affectedTasks }} tareas serán ajustadas
              </p>
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="impactPreview.warnings && impactPreview.warnings.length > 0" class="space-y-2">
          <div
            v-for="(warning, index) in impactPreview.warnings"
            :key="index"
            class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3"
          >
            <div class="flex items-start">
              <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 text-sm"></i>
              <p class="text-sm text-yellow-800 dark:text-yellow-200">{{ warning }}</p>
            </div>
          </div>
        </div>

        <!-- Date changes preview -->
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div class="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Cambios de Fechas
            </h5>
          </div>
          <div class="p-4 space-y-3 max-h-48 overflow-y-auto">
            <div class="grid grid-cols-3 gap-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              <span>Proyecto/Tarea</span>
              <span>Fecha Actual</span>
              <span>Nueva Fecha</span>
            </div>
            
            <!-- Project dates -->
            <div class="grid grid-cols-3 gap-4 text-sm py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="font-medium text-gray-900 dark:text-gray-100">
                {{ project?.name }}
              </span>
              <span class="text-gray-600 dark:text-gray-400">
                {{ formatDate(project?.startDate) }}
              </span>
              <span class="text-blue-600 dark:text-blue-400 font-medium">
                {{ formatDate(newStartDate) }}
              </span>
            </div>

            <!-- Task dates preview (first 5 tasks) -->
            <div
              v-for="(task, index) in previewTasks"
              :key="task.id"
              class="grid grid-cols-3 gap-4 text-sm py-1"
            >
              <span class="text-gray-700 dark:text-gray-300 truncate">
                {{ task.title }}
              </span>
              <span class="text-gray-600 dark:text-gray-400">
                {{ formatDate(task.startDate) }}
              </span>
              <span class="text-green-600 dark:text-green-400">
                {{ formatDate(task.newStartDate) }}
              </span>
            </div>

            <div v-if="project?.tasks && project.tasks.length > 5" class="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              ... y {{ project.tasks.length - 5 }} tareas más
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isValidating" class="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" class="mr-2" />
        <span class="text-sm text-gray-600 dark:text-gray-400">Validando cambios...</span>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          @click="handleClose"
          :disabled="isProcessing"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="!canConfirm || isProcessing"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <span v-if="isProcessing" class="flex items-center justify-center">
            <LoadingSpinner size="xs" color="white" class="mr-2" />
            Ajustando fechas...
          </span>
          <span v-else>
            Confirmar Ajuste
          </span>
        </button>
      </div>
    </template>
  </ResponsiveModal>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import ResponsiveModal from '../ui/ResponsiveModal.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import { useNotifications } from '../../services/notificationService.js'
import { useErrorHandler } from '../../composables/useErrorHandler.js'

export default {
  name: 'ProjectDateAdjustmentDialog',
  components: {
    ResponsiveModal,
    LoadingSpinner
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    project: {
      type: Object,
      required: true
    }
  },
  emits: ['update:visible', 'confirmed', 'cancelled'],
  setup(props, { emit }) {
    const store = useStore()
    const { operationSuccess, operationError, operationWarning } = useNotifications()
    const { handleError } = useErrorHandler()

    // State
    const newStartDate = ref('')
    const impactPreview = ref(null)
    const validationError = ref('')
    const isValidating = ref(false)
    const isProcessing = ref(false)

    // Computed
    const hasValidationError = computed(() => !!validationError.value)
    
    const canConfirm = computed(() => {
      return newStartDate.value && 
             !hasValidationError.value && 
             impactPreview.value && 
             !isValidating.value
    })

    const minDate = computed(() => {
      // Allow dates from 1 year ago to 2 years in the future
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      return oneYearAgo.toISOString().split('T')[0]
    })

    const previewTasks = computed(() => {
      if (!props.project?.tasks || !impactPreview.value) return []
      
      return props.project.tasks.slice(0, 5).map(task => {
        const daysDiff = impactPreview.value.daysDifference
        const currentStart = new Date(task.startDate)
        let newStart
        
        if (daysDiff > 0) {
          newStart = addWorkingDays(currentStart, daysDiff)
        } else {
          newStart = subtractWorkingDays(currentStart, Math.abs(daysDiff))
        }
        
        return {
          ...task,
          newStartDate: newStart
        }
      })
    })

    // Methods
    const formatDate = (date) => {
      if (!date) return 'No definida'
      const d = new Date(date)
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const addWorkingDays = (startDate, days) => {
      const result = new Date(startDate)
      let addedDays = 0
      
      while (addedDays < days) {
        result.setDate(result.getDate() + 1)
        // Skip Sundays (0 = Sunday)
        if (result.getDay() !== 0) {
          addedDays++
        }
      }
      
      return result
    }

    const subtractWorkingDays = (endDate, days) => {
      const result = new Date(endDate)
      let subtractedDays = 0
      
      while (subtractedDays < days) {
        result.setDate(result.getDate() - 1)
        // Skip Sundays (0 = Sunday)
        if (result.getDay() !== 0) {
          subtractedDays++
        }
      }
      
      return result
    }

    const validateAndPreview = async () => {
      if (!newStartDate.value) {
        impactPreview.value = null
        validationError.value = ''
        return
      }

      isValidating.value = true
      validationError.value = ''

      try {
        // Validate the new start date
        const validation = await store.dispatch('projects/validateProjectDateAdjustment', {
          projectId: props.project.id,
          newStartDate: new Date(newStartDate.value)
        })

        if (!validation.isValid) {
          validationError.value = validation.errors.join(', ')
          impactPreview.value = null
        } else {
          impactPreview.value = validation
          
          // Show warnings if any
          if (validation.warnings && validation.warnings.length > 0) {
            validation.warnings.forEach(warning => {
              operationWarning(warning)
            })
          }
        }
      } catch (error) {
        validationError.value = 'Error al validar la nueva fecha'
        impactPreview.value = null
        handleError(error, 'Validating project date adjustment')
      } finally {
        isValidating.value = false
      }
    }

    const handleConfirm = async () => {
      if (!canConfirm.value) return

      isProcessing.value = true

      try {
        const result = await store.dispatch('projects/adjustProjectDates', {
          projectId: props.project.id,
          newStartDate: new Date(newStartDate.value)
        })

        if (result.success) {
          operationSuccess('update', 'Fechas del proyecto')
          emit('confirmed', {
            project: result.project,
            adjustedTasks: result.adjustedTasks,
            originalStartDate: props.project.startDate,
            newStartDate: new Date(newStartDate.value)
          })
          handleClose()
        }
      } catch (error) {
        operationError('update', 'las fechas del proyecto', error)
        handleError(error, 'Adjusting project dates')
      } finally {
        isProcessing.value = false
      }
    }

    const handleClose = () => {
      if (isProcessing.value) return
      
      // Reset form
      newStartDate.value = ''
      impactPreview.value = null
      validationError.value = ''
      
      emit('cancelled')
      emit('update:visible', false)
    }

    // Initialize form when dialog opens
    watch(() => props.visible, (isVisible) => {
      if (isVisible && props.project) {
        // Set default new start date to current start date
        const currentStart = new Date(props.project.startDate)
        newStartDate.value = currentStart.toISOString().split('T')[0]
        
        nextTick(() => {
          validateAndPreview()
        })
      }
    })

    return {
      // State
      newStartDate,
      impactPreview,
      validationError,
      isValidating,
      isProcessing,

      // Computed
      hasValidationError,
      canConfirm,
      minDate,
      previewTasks,

      // Methods
      formatDate,
      validateAndPreview,
      handleConfirm,
      handleClose
    }
  }
}
</script>