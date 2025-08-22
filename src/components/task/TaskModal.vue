<template>
  <Dialog
    v-model:visible="isVisible"
    :header="modalTitle"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="task-modal"
    :style="{ width: '90vw', maxWidth: '900px' }"
    @hide="handleClose"
  >
    <TaskForm
      :task="task"
      :project-id="projectId"
      :parent-task-id="parentTaskId"
      :team-members="teamMembers"
      @submit="handleSubmit"
      @cancel="handleClose"
    />
  </Dialog>
</template>

<script>
import { computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import TaskForm from './TaskForm.vue'

export default {
  name: 'TaskModal',
  components: {
    Dialog,
    TaskForm
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    task: {
      type: Object,
      default: null
    },
    projectId: {
      type: String,
      required: true
    },
    parentTaskId: {
      type: String,
      default: null
    },
    teamMembers: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'submit', 'close'],
  setup(props, { emit }) {
    const isVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value)
    })

    const modalTitle = computed(() => {
      if (props.task) {
        return 'Editar Tarea'
      } else if (props.parentTaskId) {
        return 'Crear Subtarea'
      } else {
        return 'Crear Nueva Tarea'
      }
    })

    const handleSubmit = (taskData) => {
      emit('submit', taskData)
    }

    const handleClose = () => {
      emit('close')
      isVisible.value = false
    }

    return {
      isVisible,
      modalTitle,
      handleSubmit,
      handleClose
    }
  }
}
</script>

<style scoped>
.task-modal :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.task-modal :deep(.p-dialog-header) {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}
</style>