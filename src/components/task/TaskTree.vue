<template>
  <div class="task-tree">
    <!-- Tree Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Jerarquía de Tareas</h3>
      <div class="flex items-center gap-3">
        <!-- Expand/Collapse All -->
        <Button
          :label="allExpanded ? 'Contraer Todo' : 'Expandir Todo'"
          :icon="allExpanded ? 'pi pi-minus' : 'pi pi-plus'"
          size="small"
          severity="secondary"
          text
          @click="toggleAllNodes"
        />
        
        <!-- Max Nesting Level Display -->
        <div class="text-sm text-gray-600">
          Nivel máximo: {{ maxNestingLevel }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner size="small" />
    </div>

    <!-- Empty State -->
    <div v-else-if="hierarchicalTasks.length === 0" class="text-center py-8">
      <div class="text-gray-400 mb-2">
        <i class="pi pi-sitemap text-4xl"></i>
      </div>
      <p class="text-gray-600">No hay tareas para mostrar</p>
    </div>

    <!-- Task Tree -->
    <div v-else class="task-tree-container">
      <TaskTreeNode
        v-for="task in hierarchicalTasks"
        :key="task.id"
        :task="task"
        :level="0"
        :max-nesting-level="maxNestingLevel"
        :team-members="teamMembers"
        :expanded-nodes="expandedNodes"
        @toggle-node="toggleNode"
        @edit-task="$emit('edit-task', $event)"
        @delete-task="$emit('delete-task', $event)"
        @create-subtask="$emit('create-subtask', $event)"
        @move-task="handleMoveTask"
      />
    </div>

    <!-- Nesting Level Configuration -->
    <div v-if="showNestingConfig" class="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 class="text-sm font-medium text-gray-900 mb-3">Configuración de Anidación</h4>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <label for="maxNesting" class="block text-xs text-gray-600 mb-1">
            Nivel máximo de anidación (1-100)
          </label>
          <InputNumber
            id="maxNesting"
            v-model="tempMaxNesting"
            :min="1"
            :max="100"
            :step="1"
            class="w-32"
          />
        </div>
        <div class="flex gap-2">
          <Button
            label="Aplicar"
            size="small"
            @click="updateMaxNestingLevel"
          />
          <Button
            label="Cancelar"
            size="small"
            severity="secondary"
            @click="cancelNestingConfig"
          />
        </div>
      </div>
    </div>

    <!-- Admin Controls -->
    <div class="flex justify-end mt-4">
      <Button
        :label="showNestingConfig ? 'Ocultar Config' : 'Configurar Anidación'"
        icon="pi pi-cog"
        size="small"
        severity="secondary"
        text
        @click="toggleNestingConfig"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import ProgressSpinner from 'primevue/progressspinner'
import TaskTreeNode from './TaskTreeNode.vue'

export default {
  name: 'TaskTree',
  components: {
    Button,
    InputNumber,
    ProgressSpinner,
    TaskTreeNode
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    teamMembers: {
      type: Array,
      default: () => []
    }
  },
  emits: ['edit-task', 'delete-task', 'create-subtask', 'move-task'],
  setup(props, { emit }) {
    const store = useStore()
    const toast = useToast()

    // Component state
    const expandedNodes = ref(new Set())
    const showNestingConfig = ref(false)
    const tempMaxNesting = ref(100)

    // Computed properties
    const loading = computed(() => store.getters['tasks/isLoading'])
    const tasks = computed(() => store.getters['tasks/tasksByProject'](props.projectId))
    const maxNestingLevel = computed(() => store.getters['tasks/maxNestingLevel'])

    // Build hierarchical structure
    const hierarchicalTasks = computed(() => {
      const taskMap = new Map()
      const rootTasks = []

      // Create a map of all tasks
      tasks.value.forEach(task => {
        taskMap.set(task.id, {
          ...task,
          children: []
        })
      })

      // Build the hierarchy
      tasks.value.forEach(task => {
        const taskNode = taskMap.get(task.id)
        
        if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
          // Add to parent's children
          const parent = taskMap.get(task.parentTaskId)
          parent.children.push(taskNode)
        } else {
          // Root level task
          rootTasks.push(taskNode)
        }
      })

      // Sort tasks by creation date
      const sortTasks = (tasks) => {
        tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        tasks.forEach(task => {
          if (task.children.length > 0) {
            sortTasks(task.children)
          }
        })
      }

      sortTasks(rootTasks)
      return rootTasks
    })

    const allExpanded = computed(() => {
      const allTaskIds = getAllTaskIds(hierarchicalTasks.value)
      return allTaskIds.every(id => expandedNodes.value.has(id))
    })

    // Methods
    const getAllTaskIds = (tasks) => {
      const ids = []
      tasks.forEach(task => {
        ids.push(task.id)
        if (task.children.length > 0) {
          ids.push(...getAllTaskIds(task.children))
        }
      })
      return ids
    }

    const toggleNode = (taskId) => {
      if (expandedNodes.value.has(taskId)) {
        expandedNodes.value.delete(taskId)
      } else {
        expandedNodes.value.add(taskId)
      }
    }

    const toggleAllNodes = () => {
      const allTaskIds = getAllTaskIds(hierarchicalTasks.value)
      
      if (allExpanded.value) {
        // Collapse all
        expandedNodes.value.clear()
      } else {
        // Expand all
        allTaskIds.forEach(id => expandedNodes.value.add(id))
      }
    }

    const expandToTask = (taskId) => {
      // Find the task and expand all its parents
      const findAndExpandParents = (tasks, targetId, parents = []) => {
        for (const task of tasks) {
          const currentPath = [...parents, task.id]
          
          if (task.id === targetId) {
            // Found the task, expand all parents
            parents.forEach(parentId => expandedNodes.value.add(parentId))
            return true
          }
          
          if (task.children.length > 0) {
            if (findAndExpandParents(task.children, targetId, currentPath)) {
              return true
            }
          }
        }
        return false
      }

      findAndExpandParents(hierarchicalTasks.value, taskId)
    }

    const handleMoveTask = (moveData) => {
      emit('move-task', moveData)
    }

    const toggleNestingConfig = () => {
      showNestingConfig.value = !showNestingConfig.value
      if (showNestingConfig.value) {
        tempMaxNesting.value = maxNestingLevel.value
      }
    }

    const updateMaxNestingLevel = async () => {
      try {
        await store.dispatch('tasks/setMaxNestingLevel', tempMaxNesting.value)
        showNestingConfig.value = false
        
        // Show success message
        toast.add({
          severity: 'success',
          summary: 'Configuración actualizada',
          detail: `Nivel máximo de anidación establecido en ${tempMaxNesting.value}`,
          life: 3000
        })
      } catch (error) {
        console.error('Error updating max nesting level:', error)
        
        // Show error message
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo actualizar la configuración',
          life: 5000
        })
      }
    }

    const cancelNestingConfig = () => {
      tempMaxNesting.value = maxNestingLevel.value
      showNestingConfig.value = false
    }

    // Auto-expand nodes with children on initial load
    const autoExpandInitialNodes = () => {
      const expandInitialLevel = (tasks, level = 0) => {
        if (level < 2) { // Auto-expand first 2 levels
          tasks.forEach(task => {
            if (task.children.length > 0) {
              expandedNodes.value.add(task.id)
              expandInitialLevel(task.children, level + 1)
            }
          })
        }
      }
      
      expandInitialLevel(hierarchicalTasks.value)
    }

    // Watch for changes in hierarchical tasks
    watch(hierarchicalTasks, (newTasks) => {
      if (newTasks.length > 0 && expandedNodes.value.size === 0) {
        autoExpandInitialNodes()
      }
    }, { immediate: true })

    // Lifecycle
    onMounted(() => {
      tempMaxNesting.value = maxNestingLevel.value
    })

    return {
      loading,
      hierarchicalTasks,
      maxNestingLevel,
      expandedNodes,
      allExpanded,
      showNestingConfig,
      tempMaxNesting,
      toggleNode,
      toggleAllNodes,
      expandToTask,
      handleMoveTask,
      toggleNestingConfig,
      updateMaxNestingLevel,
      cancelNestingConfig
    }
  }
}
</script>

<style scoped>
.task-tree {
  max-width: 100%;
}

.task-tree-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}
</style>