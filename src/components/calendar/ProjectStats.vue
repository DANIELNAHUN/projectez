<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-gray-900">Estadísticas del Proyecto</h4>
      <Button
        icon="pi pi-external-link"
        severity="secondary"
        text
        size="small"
        @click="$emit('view-project')"
        v-tooltip="'Ver detalles del proyecto'"
      />
    </div>
    
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <!-- Total Tasks -->
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900">{{ totalTasks }}</div>
        <div class="text-xs text-gray-500">Total tareas</div>
      </div>
      
      <!-- Tasks in Current View -->
      <div class="text-center">
        <div class="text-2xl font-bold stats-blue">{{ tasksInView }}</div>
        <div class="text-xs text-gray-500">En vista actual</div>
      </div>
      
      <!-- Completed Tasks -->
      <div class="text-center">
        <div class="text-2xl font-bold stats-green">{{ completedTasks }}</div>
        <div class="text-xs text-gray-500">Completadas</div>
      </div>
      
      <!-- Progress -->
      <div class="text-center">
        <div class="text-2xl font-bold stats-purple">{{ progressPercentage }}%</div>
        <div class="text-xs text-gray-500">Progreso</div>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="mt-4">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progreso del proyecto</span>
        <span>{{ completedTasks }}/{{ totalTasks }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="progress-bar h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>
    
    <!-- Task Status Distribution -->
    <div class="mt-4 flex items-center justify-center gap-4 text-xs">
      <div v-if="pendingTasks > 0" class="flex items-center gap-1">
        <span class="w-2 h-2 status-pending rounded-full"></span>
        <span class="text-gray-600">{{ pendingTasks }} pendientes</span>
      </div>
      <div v-if="inProgressTasks > 0" class="flex items-center gap-1">
        <span class="w-2 h-2 status-progress rounded-full"></span>
        <span class="text-gray-600">{{ inProgressTasks }} en progreso</span>
      </div>
      <div v-if="completedTasks > 0" class="flex items-center gap-1">
        <span class="w-2 h-2 status-completed rounded-full"></span>
        <span class="text-gray-600">{{ completedTasks }} completadas</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  tasksInCurrentView: {
    type: Number,
    default: 0
  }
})

defineEmits(['view-project'])

// Computed properties for task statistics
const totalTasks = computed(() => props.project.tasks?.length || 0)

const completedTasks = computed(() => {
  return props.project.tasks?.filter(task => task.status === 'completed').length || 0
})

const pendingTasks = computed(() => {
  return props.project.tasks?.filter(task => task.status === 'pending').length || 0
})

const inProgressTasks = computed(() => {
  return props.project.tasks?.filter(task => task.status === 'in_progress').length || 0
})

const progressPercentage = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})
</script>

<style scoped>
/* Statistics colors usando la nueva paleta */
.stats-blue {
  color: var(--color-earth-brown);
}

.stats-green {
  color: var(--color-earth-olive);
}

.stats-purple {
  color: var(--color-earth-golden);
}

/* Progress bar */
.progress-bar {
  background: linear-gradient(to right, var(--color-earth-golden), var(--color-earth-olive));
}

/* Status indicators */
.status-pending {
  background-color: var(--color-earth-light-gray);
}

.status-progress {
  background-color: var(--color-earth-golden);
}

.status-completed {
  background-color: var(--color-earth-olive);
}
</style>