<template>
  <div class="flex justify-between items-center mb-8">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2" :style="{ color: isDarkMode ? '#f9fafb' : '#111827' }">Calendario</h2>
      <div class="flex items-center gap-2">
        <p class="text-gray-600">Vista temporal de tus tareas y proyectos</p>
        <div v-if="currentProject" class="flex items-center gap-2 ml-4">
          <span class="text-gray-400">•</span>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="getProjectStatusColor(currentProject.status)"></span>
            <span class="text-sm font-medium text-gray-700">{{ currentProject.name }}</span>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {{ getTaskCount(currentProject) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-center space-x-3">
      <!-- View Toggle -->
      <div class="flex bg-gray-100 rounded-lg p-1">
        <button 
          v-for="view in viewOptions"
          :key="view.value"
          @click="$emit('view-change', view.value)"
          :class="[
            'px-3 py-1 text-sm font-medium rounded transition-colors',
            currentView === view.value 
              ? 'text-gray-700 bg-white shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          {{ view.label }}
        </button>
      </div>
      
      <!-- Navigation -->
      <div class="flex items-center space-x-2">
        <Button
          icon="pi pi-chevron-left"
          severity="secondary"
          text
          @click="$emit('navigate-previous')"
          :title="getPreviousTitle()"
        />
        <Button
          label="Hoy"
          severity="secondary"
          text
          @click="$emit('navigate-today')"
          title="Ir a hoy"
        />
        <Button
          icon="pi pi-chevron-right"
          severity="secondary"
          text
          @click="$emit('navigate-next')"
          :title="getNextTitle()"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import { useTheme } from '../../composables/useTheme'

const props = defineProps({
  currentView: {
    type: String,
    default: 'month'
  },
  currentProject: {
    type: Object,
    default: null
  }
})

const { isDarkMode } = useTheme()

defineEmits(['view-change', 'navigate-previous', 'navigate-next', 'navigate-today'])

// View options
const viewOptions = [
  { label: 'Mes', value: 'month' },
  { label: 'Semana', value: 'week' },
  { label: 'Día', value: 'day' }
]

// Helper methods for navigation titles
const getPreviousTitle = () => {
  const titles = {
    'month': 'Mes anterior',
    'week': 'Semana anterior', 
    'day': 'Día anterior'
  }
  return titles[props.currentView] || 'Anterior'
}

const getNextTitle = () => {
  const titles = {
    'month': 'Mes siguiente',
    'week': 'Semana siguiente',
    'day': 'Día siguiente'
  }
  return titles[props.currentView] || 'Siguiente'
}

// Project helper methods
const getProjectStatusColor = (status) => {
  const statusColors = {
    active: 'project-status-active',
    completed: 'project-status-completed',
    paused: 'project-status-paused',
    cancelled: 'project-status-cancelled'
  }
  return statusColors[status] || 'project-status-default'
}

const getTaskCount = (project) => {
  const taskCount = project?.tasks?.length || 0
  return `${taskCount} ${taskCount === 1 ? 'tarea' : 'tareas'}`
}
</script>

<style scoped>
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
</style>