<template>
  <div>
    <!-- Header -->
    <CalendarNavigation :current-view="currentView" :current-project="currentProject" @view-change="setCurrentView"
      @navigate-previous="navigatePrevious" @navigate-next="navigateNext" @navigate-today="navigateToToday" />

    <!-- Project Selector and Current Date Display -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900" :style="{ color: isDarkMode ? '#f9fafb' : '#111827' }">
          {{ formattedSelectedDate }}
        </h3>
      </div>

      <!-- Project Selector -->
      <div class="flex items-center gap-3">
        <label for="project-selector" class="text-sm font-medium text-gray-700 whitespace-nowrap">
          Proyecto:
        </label>
        <Select id="project-selector" v-model="selectedProjectId" :options="projectOptions" option-label="name"
          option-value="id" placeholder="Seleccionar proyecto" class="w-64" :loading="isLoadingProjects"
          :disabled="isLoadingProjects || allProjects.length === 0" @change="handleProjectChange"
          v-tooltip="allProjects.length === 0 ? 'No hay proyectos disponibles' : 'Selecciona un proyecto para ver sus tareas en el calendario'">
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center">
              <span class="w-3 h-3 rounded-full mr-2" :class="getProjectStatusColor(slotProps.value)"></span>
              {{ getProjectName(slotProps.value) }}
            </div>
            <span v-else class="text-gray-500">Seleccionar proyecto</span>
          </template>
          <template #option="slotProps">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <span class="w-3 h-3 rounded-full mr-2" :class="getProjectStatusColor(slotProps.option.id)"></span>
                <div>
                  <div class="font-medium">{{ slotProps.option.name }}</div>
                  <div class="text-sm text-gray-500">{{ getProjectTaskCount(slotProps.option.id) }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="getProjectTasksInCurrentView(slotProps.option.id) > 0"
                  class="text-xs badge-blue px-2 py-1 rounded-full">
                  {{ getProjectTasksInCurrentView(slotProps.option.id) }} en vista
                </span>
                <span class="text-xs text-gray-400 capitalize">{{ getProjectStatusText(slotProps.option.status)
                }}</span>
              </div>
            </div>
          </template>
        </Select>

        <!-- Quick Actions -->
        <div class="flex items-center gap-2">
          <Button icon="pi pi-plus" severity="secondary" size="small" v-tooltip="'Crear nuevo proyecto'"
            @click="handleCreateProject" />
          <Button icon="pi pi-refresh" severity="secondary" size="small" v-tooltip="'Actualizar calendario'"
            @click="loadCalendarEvents" :loading="isLoading" />
        </div>
      </div>
    </div>

    <!-- Calendar Content -->
    <div class="bg-white rounded-lg shadow">
      <div v-if="isLoading" class="p-6">
        <div class="text-center py-12">
          <i class="pi pi-spin pi-spinner text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500">Cargando calendario...</p>
        </div>
      </div>

      <div v-else-if="error" class="p-6">
        <div class="text-center py-12">
          <i class="pi pi-exclamation-triangle text-red-400 text-4xl mb-4"></i>
          <p class="text-red-600 mb-2">Error al cargar el calendario</p>
          <p class="text-sm text-gray-500">{{ error }}</p>
          <Button label="Reintentar" severity="secondary" @click="loadCalendarEvents" class="mt-4" />
        </div>
      </div>

      <div v-else class="p-6">
        <!-- Empty state when no project is selected -->
        <div v-if="!currentProject && allProjects.length === 0" class="text-center py-12">
          <i class="pi pi-calendar text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500 mb-4">No hay proyectos disponibles</p>
          <p class="text-sm text-gray-400 mb-6">Crea un proyecto o carga datos de ejemplo para comenzar a usar el
            calendario
          </p>
          <div class="space-x-3">
            <Button label="Crear Proyecto" @click="handleCreateProject" />
            <Button label="Cargar Datos de Ejemplo" @click="loadSampleData" :loading="loadingSampleData"
              severity="secondary" />
          </div>
        </div>

        <!-- Project Info Panel -->
        <div v-else-if="currentProject && (!currentViewEvents || currentViewEvents.length === 0)" class="space-y-6">
          <!-- Project Summary Card -->
          <div class="project-summary-card border rounded-lg p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 project-icon-bg rounded-lg flex items-center justify-center">
                  <i class="pi pi-folder project-icon text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{{ currentProject.name }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ currentProject.description || 'Sin descripción' }}</p>
                  <div class="flex items-center gap-4 mt-2">
                    <div class="flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full" :class="getProjectStatusColor(currentProject.id)"></span>
                      <span class="text-xs font-medium text-gray-700 capitalize">{{
                        getProjectStatusText(currentProject.status) }}</span>
                    </div>
                    <span class="text-xs text-gray-500">{{ getProjectTaskCount(currentProject.id) }}</span>
                    <span class="text-xs text-gray-500">{{ getProjectDateRange(currentProject) }}</span>
                  </div>
                </div>
              </div>
              <Button icon="pi pi-external-link" severity="secondary" text size="small"
                @click="router.push(`/projects/${currentProject.id}`)" v-tooltip="'Ver detalles del proyecto'" />
            </div>
          </div>

          <!-- Empty Calendar State -->
          <div class="text-center py-12">
            <i class="pi pi-calendar text-gray-400 text-4xl mb-4"></i>
            <p class="text-gray-500 mb-4">No hay tareas programadas</p>
            <p class="text-sm text-gray-400 mb-6">
              No hay tareas programadas para este período en "{{ currentProject.name }}"
            </p>
            <div class="space-x-3">
              <Button label="Crear Tarea" @click="handleDateClick(selectedDate)" />
              <Button label="Ver Todas las Tareas" severity="secondary" @click="router.push('/projects')" />
            </div>
          </div>
        </div>

        <!-- Calendar Views -->
        <div v-else class="space-y-6">
          <!-- Project Statistics (when project is selected and has tasks) -->
          <ProjectStats v-if="currentProject && currentViewEvents && currentViewEvents.length > 0"
            :project="currentProject" :tasks-in-current-view="currentViewEvents.length"
            @view-project="router.push(`/projects/${currentProject.id}`)" />

          <!-- Month View -->
          <div v-if="currentView === 'month'" class="calendar-month">
            <BasicCalendarGrid v-if="!currentViewEvents || currentViewEvents.length === 0" :selected-date="selectedDate"
              @date-click="handleDateClick" />
            <CalendarMonth v-else :selected-date="selectedDate" :events="currentViewEvents"
              @date-click="handleDateClick" @task-edit="handleTaskEdit" @task-drag-start="handleTaskDragStart"
              @task-drag-end="handleTaskDragEnd" @date-drop="handleDateDrop" />
          </div>

          <!-- Week View -->
          <div v-else-if="currentView === 'week'" class="calendar-week">
            <CalendarWeek :selected-date="selectedDate" :events="currentViewEvents" @date-click="handleDateClick"
              @task-edit="handleTaskEdit" @task-drag-start="handleTaskDragStart" @task-drag-end="handleTaskDragEnd"
              @date-drop="handleDateDrop" />
          </div>

          <!-- Day View -->
          <div v-else-if="currentView === 'day'" class="calendar-day">
            <CalendarDay :selected-date="selectedDate" :events="currentViewEvents" @date-click="handleDateClick"
              @task-edit="handleTaskEdit" @task-drag-start="handleTaskDragStart" @task-drag-end="handleTaskDragEnd"
              @date-drop="handleDateDrop" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Task Form -->
    <QuickTaskForm v-model:visible="showQuickTaskForm" :selected-date="clickedDate" @task-created="handleTaskCreated"
      @open-full-form="handleOpenFullForm" />

    <!-- Task Edit Modal -->
    <TaskEditModal v-model:visible="showTaskModal" :task="selectedTask" :initial-date="selectedDate"
      :initial-data="initialTaskData" @task-saved="handleTaskSaved" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import Button from 'primevue/button'
import Select from 'primevue/select'
import CalendarNavigation from '../components/calendar/CalendarNavigation.vue'
import BasicCalendarGrid from '../components/calendar/BasicCalendarGrid.vue'
import CalendarMonth from '../components/calendar/CalendarMonth.vue'
import CalendarWeek from '../components/calendar/CalendarWeek.vue'
import CalendarDay from '../components/calendar/CalendarDay.vue'
import QuickTaskForm from '../components/calendar/QuickTaskForm.vue'
import TaskEditModal from '../components/calendar/TaskEditModal.vue'
import ProjectStats from '../components/calendar/ProjectStats.vue'

const store = useStore()
const router = useRouter()

const { isDarkMode } = useTheme()

// Reactive data
const showQuickTaskForm = ref(false)
const showTaskModal = ref(false)
const selectedTask = ref(null)
const clickedDate = ref(null)
const initialTaskData = ref(null)
const loadingSampleData = ref(false)
const selectedProjectId = ref(null)

// Computed properties
const currentView = computed(() => store.getters['calendar/currentView'])
const selectedDate = computed(() => store.getters['calendar/selectedDate'])
const currentViewEvents = computed(() => store.getters['calendar/getCurrentViewEvents'])
const formattedSelectedDate = computed(() => store.getters['calendar/formattedSelectedDate'])
const isLoading = computed(() => store.getters['calendar/isLoading'])
const error = computed(() => store.getters['calendar/error'])
const currentProject = computed(() => store.getters['projects/currentProject'])
const allProjects = computed(() => store.getters['projects/allProjects'])
const isLoadingProjects = computed(() => store.getters['projects/isLoading'])

// Project selector options
const projectOptions = computed(() => {
  const options = [
    {
      id: 'all',
      name: 'Todos los proyectos',
      status: 'active',
      taskCount: allProjects.value.reduce((total, project) => total + (project.tasks?.length || 0), 0)
    }
  ]

  const projectList = allProjects.value.map(project => ({
    id: project.id,
    name: project.name,
    status: project.status,
    taskCount: project.tasks?.length || 0
  }))

  return [...options, ...projectList]
})

// Methods
const setCurrentView = (view) => {
  store.dispatch('calendar/setCurrentView', view)
}

const navigatePrevious = () => {
  store.dispatch('calendar/navigatePrevious')
}

const navigateNext = () => {
  store.dispatch('calendar/navigateNext')
}

const navigateToToday = () => {
  store.dispatch('calendar/navigateToToday')
}

const loadCalendarEvents = () => {
  store.dispatch('calendar/loadCalendarEvents')
}

const handleDateClick = (date, isEmpty = true) => {
  // Set selected date and show appropriate form based on whether the date/time slot is empty
  store.dispatch('calendar/setSelectedDate', date)
  clickedDate.value = date
  selectedTask.value = null
  initialTaskData.value = null

  if (isEmpty) {
    // Show quick task form for empty dates/time slots
    showQuickTaskForm.value = true
  } else {
    // Show full task modal for dates with existing tasks
    showTaskModal.value = true
  }
}

const handleTaskEdit = (task) => {
  // Force modal to re-render by clearing and setting the task
  selectedTask.value = null
  nextTick(() => {
    selectedTask.value = task
    showTaskModal.value = true
  })
}

const handleTaskDragStart = ({ task, event }) => {
  store.dispatch('calendar/setDraggedTask', task)
}

const handleTaskDragEnd = ({ task, event }) => {
  store.dispatch('calendar/clearDraggedTask')
}

const handleDateDrop = async ({ date, draggedTask }) => {
  if (!draggedTask) return

  try {
    // Calculate new end date maintaining the same duration
    const originalDuration = new Date(draggedTask.end) - new Date(draggedTask.start)
    const newStartDate = new Date(date)
    const newEndDate = new Date(newStartDate.getTime() + originalDuration)

    // Update task dates
    await store.dispatch('calendar/updateTaskDates', {
      taskId: draggedTask.id,
      newStartDate,
      newEndDate
    })

  } catch (error) {
    console.error('Error updating task dates:', error)
  }
}

const handleTaskCreated = () => {
  // Reload calendar events after quick task is created
  loadCalendarEvents()
}

const handleOpenFullForm = (taskData) => {
  // Open full task form with pre-filled data from quick form
  initialTaskData.value = taskData
  selectedTask.value = null
  showTaskModal.value = true
}

const handleTaskSaved = () => {
  // Reload calendar events after task is saved
  loadCalendarEvents()
}

const loadSampleData = async () => {
  loadingSampleData.value = true
  try {
    const { initializeSampleData } = await import('../utils/sampleData.js')
    await initializeSampleData(store)
    // Reload calendar events after sample data is loaded
    await loadCalendarEvents()
  } catch (error) {
    console.error('Error loading sample data:', error)
  } finally {
    loadingSampleData.value = false
  }
}

// Project selector methods
const handleProjectChange = async (event) => {
  const projectId = event.value
  if (projectId) {
    try {
      if (projectId === 'all') {
        // Clear current project to show all projects
        await store.dispatch('projects/clearCurrentProject')
        console.log('Mostrando tareas de todos los proyectos')
      } else {
        // Set the selected project as current
        await store.dispatch('projects/setCurrentProject', projectId)
        const project = allProjects.value.find(p => p.id === projectId)
        if (project) {
          console.log(`Proyecto cambiado a: ${project.name}`)
        }
      }

      // Reload calendar events for the new selection
      await loadCalendarEvents()
    } catch (error) {
      console.error('Error changing project:', error)
      // You could show an error toast here
    }
  }
}

const handleCreateProject = () => {
  router.push('/projects?action=create')
}

const getProjectName = (projectId) => {
  if (projectId === 'all') {
    return 'Todos los proyectos'
  }
  const project = allProjects.value.find(p => p.id === projectId)
  return project?.name || 'Proyecto desconocido'
}

const getProjectStatusColor = (projectId) => {
  if (projectId === 'all') {
    return 'project-status-active'
  }
  const project = allProjects.value.find(p => p.id === projectId)
  if (!project) return 'project-status-default'

  const statusColors = {
    active: 'project-status-active',
    completed: 'project-status-completed',
    paused: 'project-status-paused',
    cancelled: 'project-status-cancelled'
  }

  return statusColors[project.status] || 'project-status-default'
}

const getProjectTaskCount = (projectId) => {
  if (projectId === 'all') {
    const totalTasks = allProjects.value.reduce((total, project) => total + (project.tasks?.length || 0), 0)
    return `${totalTasks} ${totalTasks === 1 ? 'tarea' : 'tareas'} en total`
  }
  const project = allProjects.value.find(p => p.id === projectId)
  const taskCount = project?.tasks?.length || 0
  return `${taskCount} ${taskCount === 1 ? 'tarea' : 'tareas'}`
}

const getProjectStatusText = (status) => {
  const statusTexts = {
    active: 'Activo',
    completed: 'Completado',
    paused: 'Pausado',
    cancelled: 'Cancelado'
  }
  return statusTexts[status] || 'Desconocido'
}

const getProjectDateRange = (project) => {
  if (!project.startDate) return 'Sin fechas'

  const startDate = new Date(project.startDate)
  const endDate = project.endDate ? new Date(project.endDate) : null

  const formatDate = (date) => date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  if (endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  } else {
    return `Desde ${formatDate(startDate)}`
  }
}

const getProjectTasksInCurrentView = (projectId) => {
  // Get all events for the project
  const projectEvents = store.getters['calendar/events'].filter(event => event.projectId === projectId)

  // Get current view date range
  const selectedDate = store.getters['calendar/selectedDate']
  const currentView = store.getters['calendar/currentView']

  let startDate, endDate

  switch (currentView) {
    case 'day':
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      break

    case 'week':
      const dayOfWeek = selectedDate.getDay()
      const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      startDate = new Date(selectedDate)
      startDate.setDate(diff)
      startDate.setHours(0, 0, 0, 0)

      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break

    case 'month':
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)

      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      break

    default:
      return 0
  }

  // Count events that overlap with the current view period
  return projectEvents.filter(event => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    return eventStart <= endDate && eventEnd >= startDate
  }).length
}

// Watch for current project changes to reload events
watch(() => store.getters['projects/currentProject'], (newProject) => {
  if (newProject) {
    selectedProjectId.value = newProject.id
  } else {
    // If no current project, show all projects
    selectedProjectId.value = 'all'
  }
  loadCalendarEvents()
}, { immediate: true })

// Load initial data
onMounted(async () => {
  // Load projects first
  await store.dispatch('projects/loadProjects')

  // Set initial selected project if there's a current project
  const current = store.getters['projects/currentProject']
  if (current) {
    selectedProjectId.value = current.id
  } else if (allProjects.value.length > 0) {
    // If no current project but projects exist, show all projects by default
    selectedProjectId.value = 'all'
  }

  // Initialize calendar
  loadCalendarEvents()
})
</script>

<style scoped>
.calendar-month,
.calendar-week,
.calendar-day {
  min-height: 600px;
}

/* Custom select styling */
:deep(.p-select) {
  min-width: 250px;
}

:deep(.p-select-overlay) {
  min-width: 350px;
}

:deep(.p-select-option) {
  padding: 0.75rem 1rem;
}

/* Project status indicators usando la nueva paleta */
.project-status-active {
  background-color: var(--color-earth-olive);
}

.project-status-completed {
  background-color: var(--color-earth-golden);
}

.project-status-paused {
  background-color: var(--color-earth-brown);
}

.project-status-cancelled {
  background-color: var(--color-earth-dark-olive);
}

.project-status-default {
  background-color: var(--color-earth-light-gray);
}

/* Badge styles usando la nueva paleta */
.badge-blue {
  background-color: var(--color-earth-light-yellow);
  color: var(--color-earth-dark-olive);
}

/* Project summary card */
.project-summary-card {
  background: linear-gradient(to right, var(--color-earth-light-gray), var(--color-earth-light-yellow));
  border-color: var(--color-earth-golden);
}

/* Project icon */
.project-icon-bg {
  background-color: var(--color-earth-light-yellow);
}

.project-icon {
  color: var(--color-earth-brown);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  :deep(.p-select) {
    min-width: 200px;
  }

  :deep(.p-select-overlay) {
    min-width: 280px;
  }
}
</style>