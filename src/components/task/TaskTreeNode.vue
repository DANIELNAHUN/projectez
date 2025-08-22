<template>
  <div class="task-tree-node">
    <!-- Task Node -->
    <div 
      class="task-node flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      :class="nodeClasses"
      :style="{ paddingLeft: `${(level * 24) + 12}px` }"
    >
      <!-- Expand/Collapse Button -->
      <div class="flex-shrink-0 w-6 h-6 mr-2">
        <Button
          v-if="hasChildren"
          :icon="isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
          size="small"
          text
          class="w-6 h-6 p-0"
          @click="toggleExpansion"
        />
        <div v-else class="w-6 h-6 flex items-center justify-center">
          <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <!-- Level Indicator -->
      <div class="flex-shrink-0 mr-3">
        <div 
          class="level-indicator text-xs px-2 py-1 rounded border"
          :class="getLevelIndicatorClass()"
        >
          L{{ level + 1 }}
        </div>
      </div>
      
      <!-- Hierarchy Line -->
      <div v-if="level > 0" class="hierarchy-line absolute left-0 top-0 bottom-0 w-px bg-gray-200" 
           :style="{ left: `${(level - 1) * 24 + 6}px` }">
      </div>

      <!-- Task Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <!-- Task Info -->
          <div class="flex-1 min-w-0 mr-4">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-medium text-gray-900 truncate">{{ task.title }}</h4>
              
              <!-- Status Badge -->
              <Tag 
                :value="getStatusLabel(task.status)" 
                :severity="getStatusSeverity(task.status)"
                class="text-xs"
              />
              
              <!-- Priority Badge -->
              <Tag 
                :value="getPriorityLabel(task.priority)" 
                :severity="getPrioritySeverity(task.priority)"
                class="text-xs"
              />
            </div>
            
            <!-- Task Description -->
            <p v-if="task.description" class="text-sm text-gray-600 truncate mb-2">
              {{ task.description }}
            </p>
            
            <!-- Task Metadata -->
            <div class="flex items-center gap-4 text-xs text-gray-500">
              <!-- Dates -->
              <div class="flex items-center gap-1">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(task.startDate) }} - {{ formatDate(task.endDate) }}</span>
              </div>
              
              <!-- Assigned Member -->
              <div v-if="assignedMember" class="flex items-center gap-1">
                <i class="pi pi-user"></i>
                <span>{{ assignedMember.name }}</span>
              </div>
              
              <!-- Progress -->
              <div class="flex items-center gap-1">
                <i class="pi pi-chart-line"></i>
                <span>{{ task.progress }}%</span>
              </div>
              
              <!-- Children Count -->
              <div v-if="hasChildren" class="flex items-center gap-1">
                <i class="pi pi-sitemap"></i>
                <span>{{ task.children.length }} subtarea{{ task.children.length !== 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Task Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Add Subtask -->
            <Button
              v-if="canAddSubtask"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              text
              title="Agregar subtarea"
              @click="createSubtask"
            />
            
            <!-- Edit Task -->
            <Button
              icon="pi pi-pencil"
              size="small"
              severity="secondary"
              text
              title="Editar tarea"
              @click="editTask"
            />
            
            <!-- Move Task -->
            <Button
              icon="pi pi-arrows-alt"
              size="small"
              severity="secondary"
              text
              title="Mover tarea"
              @click="showMoveDialog = true"
            />
            
            <!-- Delete Task -->
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              title="Eliminar tarea"
              @click="deleteTask"
            />
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-2">
          <ProgressBar 
            :value="task.progress" 
            :showValue="false"
            class="h-1"
            :class="getProgressBarClass()"
          />
        </div>

        <!-- Deliverable Info -->
        <div v-if="task.type === 'with_deliverable' && task.deliverable" class="mt-2 p-2 bg-blue-50 rounded text-xs">
          <div class="flex items-center justify-between">
            <span class="font-medium text-blue-800">
              Entregable: {{ getDeliverableTypeLabel(task.deliverable.type) }}
            </span>
            <Tag 
              :value="getDeliverableStatusLabel(task.deliverable.status)" 
              :severity="getDeliverableStatusSeverity(task.deliverable.status)"
              class="text-xs"
            />
          </div>
          <div v-if="task.deliverable.dueDate" class="text-blue-600 mt-1">
            Entrega: {{ formatDate(task.deliverable.dueDate) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Children Nodes -->
    <div v-if="hasChildren && isExpanded" class="children-container">
      <TaskTreeNode
        v-for="child in task.children"
        :key="child.id"
        :task="child"
        :level="level + 1"
        :max-nesting-level="maxNestingLevel"
        :team-members="teamMembers"
        :expanded-nodes="expandedNodes"
        @toggle-node="$emit('toggle-node', $event)"
        @edit-task="$emit('edit-task', $event)"
        @delete-task="$emit('delete-task', $event)"
        @create-subtask="$emit('create-subtask', $event)"
        @move-task="$emit('move-task', $event)"
      />
    </div>

    <!-- Move Task Dialog -->
    <Dialog
      v-model:visible="showMoveDialog"
      header="Mover Tarea"
      :modal="true"
      :closable="true"
      class="w-96"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Selecciona la nueva ubicación para la tarea "{{ task.title }}"
        </p>
        
        <!-- Parent Task Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nueva tarea padre (opcional)
          </label>
          <Select
            v-model="selectedParentId"
            :options="availableParents"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tarea padre"
            class="w-full"
            :showClear="true"
          />
        </div>
        
        <!-- Level Preview -->
        <div v-if="previewLevel !== null" class="text-sm text-gray-600">
          Nuevo nivel: {{ previewLevel + 1 }}
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            @click="showMoveDialog = false"
          />
          <Button
            label="Mover"
            @click="confirmMove"
            :disabled="!canMove"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'

export default {
  name: 'TaskTreeNode',
  components: {
    Button,
    Tag,
    ProgressBar,
    Dialog,
    Select
  },
  props: {
    task: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      required: true
    },
    maxNestingLevel: {
      type: Number,
      required: true
    },
    teamMembers: {
      type: Array,
      default: () => []
    },
    expandedNodes: {
      type: Set,
      required: true
    }
  },
  emits: ['toggle-node', 'edit-task', 'delete-task', 'create-subtask', 'move-task'],
  setup(props, { emit }) {
    const store = useStore()
    
    // Component state
    const showMoveDialog = ref(false)
    const selectedParentId = ref(null)

    // Computed properties
    const hasChildren = computed(() => props.task.children && props.task.children.length > 0)
    const isExpanded = computed(() => props.expandedNodes.has(props.task.id))
    const canAddSubtask = computed(() => props.level < props.maxNestingLevel - 1)

    const assignedMember = computed(() => {
      if (!props.task.assignedTo) return null
      return props.teamMembers.find(member => member.id === props.task.assignedTo)
    })

    const nodeClasses = computed(() => {
      const classes = []
      
      // Status-based styling
      switch (props.task.status) {
        case 'completed':
          classes.push('bg-green-50', 'border-l-4', 'border-l-green-500')
          break
        case 'in_progress':
          classes.push('bg-blue-50', 'border-l-4', 'border-l-blue-500')
          break
        case 'cancelled':
          classes.push('bg-red-50', 'border-l-4', 'border-l-red-500')
          break
        default:
          classes.push('bg-white')
      }

      // Overdue styling
      if (isOverdue.value && props.task.status !== 'completed') {
        classes.push('ring-2', 'ring-red-200')
      }

      return classes
    })

    const isOverdue = computed(() => {
      const now = new Date()
      const endDate = new Date(props.task.endDate)
      return endDate < now && props.task.status !== 'completed' && props.task.status !== 'cancelled'
    })

    // Available parents for moving (excluding self and descendants)
    const availableParents = computed(() => {
      // Get all tasks from the store to build parent options
      const allTasks = store.getters['tasks/tasksByProject'](props.task.projectId)
      const options = []
      
      // Add root level option
      options.push({
        label: 'Nivel raíz',
        value: null
      })
      
      // Get descendants of current task to exclude them
      const getDescendants = (taskId) => {
        const descendants = new Set([taskId])
        const addChildren = (parentId) => {
          allTasks.forEach(task => {
            if (task.parentTaskId === parentId && !descendants.has(task.id)) {
              descendants.add(task.id)
              addChildren(task.id)
            }
          })
        }
        addChildren(taskId)
        return descendants
      }
      
      const excludedIds = getDescendants(props.task.id)
      
      // Add valid parent options
      allTasks.forEach(task => {
        if (!excludedIds.has(task.id)) {
          // Check if adding this task as parent would exceed nesting limit
          const potentialLevel = task.level + 1
          if (potentialLevel < props.maxNestingLevel) {
            options.push({
              label: `${task.title} (Nivel ${task.level + 1})`,
              value: task.id
            })
          }
        }
      })
      
      return options
    })

    const previewLevel = computed(() => {
      if (selectedParentId.value === null) {
        return 0 // Root level
      }
      
      // Find the selected parent and calculate new level
      const allTasks = store.getters['tasks/tasksByProject'](props.task.projectId)
      const parent = allTasks.find(t => t.id === selectedParentId.value)
      return parent ? parent.level + 1 : 0
    })

    const canMove = computed(() => {
      return previewLevel.value !== null && previewLevel.value < props.maxNestingLevel
    })

    // Methods
    const toggleExpansion = () => {
      emit('toggle-node', props.task.id)
    }

    const editTask = () => {
      emit('edit-task', props.task)
    }

    const deleteTask = () => {
      // Check if task has children
      const hasSubtasks = hasChildren.value
      
      if (hasSubtasks) {
        // Emit with subtask handling options
        emit('delete-task', {
          task: props.task,
          hasSubtasks: true
        })
      } else {
        // Simple deletion
        emit('delete-task', {
          task: props.task,
          hasSubtasks: false
        })
      }
    }

    const createSubtask = () => {
      emit('create-subtask', props.task.id)
    }

    const confirmMove = () => {
      emit('move-task', {
        taskId: props.task.id,
        newParentId: selectedParentId.value
      })
      showMoveDialog.value = false
      selectedParentId.value = null
    }

    const getLevelIndicatorClass = () => {
      const level = props.level
      const colors = [
        'bg-blue-100 text-blue-800 border-blue-200',
        'bg-green-100 text-green-800 border-green-200',
        'bg-yellow-100 text-yellow-800 border-yellow-200',
        'bg-purple-100 text-purple-800 border-purple-200',
        'bg-pink-100 text-pink-800 border-pink-200',
        'bg-indigo-100 text-indigo-800 border-indigo-200',
        'bg-red-100 text-red-800 border-red-200',
        'bg-orange-100 text-orange-800 border-orange-200'
      ]
      
      if (level < colors.length) {
        return colors[level]
      }
      
      // For deeper levels, use a cycling pattern with opacity
      const colorIndex = level % colors.length
      return `${colors[colorIndex]} opacity-75`
    }

    const getProgressBarClass = () => {
      if (props.task.progress >= 100) return 'progress-complete'
      if (props.task.progress >= 75) return 'progress-high'
      if (props.task.progress >= 50) return 'progress-medium'
      if (props.task.progress >= 25) return 'progress-low'
      return 'progress-none'
    }

    // Label functions
    const getStatusLabel = (status) => {
      const labels = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completada',
        cancelled: 'Cancelada'
      }
      return labels[status] || status
    }

    const getStatusSeverity = (status) => {
      const severities = {
        pending: 'warning',
        in_progress: 'info',
        completed: 'success',
        cancelled: 'danger'
      }
      return severities[status] || 'secondary'
    }

    const getPriorityLabel = (priority) => {
      const labels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta'
      }
      return labels[priority] || priority
    }

    const getPrioritySeverity = (priority) => {
      const severities = {
        low: 'secondary',
        medium: 'warning',
        high: 'danger'
      }
      return severities[priority] || 'secondary'
    }

    const getDeliverableTypeLabel = (type) => {
      const labels = {
        presentation: 'Presentación',
        file: 'Archivo',
        exposition: 'Exposición',
        other: 'Otro'
      }
      return labels[type] || type
    }

    const getDeliverableStatusLabel = (status) => {
      const labels = {
        pending: 'Pendiente',
        in_review: 'En Revisión',
        completed: 'Completado'
      }
      return labels[status] || status
    }

    const getDeliverableStatusSeverity = (status) => {
      const severities = {
        pending: 'warning',
        in_review: 'info',
        completed: 'success'
      }
      return severities[status] || 'secondary'
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    return {
      hasChildren,
      isExpanded,
      canAddSubtask,
      assignedMember,
      nodeClasses,
      isOverdue,
      showMoveDialog,
      selectedParentId,
      availableParents,
      previewLevel,
      canMove,
      toggleExpansion,
      editTask,
      deleteTask,
      createSubtask,
      confirmMove,
      getLevelIndicatorClass,
      getProgressBarClass,
      getStatusLabel,
      getStatusSeverity,
      getPriorityLabel,
      getPrioritySeverity,
      getDeliverableTypeLabel,
      getDeliverableStatusLabel,
      getDeliverableStatusSeverity,
      formatDate
    }
  }
}
</script>

<style scoped>
.task-tree-node {
  position: relative;
}

.task-node {
  position: relative;
}

.level-indicator {
  font-weight: 600;
  font-size: 0.75rem;
  min-width: 2rem;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.children-container {
  background-color: #fafafa;
  position: relative;
}

.hierarchy-line {
  z-index: 1;
}

.task-node {
  position: relative;
  z-index: 2;
}

/* Hover effects for better UX */
.task-node:hover {
  background-color: #f8fafc !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-node:hover .level-indicator {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Progress bar custom colors */
:deep(.progress-complete .p-progressbar-value) {
  background: #10b981;
}

:deep(.progress-high .p-progressbar-value) {
  background: #3b82f6;
}

:deep(.progress-medium .p-progressbar-value) {
  background: #f59e0b;
}

:deep(.progress-low .p-progressbar-value) {
  background: #ef4444;
}

:deep(.progress-none .p-progressbar-value) {
  background: #6b7280;
}
</style>