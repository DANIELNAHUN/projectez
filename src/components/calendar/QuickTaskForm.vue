<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="Crear Tarea Rápida"
    :style="{ width: '30rem' }"
    :breakpoints="{ '1199px': '50vw', '575px': '90vw' }"
    @hide="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Title -->
      <div class="field">
        <label for="quickTitle" class="block text-sm font-medium text-gray-700 mb-2">
          Título *
        </label>
        <InputText
          id="quickTitle"
          v-model="formData.title"
          :class="{ 'p-invalid': errors.title }"
          class="w-full"
          placeholder="¿Qué necesitas hacer?"
          autofocus
        />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>

      <!-- Description -->
      <div class="field">
        <label for="quickDescription" class="block text-sm font-medium text-gray-700 mb-2">
          Descripción (opcional)
        </label>
        <Textarea
          id="quickDescription"
          v-model="formData.description"
          rows="2"
          class="w-full"
          placeholder="Detalles adicionales..."
        />
      </div>

      <!-- Time Range -->
      <div class="grid grid-cols-2 gap-3">
        <div class="field">
          <label for="quickStartTime" class="block text-sm font-medium text-gray-700 mb-2">
            Hora de inicio
          </label>
          <DatePicker
            id="quickStartTime"
            v-model="formData.startDate"
            timeOnly
            hourFormat="24"
            class="w-full"
            placeholder="HH:mm"
          />
        </div>

        <div class="field">
          <label for="quickEndTime" class="block text-sm font-medium text-gray-700 mb-2">
            Hora de fin
          </label>
          <DatePicker
            id="quickEndTime"
            v-model="formData.endDate"
            timeOnly
            hourFormat="24"
            class="w-full"
            placeholder="HH:mm"
          />
        </div>
      </div>

      <!-- Quick Options -->
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Opciones rápidas
        </label>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            label="1 hora"
            size="small"
            severity="secondary"
            @click="setDuration(1)"
          />
          <Button
            type="button"
            label="2 horas"
            size="small"
            severity="secondary"
            @click="setDuration(2)"
          />
          <Button
            type="button"
            label="Todo el día"
            size="small"
            severity="secondary"
            @click="setAllDay"
          />
        </div>
      </div>

      <!-- Priority -->
      <div class="field">
        <label for="quickPriority" class="block text-sm font-medium text-gray-700 mb-2">
          Prioridad
        </label>
        <div class="flex gap-2">
          <Button
            type="button"
            :label="priorityLabels.low"
            size="small"
            :severity="formData.priority === 'low' ? 'success' : 'secondary'"
            @click="formData.priority = 'low'"
          />
          <Button
            type="button"
            :label="priorityLabels.medium"
            size="small"
            :severity="formData.priority === 'medium' ? 'warn' : 'secondary'"
            @click="formData.priority = 'medium'"
          />
          <Button
            type="button"
            :label="priorityLabels.high"
            size="small"
            :severity="formData.priority === 'high' ? 'danger' : 'secondary'"
            @click="formData.priority = 'high'"
          />
        </div>
      </div>

      <!-- Assignment (if team members available) -->
      <div v-if="teamMemberOptions.length > 0" class="field">
        <label for="quickAssignment" class="block text-sm font-medium text-gray-700 mb-2">
          Asignar a
        </label>
        <Select
          id="quickAssignment"
          v-model="formData.assignedTo"
          :options="teamMemberOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          placeholder="Selecciona un miembro"
          showClear
        />
      </div>

      <!-- Form Actions -->
      <div class="flex justify-between pt-4 border-t">
        <Button
          type="button"
          label="Más opciones"
          severity="secondary"
          text
          @click="openFullForm"
        />
        <div class="flex gap-2">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            @click="handleClose"
          />
          <Button
            type="submit"
            label="Crear Tarea"
            :loading="isSubmitting"
          />
        </div>
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
import Button from 'primevue/button'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedDate: {
    type: Date,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'task-created', 'open-full-form'])

const store = useStore()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isSubmitting = ref(false)
const errors = ref({})

// Priority labels
const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
}

// Form data
const formData = ref({
  title: '',
  description: '',
  startDate: new Date(),
  endDate: new Date(),
  priority: 'medium',
  assignedTo: null
})

// Team member options
const teamMemberOptions = computed(() => {
  const currentProject = store.getters['projects/currentProject']
  if (!currentProject || !currentProject.teamMembers) return []
  
  return currentProject.teamMembers.map(member => ({
    label: member.name,
    value: member.id
  }))
})

// Helper methods
const resetForm = () => {
  const selectedDate = props.selectedDate || new Date()
  const startDate = new Date(selectedDate)
  const endDate = new Date(selectedDate)
  
  // Set default time if no specific time was provided
  if (startDate.getHours() === 0 && startDate.getMinutes() === 0) {
    startDate.setHours(9, 0, 0, 0) // Default to 9:00 AM
    endDate.setHours(10, 0, 0, 0)  // Default to 10:00 AM (1 hour duration)
  } else {
    // If a specific time was clicked, use that time and add 1 hour
    endDate.setTime(startDate.getTime() + 60 * 60 * 1000)
  }
  
  formData.value = {
    title: '',
    description: '',
    startDate,
    endDate,
    priority: 'medium',
    assignedTo: null
  }
  errors.value = {}
}

const setDuration = (hours) => {
  const startDate = new Date(formData.value.startDate)
  const endDate = new Date(startDate)
  endDate.setHours(startDate.getHours() + hours)
  formData.value.endDate = endDate
}

const setAllDay = () => {
  const selectedDate = props.selectedDate || new Date()
  const startDate = new Date(selectedDate)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(selectedDate)
  endDate.setHours(23, 59, 59, 999)
  
  formData.value.startDate = startDate
  formData.value.endDate = endDate
}

const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.title.trim()) {
    errors.value.title = 'El título es requerido'
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
    
    // Combine the selected date with the time from form
    const selectedDate = props.selectedDate || new Date()
    const startDateTime = new Date(selectedDate)
    const endDateTime = new Date(selectedDate)
    
    // Set the time from the form
    const startTime = new Date(formData.value.startDate)
    const endTime = new Date(formData.value.endDate)
    
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0)
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0)
    
    const taskData = {
      title: formData.value.title,
      description: formData.value.description,
      startDate: startDateTime,
      endDate: endDateTime,
      status: 'pending',
      priority: formData.value.priority,
      type: 'simple',
      assignedTo: formData.value.assignedTo,
      progress: 0,
      projectId: currentProject.id,
      deliverable: null
    }
    
    await store.dispatch('tasks/createTask', taskData)
    
    // Reload calendar events
    await store.dispatch('calendar/loadCalendarEvents')
    
    emit('task-created')
    handleClose()
    
  } catch (error) {
    console.error('Error creating quick task:', error)
    // In a real app, you'd show a toast notification here
  } finally {
    isSubmitting.value = false
  }
}

const openFullForm = () => {
  // Pass the current form data to the full form
  const taskData = {
    title: formData.value.title,
    description: formData.value.description,
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    priority: formData.value.priority,
    assignedTo: formData.value.assignedTo
  }
  
  emit('open-full-form', taskData)
  handleClose()
}

const handleClose = () => {
  isVisible.value = false
  nextTick(() => {
    resetForm()
  })
}

// Watchers
watch(() => props.selectedDate, () => {
  if (props.visible) {
    resetForm()
  }
}, { immediate: true })

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetForm()
  }
})
</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}

.p-error {
  color: #ef4444;
  font-size: 0.875rem;
}

.p-invalid {
  border-color: #ef4444 !important;
}
</style>