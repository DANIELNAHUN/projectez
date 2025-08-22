<template>
  <Card class="nesting-config-card">
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-cog text-blue-600"></i>
        <span>Configuración de Anidación</span>
      </div>
    </template>
    
    <template #content>
      <div class="space-y-6">
        <!-- Current Configuration Display -->
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-medium text-blue-900 mb-2">Configuración Actual</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-blue-700 font-medium">Nivel máximo:</span>
              <span class="ml-2 text-blue-900">{{ currentMaxLevel }}</span>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Tareas con anidación:</span>
              <span class="ml-2 text-blue-900">{{ nestedTasksCount }}</span>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Nivel más profundo:</span>
              <span class="ml-2 text-blue-900">{{ deepestLevel }}</span>
            </div>
          </div>
        </div>

        <!-- Level Configuration -->
        <div class="space-y-4">
          <div>
            <label for="maxLevel" class="block text-sm font-medium text-gray-700 mb-2">
              Nivel máximo de anidación
            </label>
            <div class="flex items-center gap-4">
              <InputNumber
                id="maxLevel"
                v-model="newMaxLevel"
                :min="1"
                :max="100"
                :step="1"
                class="w-32"
                :class="{ 'p-invalid': errors.maxLevel }"
              />
              <div class="text-sm text-gray-600">
                (Rango: 1-100 niveles)
              </div>
            </div>
            <small v-if="errors.maxLevel" class="p-error">{{ errors.maxLevel }}</small>
          </div>

          <!-- Visual Level Preview -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h5 class="font-medium text-gray-900 mb-3">Vista previa de niveles</h5>
            <div class="space-y-2">
              <div
                v-for="level in Math.min(newMaxLevel, 5)"
                :key="level"
                class="flex items-center"
                :style="{ paddingLeft: `${(level - 1) * 20}px` }"
              >
                <div class="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span class="text-sm text-gray-700">Nivel {{ level }}</span>
                <div 
                  class="ml-2 text-xs px-2 py-1 rounded"
                  :class="getLevelIndicatorClass(level - 1)"
                >
                  L{{ level }}
                </div>
              </div>
              <div v-if="newMaxLevel > 5" class="text-sm text-gray-500 italic">
                ... y {{ newMaxLevel - 5 }} niveles más
              </div>
            </div>
          </div>
        </div>

        <!-- Impact Warning -->
        <div v-if="showImpactWarning" class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-yellow-600 mt-0.5"></i>
            <div>
              <h5 class="font-medium text-yellow-800 mb-1">Advertencia de Impacto</h5>
              <div class="text-sm text-yellow-700 space-y-1">
                <p v-if="newMaxLevel < deepestLevel">
                  Reducir el nivel máximo a {{ newMaxLevel }} afectará {{ affectedTasksCount }} tarea(s) 
                  que actualmente están en niveles más profundos.
                </p>
                <p v-if="newMaxLevel < currentMaxLevel">
                  Esta acción puede requerir reorganizar algunas tareas existentes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">{{ totalTasks }}</div>
            <div class="text-sm text-gray-600">Total Tareas</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ rootTasksCount }}</div>
            <div class="text-sm text-gray-600">Tareas Raíz</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ nestedTasksCount }}</div>
            <div class="text-sm text-gray-600">Con Anidación</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ deepestLevel }}</div>
            <div class="text-sm text-gray-600">Nivel Máximo Usado</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
            label="Cancelar"
            severity="secondary"
            @click="handleCancel"
          />
          <Button
            label="Aplicar Cambios"
            :loading="loading"
            :disabled="!hasChanges || !!errors.maxLevel"
            @click="handleApply"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

export default {
  name: 'NestingLevelConfig',
  components: {
    Card,
    InputNumber,
    Button
  },
  props: {
    projectId: {
      type: String,
      default: null
    }
  },
  emits: ['apply', 'cancel'],
  setup(props, { emit }) {
    const store = useStore()

    // Component state
    const newMaxLevel = ref(100)
    const loading = ref(false)
    const errors = ref({})

    // Computed properties
    const currentMaxLevel = computed(() => store.getters['tasks/maxNestingLevel'])
    
    const allTasks = computed(() => {
      if (props.projectId) {
        return store.getters['tasks/tasksByProject'](props.projectId)
      }
      return store.getters['tasks/allTasks']
    })

    const totalTasks = computed(() => allTasks.value.length)

    const rootTasksCount = computed(() => 
      allTasks.value.filter(task => !task.parentTaskId).length
    )

    const nestedTasksCount = computed(() => 
      allTasks.value.filter(task => task.level > 0).length
    )

    const deepestLevel = computed(() => {
      if (allTasks.value.length === 0) return 0
      return Math.max(...allTasks.value.map(task => task.level)) + 1
    })

    const hasChanges = computed(() => newMaxLevel.value !== currentMaxLevel.value)

    const showImpactWarning = computed(() => 
      newMaxLevel.value < currentMaxLevel.value || newMaxLevel.value < deepestLevel.value
    )

    const affectedTasksCount = computed(() => {
      if (newMaxLevel.value >= deepestLevel.value) return 0
      return allTasks.value.filter(task => task.level >= newMaxLevel.value).length
    })

    // Methods
    const validateMaxLevel = () => {
      errors.value = {}

      if (!newMaxLevel.value || newMaxLevel.value < 1) {
        errors.value.maxLevel = 'El nivel máximo debe ser al menos 1'
        return false
      }

      if (newMaxLevel.value > 100) {
        errors.value.maxLevel = 'El nivel máximo no puede exceder 100'
        return false
      }

      return true
    }

    const getLevelIndicatorClass = (level) => {
      if (level === 0) return 'bg-blue-100 text-blue-800'
      if (level === 1) return 'bg-green-100 text-green-800'
      if (level === 2) return 'bg-yellow-100 text-yellow-800'
      if (level === 3) return 'bg-purple-100 text-purple-800'
      return 'bg-gray-100 text-gray-800'
    }

    const handleApply = async () => {
      if (!validateMaxLevel()) return

      loading.value = true
      try {
        await store.dispatch('tasks/setMaxNestingLevel', newMaxLevel.value)
        emit('apply', newMaxLevel.value)
      } catch (error) {
        console.error('Error updating max nesting level:', error)
        errors.value.maxLevel = 'Error al actualizar el nivel máximo'
      } finally {
        loading.value = false
      }
    }

    const handleCancel = () => {
      newMaxLevel.value = currentMaxLevel.value
      errors.value = {}
      emit('cancel')
    }

    // Watch for validation
    watch(newMaxLevel, () => {
      if (errors.value.maxLevel) {
        validateMaxLevel()
      }
    })

    // Lifecycle
    onMounted(() => {
      newMaxLevel.value = currentMaxLevel.value
    })

    return {
      newMaxLevel,
      loading,
      errors,
      currentMaxLevel,
      totalTasks,
      rootTasksCount,
      nestedTasksCount,
      deepestLevel,
      hasChanges,
      showImpactWarning,
      affectedTasksCount,
      getLevelIndicatorClass,
      handleApply,
      handleCancel
    }
  }
}
</script>

<style scoped>
.nesting-config-card {
  max-width: 800px;
  margin: 0 auto;
}

.p-error {
  color: #ef4444;
  font-size: 0.875rem;
}

.p-invalid {
  border-color: #ef4444 !important;
}
</style>