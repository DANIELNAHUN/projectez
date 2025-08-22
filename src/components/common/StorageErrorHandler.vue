<template>
  <div v-if="hasStorageError" class="storage-error-banner">
    <!-- Critical Error Banner -->
    <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <i class="pi pi-exclamation-triangle text-red-400 text-xl"></i>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-red-800">
            Error de Almacenamiento Detectado
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button
              label="Intentar Recuperar"
              icon="pi pi-refresh"
              size="small"
              severity="danger"
              :loading="isRecovering"
              @click="attemptRecovery"
            />
            <Button
              label="Exportar Datos"
              icon="pi pi-download"
              size="small"
              severity="secondary"
              @click="exportData"
            />
            <Button
              label="Ver Detalles"
              icon="pi pi-info-circle"
              size="small"
              severity="secondary"
              text
              @click="showDetails = true"
            />
          </div>
        </div>
        <div class="flex-shrink-0 ml-4">
          <Button
            icon="pi pi-times"
            size="small"
            severity="secondary"
            text
            @click="dismissError"
          />
        </div>
      </div>
    </div>

    <!-- Storage Details Dialog -->
    <Dialog
      v-model:visible="showDetails"
      header="Información de Almacenamiento"
      :modal="true"
      class="w-full max-w-2xl"
    >
      <div class="space-y-6">
        <!-- Storage Status -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-3">Estado del Almacenamiento</h4>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-600">Disponible:</span>
                <span class="ml-2" :class="isStorageAvailable ? 'text-green-600' : 'text-red-600'">
                  {{ isStorageAvailable ? 'Sí' : 'No' }}
                </span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Proyectos:</span>
                <span class="ml-2 text-gray-900">{{ storageStats.projectCount }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Tamaño aproximado:</span>
                <span class="ml-2 text-gray-900">{{ storageStats.sizeFormatted }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Último error:</span>
                <span class="ml-2 text-red-600">{{ lastError || 'Ninguno' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Migration Status -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-3">Estado de Migración</h4>
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-600">Versión actual:</span>
                <span class="ml-2 text-gray-900">{{ migrationInfo.currentVersion }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Versión objetivo:</span>
                <span class="ml-2 text-gray-900">{{ migrationInfo.targetVersion }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Necesita migración:</span>
                <span class="ml-2" :class="migrationInfo.needsMigration ? 'text-yellow-600' : 'text-green-600'">
                  {{ migrationInfo.needsMigration ? 'Sí' : 'No' }}
                </span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Migraciones pendientes:</span>
                <span class="ml-2 text-gray-900">{{ migrationInfo.pendingMigrations.length }}</span>
              </div>
            </div>
            
            <div v-if="migrationInfo.pendingMigrations.length > 0" class="mt-3 pt-3 border-t border-blue-200">
              <span class="text-sm font-medium text-gray-600">Migraciones pendientes:</span>
              <ul class="mt-2 space-y-1">
                <li v-for="migration in migrationInfo.pendingMigrations" :key="migration.version" class="text-sm text-gray-700">
                  • {{ migration.version }}: {{ migration.description }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Error Details -->
        <div v-if="lastError">
          <h4 class="text-lg font-medium text-gray-900 mb-3">Detalles del Error</h4>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <code class="text-sm text-red-800 break-all">{{ lastError }}</code>
          </div>
        </div>

        <!-- Recovery Options -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-3">Opciones de Recuperación</h4>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 class="font-medium text-gray-900">Intentar Recuperación Automática</h5>
                <p class="text-sm text-gray-600">Intenta restaurar los datos desde el almacenamiento local</p>
              </div>
              <Button
                label="Recuperar"
                icon="pi pi-refresh"
                size="small"
                :loading="isRecovering"
                @click="attemptRecovery"
              />
            </div>

            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 class="font-medium text-gray-900">Exportar Datos</h5>
                <p class="text-sm text-gray-600">Descarga una copia de seguridad de tus datos</p>
              </div>
              <Button
                label="Exportar"
                icon="pi pi-download"
                size="small"
                severity="secondary"
                @click="exportData"
              />
            </div>

            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 class="font-medium text-gray-900">Importar Datos</h5>
                <p class="text-sm text-gray-600">Restaura datos desde un archivo de respaldo</p>
              </div>
              <div class="flex gap-2">
                <input
                  ref="fileInput"
                  type="file"
                  accept=".json"
                  class="hidden"
                  @change="handleFileImport"
                />
                <Button
                  label="Seleccionar Archivo"
                  icon="pi pi-upload"
                  size="small"
                  severity="secondary"
                  @click="$refs.fileInput.click()"
                />
              </div>
            </div>

            <div class="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h5 class="font-medium text-red-900">Limpiar Todos los Datos</h5>
                <p class="text-sm text-red-600">Elimina todos los datos y reinicia la aplicación</p>
              </div>
              <Button
                label="Limpiar"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                @click="showClearConfirm = true"
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Clear Data Confirmation -->
    <Dialog
      v-model:visible="showClearConfirm"
      header="Confirmar Limpieza de Datos"
      :modal="true"
      class="w-full max-w-md"
    >
      <div class="space-y-4">
        <div class="flex items-center text-red-600">
          <i class="pi pi-exclamation-triangle text-2xl mr-3"></i>
          <div>
            <h4 class="font-medium">¡Acción Irreversible!</h4>
            <p class="text-sm mt-1">Esta acción eliminará todos tus proyectos, tareas y configuraciones.</p>
          </div>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p class="text-sm text-yellow-800">
            <strong>Recomendación:</strong> Exporta tus datos antes de continuar.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Escribe "ELIMINAR" para confirmar:
          </label>
          <InputText
            v-model="confirmText"
            placeholder="ELIMINAR"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            @click="showClearConfirm = false"
          />
          <Button
            label="Exportar Primero"
            icon="pi pi-download"
            severity="secondary"
            @click="exportData"
          />
          <Button
            label="Eliminar Todo"
            icon="pi pi-trash"
            severity="danger"
            :disabled="confirmText !== 'ELIMINAR'"
            @click="confirmClearData"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useStorageError } from '../../composables/useStorageError.js'

export default {
  name: 'StorageErrorHandler',
  components: {
    Button,
    Dialog,
    InputText
  },
  setup() {
    const {
      isRecovering,
      lastError,
      hasStorageError,
      isStorageAvailable,
      attemptRecovery,
      exportData,
      importData,
      clearAllData,
      getStorageStats,
      getMigrationInfo
    } = useStorageError()

    // Component state
    const showDetails = ref(false)
    const showClearConfirm = ref(false)
    const confirmText = ref('')
    const dismissed = ref(false)

    // Computed
    const errorMessage = computed(() => {
      if (lastError.value) {
        return lastError.value
      }
      return 'Se ha detectado un problema con el almacenamiento de datos.'
    })

    const storageStats = computed(() => getStorageStats())
    const migrationInfo = computed(() => getMigrationInfo())

    const shouldShowError = computed(() => {
      return hasStorageError.value && !dismissed.value
    })

    // Methods
    const dismissError = () => {
      dismissed.value = true
    }

    const handleFileImport = async (event) => {
      const file = event.target.files[0]
      if (file) {
        const success = await importData(file)
        if (success) {
          showDetails.value = false
          dismissed.value = true
        }
      }
      // Reset file input
      event.target.value = ''
    }

    const confirmClearData = async () => {
      if (confirmText.value === 'ELIMINAR') {
        const success = await clearAllData()
        if (success) {
          showClearConfirm.value = false
          showDetails.value = false
          dismissed.value = true
          confirmText.value = ''
        }
      }
    }

    // Watch for new errors to reset dismissed state
    watch(hasStorageError, (newValue) => {
      if (newValue) {
        dismissed.value = false
      }
    })

    // Reset confirm text when dialog closes
    watch(showClearConfirm, (newValue) => {
      if (!newValue) {
        confirmText.value = ''
      }
    })

    return {
      // State
      isRecovering,
      lastError,
      showDetails,
      showClearConfirm,
      confirmText,
      
      // Computed
      hasStorageError: shouldShowError,
      isStorageAvailable,
      errorMessage,
      storageStats,
      migrationInfo,
      
      // Methods
      attemptRecovery,
      exportData,
      handleFileImport,
      dismissError,
      confirmClearData
    }
  }
}
</script>

<style scoped>
.storage-error-banner {
  position: sticky;
  top: 0;
  z-index: 40;
}

.storage-error-banner .bg-red-50 {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>