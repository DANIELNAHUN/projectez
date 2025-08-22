<template>
  <div class="gantt-chart" :style="{ backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }">
    <!-- Header with project info and controls -->
    <div class="gantt-header border-b p-4" :style="headerStyles">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold" :style="primaryTextStyles">
            {{ currentProject?.name || 'Seleccionar Proyecto' }}
          </h3>
          <div v-if="projectDuration" class="text-sm space-y-1" :style="secondaryTextStyles">
            <p>Duración: {{ formattedProjectDuration }}</p>
            <div v-if="projectStats" class="flex items-center space-x-4">
              <span>{{ projectStats.totalTasks }} tareas</span>
              <span class="text-green-600">{{ projectStats.completedTasks }} completadas</span>
              <span class="text-blue-600">{{ projectStats.inProgressTasks }} en progreso</span>
              <span class="text-yellow-600">{{ projectStats.pendingTasks }} pendientes</span>
              <span v-if="projectStats.cancelledTasks > 0" class="text-gray-500">{{ projectStats.cancelledTasks }} canceladas</span>
            </div>
            <div v-if="projectStats" class="flex items-center space-x-2">
              <span>Progreso general:</span>
              <div class="w-20 rounded-full h-2" :style="{ backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }">
                <div :style="{ width: projectStats.overallProgress + '%' }"
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"></div>
              </div>
              <span class="text-sm font-medium">{{ projectStats.overallProgress }}%</span>
            </div>
          </div>
        </div>

        <!-- Zoom controls -->
        <div class="flex items-center space-x-2">
          <!-- Temporary test button -->
          <button @click="toggleSidebar" class="px-3 py-1 text-sm rounded border" :style="{
            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
            color: isDarkMode ? '#f9fafb' : '#111827'
          }">
            {{ isSidebarMinimized ? 'Expandir' : 'Minimizar' }} Sidebar
          </button>

          <label class="text-sm" :style="secondaryTextStyles">Vista:</label>
          <select v-model="selectedZoomLevel" @change="handleZoomChange" class="border rounded px-2 py-1 text-sm"
            :style="{
              borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
              color: isDarkMode ? '#f9fafb' : '#111827'
            }">
            <option value="days">Días</option>
            <option value="weeks">Semanas</option>
            <option value="months">Meses</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main Gantt content -->
    <div class="gantt-content flex" v-if="!isLoading && currentProject">
      <!-- Task grid (left side) -->
      <div class="gantt-sidebar-container relative" :class="{ 'minimized': isSidebarMinimized }" :style="{
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        alignSelf: 'flex-start'
      }">

        <!-- Sidebar toggle button -->
        <button @click="toggleSidebar"
          class="sidebar-toggle-btn absolute top-3 right-3 z-50 p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
          :style="{
            backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }" :title="isSidebarMinimized ? 'Expandir barra lateral' : 'Minimizar barra lateral'">
          <i :class="isSidebarMinimized ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'" class="text-sm"></i>
        </button>

        <!-- Minimized sidebar (icons only) -->
        <div v-if="isSidebarMinimized" class="minimized-sidebar" :style="{ height: timelineMinHeight + 'px' }">
          <!-- Header -->
          <div class="minimized-header border-b p-2 text-center"
            :style="{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }">
            <i class="pi pi-list text-lg" :style="{ color: isDarkMode ? '#9ca3af' : '#6b7280' }"></i>
          </div>

          <!-- Task icons -->
          <div class="minimized-tasks p-1 space-y-1">
            <div v-if="ganttTasks.length === 0" class="text-center p-4">
              <i class="pi pi-inbox text-lg" :style="{ color: isDarkMode ? '#9ca3af' : '#6b7280' }"></i>
              <p class="text-xs mt-1" :style="{ color: isDarkMode ? '#9ca3af' : '#6b7280' }">Sin tareas</p>
            </div>
            <div v-else v-for="task in ganttTasks" :key="task.id"
              class="minimized-task-item relative flex flex-col items-center p-1 rounded cursor-pointer transition-all duration-200"
              :class="{ 'opacity-60': task.status === 'cancelled' }" :style="{
                marginLeft: (task.level * 2) + 'px',
                height: '40px'
              }" :title="`${task.title} - ${task.progress}% completado`" @click="handleMinimizedTaskClick(task)"
              @mouseover="$event.target.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'"
              @mouseleave="$event.target.style.backgroundColor = 'transparent'">
              <!-- Task icon -->
              <i :class="getTaskIcon(task)" class="text-xs mb-1" :style="{ color: task.color }"></i>

              <!-- Mini progress bar -->
              <div class="w-full h-1 rounded-full overflow-hidden"
                :style="{ backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }">
                <div :style="{
                  width: task.progress + '%',
                  backgroundColor: task.color || '#3b82f6'
                }" class="h-full transition-all duration-300"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Full sidebar -->
        <GanttGrid v-else :tasks="ganttTasks" :loading="isLoading" class="gantt-grid" />
      </div>

      <!-- Timeline (right side) -->
      <div class="gantt-timeline-container flex-1 overflow-x-auto border-l" :style="{
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        alignSelf: 'flex-start',
        minHeight: timelineMinHeight + 'px'
      }">
        <GanttTimeline :timeline-start="timelineStart" :timeline-end="timelineEnd" :zoom-level="zoomLevel"
          :tasks="ganttTasks" :total-width="totalTimelineWidth" @task-date-change="handleTaskDateChange"
          @task-edit="handleTaskEdit" @task-duplicate="handleTaskDuplicate" @task-add-subtask="handleTaskAddSubtask"
          @task-status-change="handleTaskStatusChange" @task-delete="handleTaskDelete" />
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="gantt-loading p-8 text-center">
      <i class="pi pi-spin pi-spinner text-2xl mb-2" :style="{ color: isDarkMode ? '#9ca3af' : '#6b7280' }"></i>
      <p :style="secondaryTextStyles">Cargando diagrama de Gantt...</p>
    </div>

    <!-- Empty state -->
    <div v-else class="gantt-empty p-8 text-center">
      <i class="pi pi-chart-bar text-4xl mb-4" :style="{ color: isDarkMode ? '#9ca3af' : '#6b7280' }"></i>
      <p class="mb-2" :style="secondaryTextStyles">No hay tareas para mostrar</p>
      <p class="text-sm" :style="{ color: isDarkMode ? '#9ca3af' : '#6b7280' }">
        {{ currentProject ? 'Agrega tareas al proyecto para ver el diagrama de Gantt' : 'Selecciona un proyecto para comenzar' }}
      </p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="gantt-error border rounded-lg p-4 m-4" :style="{
      backgroundColor: isDarkMode ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2',
      borderColor: isDarkMode ? '#991b1b' : '#fecaca'
    }">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
        <span :style="{ color: isDarkMode ? '#f87171' : '#b91c1c' }">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useTheme } from '../../composables/useTheme'
import GanttGrid from './GanttGrid.vue'
import GanttTimeline from './GanttTimeline.vue'

const props = defineProps({
  projectId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['project-change', 'task-edit'])

const store = useStore()
const { isDarkMode } = useTheme()

// Reactive data
const selectedZoomLevel = ref('days')
const isSidebarMinimized = ref(false)

// Computed styles for theme
const headerStyles = computed(() => ({
  backgroundColor: isDarkMode.value ? '#1f2937' : '#ffffff',
  borderColor: isDarkMode.value ? '#374151' : '#e5e7eb'
}))

const primaryTextStyles = computed(() => ({
  color: isDarkMode.value ? '#f9fafb' : '#111827'
}))

const secondaryTextStyles = computed(() => ({
  color: isDarkMode.value ? '#d1d5db' : '#6b7280'
}))

// Computed properties from store
const ganttTasks = computed(() => store.getters['gantt/ganttTasks'])
const timelineStart = computed(() => store.getters['gantt/timelineStart'])
const timelineEnd = computed(() => store.getters['gantt/timelineEnd'])
const zoomLevel = computed(() => store.getters['gantt/zoomLevel'])
const projectDuration = computed(() => store.getters['gantt/projectDuration'])
const formattedProjectDuration = computed(() => store.getters['gantt/formattedProjectDuration'])
const projectStats = computed(() => store.getters['gantt/projectStats'])
const criticalPath = computed(() => store.getters['gantt/criticalPath'])
const totalTimelineWidth = computed(() => store.getters['gantt/totalTimelineWidth'])
const isLoading = computed(() => store.getters['gantt/isLoading'])
const error = computed(() => store.getters['gantt/error'])

// Calculate timeline minimum height based on content
const timelineMinHeight = computed(() => {
  const headerHeight = 60 // Timeline header height
  const taskRowHeight = 40 // Height per task row
  const minTasks = Math.max(ganttTasks.value.length, 10) // Minimum 10 rows for better UX
  const padding = 20 // Extra padding
  
  return headerHeight + (minTasks * taskRowHeight) + padding
})

// Get current project
const currentProject = computed(() => {
  if (!props.projectId) return null
  return store.getters['projects/getProjectById'](props.projectId)
})

// Methods
const toggleSidebar = () => {
  isSidebarMinimized.value = !isSidebarMinimized.value
}

const handleMinimizedTaskClick = (task) => {
  // Expand sidebar when clicking on a minimized task
  isSidebarMinimized.value = false
  // Optionally emit task edit event
  emit('task-edit', task)
}

const handleZoomChange = () => {
  store.dispatch('gantt/setZoomLevel', {
    level: selectedZoomLevel.value,
    projectId: props.projectId
  })
}

const handleTaskDateChange = (taskUpdate) => {
  store.dispatch('gantt/updateTaskDates', {
    taskId: taskUpdate.taskId,
    newStart: taskUpdate.newStart,
    newEnd: taskUpdate.newEnd,
    projectId: props.projectId,
    type: taskUpdate.type
  })
}

const handleTaskEdit = (task) => {
  // Emit to parent or handle task editing
  emit('task-edit', task)
}

const handleTaskDuplicate = (task) => {
  // Create a duplicate task
  const duplicateTask = {
    ...task,
    id: undefined, // Will be generated
    title: `${task.title} (Copia)`,
    startDate: new Date(task.start),
    endDate: new Date(task.end),
    status: 'pending',
    progress: 0
  }

  store.dispatch('tasks/createTask', {
    projectId: props.projectId,
    task: duplicateTask
  }).then(() => {
    // Reload Gantt data
    store.dispatch('gantt/loadGanttData', props.projectId)
  })
}

const handleTaskAddSubtask = (parentTask) => {
  // Create a new subtask under the parent
  const subtask = {
    title: 'Nueva subtarea',
    description: '',
    startDate: new Date(parentTask.start),
    endDate: new Date(parentTask.end),
    status: 'pending',
    type: 'simple',
    progress: 0,
    priority: 'medium',
    parentTaskId: parentTask.id,
    level: (parentTask.level || 0) + 1
  }

  store.dispatch('tasks/createTask', {
    projectId: props.projectId,
    task: subtask
  }).then(() => {
    // Reload Gantt data
    store.dispatch('gantt/loadGanttData', props.projectId)
  })
}

const handleTaskStatusChange = ({ task, status }) => {
  store.dispatch('tasks/updateTask', {
    id: task.id,
    status: status,
    progress: status === 'completed' ? 100 : task.progress
  }).then(() => {
    // Reload Gantt data
    store.dispatch('gantt/loadGanttData', props.projectId)
  })
}

const handleTaskDelete = (task) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la tarea "${task.title}"?`)) {
    store.dispatch('tasks/deleteTask', task.id).then(() => {
      // Reload Gantt data
      store.dispatch('gantt/loadGanttData', props.projectId)
    })
  }
}

const getTaskIcon = (task) => {
  if (task.status === 'completed') return 'pi pi-check-circle'
  if (task.status === 'cancelled') return 'pi pi-times-circle'
  if (task.status === 'in_progress') return 'pi pi-clock'
  if (task.type === 'with_deliverable') return 'pi pi-file'
  return 'pi pi-circle'
}

// Combined watcher for project changes and task updates
watch(() => ({
  projectId: props.projectId,
  tasks: props.projectId ? store.getters['tasks/tasksByProject'](props.projectId) : []
}), ({ projectId, tasks }) => {
  if (projectId) {
    // Load Gantt data when project changes or tasks are updated
    store.dispatch('gantt/loadGanttData', projectId)
  }
}, {
  immediate: true,
  deep: true
})

// Sync zoom level with store
watch(zoomLevel, (newZoomLevel) => {
  selectedZoomLevel.value = newZoomLevel
}, { immediate: true })

onMounted(() => {
  console.log('GanttChart mounted with projectId:', props.projectId)
  console.log('Current project:', currentProject.value)
  console.log('Gantt tasks:', ganttTasks.value)
  console.log('Is loading:', isLoading.value)

  if (props.projectId) {
    store.dispatch('gantt/loadGanttData', props.projectId)
  }
})
</script>

<style scoped>
.gantt-chart {
  border-radius: 0.5rem;
  overflow: hidden;
  min-height: 500px;
}

.gantt-content {
  min-height: 400px;
  align-items: flex-start;
}

.gantt-sidebar-container {
  min-width: 300px;
  max-width: 400px;
  width: 30%;
  transition: all 0.3s ease;
  border-right: 1px solid;
  height: fit-content;
}

.gantt-sidebar-container.minimized {
  min-width: 60px;
  max-width: 60px;
  width: 60px;
}

.gantt-grid {
  width: 100%;
  height: 100%;
}

.sidebar-toggle-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimized-sidebar {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: fit-content;
  min-height: 400px;
}

.minimized-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.minimized-tasks {
  flex: 1;
  overflow-y: visible;
  height: auto;
}

.minimized-task-item {
  width: 32px;
  margin: 0 auto;
  justify-content: center;
}

.sidebar-toggle-btn:hover {
  transform: scale(1.05);
}

.gantt-timeline-container {
  /* Styles moved to template classes for dark mode support */
}

.gantt-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.gantt-loading,
.gantt-empty {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>