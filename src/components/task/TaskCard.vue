<template>
  <div 
    class="task-card border rounded-lg p-4 hover:shadow-md transition-shadow"
    :class="cardClasses"
  >
    <!-- Task Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 mb-1">{{ task.title }}</h3>
        <p v-if="task.description" class="text-sm text-gray-600 line-clamp-2">
          {{ task.description }}
        </p>
      </div>
      
      <!-- Task Actions -->
      <div class="flex items-center gap-2 ml-4">
        <Button
          icon="pi pi-pencil"
          size="small"
          severity="secondary"
          text
          @click="$emit('edit', task)"
          title="Editar tarea"
        />
        <Button
          icon="pi pi-trash"
          size="small"
          severity="danger"
          text
          @click="$emit('delete', task)"
          title="Eliminar tarea"
        />
      </div>
    </div>

    <!-- Task Metadata -->
    <div class="space-y-2 mb-3">
      <!-- Status and Priority -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <Tag 
            :value="getStatusLabel(task.status)" 
            :severity="getStatusSeverity(task.status)"
            class="text-xs"
          />
          <Tag 
            :value="getPriorityLabel(task.priority)" 
            :severity="getPrioritySeverity(task.priority)"
            class="text-xs"
          />
        </div>
        
        <!-- Task Type -->
        <div class="flex items-center gap-1 text-xs text-gray-500">
          <i :class="task.type === 'with_deliverable' ? 'pi pi-file' : 'pi pi-check-circle'"></i>
          <span>{{ task.type === 'with_deliverable' ? 'Con entregable' : 'Simple' }}</span>
        </div>
      </div>

      <!-- Dates -->
      <div class="flex items-center gap-4 text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <i class="pi pi-calendar"></i>
          <span>{{ formatDate(task.startDate) }} - {{ formatDate(task.endDate) }}</span>
        </div>
        
        <!-- Days remaining/overdue -->
        <div class="flex items-center gap-1" :class="getDaysRemainingClass()">
          <i class="pi pi-clock"></i>
          <span>{{ getDaysRemainingText() }}</span>
        </div>
      </div>

      <!-- Assigned Member -->
      <div v-if="assignedMember" class="flex items-center gap-2 text-xs text-gray-600">
        <i class="pi pi-user"></i>
        <span>{{ assignedMember.name }} ({{ assignedMember.role }})</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mb-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-gray-600">Progreso</span>
        <span class="text-xs font-medium">{{ task.progress }}%</span>
      </div>
      <ProgressBar 
        :value="task.progress" 
        :showValue="false"
        class="h-2"
        :class="getProgressBarClass()"
      />
    </div>

    <!-- Deliverable Info (if applicable) -->
    <div v-if="task.type === 'with_deliverable' && task.deliverable" class="deliverable-info bg-gray-50 rounded p-3 mb-3">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-medium text-gray-700">Entregable</h4>
        <Tag 
          :value="getDeliverableStatusLabel(task.deliverable.status)" 
          :severity="getDeliverableStatusSeverity(task.deliverable.status)"
          class="text-xs"
        />
      </div>
      
      <div class="space-y-1 text-xs text-gray-600">
        <div class="flex items-center gap-2">
          <span class="font-medium">Tipo:</span>
          <span>{{ getDeliverableTypeLabel(task.deliverable.type) }}</span>
        </div>
        
        <div v-if="task.deliverable.dueDate" class="flex items-center gap-2">
          <span class="font-medium">Entrega:</span>
          <span>{{ formatDate(task.deliverable.dueDate) }}</span>
        </div>
        
        <div v-if="task.deliverable.description" class="flex items-start gap-2">
          <span class="font-medium">Descripción:</span>
          <span class="line-clamp-2">{{ task.deliverable.description }}</span>
        </div>
      </div>
    </div>

    <!-- Subtasks indicator -->
    <div v-if="hasSubtasks" class="flex items-center gap-2 text-xs text-gray-500">
      <i class="pi pi-sitemap"></i>
      <span>{{ subtaskCount }} subtarea{{ subtaskCount !== 1 ? 's' : '' }}</span>
      <Button
        :label="showSubtasks ? 'Ocultar' : 'Mostrar'"
        size="small"
        text
        class="text-xs p-0 h-auto"
        @click="$emit('toggle-subtasks', task)"
      />
    </div>

    <!-- Task Level Indicator (for nested tasks) -->
    <div v-if="task.level > 0" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg"></div>
  </div>
</template>

<script>
import { computed } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'

export default {
  name: 'TaskCard',
  components: {
    Button,
    Tag,
    ProgressBar
  },
  props: {
    task: {
      type: Object,
      required: true
    },
    teamMembers: {
      type: Array,
      default: () => []
    },
    subtaskCount: {
      type: Number,
      default: 0
    },
    showSubtasks: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'delete', 'toggle-subtasks'],
  setup(props) {
    const assignedMember = computed(() => {
      if (!props.task.assignedTo) return null
      return props.teamMembers.find(member => member.id === props.task.assignedTo)
    })

    const hasSubtasks = computed(() => props.subtaskCount > 0)

    const cardClasses = computed(() => {
      const classes = ['relative']
      
      // Status-based styling
      switch (props.task.status) {
        case 'completed':
          classes.push('border-green-200', 'bg-green-50')
          break
        case 'in_progress':
          classes.push('border-blue-200', 'bg-blue-50')
          break
        case 'cancelled':
          classes.push('border-red-200', 'bg-red-50')
          break
        default:
          classes.push('border-gray-200', 'bg-white')
      }

      // Priority-based border
      if (props.task.priority === 'high') {
        classes.push('border-l-4', 'border-l-red-500')
      } else if (props.task.priority === 'medium') {
        classes.push('border-l-4', 'border-l-yellow-500')
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

    const getDaysRemainingText = () => {
      const now = new Date()
      const endDate = new Date(props.task.endDate)
      const diffTime = endDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (props.task.status === 'completed') {
        return 'Completada'
      } else if (props.task.status === 'cancelled') {
        return 'Cancelada'
      } else if (diffDays < 0) {
        return `${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''} atrasada`
      } else if (diffDays === 0) {
        return 'Vence hoy'
      } else if (diffDays === 1) {
        return 'Vence mañana'
      } else {
        return `${diffDays} días restantes`
      }
    }

    const getDaysRemainingClass = () => {
      if (props.task.status === 'completed') {
        return 'text-green-600'
      } else if (props.task.status === 'cancelled') {
        return 'text-gray-500'
      } else if (isOverdue.value) {
        return 'text-red-600'
      } else {
        const now = new Date()
        const endDate = new Date(props.task.endDate)
        const diffTime = endDate - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 1) {
          return 'text-orange-600'
        } else if (diffDays <= 3) {
          return 'text-yellow-600'
        } else {
          return 'text-gray-500'
        }
      }
    }

    const getProgressBarClass = () => {
      if (props.task.progress >= 100) {
        return 'progress-complete'
      } else if (props.task.progress >= 75) {
        return 'progress-high'
      } else if (props.task.progress >= 50) {
        return 'progress-medium'
      } else if (props.task.progress >= 25) {
        return 'progress-low'
      } else {
        return 'progress-none'
      }
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
      assignedMember,
      hasSubtasks,
      cardClasses,
      isOverdue,
      getDaysRemainingText,
      getDaysRemainingClass,
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
.task-card {
  position: relative;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.deliverable-info {
  border-left: 3px solid #6b7280;
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