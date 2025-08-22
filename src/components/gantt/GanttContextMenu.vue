<template>
  <div
    v-if="visible"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    class="gantt-context-menu fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50 min-w-48 transition-colors duration-200"
    @click.stop
  >
    <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate transition-colors duration-200">{{ task?.title }}</h4>
      <p class="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">{{ formatDateRange() }}</p>
    </div>
    
    <div class="py-1">
      <button
        @click="editTask"
        class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
      >
        <i class="pi pi-pencil mr-2 text-gray-400 dark:text-gray-500"></i>
        Editar tarea
      </button>
      
      <button
        @click="duplicateTask"
        class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
      >
        <i class="pi pi-copy mr-2 text-gray-400 dark:text-gray-500"></i>
        Duplicar tarea
      </button>
      
      <button
        @click="addSubtask"
        class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
      >
        <i class="pi pi-plus mr-2 text-gray-400 dark:text-gray-500"></i>
        Agregar subtarea
      </button>
      
      <div class="border-t border-gray-100 dark:border-gray-700 my-1 transition-colors duration-200"></div>
      
      <button
        @click="markCompleted"
        v-if="task?.status !== 'completed'"
        class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
      >
        <i class="pi pi-check mr-2 text-green-500"></i>
        Marcar como completada
      </button>
      
      <button
        @click="markInProgress"
        v-if="task?.status !== 'in_progress'"
        class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
      >
        <i class="pi pi-clock mr-2 text-blue-500"></i>
        Marcar en progreso
      </button>
      
      <div class="border-t border-gray-100 dark:border-gray-700 my-1 transition-colors duration-200"></div>
      
      <button
        @click="deleteTask"
        class="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors duration-200"
      >
        <i class="pi pi-trash mr-2 text-red-500"></i>
        Eliminar tarea
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'edit-task',
  'duplicate-task', 
  'add-subtask',
  'mark-completed',
  'mark-in-progress',
  'delete-task',
  'close'
])

// Methods
const formatDateRange = () => {
  if (!props.task) return ''
  
  const start = new Date(props.task.start).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit'
  })
  const end = new Date(props.task.end).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit'
  })
  
  return `${start} - ${end}`
}

const editTask = () => {
  emit('edit-task', props.task)
  emit('close')
}

const duplicateTask = () => {
  emit('duplicate-task', props.task)
  emit('close')
}

const addSubtask = () => {
  emit('add-subtask', props.task)
  emit('close')
}

const markCompleted = () => {
  emit('mark-completed', props.task)
  emit('close')
}

const markInProgress = () => {
  emit('mark-in-progress', props.task)
  emit('close')
}

const deleteTask = () => {
  emit('delete-task', props.task)
  emit('close')
}
</script>

<style scoped>
.gantt-context-menu {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>