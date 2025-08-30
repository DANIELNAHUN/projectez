<template>
  <div class="task-form">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Task Title -->
      <div class="form-group">
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Título de la tarea *
        </label>
        <InputText
          id="title"
          v-model="formData.title"
          :class="{ 'p-invalid': errors.title }"
          placeholder="Ingresa el título de la tarea"
          class="w-full"
        />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>

      <!-- Task Description -->
      <div class="form-group">
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <Textarea
          id="description"
          v-model="formData.description"
          rows="4"
          placeholder="Describe la tarea en detalle"
          class="w-full"
        />
      </div>

      <!-- Enhanced Date Management -->
      <div class="form-group">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Fechas y Duración</h3>
        <EnhancedDatePicker
          v-model:startDate="formData.startDate"
          v-model:endDate="formData.endDate"
          v-model:duration="formData.duration"
          v-model:adjustStartDate="formData.adjustStartDate"
          :startDateId="'task-start-date'"
          :endDateId="'task-end-date'"
          :durationId="'task-duration'"
          :adjustStartDateId="'task-adjust-start-date'"
          :startDateLabel="'Fecha de inicio *'"
          :endDateLabel="'Fecha de fin *'"
          :required="true"
          @validation-change="onDateValidationChange"
        />
      </div>

      <!-- Status and Priority -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <Select
            id="status"
            v-model="formData.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona el estado"
            class="w-full"
          />
        </div>

        <div class="form-group">
          <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
            Prioridad
          </label>
          <Select
            id="priority"
            v-model="formData.priority"
            :options="priorityOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona la prioridad"
            class="w-full"
          />
        </div>
      </div>

      <!-- Task Type -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Tipo de tarea *
        </label>
        <div class="flex gap-4">
          <div class="flex items-center">
            <RadioButton
              id="simple"
              v-model="formData.type"
              name="taskType"
              value="simple"
            />
            <label for="simple" class="ml-2">Simple</label>
          </div>
          <div class="flex items-center">
            <RadioButton
              id="with_deliverable"
              v-model="formData.type"
              name="taskType"
              value="with_deliverable"
            />
            <label for="with_deliverable" class="ml-2">Con entregable</label>
          </div>
        </div>
      </div>

      <!-- Deliverable Section (only if type is 'with_deliverable') -->
      <div v-if="formData.type === 'with_deliverable'" class="deliverable-section border-t pt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Información del Entregable</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label for="deliverableType" class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de entregable *
            </label>
            <Select
              id="deliverableType"
              v-model="formData.deliverable.type"
              :options="deliverableTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona el tipo"
              class="w-full"
              :class="{ 'p-invalid': errors.deliverableType }"
            />
            <small v-if="errors.deliverableType" class="p-error">{{ errors.deliverableType }}</small>
          </div>

          <div class="form-group">
            <label for="deliverableDueDate" class="block text-sm font-medium text-gray-700 mb-2">
              Fecha de entrega
            </label>
            <DatePicker
              id="deliverableDueDate"
              v-model="formData.deliverable.dueDate"
              dateFormat="dd/mm/yy"
              :showIcon="true"
              :minDate="formData.startDate"
              :maxDate="formData.endDate"
              class="w-full"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="deliverableDescription" class="block text-sm font-medium text-gray-700 mb-2">
            Descripción del entregable
          </label>
          <Textarea
            id="deliverableDescription"
            v-model="formData.deliverable.description"
            rows="3"
            placeholder="Describe el entregable esperado"
            class="w-full"
          />
        </div>

        <div class="form-group">
          <label for="deliverableStatus" class="block text-sm font-medium text-gray-700 mb-2">
            Estado del entregable
          </label>
          <Select
            id="deliverableStatus"
            v-model="formData.deliverable.status"
            :options="deliverableStatusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona el estado"
            class="w-full"
          />
        </div>

        <div class="form-group">
          <label for="deliverableNotes" class="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales
          </label>
          <Textarea
            id="deliverableNotes"
            v-model="formData.deliverable.notes"
            rows="2"
            placeholder="Notas o comentarios adicionales"
            class="w-full"
          />
        </div>
      </div>

      <!-- Team Member Assignment -->
      <div v-if="teamMembers.length > 0" class="form-group">
        <label for="assignedTo" class="block text-sm font-medium text-gray-700 mb-2">
          Asignar a
        </label>
        <Select
          id="assignedTo"
          v-model="formData.assignedTo"
          :options="teamMemberOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecciona un miembro del equipo"
          class="w-full"
          :showClear="true"
        />
      </div>

      <!-- Progress (only for editing existing tasks) -->
      <div v-if="isEditing" class="form-group">
        <label for="progress" class="block text-sm font-medium text-gray-700 mb-2">
          Progreso: {{ formData.progress }}%
        </label>
        <Slider
          id="progress"
          v-model="formData.progress"
          :min="0"
          :max="100"
          class="w-full"
        />
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          @click="handleCancel"
        />
        <Button
          type="submit"
          :label="isEditing ? 'Actualizar Tarea' : 'Crear Tarea'"
          :loading="loading"
        />
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import RadioButton from 'primevue/radiobutton'
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import EnhancedDatePicker from '../ui/EnhancedDatePicker.vue'
import { Task, Deliverable } from '../../models/index.js'
import { 
  TASK_STATUSES, 
  TASK_PRIORITIES, 
  DELIVERABLE_TYPES, 
  DELIVERABLE_STATUSES 
} from '../../models/index.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'

export default {
  name: 'TaskForm',
  components: {
    InputText,
    Textarea,
    DatePicker,
    Select,
    RadioButton,
    Button,
    Slider,
    EnhancedDatePicker
  },
  props: {
    task: {
      type: Object,
      default: null
    },
    projectId: {
      type: String,
      required: true
    },
    parentTaskId: {
      type: String,
      default: null
    },
    teamMembers: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const store = useStore()
    const loading = ref(false)
    const errors = ref({})

    const isEditing = computed(() => !!props.task)

    // Form data initialization
    const initializeFormData = () => {
      if (props.task) {
        // Editing existing task
        return {
          id: props.task.id,
          title: props.task.title,
          description: props.task.description,
          startDate: new Date(props.task.startDate),
          endDate: new Date(props.task.endDate),
          duration: props.task.duration || DateCalculationService.calculateWorkingDays(
            new Date(props.task.startDate), 
            new Date(props.task.endDate)
          ),
          adjustStartDate: props.task.adjustStartDate || false,
          status: props.task.status,
          type: props.task.type,
          priority: props.task.priority,
          assignedTo: props.task.assignedTo,
          progress: props.task.progress,
          deliverable: props.task.deliverable ? {
            type: props.task.deliverable.type,
            description: props.task.deliverable.description,
            dueDate: new Date(props.task.deliverable.dueDate),
            status: props.task.deliverable.status,
            notes: props.task.deliverable.notes
          } : {
            type: 'other',
            description: '',
            dueDate: new Date(),
            status: 'pending',
            notes: ''
          }
        }
      } else {
        // Creating new task
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        return {
          title: '',
          description: '',
          startDate: now,
          endDate: tomorrow,
          duration: 1, // Default to 1 working day
          adjustStartDate: false,
          status: 'pending',
          type: 'simple',
          priority: 'medium',
          assignedTo: null,
          progress: 0,
          deliverable: {
            type: 'other',
            description: '',
            dueDate: tomorrow,
            status: 'pending',
            notes: ''
          }
        }
      }
    }

    const formData = ref(initializeFormData())

    // Options for dropdowns
    const statusOptions = computed(() => 
      TASK_STATUSES.map(status => ({
        label: getStatusLabel(status),
        value: status
      }))
    )

    const priorityOptions = computed(() => 
      TASK_PRIORITIES.map(priority => ({
        label: getPriorityLabel(priority),
        value: priority
      }))
    )

    const deliverableTypeOptions = computed(() => 
      DELIVERABLE_TYPES.map(type => ({
        label: getDeliverableTypeLabel(type),
        value: type
      }))
    )

    const deliverableStatusOptions = computed(() => 
      DELIVERABLE_STATUSES.map(status => ({
        label: getDeliverableStatusLabel(status),
        value: status
      }))
    )

    const teamMemberOptions = computed(() => 
      props.teamMembers.map(member => ({
        label: `${member.name} (${member.role})`,
        value: member.id
      }))
    )

    // Label functions
    const getStatusLabel = (status) => {
      const labels = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completada',
        cancelled: 'Cancelada'
      }
      return labels[status] || status
    }

    const getPriorityLabel = (priority) => {
      const labels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta'
      }
      return labels[priority] || priority
    }

    const getDeliverableTypeLabel = (type) => {
      const labels = {
        presentation: 'Presentación',
        file: 'Archivo',
        exposition: 'Exposición',
        other: 'Otro'
      }
      return labels[type] || type
    }

    const getDeliverableStatusLabel = (status) => {
      const labels = {
        pending: 'Pendiente',
        in_review: 'En Revisión',
        completed: 'Completado'
      }
      return labels[status] || status
    }

    // Date validation state
    const dateValidationErrors = ref({})
    const isDateValidationValid = ref(true)

    // Date validation handler
    const onDateValidationChange = (validationResult) => {
      dateValidationErrors.value = validationResult.errors || {}
      isDateValidationValid.value = validationResult.isValid
    }

    // Validation
    const validateForm = () => {
      errors.value = {}

      if (!formData.value.title.trim()) {
        errors.value.title = 'El título es requerido'
      }

      // Include date validation errors from EnhancedDatePicker
      if (!isDateValidationValid.value) {
        Object.assign(errors.value, dateValidationErrors.value)
      }

      // Additional date validation using DateCalculationService
      if (formData.value.startDate && formData.value.endDate) {
        try {
          if (!DateCalculationService.validateDateRange(formData.value.startDate, formData.value.endDate)) {
            errors.value.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio'
          }
        } catch (error) {
          errors.value.dateRange = 'Error en el rango de fechas: ' + error.message
        }
      }

      // Validate duration
      if (formData.value.duration !== null && formData.value.duration < 1) {
        errors.value.duration = 'La duración debe ser al menos 1 día'
      }

      if (formData.value.type === 'with_deliverable') {
        if (!formData.value.deliverable.type) {
          errors.value.deliverableType = 'El tipo de entregable es requerido'
        }
      }

      return Object.keys(errors.value).length === 0
    }

    // Watch for date changes to update deliverable due date
    watch([() => formData.value.startDate, () => formData.value.endDate], ([startDate, endDate]) => {
      if (formData.value.type === 'with_deliverable') {
        // Set deliverable due date to end date if not set or invalid
        if (!formData.value.deliverable.dueDate || 
            formData.value.deliverable.dueDate < startDate || 
            formData.value.deliverable.dueDate > endDate) {
          formData.value.deliverable.dueDate = endDate
        }
      }
    })

    // Watch for duration changes to ensure consistency
    watch(() => formData.value.duration, (newDuration) => {
      if (newDuration && newDuration > 0) {
        // The EnhancedDatePicker handles the date calculations
        // We just need to ensure the form data is consistent
        if (formData.value.type === 'with_deliverable' && formData.value.endDate) {
          // Update deliverable due date if it's outside the new date range
          if (formData.value.deliverable.dueDate > formData.value.endDate) {
            formData.value.deliverable.dueDate = formData.value.endDate
          }
        }
      }
    })

    // Form submission
    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      loading.value = true

      try {
        const taskData = {
          ...formData.value,
          projectId: props.projectId,
          // Ensure duration and adjustStartDate are included
          duration: formData.value.duration,
          adjustStartDate: formData.value.adjustStartDate
        }

        // Only include parentTaskId if it's actually set
        if (props.parentTaskId && props.parentTaskId !== null && props.parentTaskId !== '') {
          taskData.parentTaskId = props.parentTaskId
        }

        // Create deliverable object if task type is 'with_deliverable'
        if (taskData.type === 'with_deliverable') {
          taskData.deliverable = new Deliverable(formData.value.deliverable)
        } else {
          taskData.deliverable = null
        }

        emit('submit', taskData)
      } catch (error) {
        console.error('Error submitting task:', error)
      } finally {
        loading.value = false
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    // Reset form when task prop changes
    watch(() => props.task, () => {
      formData.value = initializeFormData()
      errors.value = {}
    })

    return {
      formData,
      errors,
      loading,
      isEditing,
      statusOptions,
      priorityOptions,
      deliverableTypeOptions,
      deliverableStatusOptions,
      teamMemberOptions,
      dateValidationErrors,
      isDateValidationValid,
      onDateValidationChange,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.task-form {
  max-width: 800px;
}

.form-group {
  margin-bottom: 1rem;
}

.deliverable-section {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.p-error {
  color: #ef4444;
  font-size: 0.875rem;
}

.p-invalid {
  border-color: #ef4444 !important;
}
</style>