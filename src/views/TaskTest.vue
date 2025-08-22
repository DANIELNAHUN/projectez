<template>
  <div class="task-test-page">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Test de Gestión de Tareas</h1>
      
      <!-- Project Selection -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Proyecto
        </label>
        <Select
          v-model="selectedProjectId"
          :options="projectOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecciona un proyecto"
          class="w-full md:w-80"
        />
      </div>

      <!-- Task Manager -->
      <TaskManager
        v-if="selectedProjectId"
        :project-id="selectedProjectId"
        :project-name="selectedProjectName"
        :team-members="selectedProjectTeamMembers"
      />

      <!-- No Project Selected -->
      <div v-else class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <i class="pi pi-folder-open text-6xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Selecciona un proyecto</h3>
        <p class="text-gray-600">Elige un proyecto para gestionar sus tareas.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import Select from 'primevue/select'
import { TaskManager } from '../components/task/index.js'

export default {
  name: 'TaskTest',
  components: {
    Select,
    TaskManager
  },
  setup() {
    const store = useStore()
    const selectedProjectId = ref(null)

    // Computed properties
    const projects = computed(() => store.getters['projects/allProjects'])
    
    const projectOptions = computed(() => 
      projects.value.map(project => ({
        label: project.name,
        value: project.id
      }))
    )

    const selectedProject = computed(() => 
      projects.value.find(p => p.id === selectedProjectId.value)
    )

    const selectedProjectName = computed(() => 
      selectedProject.value?.name || ''
    )

    const selectedProjectTeamMembers = computed(() => 
      selectedProject.value?.teamMembers || []
    )

    // Methods
    const loadProjects = async () => {
      try {
        // Initialize test data if needed
        const { initializeTestData } = await import('../utils/testTaskData.js')
        initializeTestData()
        
        await store.dispatch('projects/loadProjects')
        // Auto-select first project if available
        if (projects.value.length > 0 && !selectedProjectId.value) {
          selectedProjectId.value = projects.value[0].id
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    }

    // Lifecycle
    onMounted(() => {
      loadProjects()
    })

    return {
      selectedProjectId,
      projectOptions,
      selectedProjectName,
      selectedProjectTeamMembers
    }
  }
}
</script>

<style scoped>
.task-test-page {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>