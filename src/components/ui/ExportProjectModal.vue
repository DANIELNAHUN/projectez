<template>
  <ResponsiveModal
    v-model:visible="isVisible"
    title="Exportar Proyecto"
    subtitle="Exporta el proyecto actual a un archivo JSON"
    size="md"
    :persistent="isExporting"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Project Information -->
      <div v-if="currentProject" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Proyecto a exportar
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{{ currentProject.name }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{{ getStatusText(currentProject.status) }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Tareas:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{{ currentProject.tasks?.length || 0 }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Equipo:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{{ currentProject.teamMembers?.length || 0 }} miembros</span>
          </div>
          <div v-if="currentProject.startDate">
            <span class="font-medium text-gray-700 dark:text-gray-300">Inicio:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{{ formatDate(currentProject.startDate) }}</span>
          </div>
          <div v-if="currentProject.endDate">
            <span class="font-medium text-gray-700 dark:text-gray-300">Fin:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{{ formatDate(currentProject.endDate) }}</span>
          </div>
        </div>
        <div v-if="currentProject.description" class="mt-3">
          <span class="font-medium text-gray-700 dark:text-gray-300">Descripción:</span>
          <p class="mt-1 text-gray-600 dark:text-gray-400 text-sm">{{ currentProject.description }}</p>
        </div>
      </div>

      <!-- Export Options -->
      <div v-if="currentProject" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 class="font-medium text-blue-900 dark:text-blue-100 mb-3">
          Opciones de exportación
        </h5>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Nombre del archivo
            </label>
            <input
              v-model="exportFilename"
              type="text"
              placeholder="proyecto-export"
              class="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-blue-900/30 dark:text-blue-100"
              :disabled="isExporting"
            />
            <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Se agregará automáticamente la extensión .json
            </p>
          </div>
          
          <div class="space-y-2">
            <div class="flex items-center">
              <input
                v-model="exportOptions.includeTeamMembers"
                type="checkbox"
                id="includeTeam"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                :disabled="isExporting"
              />
              <label for="includeTeam" class="ml-2 text-sm text-blue-800 dark:text-blue-200">
                Incluir miembros del equipo
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                v-model="exportOptions.includeTasks"
                type="checkbox"
                id="includeTasks"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                :disabled="isExporting"
              />
              <label for="includeTasks" class="ml-2 text-sm text-blue-800 dark:text-blue-200">
                Incluir todas las tareas
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                v-model="exportOptions.includeMetadata"
                type="checkbox"
                id="includeMetadata"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                :disabled="isExporting"
              />
              <label for="includeMetadata" class="ml-2 text-sm text-blue-800 dark:text-blue-200">
                Incluir metadatos (fechas de creación, etc.)
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Not Found -->
      <div v-if="!currentProject && !isLoading" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex items-start">
          <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3"></i>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Proyecto no encontrado
            </h4>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">
              No se pudo cargar el proyecto para exportar. Verifica que estés en la página correcta del proyecto.
            </p>
          </div>
        </div>
      </div>

      <!-- Export Progress -->
      <div v-if="isExporting" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <LoadingSpinner size="sm" text="Exportando proyecto..." />
      </div>

      <!-- Success/Error Messages -->
      <div v-if="operationResult" class="space-y-4">
        <div
          v-if="operationResult.success"
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div class="flex items-start">
            <i class="pi pi-check-circle text-green-600 dark:text-green-400 mt-0.5 mr-3"></i>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                {{ operationResult.message }}
              </h4>
              <p v-if="operationResult.details" class="text-sm text-green-700 dark:text-green-300">
                {{ operationResult.details }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="!operationResult.success"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div class="flex items-start">
            <i class="pi pi-times-circle text-red-600 dark:text-red-400 mt-0.5 mr-3"></i>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                {{ operationResult.message }}
              </h4>
              <p v-if="operationResult.details" class="text-sm text-red-700 dark:text-red-300">
                {{ operationResult.details }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex justify-between">
        <button
          @click="handleClose"
          :disabled="isExporting"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isExporting ? 'Exportando...' : 'Cerrar' }}
        </button>
        
        <button
          v-if="currentProject"
          @click="exportProject"
          :disabled="isExporting || !currentProject"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LoadingSpinner v-if="isExporting" size="xs" color="white" class="mr-2" />
          <i v-else class="pi pi-download mr-2"></i>
          {{ isExporting ? 'Exportando...' : 'Exportar Proyecto' }}
        </button>
      </div>
    </template>
  </ResponsiveModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import ResponsiveModal from './ResponsiveModal.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { ProjectExportService } from '../../services/projectExportService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'project-exported'])

const store = useStore()

// Reactive state
const isVisible = ref(props.visible)
const isExporting = ref(false)
const isLoading = ref(false)
const exportFilename = ref('')
const operationResult = ref(null)

// Export options
const exportOptions = ref({
  includeTeamMembers: true,
  includeTasks: true,
  includeMetadata: true
})

// Computed properties
const currentProject = computed(() => store.getters['projects/currentProject'])

// Watch for prop changes
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
  if (newValue) {
    resetState()
    loadProject()
  }
})

watch(isVisible, (newValue) => {
  emit('update:visible', newValue)
})

// Watch for project changes to update filename
watch(currentProject, (newProject) => {
  if (newProject) {
    exportFilename.value = sanitizeFilename(newProject.name)
  }
})

// Methods
const handleClose = () => {
  if (isExporting.value) return
  isVisible.value = false
}

const resetState = () => {
  exportFilename.value = ''
  operationResult.value = null
  isExporting.value = false
  exportOptions.value = {
    includeTeamMembers: true,
    includeTasks: true,
    includeMetadata: true
  }
}

const loadProject = async () => {
  if (!props.projectId) return
  
  isLoading.value = true
  try {
    await store.dispatch('projects/setCurrentProject', props.projectId)
  } catch (error) {
    console.error('Error loading project:', error)
  } finally {
    isLoading.value = false
  }
}

const sanitizeFilename = (filename) => {
  if (!filename) return 'proyecto-export'
  
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 50) || 'proyecto-export'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('es-ES')
}

const getStatusText = (status) => {
  const statusMap = {
    active: 'Activo',
    completed: 'Completado',
    paused: 'Pausado',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

const exportProject = async () => {
  if (!currentProject.value) return
  
  isExporting.value = true
  operationResult.value = null
  
  try {
    // Create a copy of the project with selected options
    let projectToExport = { ...currentProject.value }
    
    // Apply export options
    if (!exportOptions.value.includeTeamMembers) {
      projectToExport.teamMembers = []
    }
    
    if (!exportOptions.value.includeTasks) {
      projectToExport.tasks = []
    }
    
    if (!exportOptions.value.includeMetadata) {
      delete projectToExport.createdAt
      delete projectToExport.updatedAt
      delete projectToExport.createdBy
      delete projectToExport.lastModifiedBy
    }
    
    // Validate project for export
    const validation = ProjectExportService.validateProjectForExport(projectToExport)
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    // Export and download
    const filename = exportFilename.value || sanitizeFilename(currentProject.value.name)
    ProjectExportService.exportAndDownload(projectToExport, filename)
    
    operationResult.value = {
      success: true,
      message: 'Proyecto exportado exitosamente',
      details: `El archivo ${filename}.json se ha descargado correctamente`
    }
    
    emit('project-exported', {
      project: currentProject.value,
      filename: filename,
      options: exportOptions.value
    })
    
    // Close modal after successful export
    setTimeout(() => {
      handleClose()
    }, 2000)
    
  } catch (error) {
    operationResult.value = {
      success: false,
      message: 'Error al exportar el proyecto',
      details: error.message
    }
  } finally {
    isExporting.value = false
  }
}

// Initialize component
onMounted(() => {
  if (props.visible) {
    loadProject()
  }
})
</script>