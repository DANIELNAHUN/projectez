<template>
  <div class="gantt-grid bg-white border-r border-gray-200">
    <!-- Grid header -->
    <div class="grid-header bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
      <div class="flex items-center h-15 px-4 py-3">
        <div class="flex-1">
          <h4 class="text-sm font-medium text-gray-900">Tareas</h4>
        </div>
        <div class="flex items-center space-x-2 text-xs text-gray-500">
          <span>Estado</span>
          <span>•</span>
          <span>Progreso</span>
        </div>
      </div>
    </div>

    <!-- Task list -->
    <div class="grid-body">
      <div v-for="(task, index) in tasks" :key="task.id" :style="{ height: taskRowHeight + 'px' }"
        class="task-row flex items-center px-3 py-2 border-b border-gray-50 hover:bg-gray-25 transition-colors"
        :class="getTaskRowClasses(task)">
        <!-- Task hierarchy and title -->
        <div class="flex-1 flex items-center min-w-0 pr-3">
          <!-- Indentation for hierarchy -->
          <div :style="{ width: (task.level * 12) + 'px' }" class="flex-shrink-0"></div>

          <!-- Task icon based on type and status -->
          <div class="flex-shrink-0 mr-2">
            <i :class="getTaskIcon(task)" class="text-xs" :style="{ color: task.color }"></i>
          </div>

          <!-- Task title and info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center mb-1">
              <h5 class="text-xs font-medium text-gray-900 truncate leading-tight">
                {{ task.title }}
              </h5>
              <span v-if="task.type === 'with_deliverable'"
                class="ml-1.5 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Entregable
              </span>
            </div>

            <!-- Task dates - more compact -->
            <div class="flex items-center text-xs text-gray-500 leading-tight">
              <span>{{ formatDate(task.start) }}</span>
              <span class="mx-1">→</span>
              <span>{{ formatDate(task.end) }}</span>
              <span class="ml-1.5 text-gray-400">
                ({{ task.duration }}{{ task.duration !== 1 ? 'd' : 'd' }})
              </span>
            </div>
          </div>
        </div>

        <!-- Task status and progress - more compact -->
        <div class="flex-shrink-0 flex flex-col items-end space-y-1 min-w-0">
          <!-- Status badge -->
          <span :class="getStatusBadgeClasses(task.status)"
            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium">
            {{ getStatusLabel(task.status) }}
          </span>

          <!-- Progress indicator -->
          <div class="flex items-center space-x-1.5">
            <div class="w-10 bg-gray-200 rounded-full h-1.5">
              <div :style="{ width: task.progress + '%', backgroundColor: task.color }"
                class="h-1.5 rounded-full transition-all duration-300"></div>
            </div>
            <span class="text-xs text-gray-600 w-6 text-right font-medium">
              {{ task.progress }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="tasks.length === 0" class="grid-empty p-8 text-center">
      <i class="pi pi-list text-2xl text-gray-400 mb-2"></i>
      <p class="text-gray-600 text-sm">No hay tareas para mostrar</p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="grid-loading p-8 text-center">
      <i class="pi pi-spin pi-spinner text-xl text-gray-400 mb-2"></i>
      <p class="text-gray-600 text-sm">Cargando tareas...</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const store = useStore()

// Constants
const taskRowHeight = 48

// Computed
const teamMembers = computed(() => {
  const currentProject = store.getters['projects/currentProject']
  return currentProject?.teamMembers || []
})

// Methods
const getTaskRowClasses = (task) => {
  return {
    'bg-gray-50': task.level > 0,
    'opacity-60': task.status === 'cancelled'
  }
}

const getTaskIcon = (task) => {
  if (task.status === 'completed') return 'pi pi-check-circle text-green-500'
  if (task.status === 'cancelled') return 'pi pi-times-circle text-gray-400'
  if (task.status === 'in_progress') return 'pi pi-clock text-blue-500'
  if (task.type === 'with_deliverable') return 'pi pi-file text-purple-500'
  return 'pi pi-circle text-gray-400'
}

const getStatusBadgeClasses = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'completed': return 'Completada'
    case 'in_progress': return 'En Progreso'
    case 'cancelled': return 'Cancelada'
    default: return 'Pendiente'
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

// Removed getAssignedUserName to simplify the UI
</script>

<style scoped>
.gantt-grid {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  max-width: 400px;
  height: fit-content;
}

.grid-header {
  height: 60px;
  /* Match timeline header height */
}

.grid-body {
  flex: 1;
  overflow-y: visible;
  height: auto;
}

.task-row {
  cursor: pointer;
  min-height: 48px;
}

.task-row:hover {
  background-color: #f9fafb;
}

.grid-empty,
.grid-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* Custom scrollbar */
.grid-body::-webkit-scrollbar {
  width: 6px;
}

.grid-body::-webkit-scrollbar-track {
  background-color: #f3f4f6;
}

.grid-body::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 9999px;
}

.grid-body::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}
</style>