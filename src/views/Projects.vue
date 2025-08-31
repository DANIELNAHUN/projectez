<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h2 class="text-2xl sm:text-3xl font-bold mb-2" :style="{ color: isDarkMode ? '#f9fafb' : '#111827' }">
          Proyectos
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Gestiona todos tus proyectos
        </p>
      </div>
      
      <div class="flex-shrink-0 flex gap-3">
        <button 
          @click="showAIGenerator = true"
          class="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <i class="pi pi-sparkles mr-2"></i>
          <span class="hidden sm:inline">Generar con IA</span>
          <span class="sm:hidden">IA</span>
        </button>
        
        <button 
          @click="showCreateForm = true"
          class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <i class="pi pi-plus mr-2"></i>
          <span class="hidden sm:inline">Nuevo Proyecto</span>
          <span class="sm:hidden">Crear</span>
        </button>
      </div>
    </div>

    <!-- Create/Edit Project Form Modal -->
    <ResponsiveModal
      v-model:visible="showCreateForm"
      :title="editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'"
      size="lg"
      :content-padding="false"
      @close="closeForm"
    >
      <ProjectForm
        :project="editingProject"
        @submit="handleProjectSubmit"
        @cancel="closeForm"
      />
    </ResponsiveModal>

    <ResponsiveModal
      v-model:visible="showEditForm"
      :title="editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'"
      size="lg"
      :content-padding="false"
      @close="closeForm"
    >
      <ProjectForm
        :project="editingProject"
        @submit="handleProjectSubmit"
        @cancel="closeForm"
      />
    </ResponsiveModal>

    <!-- Delete Confirmation Modal -->
    <ResponsiveModal
      v-model:visible="showDeleteConfirm"
      title="Confirmar Eliminación"
      size="sm"
      :close-on-backdrop="false"
      @close="showDeleteConfirm = false"
    >
      <div class="space-y-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-gray-900 dark:text-gray-100 font-medium mb-2">
              ¿Eliminar proyecto?
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              ¿Estás seguro de que deseas eliminar el proyecto "{{ deletingProject?.name }}"? 
              Esta acción no se puede deshacer y se eliminarán todas las tareas asociadas.
            </p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            @click="confirmDelete"
            :disabled="isDeleting"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 border border-transparent rounded-lg hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="isDeleting" class="flex items-center justify-center">
              <LoadingSpinner size="xs" color="white" class="mr-2" />
              Eliminando...
            </span>
            <span v-else>Eliminar</span>
          </button>
        </div>
      </template>
    </ResponsiveModal>

    <!-- AI Project Generator Modal -->
    <AIProjectGenerator
      v-model:visible="showAIGenerator"
      @project-imported="handleAIProjectImported"
    />

    <!-- Project Import/Export Component -->
    <ProjectImportExport
      @project-imported="handleProjectImported"
      @project-exported="handleProjectExported"
    />

    <!-- User Management Demo (temporary for testing) -->
    <UserManagementDemo v-if="showUserManagementDemo"/>

    <!-- Projects List -->
    <ProjectList
      @create-project="showCreateForm = true"
      @edit-project="handleEditProject"
      @delete-project="handleDeleteProject"
      @view-project="handleViewProject"
      @retry="loadProjects"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import ProjectList from '../components/project/ProjectList.vue'
import ProjectForm from '../components/project/ProjectForm.vue'
import ResponsiveModal from '../components/ui/ResponsiveModal.vue'
import LoadingSpinner from '../components/ui/LoadingSpinner.vue'
import UserManagementDemo from '../components/project/UserManagementDemo.vue'
import AIProjectGenerator from '../components/ui/AIProjectGenerator.vue'
import ProjectImportExport from '../components/ui/ProjectImportExport.vue'
import { useToast } from '../composables/useToast.js'
import { useTheme } from '../composables/useTheme'

export default {
  name: 'Projects',
  components: {
    ProjectList,
    ProjectForm,
    ResponsiveModal,
    LoadingSpinner,
    UserManagementDemo,
    AIProjectGenerator,
    ProjectImportExport
  },
  setup() {
    const toast = useToast()
    const { isDarkMode } = useTheme()
    return { toast }
  },
  data() {
    return {
      showCreateForm: false,
      showEditForm: false,
      showDeleteConfirm: false,
      showAIGenerator: false,
      editingProject: null,
      deletingProject: null,
      isDeleting: false,
      showUserManagementDemo: import.meta.env.VITE_APP_ENVIROMENT === "DEV"
    }
  },
  methods: {
    ...mapActions('projects', ['loadProjects', 'createProject', 'updateProject', 'deleteProject']),
    
    closeForm() {
      this.showCreateForm = false
      this.showEditForm = false
      this.editingProject = null
    },
    
    handleEditProject(project) {
      this.editingProject = project
      this.showEditForm = true
    },
    
    handleDeleteProject(project) {
      this.deletingProject = project
      this.showDeleteConfirm = true
    },
    
    handleViewProject(project) {
      this.$router.push(`/projects/${project.id}`)
    },
    
    async handleProjectSubmit(projectData) {
      try {
        if (this.editingProject) {
          await this.updateProject(projectData)
          this.toast.success(
            'Proyecto actualizado',
            `El proyecto "${projectData.name}" ha sido actualizado correctamente.`
          )
        } else {
          await this.createProject(projectData)
          this.toast.success(
            'Proyecto creado',
            `El proyecto "${projectData.name}" ha sido creado correctamente.`
          )
        }
        this.closeForm()
      } catch (error) {
        console.error('Error saving project:', error)
        this.toast.error(
          'Error al guardar',
          'No se pudo guardar el proyecto. Por favor, intenta de nuevo.'
        )
      }
    },
    
    async confirmDelete() {
      if (this.isDeleting) return
      
      this.isDeleting = true
      
      try {
        await this.deleteProject(this.deletingProject.id)
        this.toast.success(
          'Proyecto eliminado',
          `El proyecto "${this.deletingProject.name}" ha sido eliminado.`
        )
        this.showDeleteConfirm = false
        this.deletingProject = null
      } catch (error) {
        console.error('Error deleting project:', error)
        this.toast.error(
          'Error al eliminar',
          'No se pudo eliminar el proyecto. Por favor, intenta de nuevo.'
        )
      } finally {
        this.isDeleting = false
      }
    },

    handleAIProjectImported(project) {
      this.toast.success(
        'Proyecto generado con IA',
        `El proyecto "${project.name}" ha sido creado exitosamente usando inteligencia artificial.`
      )
      // Reload projects to show the new one
      this.loadProjects()
    },

    handleProjectImported(project) {
      this.toast.success(
        'Proyecto importado',
        `El proyecto "${project.name}" ha sido importado exitosamente.`
      )
      // Reload projects to show the new one
      this.loadProjects()
    },

    handleProjectExported(projectName) {
      this.toast.success(
        'Proyecto exportado',
        `El proyecto "${projectName}" ha sido exportado exitosamente.`
      )
    },

    // Keyboard shortcut handlers
    handleOpenAIChatbot() {
      this.showAIGenerator = true
    },
    
    handleCreateNewProject() {
      this.showCreateForm = true
    },
    
    handleImportProject() {
      // Trigger import functionality - will be handled by ProjectImportExport component
      window.dispatchEvent(new CustomEvent('trigger-import'))
    },
    
    handleExportProject() {
      // Trigger export functionality - will be handled by ProjectImportExport component
      window.dispatchEvent(new CustomEvent('trigger-export'))
    }
  },
  
  async mounted() {
    await this.loadProjects()
    
    // Listen for keyboard shortcut events
    window.addEventListener('open-ai-chatbot', this.handleOpenAIChatbot)
    window.addEventListener('create-new-project', this.handleCreateNewProject)
    window.addEventListener('import-project', this.handleImportProject)
    window.addEventListener('export-project', this.handleExportProject)
  },
  
  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('open-ai-chatbot', this.handleOpenAIChatbot)
    window.removeEventListener('create-new-project', this.handleCreateNewProject)
    window.removeEventListener('import-project', this.handleImportProject)
    window.removeEventListener('export-project', this.handleExportProject)
  }
}
</script>