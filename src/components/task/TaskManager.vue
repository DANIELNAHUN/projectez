<template>
  <div class="task-manager">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Gestión de Tareas</h2>
        <p class="text-gray-600 mt-1">
          {{ tasks.length }} tarea{{ tasks.length !== 1 ? 's' : '' }} 
          {{ projectName ? `en ${projectName}` : '' }}
        </p>
      </div>
      
      <div class="flex gap-3">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 rounded-lg p-1">
          <Button
            :label="viewMode === 'list' ? 'Lista' : ''"
            :icon="viewMode === 'list' ? 'pi pi-list' : 'pi pi-list'"
            :severity="viewMode === 'list' ? 'primary' : 'secondary'"
            :text="viewMode !== 'list'"
            size="small"
            @click="viewMode = 'list'"
          />
          <Button
            :label="viewMode === 'tree' ? 'Árbol' : ''"
            :icon="viewMode === 'tree' ? 'pi pi-sitemap' : 'pi pi-sitemap'"
            :severity="viewMode === 'tree' ? 'primary' : 'secondary'"
            :text="viewMode !== 'tree'"
            size="small"
            @click="viewMode = 'tree'"
          />
        </div>
        
        <Button
          label="Nueva Tarea"
          icon="pi pi-plus"
          @click="() => openCreateModal()"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Error State -->
    <Message v-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- Empty State -->
    <div v-if="!loading && tasks.length === 0" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <i class="pi pi-list text-6xl"></i>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No hay tareas</h3>
      <p class="text-gray-600 mb-4">Comienza creando tu primera tarea para este proyecto.</p>
      <Button
        label="Crear Primera Tarea"
        icon="pi pi-plus"
        @click="() => openCreateModal()"
      />
    </div>

    <!-- Tasks Content -->
    <div v-if="!loading && tasks.length > 0">
      <!-- List View -->
      <div v-if="viewMode === 'list'">
        <TaskList
          :tasks="tasks"
          :team-members="teamMembers"
          :loading="loading"
          @create-task="openCreateModal"
          @create-subtask="openCreateModal"
          @edit-task="openEditModal"
          @delete-task="confirmDeleteTask"
          @toggle-subtasks="toggleSubtasks"
          @update-task-status="handleTaskStatusUpdate"
          @update-task-assignment="handleTaskAssignmentUpdate"
          @bulk-status-change="handleBulkStatusChange"
          @bulk-assignment="handleBulkAssignment"
        />
      </div>
      
      <!-- Tree View -->
      <div v-else-if="viewMode === 'tree'">
        <TaskTree
          :project-id="projectId"
          :team-members="teamMembers"
          @edit-task="openEditModal"
          @delete-task="confirmDeleteTask"
          @create-subtask="openCreateModal"
          @move-task="handleMoveTask"
        />
      </div>
    </div>

    <!-- Task Modal -->
    <TaskModal
      v-model:visible="showModal"
      :task="selectedTask"
      :project-id="projectId"
      :parent-task-id="parentTaskId"
      :team-members="teamMembers"
      @submit="handleTaskSubmit"
      @close="closeModal"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog />

    <!-- Success/Error Messages -->
    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import TaskCard from './TaskCard.vue'
import TaskModal from './TaskModal.vue'
import TaskTree from './TaskTree.vue'
import TaskList from './TaskList.vue'

export default {
  name: 'TaskManager',
  components: {
    Button,
    Message,
    ProgressSpinner,
    ConfirmDialog,
    Toast,
    TaskCard,
    TaskModal,
    TaskTree,
    TaskList
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      default: ''
    },
    teamMembers: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const store = useStore()
    const confirm = useConfirm()
    const toast = useToast()

    // Component state
    const showModal = ref(false)
    const selectedTask = ref(null)
    const parentTaskId = ref(null)
    const viewMode = ref('list')

    // Computed properties
    const loading = computed(() => store.getters['tasks/isLoading'])
    const error = computed(() => store.getters['tasks/error'])
    const tasks = computed(() => store.getters['tasks/tasksByProject'](props.projectId))

    // Methods
    const loadTasks = async () => {
      try {
        await store.dispatch('tasks/loadTasks', props.projectId)
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las tareas',
          life: 5000
        })
      }
    }

    const openCreateModal = (parentId = null) => {
      selectedTask.value = null
      parentTaskId.value = parentId
      showModal.value = true
    }

    const openEditModal = (task) => {
      selectedTask.value = task
      parentTaskId.value = null
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      selectedTask.value = null
      parentTaskId.value = null
    }

    const handleTaskSubmit = async (taskData) => {
      try {
        if (selectedTask.value) {
          // Update existing task
          await store.dispatch('tasks/updateTask', {
            ...taskData,
            id: selectedTask.value.id
          })
          toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tarea actualizada correctamente',
            life: 3000
          })
        } else {
          // Create new task
          await store.dispatch('tasks/createTask', taskData)
          toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tarea creada correctamente',
            life: 3000
          })
        }
        closeModal()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo guardar la tarea',
          life: 5000
        })
      }
    }

    const confirmDeleteTask = (deleteData) => {
      const task = deleteData.task || deleteData
      const hasSubtasks = deleteData.hasSubtasks || false
      const subtaskCount = getSubtaskCount(task.id)
      
      if (hasSubtasks && subtaskCount > 0) {
        // Show options for handling subtasks
        confirm.require({
          message: `La tarea "${task.title}" tiene ${subtaskCount} subtarea${subtaskCount !== 1 ? 's' : ''}. ¿Qué deseas hacer con ellas?`,
          header: 'Eliminar Tarea con Subtareas',
          icon: 'pi pi-exclamation-triangle',
          acceptClass: 'p-button-danger',
          acceptLabel: 'Eliminar Todo',
          rejectLabel: 'Cancelar',
          accept: () => deleteTask(task, 'delete'),
          reject: () => {},
          // Add custom buttons for promote option
          onShow: (event) => {
            // Add promote button
            const dialog = event.target.closest('.p-confirm-dialog')
            if (dialog) {
              const footer = dialog.querySelector('.p-confirm-dialog-footer')
              if (footer && !footer.querySelector('.promote-button')) {
                const promoteBtn = document.createElement('button')
                promoteBtn.className = 'p-button p-component p-button-secondary promote-button'
                promoteBtn.innerHTML = '<span class="p-button-label">Promover Subtareas</span>'
                promoteBtn.onclick = () => {
                  deleteTask(task, 'promote')
                  // Close dialog
                  const closeBtn = dialog.querySelector('.p-confirm-dialog-reject')
                  if (closeBtn) closeBtn.click()
                }
                footer.insertBefore(promoteBtn, footer.firstChild)
              }
            }
          }
        })
      } else {
        // Simple confirmation for tasks without subtasks
        confirm.require({
          message: `¿Estás seguro de que deseas eliminar la tarea "${task.title}"?`,
          header: 'Confirmar Eliminación',
          icon: 'pi pi-exclamation-triangle',
          acceptClass: 'p-button-danger',
          acceptLabel: 'Eliminar',
          rejectLabel: 'Cancelar',
          accept: () => deleteTask(task, 'delete'),
          reject: () => {}
        })
      }
    }

    const deleteTask = async (task, handleSubtasks = 'delete') => {
      try {
        await store.dispatch('tasks/deleteTask', {
          taskId: task.id,
          handleSubtasks
        })
        
        const message = handleSubtasks === 'promote' 
          ? 'Tarea eliminada y subtareas promovidas correctamente'
          : 'Tarea eliminada correctamente'
          
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: message,
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo eliminar la tarea',
          life: 5000
        })
      }
    }

    const getSubtaskCount = (taskId) => {
      return store.getters['tasks/getSubtasks'](taskId).length
    }

    const toggleSubtasks = (task) => {
      // This would be implemented when we add the task hierarchy display
      console.log('Toggle subtasks for:', task.title)
    }

    const handleMoveTask = async (moveData) => {
      try {
        await store.dispatch('tasks/moveTask', moveData)
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tarea movida correctamente',
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo mover la tarea',
          life: 5000
        })
      }
    }

    const handleTaskStatusUpdate = async ({ task, status }) => {
      try {
        await store.dispatch('tasks/updateTask', {
          ...task,
          status
        })
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado de tarea actualizado',
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo actualizar el estado',
          life: 5000
        })
      }
    }

    const handleTaskAssignmentUpdate = async ({ task, assigneeId }) => {
      try {
        await store.dispatch('tasks/updateTask', {
          ...task,
          assignedTo: assigneeId
        })
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignación de tarea actualizada',
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo actualizar la asignación',
          life: 5000
        })
      }
    }

    const handleBulkStatusChange = async ({ taskIds, status }) => {
      try {
        const updatePromises = taskIds.map(taskId => {
          const task = tasks.value.find(t => t.id === taskId)
          if (task) {
            return store.dispatch('tasks/updateTask', {
              ...task,
              status
            })
          }
        })

        await Promise.all(updatePromises.filter(Boolean))
        
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado actualizado para ${taskIds.length} tarea(s)`,
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo actualizar el estado de las tareas',
          life: 5000
        })
      }
    }

    const handleBulkAssignment = async ({ taskIds, assigneeId }) => {
      try {
        const updatePromises = taskIds.map(taskId => {
          const task = tasks.value.find(t => t.id === taskId)
          if (task) {
            return store.dispatch('tasks/updateTask', {
              ...task,
              assignedTo: assigneeId
            })
          }
        })

        await Promise.all(updatePromises.filter(Boolean))
        
        const assigneeName = assigneeId 
          ? props.teamMembers.find(m => m.id === assigneeId)?.name || 'Miembro desconocido'
          : 'Sin asignar'
        
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `${taskIds.length} tarea(s) asignada(s) a ${assigneeName}`,
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo actualizar la asignación de las tareas',
          life: 5000
        })
      }
    }

    // Lifecycle
    onMounted(() => {
      loadTasks()
    })

    // Watch for project changes
    watch(() => props.projectId, () => {
      if (props.projectId) {
        loadTasks()
      }
    })

    return {
      loading,
      error,
      tasks,
      showModal,
      selectedTask,
      parentTaskId,
      viewMode,
      openCreateModal,
      openEditModal,
      closeModal,
      handleTaskSubmit,
      confirmDeleteTask,
      getSubtaskCount,
      toggleSubtasks,
      handleMoveTask,
      handleTaskStatusUpdate,
      handleTaskAssignmentUpdate,
      handleBulkStatusChange,
      handleBulkAssignment
    }
  }
}
</script>

<style scoped>
.task-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
</style>