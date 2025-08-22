<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-2xl font-bold mb-2" :style="{ color: isDarkMode ? '#f9fafb' : '#111827' }">Diagrama de Gantt</h2>
        <p :style="{ color: isDarkMode ? '#d1d5db' : '#6b7280' }">Visualización temporal de proyectos y dependencias</p>
      </div>
      <div class="flex items-center space-x-3">
        <select 
          v-model="selectedProjectId"
          @change="handleProjectChange"
          class="border rounded-lg px-3 py-2 text-sm"
          :style="{
            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
            color: isDarkMode ? '#f9fafb' : '#111827'
          }"
        >
          <option value="">Seleccionar proyecto</option>
          <option 
            v-for="project in projects" 
            :key="project.id" 
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Gantt chart -->
    <div class="rounded-lg shadow overflow-hidden" :style="{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }">
      <GanttChart 
        :project-id="selectedProjectId"
        @project-change="handleProjectChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useTheme } from '../composables/useTheme'
import { GanttChart } from '../components/gantt'

const store = useStore()
const { isDarkMode } = useTheme()

// Reactive data
const selectedProjectId = ref('')

// Computed
const projects = computed(() => store.getters['projects/allProjects'])

// Methods
const handleProjectChange = async () => {
  if (selectedProjectId.value) {
    // Load tasks for the selected project
    await store.dispatch('tasks/loadTasks', selectedProjectId.value)
    // Load Gantt data immediately for better UX
    await store.dispatch('gantt/loadGanttData', selectedProjectId.value)
  }
}

// Watch for project selection changes
watch(selectedProjectId, async (newProjectId) => {
  if (newProjectId) {
    // Load tasks for the selected project
    await store.dispatch('tasks/loadTasks', newProjectId)
    // Also trigger Gantt data loading immediately
    await store.dispatch('gantt/loadGanttData', newProjectId)
  }
}, { immediate: false })

// Load projects on mount
onMounted(async () => {
  await store.dispatch('projects/loadProjects')
  
  // Auto-select first project if available
  if (projects.value.length > 0 && !selectedProjectId.value) {
    selectedProjectId.value = projects.value[0].id
    // Load tasks and Gantt data for the first project
    await Promise.all([
      store.dispatch('tasks/loadTasks', selectedProjectId.value),
      store.dispatch('gantt/loadGanttData', selectedProjectId.value)
    ])
  }
})
</script>