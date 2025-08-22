<template>
  <div
    :class="[
      'task-event-card',
      'p-2 rounded-md text-xs cursor-pointer transition-all duration-200',
      'hover:shadow-md border-l-4',
      statusClasses,
      priorityClasses,
      { 'opacity-75': isDragging }
    ]"
    :draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    :title="taskTooltip"
  >
    <div class="flex items-center justify-between mb-1">
      <span class="font-medium truncate flex-1" :class="textColorClass">
        {{ task.title }}
      </span>
      <span v-if="task.type === 'with_deliverable'" class="ml-1">
        <i class="pi pi-file text-xs" :class="textColorClass"></i>
      </span>
    </div>
    
    <div class="flex items-center justify-between text-xs opacity-75">
      <span :class="textColorClass">
        {{ formatTime(task.startDate) }} - {{ formatTime(task.endDate) }}
      </span>
      <div class="flex items-center space-x-1">
        <span v-if="task.assignedTo" class="truncate max-w-16" :class="textColorClass">
          {{ getAssigneeName(task.assignedTo) }}
        </span>
        <div 
          v-if="task.progress > 0"
          class="w-8 h-1 bg-gray-200 rounded-full overflow-hidden"
        >
          <div 
            class="h-full bg-current rounded-full transition-all duration-300"
            :style="{ width: task.progress + '%' }"
            :class="textColorClass"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit-task', 'drag-start', 'drag-end', 'date-change'])

const store = useStore()
const isDragging = ref(false)

// Computed properties for styling
const statusClasses = computed(() => {
  const statusMap = {
    'pending': 'bg-yellow-50 border-yellow-400',
    'in_progress': 'bg-blue-50 border-blue-400', 
    'completed': 'bg-green-50 border-green-400',
    'cancelled': 'bg-gray-50 border-gray-400'
  }
  return statusMap[props.task.status] || statusMap.pending
})

const priorityClasses = computed(() => {
  const priorityMap = {
    'high': 'ring-2 ring-red-200',
    'medium': 'ring-1 ring-yellow-200',
    'low': ''
  }
  return priorityMap[props.task.priority] || ''
})

const textColorClass = computed(() => {
  const colorMap = {
    'pending': 'text-yellow-700',
    'in_progress': 'text-blue-700',
    'completed': 'text-green-700', 
    'cancelled': 'text-gray-500'
  }
  return colorMap[props.task.status] || colorMap.pending
})

const taskTooltip = computed(() => {
  let tooltip = `${props.task.title}\n`
  tooltip += `Estado: ${getStatusLabel(props.task.status)}\n`
  tooltip += `Prioridad: ${getPriorityLabel(props.task.priority)}\n`
  if (props.task.description) {
    tooltip += `Descripción: ${props.task.description}\n`
  }
  if (props.task.assignedTo) {
    tooltip += `Asignado a: ${getAssigneeName(props.task.assignedTo)}\n`
  }
  tooltip += `Progreso: ${props.task.progress}%`
  return tooltip
})

// Helper methods
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getStatusLabel = (status) => {
  const labels = {
    'pending': 'Pendiente',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada'
  }
  return labels[status] || status
}

const getPriorityLabel = (priority) => {
  const labels = {
    'high': 'Alta',
    'medium': 'Media', 
    'low': 'Baja'
  }
  return labels[priority] || priority
}

const getAssigneeName = (assigneeId) => {
  const currentProject = store.getters['projects/currentProject']
  if (!currentProject) return assigneeId
  
  const member = currentProject.teamMembers.find(m => m.id === assigneeId)
  return member ? member.name : assigneeId
}

// Event handlers
const handleClick = (event) => {
  event.stopPropagation()
  // Emit the original task object if available, otherwise emit the task prop
  const taskToEmit = props.task.task || props.task
  emit('edit-task', taskToEmit)
}

const handleDragStart = (event) => {
  isDragging.value = true
  
  const taskToUse = props.task.task || props.task
  
  // Set drag data
  event.dataTransfer.setData('application/json', JSON.stringify({
    taskId: taskToUse.id,
    type: 'task-event'
  }))
  
  event.dataTransfer.effectAllowed = 'move'
  
  emit('drag-start', {
    task: taskToUse,
    event
  })
}

const handleDragEnd = (event) => {
  isDragging.value = false
  
  const taskToUse = props.task.task || props.task
  
  emit('drag-end', {
    task: taskToUse,
    event
  })
}
</script>

<style scoped>
.task-event-card {
  min-height: 2.5rem;
  max-width: 100%;
}

.task-event-card:hover {
  transform: translateY(-1px);
}

.task-event-card.opacity-75 {
  transform: rotate(2deg);
}
</style>