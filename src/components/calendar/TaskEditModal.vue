<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="isEditing ? 'Editar Tarea' : 'Nueva Tarea'"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    @hide="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Title -->
      <div class="field">
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Título *
        </label>
        <InputText
          id="title"
          v-model="formData.title"
          :class="{ 'p-invalid': errors.title }"
          class="w-full"
          placeholder="Ingresa el título de la tarea"
        />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>

      <!-- Description -->
      <div class="field">
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <Textarea
          id="description"
          v-model="formData.description"
          rows="3"
          class="w-full"
          placeholder="Describe la tarea (opcional)"
        />
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="field">
          <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Inicio *
          </label>
          <DatePicker
            id="startDate"
            v-model="formData.startDate"
            :class="{ 'p-invalid': errors.startDate }"
            showTime
            hourFormat="24"
            class="w-full"
            placeholder="Selecciona fecha de inicio"
          />
          <small v-if="errors.startDate" class="p-error">{{ errors.startDate }}</small>
        </div>

        <div class="field">
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Fin *
          </label>
          <DatePicker
            id="endDate"
            v-model="formData.endDate"
            :class="{ 'p-invalid': errors.endDate }"
            showTime
            hourFormat="24"
            class="w-full"
            placeholder="Selecciona fecha de fin"
          />
          <small v-if="errors.endDate" class="p-error">{{ errors.endDate }}</small>
        </div>
      </div>

      <!-- Status and Priority -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="field">
          <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <Select
            id="status"
            v-model="formData.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Selecciona el estado"
          />
        </div>

        <div class="field">
          <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
            Prioridad
          </label>
          <Select
            id="priority"
            v-model="formData.priority"
            :options="priorityOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Selecciona la prioridad"
          />
        </div>
      </div>

      <!-- Type and Assignment -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="field">
          <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Tarea
          </label>
          <Select
            id="type"
            v-model="formData.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Selecciona el tipo"
          />
        </div>

        <div class="field">
          <label for="assignedTo" class="block text-sm font-medium text-gray-700 mb-2">
            Asignado a
          </label>
          <Select
            id="assignedTo"
            v-model="formData.assignedTo"
            :options="teamMemberOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Selecciona un miembro del equipo"
            showClear
          />
        </div>
      </div>

      <!-- Progress -->
      <div class="field">
        <label for="progress" class="block text-sm font-medium text-gray-700 mb-2">
          Progreso: {{ formData.progress }}%
        </label>
        <Slider
          id="progress"
          v-model="formData.progress"
          :min="0"
          :max="100"
          :step="5"
          class="w-full"
        />
      </div>

      <!-- Deliverable section (only if type is 'with_deliverable') -->
      <div v-if="formData.type === 'with_deliverable'" class="space-y-4">
        <h4 class="text-lg font-medium text-gray-900">Entregable</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label for="deliverableType" class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Entregable
            </label>
            <Select
              id="deliverableType"
              v-model="formData.deliverable.type"
              :options="deliverableTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Selecciona el tipo de entregable"
            />
          </div>

          <div class="field">
            <label for="deliverableStatus" class="block text-sm font-medium text-gray-700 mb-2">
              Estado del Entregable
            </label>
            <Select
              id="deliverableStatus"
              v-model="formData.deliverable.status"
              :options="deliverableStatusOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Selecciona el estado"
            />
          </div>
        </div>

        <div class="field">
          <label for="deliverableDescription" class="block text-sm font-medium text-gray-700 mb-2">
            Descripción del Entregable
          </label>
          <Textarea
            id="deliverableDescription"
            v-model="formData.deliverable.description"
            rows="2"
            class="w-full"
            placeholder="Describe el entregable"
          />
        </div>

        <div class="field">
          <label for="deliverableDueDate" class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Entrega
          </label>
          <DatePicker
            id="deliverableDueDate"
            v-model="formData.deliverable.dueDate"
            showTime
            hourFormat="24"
            class="w-full"
            placeholder="Selecciona fecha de entrega"
          />
        </div>

        <div class="field">
          <label for="deliverableNotes" class="block text-sm font-medium text-gray-700 mb-2">
            Notas del Entregable
          </label>
          <Textarea
            id="deliverableNotes"
            v-model="formData.deliverable.notes"
            rows="2"
            class="w-full"
            placeholder="Notas adicionales (opcional)"
          />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          @click="handleClose"
        />
        <Button
          type="submit"
          :label="isEditing ? 'Actualizar' : 'Crear'"
          :loading="isSubmitting"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import Button from 'primevue/button'
// import { useToast } from 'primevue/usetoast' // Toast will be handled by parent component

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  },
  initialDate: {
    type: Date,
    default: null
  },
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'task-saved'])

const store = useStore()
// const toast = useToast() // Toast will be handled by parent component

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isEditing = computed(() => !!props.task)
const isSubmitting = ref(false)
const errors = ref({})

// Form data
const formData = ref({
  title: '',
  description: '',
  startDate: new Date(),
  endDate: new Date(),
  status: 'pending',
  priority: 'medium',
  type: 'simple',
  assignedTo: null,
  progress: 0,
  deliverable: {
    type: 'other',
    description: '',
    dueDate: new Date(),
    status: 'pending',
    notes: ''
  }
})

// Options for dropdowns
const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En Progreso', value: 'in_progress' },
  { label: 'Completada', value: 'completed' },
  { label: 'Cancelada', value: 'cancelled' }
]

const priorityOptions = [
  { label: 'Baja', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'high' }
]

const typeOptions = [
  { label: 'Simple', value: 'simple' },
  { label: 'Con Entregable', value: 'with_deliverable' }
]

const deliverableTypeOptions = [
  { label: 'Presentación', value: 'presentation' },
  { label: 'Archivo', value: 'file' },
  { label: 'Exposición', value: 'exposition' },
  { label: 'Otro', value: 'other' }
]

const deliverableStatusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En Revisión', value: 'in_review' },
  { label: 'Completado', value: 'completed' }
]

const teamMemberOptions = computed(() => {
  const currentProject = store.getters['projects/currentProject']
  if (!currentProject || !currentProject.teamMembers) return []
  
  return currentProject.teamMembers.map(member => ({
    label: member.name,
    value: member.id
  }))
})

// Function declarations (must be before watchers)
const populateForm = (task) => {
  if (!task) {
    console.warn('TaskEditModal: populateForm called with null/undefined task')
    return
  }
  
  // Always try to get the freshest data from the store first
  let completeTask = task
  if (task.id) {
    const taskFromStore = store.getters['tasks/getTaskById'](task.id)
    if (taskFromStore) {
      completeTask = taskFromStore
    }
  }
  
  // Create a new object to ensure reactivity
  const newFormData = {
    title: completeTask.title || '',
    description: completeTask.description || '',
    startDate: new Date(completeTask.startDate),
    endDate: new Date(completeTask.endDate),
    status: completeTask.status || 'pending',
    priority: completeTask.priority || 'medium',
    type: completeTask.type || 'simple',
    assignedTo: completeTask.assignedTo || null,
    progress: completeTask.progress || 0,
    deliverable: completeTask.deliverable ? {
      type: completeTask.deliverable.type || 'other',
      description: completeTask.deliverable.description || '',
      dueDate: new Date(completeTask.deliverable.dueDate),
      status: completeTask.deliverable.status || 'pending',
      notes: completeTask.deliverable.notes || ''
    } : {
      type: 'other',
      description: '',
      dueDate: new Date(),
      status: 'pending',
      notes: ''
    }
  }
  
  // Force reactivity by replacing the entire formData object
  formData.value = newFormData
}

const resetForm = () => {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setHours(now.getHours() + 1)
  
  // Use initial data from QuickTaskForm if available
  if (props.initialData) {
    formData.value = {
      title: props.initialData.title || '',
      description: props.initialData.description || '',
      startDate: props.initialData.startDate || props.initialDate || now,
      endDate: props.initialData.endDate || (props.initialDate ? new Date(props.initialDate.getTime() + 60 * 60 * 1000) : endDate),
      status: 'pending',
      priority: props.initialData.priority || 'medium',
      type: 'simple',
      assignedTo: props.initialData.assignedTo || null,
      progress: 0,
      deliverable: {
        type: 'other',
        description: '',
        dueDate: props.initialData.endDate || props.initialDate || now,
        status: 'pending',
        notes: ''
      }
    }
  } else {
    formData.value = {
      title: '',
      description: '',
      startDate: props.initialDate || now,
      endDate: props.initialDate ? new Date(props.initialDate.getTime() + 60 * 60 * 1000) : endDate,
      status: 'pending',
      priority: 'medium',
      type: 'simple',
      assignedTo: null,
      progress: 0,
      deliverable: {
        type: 'other',
        description: '',
        dueDate: props.initialDate || now,
        status: 'pending',
        notes: ''
      }
    }
  }
  errors.value = {}
}

const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.title.trim()) {
    errors.value.title = 'El título es requerido'
  }
  
  if (!formData.value.startDate) {
    errors.value.startDate = 'La fecha de inicio es requerida'
  }
  
  if (!formData.value.endDate) {
    errors.value.endDate = 'La fecha de fin es requerida'
  }
  
  if (formData.value.startDate && formData.value.endDate) {
    if (formData.value.startDate >= formData.value.endDate) {
      errors.value.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    const currentProject = store.getters['projects/currentProject']
    if (!currentProject) {
      throw new Error('No hay un proyecto seleccionado')
    }
    
    const taskData = {
      ...formData.value,
      projectId: currentProject.id,
      deliverable: formData.value.type === 'with_deliverable' ? formData.value.deliverable : null
    }
    
    if (isEditing.value) {
      // Update existing task
      await store.dispatch('tasks/updateTask', {
        ...props.task,
        ...taskData
      })
      
      // Show success message (handled by parent)
      console.log('Task updated successfully')
    } else {
      // Create new task
      await store.dispatch('tasks/createTask', taskData)
      
      // Show success message (handled by parent)
      console.log('Task created successfully')
    }
    
    // Reload calendar events
    await store.dispatch('calendar/loadCalendarEvents')
    
    emit('task-saved')
    handleClose()
    
  } catch (error) {
    console.error('Error saving task:', error)
    // Show error message (handled by parent)
    console.error('Error saving task:', error.message || 'Error al guardar la tarea')
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  isVisible.value = false
  nextTick(() => {
    resetForm()
  })
}

// Watchers (must be after function declarations)
watch(() => props.task, (newTask) => {
  if (newTask) {
    populateForm(newTask)
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal visibility changes to force form update
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.task) {
    // Force form population when modal opens, even if it's the same task
    // This fixes the issue when opening the same task from different calendar days
    nextTick(() => {
      populateForm(props.task)
    })
  }
}, { immediate: false })

watch(() => props.initialDate, (newDate) => {
  if (newDate && !props.task && !props.initialData) {
    const startDate = new Date(newDate)
    const endDate = new Date(newDate)
    endDate.setHours(startDate.getHours() + 1) // Default 1 hour duration
    
    formData.value.startDate = startDate
    formData.value.endDate = endDate
  }
}, { immediate: true })

watch(() => props.initialData, (newData) => {
  if (newData && !props.task) {
    resetForm()
  }
}, { immediate: true })
</script>