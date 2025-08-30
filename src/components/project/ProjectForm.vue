<template>
  <ResponsiveCard :title="isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'" size="lg" class="max-w-2xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Project name -->
      <div class="form-group">
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Proyecto *
        </label>
        <input id="name" :value="form.name" @input="handleFieldInput('name', $event.target.value)"
          @blur="handleFieldBlur('name')" type="text" required :class="[
            'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'placeholder-gray-500 dark:placeholder-gray-400',
            hasFieldError('name') ? 'border-red-500 dark:border-red-400' : ''
          ]" placeholder="Ingresa el nombre del proyecto" />
        <p v-if="hasFieldError('name')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getFieldError('name') }}
        </p>
      </div>

      <!-- Project description -->
      <div class="form-group">
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descripción
        </label>
        <textarea id="description" :value="form.description"
          @input="handleFieldInput('description', $event.target.value)" @blur="handleFieldBlur('description')" rows="4"
          :class="[
            'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'resize-none',
            hasFieldError('description') ? 'border-red-500 dark:border-red-400' : ''
          ]" placeholder="Describe el proyecto (opcional)"></textarea>
        <p v-if="hasFieldError('description')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getFieldError('description') }}
        </p>
      </div>

      <!-- Project dates -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div class="form-group">
          <div class="flex items-center justify-between mb-2">
            <label for="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de Inicio *
            </label>
            <button
              v-if="isEditing && project?.tasks && project.tasks.length > 0"
              type="button"
              @click="showDateAdjustmentDialog = true"
              class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              title="Ajustar fechas del proyecto y todas las tareas"
            >
              Ajustar fechas del proyecto
            </button>
          </div>
          <input id="startDate" :value="form.startDate" @input="handleFieldInput('startDate', $event.target.value)"
            @blur="handleFieldBlur('startDate')" type="date" required :class="[
              'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'text-gray-900 dark:text-gray-100',
              'bg-white dark:bg-gray-800',
              'border-gray-300 dark:border-gray-600',
              hasFieldError('startDate') ? 'border-red-500 dark:border-red-400' : ''
            ]" />
          <p v-if="hasFieldError('startDate')" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ getFieldError('startDate') }}
          </p>
          <p v-if="isEditing && project?.tasks && project.tasks.length > 0" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Cambiar esta fecha solo afecta el proyecto. Use "Ajustar fechas del proyecto" para actualizar todas las tareas.
          </p>
        </div>

        <div class="form-group">
          <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha de Fin
          </label>
          <input id="endDate" :value="form.endDate" @input="handleFieldInput('endDate', $event.target.value)"
            @blur="handleFieldBlur('endDate')" type="date" :class="[
              'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'text-gray-900 dark:text-gray-100',
              'bg-white dark:bg-gray-800',
              'border-gray-300 dark:border-gray-600',
              hasFieldError('endDate') ? 'border-red-500 dark:border-red-400' : ''
            ]" :min="form.startDate" />
          <p v-if="hasFieldError('endDate')" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ getFieldError('endDate') }}
          </p>
        </div>
      </div>

      <!-- Project status -->
      <div class="form-group">
        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Estado del Proyecto
        </label>
        <select id="status" :value="form.status" @change="handleFieldInput('status', $event.target.value)"
          @blur="handleFieldBlur('status')" :class="[
            'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            hasFieldError('status') ? 'border-red-500 dark:border-red-400' : ''
          ]">
          <option value="active">Activo</option>
          <option value="paused">Pausado</option>
          <option value="completed">Completado</option>
        </select>
        <p v-if="hasFieldError('status')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getFieldError('status') }}
        </p>
      </div>

      <!-- Form actions -->
      <div class="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button type="button" @click="handleCancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
          Cancelar
        </button>
        <button type="submit" :disabled="isSubmitting || hasErrors"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
          <span v-if="isSubmitting" class="flex items-center justify-center">
            <LoadingSpinner size="xs" color="white" class="mr-2" />
            {{ isEditing ? 'Actualizando...' : 'Creando...' }}
          </span>
          <span v-else>
            {{ isEditing ? 'Actualizar Proyecto' : 'Crear Proyecto' }}
          </span>
        </button>
      </div>
    </form>

    <!-- Date Adjustment Dialog -->
    <ProjectDateAdjustmentDialog
      v-if="isEditing && project"
      :visible="showDateAdjustmentDialog"
      @update:visible="showDateAdjustmentDialog = $event"
      :project="project"
      @confirmed="handleDateAdjustmentConfirmed"
      @cancelled="handleDateAdjustmentCancelled"
    />

    <!-- Undo Toast -->
    <ProjectDateAdjustmentUndo
      :visible="showUndoToast"
      :undo-data="undoData"
      @undo="handleUndo"
      @dismiss="showUndoToast = false"
    />
  </ResponsiveCard>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import ResponsiveCard from '../ui/ResponsiveCard.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import ProjectDateAdjustmentDialog from './ProjectDateAdjustmentDialog.vue'
import ProjectDateAdjustmentUndo from './ProjectDateAdjustmentUndo.vue'
import { useFormValidation, validationRules } from '../../composables/useFormValidation.js'
import { useErrorHandler } from '../../composables/useErrorHandler.js'
import { useNotifications } from '../../services/notificationService.js'

export default {
  name: 'ProjectForm',
  components: {
    ResponsiveCard,
    LoadingSpinner,
    ProjectDateAdjustmentDialog,
    ProjectDateAdjustmentUndo
  },
  props: {
    project: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel', 'dateAdjusted', 'dateUndone'],
  setup(props, { emit }) {
    const store = useStore()
    const { handleError, handleValidationError } = useErrorHandler()
    const { operationSuccess, operationError, validationError } = useNotifications()

    // Form data
    const form = ref({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'active'
    })

    const isSubmitting = ref(false)
    const showDateAdjustmentDialog = ref(false)
    const showUndoToast = ref(false)
    const undoData = ref(null)

    // Enhanced validation rules for projects
    const projectValidationRules = {
      ...validationRules.project,
      name: [
        ...validationRules.project.name
      ],
      endDate: [
        ...validationRules.project.endDate,
        {
          validator: (value, fieldName) => {
            if (value && form.value.startDate) {
              const startDate = new Date(form.value.startDate)
              const endDate = new Date(value)
              if (endDate <= startDate) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
              }
            }
          },
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        }
      ]
    }

    // Form validation
    const {
      errors,
      hasErrors,
      isValid,
      validateForm,
      validateField,
      touchField,
      getFieldError,
      hasFieldError,
      clearErrors
    } = useFormValidation(projectValidationRules)

    const isEditing = computed(() => !!props.project)

    // Methods
    const resetForm = () => {
      form.value = {
        name: '',
        description: '',
        startDate: formatDateForInput(new Date()),
        endDate: '',
        status: 'active'
      }
      clearErrors()
    }

    const initializeForm = (project) => {
      if (project) {
        form.value = {
          name: project.name || '',
          description: project.description || '',
          startDate: formatDateForInput(project.startDate),
          endDate: formatDateForInput(project.endDate),
          status: project.status || 'active'
        }
      } else {
        resetForm()
      }
      clearErrors()
    }

    // Watch for project changes
    watch(() => props.project, (newProject) => {
      initializeForm(newProject)
    })

    const formatDateForInput = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toISOString().split('T')[0]
    }

    const handleFieldBlur = (fieldName) => {
      touchField(fieldName)
      validateField(fieldName, form.value[fieldName])
    }

    const handleFieldInput = (fieldName, value) => {
      form.value[fieldName] = value
      // Clear error when user starts typing
      if (hasFieldError(fieldName)) {
        validateField(fieldName, value)
      }
    }

    const handleSubmit = async () => {
      try {
        // Validate form
        const isFormValid = await validateForm(form.value)
        if (!isFormValid) {
          return
        }

        isSubmitting.value = true

        const projectData = {
          ...form.value,
          startDate: new Date(form.value.startDate),
          endDate: form.value.endDate ? new Date(form.value.endDate) : null
        }

        if (isEditing.value) {
          projectData.id = props.project.id
        }

        await emit('submit', projectData)

        // Show success notification
        operationSuccess(
          isEditing.value ? 'update' : 'create',
          'Proyecto'
        )

        if (!isEditing.value) {
          resetForm()
        }

      } catch (error) {
        handleError(error, 'Project form submission', {
          onError: (errorObj) => {
            if (errorObj.type === 'validation') {
              validationError(errorObj.originalError)
            } else {
              operationError(
                isEditing.value ? 'update' : 'create',
                'el proyecto',
                error
              )
            }
          }
        })
      } finally {
        isSubmitting.value = false
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    const handleDateAdjustmentConfirmed = (data) => {
      // Store undo data and show undo toast
      undoData.value = data
      showUndoToast.value = true
      showDateAdjustmentDialog.value = false
      
      // Update form with new start date
      form.value.startDate = formatDateForInput(data.newStartDate)
      
      // Emit update to parent component
      emit('dateAdjusted', data)
    }

    const handleDateAdjustmentCancelled = () => {
      showDateAdjustmentDialog.value = false
    }

    const handleUndo = (undoData) => {
      // Update form with original start date
      form.value.startDate = formatDateForInput(undoData.originalStartDate)
      showUndoToast.value = false
      undoData.value = null
      
      // Emit undo to parent component
      emit('dateUndone', undoData)
    }

    // Initialize form
    onMounted(() => {
      initializeForm(props.project)
    })

    return {
      // State
      form,
      isSubmitting,
      errors,
      showDateAdjustmentDialog,
      showUndoToast,
      undoData,

      // Computed
      isEditing,
      hasErrors,
      isValid,

      // Methods
      handleSubmit,
      handleCancel,
      handleFieldBlur,
      handleFieldInput,
      getFieldError,
      hasFieldError,
      resetForm,
      handleDateAdjustmentConfirmed,
      handleDateAdjustmentCancelled,
      handleUndo
    }
  }
}
</script>