<template>
  <ResponsiveModal
    v-model:visible="isVisible"
    title="Importar/Exportar Proyecto"
    subtitle="Gestiona tus proyectos con archivos JSON"
    size="2xl"
    :persistent="isProcessing"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'export'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <i class="pi pi-download mr-2"></i>
            Exportar
          </button>
          <button
            @click="activeTab = 'import'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <i class="pi pi-upload mr-2"></i>
            Importar
          </button>
        </nav>
      </div>

      <!-- Export Tab -->
      <div v-if="activeTab === 'export'" class="space-y-6">
        <!-- Project Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar proyecto para exportar
          </label>
          <select
            v-model="selectedProjectId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            :disabled="isExporting"
          >
            <option value="">Selecciona un proyecto...</option>
            <option
              v-for="project in availableProjects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }} ({{ project.tasks?.length || 0 }} tareas)
            </option>
          </select>
        </div>

        <!-- Project Preview -->
        <div v-if="selectedProject" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Vista previa del proyecto
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{{ selectedProject.name }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{{ selectedProject.status }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Tareas:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{{ selectedProject.tasks?.length || 0 }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Equipo:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{{ selectedProject.teamMembers?.length || 0 }} miembros</span>
            </div>
            <div v-if="selectedProject.startDate">
              <span class="font-medium text-gray-700 dark:text-gray-300">Inicio:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{{ formatDate(selectedProject.startDate) }}</span>
            </div>
            <div v-if="selectedProject.endDate">
              <span class="font-medium text-gray-700 dark:text-gray-300">Fin:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{{ formatDate(selectedProject.endDate) }}</span>
            </div>
          </div>
          <div v-if="selectedProject.description" class="mt-3">
            <span class="font-medium text-gray-700 dark:text-gray-300">Descripción:</span>
            <p class="mt-1 text-gray-600 dark:text-gray-400 text-sm">{{ selectedProject.description }}</p>
          </div>
        </div>

        <!-- Export Options -->
        <div v-if="selectedProject" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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
          </div>
        </div>

        <!-- Export Progress -->
        <div v-if="isExporting" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <LoadingSpinner size="sm" text="Exportando proyecto..." />
        </div>
      </div>

      <!-- Import Tab -->
      <div v-if="activeTab === 'import'" class="space-y-6">
        <!-- File Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar archivo JSON
          </label>
          <div
            @drop="handleFileDrop"
            @dragover.prevent
            @dragenter.prevent
            :class="[
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200',
              isDragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            ]"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileSelect"
              class="hidden"
              :disabled="isImporting"
            />
            
            <div v-if="!selectedFile">
              <i class="pi pi-cloud-upload text-3xl text-gray-400 mb-3"></i>
              <p class="text-gray-600 dark:text-gray-400 mb-2">
                Arrastra un archivo JSON aquí o
                <button
                  @click="$refs.fileInput.click()"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  :disabled="isImporting"
                >
                  selecciona un archivo
                </button>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Solo archivos JSON (máximo 10MB)
              </p>
            </div>
            
            <div v-else class="space-y-2">
              <i class="pi pi-file text-2xl text-green-500"></i>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ selectedFile.name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatFileSize(selectedFile.size) }}
              </p>
              <button
                @click="clearSelectedFile"
                class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                :disabled="isImporting"
              >
                <i class="pi pi-times mr-1"></i>
                Remover archivo
              </button>
            </div>
          </div>
        </div>

        <!-- Import Options -->
        <div v-if="selectedFile && !validationErrors.length" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h5 class="font-medium text-green-900 dark:text-green-100 mb-3">
            Opciones de importación
          </h5>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Nueva fecha de inicio (opcional)
              </label>
              <input
                v-model="importStartDate"
                type="date"
                class="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-green-900/30 dark:text-green-100"
                :disabled="isImporting"
              />
              <p class="text-xs text-green-600 dark:text-green-300 mt-1">
                Si se especifica, todas las fechas del proyecto se ajustarán proporcionalmente
              </p>
            </div>
            <div class="flex items-center">
              <input
                v-model="generateUniqueIds"
                type="checkbox"
                id="generateIds"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                :disabled="isImporting"
              />
              <label for="generateIds" class="ml-2 text-sm text-green-800 dark:text-green-200">
                Generar IDs únicos para evitar conflictos
              </label>
            </div>
          </div>
        </div>

        <!-- Validation Results -->
        <div v-if="validationResult" class="space-y-4">
          <!-- Validation Errors -->
          <div v-if="validationErrors.length" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-start">
              <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mt-0.5 mr-3"></i>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Errores de validación
                </h4>
                <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li v-for="error in validationErrors" :key="error" class="flex items-start">
                    <span class="mr-2">•</span>
                    <span>{{ error }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Validation Warnings -->
          <div v-if="validationWarnings.length" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div class="flex items-start">
              <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3"></i>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Advertencias
                </h4>
                <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li v-for="warning in validationWarnings" :key="warning" class="flex items-start">
                    <span class="mr-2">•</span>
                    <span>{{ warning }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Project Preview -->
          <div v-if="previewProject && !validationErrors.length" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Vista previa del proyecto a importar
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
                <span class="ml-2 text-gray-600 dark:text-gray-400">{{ previewProject.name }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-300">Tareas:</span>
                <span class="ml-2 text-gray-600 dark:text-gray-400">{{ previewProject.tasks?.length || 0 }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-300">Equipo:</span>
                <span class="ml-2 text-gray-600 dark:text-gray-400">{{ previewProject.teamMembers?.length || 0 }} miembros</span>
              </div>
              <div v-if="previewProject.startDate">
                <span class="font-medium text-gray-700 dark:text-gray-300">Fecha original:</span>
                <span class="ml-2 text-gray-600 dark:text-gray-400">{{ formatDate(previewProject.startDate) }}</span>
              </div>
            </div>
            <div v-if="previewProject.description" class="mt-3">
              <span class="font-medium text-gray-700 dark:text-gray-300">Descripción:</span>
              <p class="mt-1 text-gray-600 dark:text-gray-400 text-sm">{{ previewProject.description }}</p>
            </div>
          </div>
        </div>

        <!-- Import Progress -->
        <div v-if="isImporting" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <LoadingSpinner size="sm" text="Importando proyecto..." />
        </div>
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
          :disabled="isProcessing"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isProcessing ? 'Procesando...' : 'Cerrar' }}
        </button>
        
        <div class="flex space-x-3">
          <!-- Export Actions -->
          <template v-if="activeTab === 'export'">
            <button
              v-if="selectedProject"
              @click="exportProject"
              :disabled="isExporting || !selectedProject"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LoadingSpinner v-if="isExporting" size="xs" color="white" class="mr-2" />
              <i v-else class="pi pi-download mr-2"></i>
              {{ isExporting ? 'Exportando...' : 'Exportar Proyecto' }}
            </button>
          </template>

          <!-- Import Actions -->
          <template v-if="activeTab === 'import'">
            <button
              v-if="selectedFile && !validationErrors.length"
              @click="importProject"
              :disabled="isImporting || validationErrors.length > 0"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LoadingSpinner v-if="isImporting" size="xs" color="white" class="mr-2" />
              <i v-else class="pi pi-upload mr-2"></i>
              {{ isImporting ? 'Importando...' : 'Importar Proyecto' }}
            </button>
          </template>
        </div>
      </div>
    </template>
  </ResponsiveModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import ResponsiveModal from './ResponsiveModal.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { ProjectExportService } from '../../services/ProjectExportService.js'
import { ProjectImportService } from '../../services/ProjectImportService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'project-exported', 'project-imported'])

const store = useStore()

// Reactive state
const isVisible = ref(props.visible)
const activeTab = ref('export')
const isExporting = ref(false)
const isImporting = ref(false)
const isDragOver = ref(false)

// Export state
const selectedProjectId = ref('')
const exportFilename = ref('')

// Import state
const selectedFile = ref(null)
const importStartDate = ref('')
const generateUniqueIds = ref(true)
const validationResult = ref(null)
const previewProject = ref(null)

// Results
const operationResult = ref(null)

// File input ref
const fileInput = ref(null)

// Computed properties
const isProcessing = computed(() => isExporting.value || isImporting.value)

const availableProjects = computed(() => store.getters['projects/allProjects'])

const selectedProject = computed(() => {
  if (!selectedProjectId.value) return null
  return availableProjects.value.find(p => p.id === selectedProjectId.value)
})

const validationErrors = computed(() => validationResult.value?.errors || [])
const validationWarnings = computed(() => validationResult.value?.warnings || [])

// Watch for prop changes
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
  if (newValue) {
    resetState()
  }
})

watch(isVisible, (newValue) => {
  emit('update:visible', newValue)
})

// Watch for project selection changes
watch(selectedProjectId, (newValue) => {
  if (newValue && selectedProject.value) {
    // Set default filename based on project name
    exportFilename.value = sanitizeFilename(selectedProject.value.name)
  }
})

// Watch for file selection changes
watch(selectedFile, async (newFile) => {
  if (newFile) {
    await validateImportFile(newFile)
  } else {
    validationResult.value = null
    previewProject.value = null
  }
})

// Methods
const handleClose = () => {
  if (isProcessing.value) return
  isVisible.value = false
}

const resetState = () => {
  // Reset export state
  selectedProjectId.value = ''
  exportFilename.value = ''
  
  // Reset import state
  selectedFile.value = null
  importStartDate.value = ''
  generateUniqueIds.value = true
  validationResult.value = null
  previewProject.value = null
  
  // Reset results
  operationResult.value = null
  
  // Reset processing states
  isExporting.value = false
  isImporting.value = false
  isDragOver.value = false
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Export methods
const exportProject = async () => {
  if (!selectedProject.value) return
  
  isExporting.value = true
  operationResult.value = null
  
  try {
    // Validate project for export
    const validation = ProjectExportService.validateProjectForExport(selectedProject.value)
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    // Export and download
    const filename = exportFilename.value || sanitizeFilename(selectedProject.value.name)
    ProjectExportService.exportAndDownload(selectedProject.value, filename)
    
    operationResult.value = {
      success: true,
      message: 'Proyecto exportado exitosamente',
      details: `El archivo ${filename}.json se ha descargado correctamente`
    }
    
    emit('project-exported', {
      project: selectedProject.value,
      filename: filename
    })
    
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

// Import methods
const handleFileDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    handleFileSelection(files[0])
  }
}

const handleFileSelect = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    handleFileSelection(files[0])
  }
}

const handleFileSelection = (file) => {
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.json')) {
    operationResult.value = {
      success: false,
      message: 'Tipo de archivo inválido',
      details: 'Solo se permiten archivos JSON'
    }
    return
  }
  
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    operationResult.value = {
      success: false,
      message: 'Archivo demasiado grande',
      details: 'El archivo no puede ser mayor a 10MB'
    }
    return
  }
  
  selectedFile.value = file
  operationResult.value = null
}

const clearSelectedFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const validateImportFile = async (file) => {
  if (!file) return
  
  try {
    const fileContent = await readFileAsText(file)
    
    // Validate JSON structure
    validationResult.value = ProjectImportService.validateProjectJSON(fileContent)
    
    // If validation passes, create preview
    if (validationResult.value.isValid) {
      try {
        const projectData = JSON.parse(fileContent)
        previewProject.value = projectData
      } catch (error) {
        validationResult.value.errors.push('Error parsing JSON for preview')
        validationResult.value.isValid = false
      }
    }
    
  } catch (error) {
    validationResult.value = {
      isValid: false,
      errors: [`Error reading file: ${error.message}`],
      warnings: []
    }
  }
}

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

const importProject = async () => {
  if (!selectedFile.value || validationErrors.value.length > 0) return
  
  isImporting.value = true
  operationResult.value = null
  
  try {
    const fileContent = await readFileAsText(selectedFile.value)
    
    // Prepare import options
    const options = {
      newStartDate: importStartDate.value ? new Date(importStartDate.value) : null
    }
    
    let jsonData = fileContent
    
    // Generate unique IDs if requested
    if (generateUniqueIds.value) {
      const existingProjectIds = availableProjects.value.map(p => p.id)
      const existingTaskIds = availableProjects.value.flatMap(p => 
        (p.tasks || []).map(t => t.id)
      )
      
      jsonData = ProjectImportService.prepareProjectForImport(
        fileContent,
        existingProjectIds,
        existingTaskIds
      )
    }
    
    // Import the project
    const importResult = ProjectImportService.importProjectSafe(jsonData, options)
    
    if (importResult.success) {
      // Add to store
      await store.dispatch('projects/importProject', jsonData)
      
      operationResult.value = {
        success: true,
        message: 'Proyecto importado exitosamente',
        details: `El proyecto "${importResult.project?.name || 'Sin nombre'}" se ha importado correctamente`
      }
      
      emit('project-imported', {
        project: importResult.project,
        warnings: importResult.warnings
      })
      
      // Clear form after successful import
      setTimeout(() => {
        resetState()
      }, 2000)
      
    } else {
      throw new Error(importResult.errors.join(', '))
    }
    
  } catch (error) {
    operationResult.value = {
      success: false,
      message: 'Error al importar el proyecto',
      details: error.message
    }
  } finally {
    isImporting.value = false
  }
}

// Drag and drop handlers
const handleDragEnter = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

// Initialize component
onMounted(() => {
  // Set default import start date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  importStartDate.value = tomorrow.toISOString().split('T')[0]
})
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark .custom-scrollbar {
  scrollbar-color: #4a5568 #2d3748;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #2d3748;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>