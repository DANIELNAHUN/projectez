<template>
  <div>
    <!-- Header -->
    <div class="flex items-center mb-8">
      <button 
        @click="$router.go(-1)"
        class="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
      >
        <i class="pi pi-arrow-left"></i>
      </button>
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {{ currentProject?.name || 'Cargando...' }}
        </h2>
        <p class="text-gray-600">{{ currentProject?.description || 'Gestión detallada del proyecto' }}</p>
      </div>
      <div v-if="currentProject" class="flex items-center space-x-4">
        <span 
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
          :class="statusClasses"
        >
          <span class="w-2 h-2 rounded-full mr-2" :class="statusDotClasses"></span>
          {{ statusText }}
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-2xl text-blue-600"></i>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle text-red-600 mr-2"></i>
        <span class="text-red-800">{{ error }}</span>
      </div>
    </div>

    <!-- Project not found -->
    <div v-else-if="!currentProject" class="bg-white rounded-lg shadow">
      <div class="p-6">
        <div class="text-center py-12">
          <i class="pi pi-folder-open text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500">Proyecto no encontrado</p>
          <p class="text-sm text-gray-400 mt-2">El proyecto que buscas no existe o ha sido eliminado</p>
          <button 
            @click="$router.push('/projects')"
            class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Volver a Proyectos
          </button>
        </div>
      </div>
    </div>

    <!-- Project content -->
    <div v-else class="space-y-6">
      <!-- Project overview -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Información del Proyecto</h3>
          <div class="flex items-center space-x-2">
            <button
              @click="showDateAdjustmentDialog = true"
              :disabled="!currentProject || isLoading"
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ajustar fechas del proyecto"
            >
              <i class="pi pi-calendar mr-1.5"></i>
              Ajustar Fechas
            </button>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
              <div class="flex items-center">
                <p class="text-gray-900">{{ formatDate(currentProject.startDate) }}</p>
                <button
                  @click="showDateAdjustmentDialog = true"
                  class="ml-2 p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200"
                  title="Ajustar fecha de inicio"
                >
                  <i class="pi pi-pencil text-xs"></i>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
              <p class="text-gray-900">{{ formatDate(currentProject.endDate) || 'No definida' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Creado</label>
              <p class="text-gray-900">{{ formatDate(currentProject.createdAt) }}</p>
            </div>
          </div>
          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <p class="text-gray-900">{{ currentProject.description || 'Sin descripción' }}</p>
          </div>
          
          <!-- Project statistics -->
          <div v-if="currentProject.tasks && currentProject.tasks.length > 0" class="mt-6 pt-6 border-t border-gray-200">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600">{{ currentProject.tasks.length }}</p>
                <p class="text-sm text-gray-600">Tareas Totales</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600">{{ completedTasksCount }}</p>
                <p class="text-sm text-gray-600">Completadas</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-yellow-600">{{ pendingTasksCount }}</p>
                <p class="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Management -->
      <TeamManager :project-id="projectId" />

      <!-- Tasks Management -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Tareas del Proyecto</h3>
        </div>
        <div class="p-6">
          <TaskManager
            :project-id="projectId"
            :project-name="currentProject?.name"
            :team-members="currentProject?.teamMembers || []"
          />
        </div>
      </div>
    </div>

    <!-- Date Adjustment Dialog -->
    <ProjectDateAdjustmentDialog
      v-if="currentProject"
      :visible="showDateAdjustmentDialog"
      @update:visible="showDateAdjustmentDialog = $event"
      :project="currentProject"
      @confirmed="handleDateAdjustmentConfirmed"
      @cancelled="handleDateAdjustmentCancelled"
    />

    <!-- Undo Toast -->
    <ProjectDateAdjustmentUndo
      :visible="showUndoToast"
      :undo-data="undoData"
      @undo="handleUndo"
      @dismiss="showUndoToast = false"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import TeamManager from '../components/project/TeamManager.vue'
import TaskManager from '../components/task/TaskManager.vue'
import ProjectDateAdjustmentDialog from '../components/project/ProjectDateAdjustmentDialog.vue'
import ProjectDateAdjustmentUndo from '../components/project/ProjectDateAdjustmentUndo.vue'

export default {
  name: 'ProjectDetail',
  components: {
    TeamManager,
    TaskManager,
    ProjectDateAdjustmentDialog,
    ProjectDateAdjustmentUndo
  },
  data() {
    return {
      projectId: this.$route.params.id,
      showDateAdjustmentDialog: false,
      showUndoToast: false,
      undoData: null
    }
  },
  computed: {
    ...mapGetters('projects', {
      currentProject: 'currentProject',
      isLoading: 'isLoading',
      error: 'error'
    }),
    statusClasses() {
      if (!this.currentProject) return ''
      const classes = {
        active: 'bg-green-100 text-green-800',
        completed: 'bg-blue-100 text-blue-800',
        paused: 'bg-yellow-100 text-yellow-800'
      }
      return classes[this.currentProject.status] || 'bg-gray-100 text-gray-800'
    },
    statusDotClasses() {
      if (!this.currentProject) return ''
      const classes = {
        active: 'bg-green-400',
        completed: 'bg-blue-400',
        paused: 'bg-yellow-400'
      }
      return classes[this.currentProject.status] || 'bg-gray-400'
    },
    statusText() {
      if (!this.currentProject) return ''
      const texts = {
        active: 'Activo',
        completed: 'Completado',
        paused: 'Pausado'
      }
      return texts[this.currentProject.status] || 'Desconocido'
    },
    completedTasksCount() {
      if (!this.currentProject?.tasks) return 0
      return this.currentProject.tasks.filter(task => task.status === 'completed').length
    },
    pendingTasksCount() {
      if (!this.currentProject?.tasks) return 0
      return this.currentProject.tasks.filter(task => task.status !== 'completed').length
    }
  },
  methods: {
    ...mapActions('projects', ['setCurrentProject']),
    
    formatDate(date) {
      if (!date) return null
      const d = new Date(date)
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    handleDateAdjustmentConfirmed(data) {
      // Store undo data and show undo toast
      this.undoData = data
      this.showUndoToast = true
      this.showDateAdjustmentDialog = false
      
      // Refresh current project to show updated dates
      this.setCurrentProject(this.projectId)
    },

    handleDateAdjustmentCancelled() {
      this.showDateAdjustmentDialog = false
    },

    handleUndo(undoData) {
      // Refresh current project after undo
      this.setCurrentProject(this.projectId)
      this.showUndoToast = false
      this.undoData = null
    }
  },
  
  async mounted() {
    // Initialize test data if needed
    try {
      const { initializeTestData } = await import('../utils/testTaskData.js')
      initializeTestData()
    } catch (error) {
      console.log('Test data initialization skipped:', error.message)
    }
    
    await this.setCurrentProject(this.projectId)
  },
  
  watch: {
    '$route.params.id': {
      immediate: true,
      async handler(newId) {
        if (newId) {
          this.projectId = newId
          await this.setCurrentProject(newId)
        }
      }
    }
  }
}
</script>