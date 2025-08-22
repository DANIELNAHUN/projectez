<template>
  <div class="task-list">
    <!-- Filters and Controls -->
    <ResponsiveCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filtros y Búsqueda
          </h3>
          <Button
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            size="small"
            @click="clearFilters"
            title="Limpiar filtros"
            class="sm:hidden"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Search -->
        <div class="w-full">
          <div class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar tareas..."
              class="w-full"
            />
          </div>
        </div>

        <!-- Filters Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <Select
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
              :showClear="true"
            />
          </div>

          <!-- Priority Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prioridad
            </label>
            <Select
              v-model="priorityFilter"
              :options="priorityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas"
              class="w-full"
              :showClear="true"
            />
          </div>

          <!-- Assignee Filter -->
          <div v-if="teamMembers.length > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Asignado a
            </label>
            <Select
              v-model="assigneeFilter"
              :options="assigneeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
              :showClear="true"
            />
          </div>

          <!-- Sort Options -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ordenar por
            </label>
            <Select
              v-model="sortOption"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>

        <!-- Additional Options -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <!-- Show Completed Toggle -->
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="showCompleted"
              inputId="showCompleted"
            />
            <label for="showCompleted" class="text-sm text-gray-700 dark:text-gray-300">
              Mostrar completadas
            </label>
          </div>

          <!-- Clear Filters (Desktop) -->
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            @click="clearFilters"
            class="hidden sm:flex"
          />
        </div>
      </div>

      <!-- Active Filters Display -->
      <div v-if="hasActiveFilters" class="flex flex-wrap gap-2 mt-3 pt-3 border-t">
        <span class="text-sm text-gray-600">Filtros activos:</span>
        
        <Tag v-if="searchQuery" :value="`Búsqueda: ${searchQuery}`" severity="info" />
        <Tag v-if="statusFilter" :value="`Estado: ${getStatusLabel(statusFilter)}`" severity="info" />
        <Tag v-if="priorityFilter" :value="`Prioridad: ${getPriorityLabel(priorityFilter)}`" severity="info" />
        <Tag v-if="assigneeFilter" :value="`Asignado: ${getAssigneeName(assigneeFilter)}`" severity="info" />
        <Tag v-if="!showCompleted" value="Ocultando completadas" severity="info" />
      </div>
    </ResponsiveCard>

    <!-- Results Summary -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {{ filteredTasks.length }} de {{ totalTasks }} tareas
        <span v-if="hasActiveFilters" class="text-blue-600 dark:text-blue-400 font-medium">(filtradas)</span>
      </div>
      
      <!-- Bulk Actions -->
      <div v-if="selectedTasks.length > 0" class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {{ selectedTasks.length }} seleccionadas
        </span>
        <div class="flex gap-2">
          <Button
            label="Estado"
            icon="pi pi-refresh"
            size="small"
            severity="secondary"
            @click="showBulkStatusDialog = true"
            class="text-xs sm:text-sm"
          />
          <Button
            label="Asignar"
            icon="pi pi-user"
            size="small"
            severity="secondary"
            @click="showBulkAssignDialog = true"
            class="text-xs sm:text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSpinner 
      v-if="loading" 
      size="lg" 
      text="Cargando tareas..." 
      class="py-12"
    />

    <!-- Empty State -->
    <ResponsiveCard v-else-if="filteredTasks.length === 0">
      <EmptyState
        icon="pi pi-list"
        :title="hasActiveFilters ? 'No se encontraron tareas' : 'No hay tareas'"
        :description="hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda.' : 'Comienza creando tu primera tarea.'"
        :action-text="hasActiveFilters ? 'Limpiar Filtros' : 'Crear Primera Tarea'"
        :action-icon="hasActiveFilters ? 'pi pi-filter-slash' : 'pi pi-plus'"
        :action-handler="hasActiveFilters ? clearFilters : () => $emit('create-task')"
      />
    </ResponsiveCard>

    <!-- Task List -->
    <div v-else class="space-y-3">
      <!-- Select All -->
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <Checkbox
          v-model="selectAll"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        />
        <span class="text-sm text-gray-700">Seleccionar todas las tareas visibles</span>
      </div>

      <!-- Task Items -->
      <div
        v-for="task in paginatedTasks"
        :key="task.id"
        class="task-list-item border rounded-lg hover:shadow-md transition-shadow"
        :class="{ 
          'ring-2 ring-blue-200': selectedTasks.includes(task.id),
          'completed': task.status === 'completed'
        }"
        :data-level="task.level"
      >
        <div class="flex items-start gap-3 p-4" :style="{ paddingLeft: `${16 + (task.level * 24)}px` }">
          <!-- Hierarchy Indicator -->
          <div v-if="task.level > 0" class="flex items-center text-gray-400 mr-2">
            <div class="flex items-center">
              <!-- Indentation lines -->
              <div 
                v-for="level in task.level" 
                :key="level"
                class="w-6 h-px bg-gray-300 mr-1"
                :class="{ 'bg-gray-400': level === task.level }"
              ></div>
              <i class="pi pi-arrow-right text-xs"></i>
            </div>
          </div>

          <!-- Selection Checkbox -->
          <Checkbox
            :modelValue="selectedTasks.includes(task.id)"
            @update:modelValue="toggleTaskSelection(task.id, $event)"
            class="mt-1"
          />

          <!-- Task Content -->
          <div class="flex-1 min-w-0">
            <TaskCard
              :task="task"
              :team-members="teamMembers"
              :subtask-count="getSubtaskCount(task.id)"
              :show-hierarchy-info="true"
              @edit="$emit('edit-task', $event)"
              @delete="$emit('delete-task', $event)"
              @toggle-subtasks="$emit('toggle-subtasks', $event)"
            />
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-col gap-2">
            <!-- Create Subtask Button -->
            <Button
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              text
              title="Crear subtarea"
              @click="$emit('create-subtask', task.id)"
              class="w-8 h-8"
            />

            <!-- Status Quick Change -->
            <Select
              :modelValue="task.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              class="w-32"
              @update:modelValue="updateTaskStatus(task, $event)"
            />

            <!-- Assignment Quick Change -->
            <Select
              v-if="teamMembers.length > 0"
              :modelValue="task.assignedTo"
              :options="assigneeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sin asignar"
              class="w-32"
              :showClear="true"
              @update:modelValue="updateTaskAssignment(task, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <Paginator
        v-model:first="first"
        :rows="pageSize"
        :totalRecords="filteredTasks.length"
        :rowsPerPageOptions="[10, 25, 50]"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      />
    </div>

    <!-- Bulk Status Change Dialog -->
    <Dialog
      v-model:visible="showBulkStatusDialog"
      header="Cambiar Estado de Tareas"
      :modal="true"
      class="w-96"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Cambiar el estado de {{ selectedTasks.length }} tarea(s) seleccionada(s):
        </p>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nuevo estado
          </label>
          <Select
            v-model="bulkStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar estado"
            class="w-full"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            @click="showBulkStatusDialog = false"
          />
          <Button
            label="Aplicar"
            @click="applyBulkStatusChange"
            :disabled="!bulkStatus"
          />
        </div>
      </template>
    </Dialog>

    <!-- Bulk Assignment Dialog -->
    <Dialog
      v-model:visible="showBulkAssignDialog"
      header="Asignar Tareas"
      :modal="true"
      class="w-96"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Asignar {{ selectedTasks.length }} tarea(s) seleccionada(s) a:
        </p>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Miembro del equipo
          </label>
          <Select
            v-model="bulkAssignee"
            :options="assigneeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar miembro"
            class="w-full"
            :showClear="true"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            @click="showBulkAssignDialog = false"
          />
          <Button
            label="Asignar"
            @click="applyBulkAssignment"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'
import Dialog from 'primevue/dialog'
import TaskCard from './TaskCard.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import EmptyState from '../ui/EmptyState.vue'
import ResponsiveCard from '../ui/ResponsiveCard.vue'
import { 
  TASK_STATUSES, 
  TASK_PRIORITIES 
} from '../../models/index.js'

export default {
  name: 'TaskList',
  components: {
    InputText,
    Select,
    Button,
    Tag,
    Checkbox,
    ProgressSpinner,
    Paginator,
    Dialog,
    TaskCard,
    LoadingSpinner,
    EmptyState,
    ResponsiveCard
  },
  props: {
    tasks: {
      type: Array,
      required: true
    },
    teamMembers: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'create-task',
    'create-subtask',
    'edit-task', 
    'delete-task', 
    'toggle-subtasks',
    'update-task-status',
    'update-task-assignment',
    'bulk-status-change',
    'bulk-assignment'
  ],
  setup(props, { emit }) {
    const store = useStore()
    const toast = useToast()

    // Component state
    const searchQuery = ref('')
    const statusFilter = ref(null)
    const priorityFilter = ref(null)
    const assigneeFilter = ref(null)
    const sortOption = ref('hierarchy_asc')
    const selectedTasks = ref([])
    const first = ref(0)
    const pageSize = ref(25)
    const showCompleted = ref(true)
    const showBulkStatusDialog = ref(false)
    const showBulkAssignDialog = ref(false)
    const bulkStatus = ref(null)
    const bulkAssignee = ref(null)

    // Options
    const statusOptions = computed(() => 
      TASK_STATUSES.map(status => ({
        label: getStatusLabel(status),
        value: status
      }))
    )

    const priorityOptions = computed(() => 
      TASK_PRIORITIES.map(priority => ({
        label: getPriorityLabel(priority),
        value: priority
      }))
    )

    const assigneeOptions = computed(() => [
      { label: 'Sin asignar', value: null },
      ...props.teamMembers.map(member => ({
        label: `${member.name} (${member.role})`,
        value: member.id
      }))
    ])

    const sortOptions = ref([
      { label: 'Jerarquía natural', value: 'hierarchy_asc' },
      { label: 'Fecha de creación (más reciente)', value: 'createdAt_desc' },
      { label: 'Fecha de creación (más antigua)', value: 'createdAt_asc' },
      { label: 'Fecha de vencimiento (próxima)', value: 'endDate_asc' },
      { label: 'Fecha de vencimiento (lejana)', value: 'endDate_desc' },
      { label: 'Título (A-Z)', value: 'title_asc' },
      { label: 'Título (Z-A)', value: 'title_desc' },
      { label: 'Prioridad (alta a baja)', value: 'priority_desc' },
      { label: 'Prioridad (baja a alta)', value: 'priority_asc' },
      { label: 'Progreso (mayor)', value: 'progress_desc' },
      { label: 'Progreso (menor)', value: 'progress_asc' }
    ])

    // Computed properties
    const totalTasks = computed(() => props.tasks.length)

    const hasActiveFilters = computed(() => 
      searchQuery.value || statusFilter.value || priorityFilter.value || assigneeFilter.value || !showCompleted.value
    )

    const filteredTasks = computed(() => {
      let filtered = [...props.tasks]

      // Show completed filter
      if (!showCompleted.value) {
        filtered = filtered.filter(task => task.status !== 'completed')
      }

      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(task => 
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
        )
      }

      // Status filter
      if (statusFilter.value) {
        filtered = filtered.filter(task => task.status === statusFilter.value)
      }

      // Priority filter
      if (priorityFilter.value) {
        filtered = filtered.filter(task => task.priority === priorityFilter.value)
      }

      // Assignee filter
      if (assigneeFilter.value !== null) {
        filtered = filtered.filter(task => task.assignedTo === assigneeFilter.value)
      }

      // Build hierarchical structure for proper ordering
      const buildHierarchicalList = (tasks) => {
        const taskMap = new Map()
        const rootTasks = []
        
        // Create a map for quick lookup
        tasks.forEach(task => taskMap.set(task.id, { ...task, children: [] }))
        
        // Build hierarchy
        tasks.forEach(task => {
          const taskWithChildren = taskMap.get(task.id)
          if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
            taskMap.get(task.parentTaskId).children.push(taskWithChildren)
          } else {
            rootTasks.push(taskWithChildren)
          }
        })
        
        // Flatten hierarchy while maintaining order
        const flattenHierarchy = (tasks, result = []) => {
          tasks.forEach(task => {
            result.push(task)
            if (task.children.length > 0) {
              flattenHierarchy(task.children, result)
            }
          })
          return result
        }
        
        return flattenHierarchy(rootTasks)
      }

      // Sort before building hierarchy (only root tasks for most sort options)
      const [sortField, sortDirection] = sortOption.value.split('_')
      
      if (sortField === 'hierarchy') {
        // Special case: maintain natural hierarchy order
        return buildHierarchicalList(filtered)
      }
      
      // For other sorts, sort root tasks first, then build hierarchy
      const rootTasks = filtered.filter(task => !task.parentTaskId)
      const childTasks = filtered.filter(task => task.parentTaskId)
      
      rootTasks.sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        // Handle special cases
        if (sortField === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[aValue] || 0
          bValue = priorityOrder[bValue] || 0
        } else if (sortField === 'title') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        } else if (sortField === 'createdAt' || sortField === 'endDate') {
          aValue = new Date(aValue)
          bValue = new Date(bValue)
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Rebuild the full list maintaining hierarchy
      return buildHierarchicalList([...rootTasks, ...childTasks])
    })

    const paginatedTasks = computed(() => {
      const start = first.value
      const end = start + pageSize.value
      return filteredTasks.value.slice(start, end)
    })

    const totalPages = computed(() => Math.ceil(filteredTasks.value.length / pageSize.value))

    const selectAll = computed({
      get: () => {
        const visibleTaskIds = paginatedTasks.value.map(task => task.id)
        return visibleTaskIds.length > 0 && visibleTaskIds.every(id => selectedTasks.value.includes(id))
      },
      set: (value) => {
        // This will be handled by handleSelectAll
      }
    })

    const isIndeterminate = computed(() => {
      const visibleTaskIds = paginatedTasks.value.map(task => task.id)
      const selectedVisible = visibleTaskIds.filter(id => selectedTasks.value.includes(id))
      return selectedVisible.length > 0 && selectedVisible.length < visibleTaskIds.length
    })

    // Methods
    const getStatusLabel = (status) => {
      const labels = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completada',
        cancelled: 'Cancelada'
      }
      return labels[status] || status
    }

    const getPriorityLabel = (priority) => {
      const labels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta'
      }
      return labels[priority] || priority
    }

    const getAssigneeName = (assigneeId) => {
      if (!assigneeId) return 'Sin asignar'
      const member = props.teamMembers.find(m => m.id === assigneeId)
      return member ? member.name : 'Desconocido'
    }

    const getSubtaskCount = (taskId) => {
      return props.tasks.filter(task => task.parentTaskId === taskId).length
    }

    const clearFilters = () => {
      searchQuery.value = ''
      statusFilter.value = null
      priorityFilter.value = null
      assigneeFilter.value = null
      showCompleted.value = true
      first.value = 0
    }

    const toggleTaskSelection = (taskId, selected) => {
      if (selected) {
        if (!selectedTasks.value.includes(taskId)) {
          selectedTasks.value.push(taskId)
        }
      } else {
        selectedTasks.value = selectedTasks.value.filter(id => id !== taskId)
      }
    }

    const handleSelectAll = (event) => {
      const visibleTaskIds = paginatedTasks.value.map(task => task.id)
      
      if (event.checked) {
        // Add all visible tasks to selection
        visibleTaskIds.forEach(id => {
          if (!selectedTasks.value.includes(id)) {
            selectedTasks.value.push(id)
          }
        })
      } else {
        // Remove all visible tasks from selection
        selectedTasks.value = selectedTasks.value.filter(id => !visibleTaskIds.includes(id))
      }
    }

    const updateTaskStatus = async (task, newStatus) => {
      try {
        await store.dispatch('tasks/updateTask', {
          ...task,
          status: newStatus
        })
        
        toast.add({
          severity: 'success',
          summary: 'Tarea Actualizada',
          detail: `Estado cambiado a ${getStatusLabel(newStatus)}`,
          life: 3000
        })
      } catch (error) {
        console.error('Error updating task status:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de la tarea',
          life: 5000
        })
      }
    }

    const updateTaskAssignment = async (task, assigneeId) => {
      try {
        await store.dispatch('tasks/updateTask', {
          ...task,
          assignedTo: assigneeId
        })
        
        const assigneeName = getAssigneeName(assigneeId)
        toast.add({
          severity: 'success',
          summary: 'Tarea Asignada',
          detail: `Asignada a ${assigneeName}`,
          life: 3000
        })
      } catch (error) {
        console.error('Error updating task assignment:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo asignar la tarea',
          life: 5000
        })
      }
    }

    const applyBulkStatusChange = async () => {
      if (!bulkStatus.value) return
      
      try {
        const updatePromises = selectedTasks.value.map(taskId => {
          const task = props.tasks.find(t => t.id === taskId)
          if (task) {
            return store.dispatch('tasks/updateTask', {
              ...task,
              status: bulkStatus.value
            })
          }
        })
        
        await Promise.all(updatePromises.filter(Boolean))
        
        toast.add({
          severity: 'success',
          summary: 'Tareas Actualizadas',
          detail: `${selectedTasks.value.length} tareas actualizadas`,
          life: 3000
        })
        
        showBulkStatusDialog.value = false
        bulkStatus.value = null
        selectedTasks.value = []
      } catch (error) {
        console.error('Error in bulk status change:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron actualizar todas las tareas',
          life: 5000
        })
      }
    }

    const applyBulkAssignment = async () => {
      try {
        const updatePromises = selectedTasks.value.map(taskId => {
          const task = props.tasks.find(t => t.id === taskId)
          if (task) {
            return store.dispatch('tasks/updateTask', {
              ...task,
              assignedTo: bulkAssignee.value
            })
          }
        })
        
        await Promise.all(updatePromises.filter(Boolean))
        
        const assigneeName = getAssigneeName(bulkAssignee.value)
        toast.add({
          severity: 'success',
          summary: 'Tareas Asignadas',
          detail: `${selectedTasks.value.length} tareas asignadas a ${assigneeName}`,
          life: 3000
        })
        
        showBulkAssignDialog.value = false
        bulkAssignee.value = null
        selectedTasks.value = []
      } catch (error) {
        console.error('Error in bulk assignment:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron asignar todas las tareas',
          life: 5000
        })
      }
    }

    // Reset pagination when filters change
    watch([searchQuery, statusFilter, priorityFilter, assigneeFilter, showCompleted], () => {
      first.value = 0
    })

    return {
      searchQuery,
      statusFilter,
      priorityFilter,
      assigneeFilter,
      sortOption,
      selectedTasks,
      first,
      pageSize,
      showCompleted,
      showBulkStatusDialog,
      showBulkAssignDialog,
      bulkStatus,
      bulkAssignee,
      statusOptions,
      priorityOptions,
      assigneeOptions,
      sortOptions,
      totalTasks,
      hasActiveFilters,
      filteredTasks,
      paginatedTasks,
      totalPages,
      selectAll,
      isIndeterminate,
      getStatusLabel,
      getPriorityLabel,
      getAssigneeName,
      getSubtaskCount,
      clearFilters,
      toggleTaskSelection,
      handleSelectAll,
      updateTaskStatus,
      updateTaskAssignment,
      applyBulkStatusChange,
      applyBulkAssignment
    }
  }
}
</script>

<style scoped>
.task-list {
  max-width: 100%;
}

.filters-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.task-list-item {
  transition: all 0.2s ease;
  position: relative;
}

.task-list-item:hover {
  transform: translateY(-1px);
}

/* Hierarchy visualization */
.task-list-item[data-level="1"] {
  border-left: 3px solid #3b82f6;
}

.task-list-item[data-level="2"] {
  border-left: 3px solid #10b981;
}

.task-list-item[data-level="3"] {
  border-left: 3px solid #f59e0b;
}

.task-list-item[data-level="4"] {
  border-left: 3px solid #ef4444;
}

.task-list-item[data-level="5"] {
  border-left: 3px solid #8b5cf6;
}

/* Hierarchy lines */
.hierarchy-indicator {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.hierarchy-line {
  width: 20px;
  height: 1px;
  background-color: #d1d5db;
  margin-right: 4px;
}

.hierarchy-line.active {
  background-color: #6b7280;
}

/* Completed tasks styling */
.task-list-item.completed {
  opacity: 0.7;
}

.task-list-item.completed .task-card {
  background-color: #f9fafb;
}
</style>