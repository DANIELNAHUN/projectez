<template>
  <ResponsiveModal
    v-model:visible="isVisible"
    title="Importar Proyecto"
    subtitle="Importa un proyecto desde un archivo JSON o texto"
    size="lg"
    :persistent="isImporting"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Import Method Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Método de importación
        </label>
        <div class="flex space-x-4">
          <button
            @click="importMethod = 'file'"
            :class="[
              'flex-1 p-3 border-2 rounded-lg text-sm font-medium transition-colors duration-200',
              importMethod === 'file'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
            ]"
            :disabled="isImporting"
          >
            <i class="pi pi-file mr-2"></i>
            Archivo JSON
          </button>
          <button
            @click="importMethod = 'text'"
            :class="[
              'flex-1 p-3 border-2 rounded-lg text-sm font-medium transition-colors duration-200',
              importMethod === 'text'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
            ]"
            :disabled="isImporting"
          >
            <i class="pi pi-align-left mr-2"></i>
            Pegar JSON
          </button>
        </div>
      </div>

      <!-- File Upload Method -->
      <div v-if="importMethod === 'file'" class="space-y-4">
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
      </div>

      <!-- Text Input Method -->
      <div v-if="importMethod === 'text'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pegar JSON del proyecto
          </label>
          <textarea
            v-model="jsonText"
            placeholder="Pega aquí el JSON del proyecto..."
            rows="10"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono text-sm"
            :disabled="isImporting"
          ></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            El JSON debe contener la estructura completa del proyecto
          </p>
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
            Vista previa del proyecto
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
              <span class="font-medium text-gray-700 dark:text-gray-300">Fecha:</span>
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
          :disabled="isImporting"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isImporting ? 'Importando...' : 'Cerrar' }}
        </button>
        
        <button
          v-if="canImport"
          @click="importProject"
          :disabled="isImporting || !canImport"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LoadingSpinner v-if="isImporting" size="xs" color="white" class="mr-2" />
          <i v-else class="pi pi-upload mr-2"></i>
          {{ isImporting ? 'Importando...' : 'Importar Proyecto' }}
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
import { ProjectImportService } from '../../services/projectImportService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'project-imported'])

const store = useStore()

// Reactive state
const isVisible = ref(props.visible)
const isImporting = ref(false)
const isDragOver = ref(false)
const importMethod = ref('file') // 'file' or 'text'

// File import state
const selectedFile = ref(null)
const fileInput = ref(null)

// Text import state
const jsonText = ref('')

// Validation and preview
const validationResult = ref(null)
const previewProject = ref(null)
const operationResult = ref(null)

// Computed properties
const validationErrors = computed(() => validationResult.value?.errors || [])
const validationWarnings = computed(() => validationResult.value?.warnings || [])

const canImport = computed(() => {
  if (importMethod.value === 'file') {
    return selectedFile.value && validationErrors.value.length === 0
  } else {
    return jsonText.value.trim() && validationErrors.value.length === 0
  }
})

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

// Watch for file selection changes
watch(selectedFile, async (newFile) => {
  if (newFile) {
    await validateImportData(newFile)
  } else {
    validationResult.value = null
    previewProject.value = null
  }
})

// Watch for text changes
watch(jsonText, async (newText) => {
  if (newText.trim()) {
    await validateImportData(newText)
  } else {
    validationResult.value = null
    previewProject.value = null
  }
})

// Methods
const handleClose = () => {
  if (isImporting.value) return
  isVisible.value = false
}

const resetState = () => {
  importMethod.value = 'file'
  selectedFile.value = null
  jsonText.value = ''
  validationResult.value = null
  previewProject.value = null
  operationResult.value = null
  isImporting.value = false
  isDragOver.value = false
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('es-ES')
}

// File handling methods
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

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

// Validation methods
const validateImportData = async (data) => {
  try {
    let content
    
    if (typeof data === 'string') {
      content = data
    } else {
      // It's a file
      content = await readFileAsText(data)
    }
    
    // Validate JSON structure
    validationResult.value = ProjectImportService.validateProjectJSON(content)
    
    // If validation passes, create preview
    if (validationResult.value.isValid) {
      try {
        const projectData = JSON.parse(content)
        previewProject.value = projectData
      } catch (error) {
        validationResult.value.errors.push('Error parsing JSON for preview')
        validationResult.value.isValid = false
      }
    }
    
  } catch (error) {
    validationResult.value = {
      isValid: false,
      errors: [`Error validating data: ${error.message}`],
      warnings: []
    }
  }
}

// Import method
const importProject = async () => {
  if (!canImport.value) return
  
  isImporting.value = true
  operationResult.value = null
  
  try {
    let content
    
    if (importMethod.value === 'file') {
      content = await readFileAsText(selectedFile.value)
    } else {
      content = jsonText.value.trim()
    }
    
    // Get existing project IDs to avoid conflicts
    const existingProjectIds = store.getters['projects/allProjects'].map(p => p.id)
    
    // Prepare project for import with unique IDs
    const preparedJson = ProjectImportService.prepareProjectForImport(
      content,
      existingProjectIds
    )
    
    // Import the project
    await store.dispatch('projects/importProject', preparedJson)
    
    operationResult.value = {
      success: true,
      message: 'Proyecto importado exitosamente',
      details: `El proyecto "${previewProject.value?.name || 'Sin nombre'}" se ha importado correctamente`
    }
    
    emit('project-imported', {
      project: previewProject.value,
      method: importMethod.value
    })
    
    // Close modal after successful import
    setTimeout(() => {
      handleClose()
    }, 2000)
    
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
</script>