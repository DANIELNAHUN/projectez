<template>
  <ResponsiveCard 
    hoverable
    class="group"
  >
    <template #header>
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
          {{ project.name }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {{ project.description || 'Sin descripción' }}
        </p>
      </div>
    </template>

    <template #actions>
      <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          @click.stop="$emit('edit', project)"
          class="p-2 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Editar proyecto"
        >
          <i class="pi pi-pencil text-sm"></i>
        </button>
        <button
          @click.stop="$emit('delete', project)"
          class="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Eliminar proyecto"
        >
          <i class="pi pi-trash text-sm"></i>
        </button>
      </div>
    </template>

    <!-- Project status -->
    <div class="flex items-center justify-between mb-4">
      <span 
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="statusClasses"
      >
        <span class="w-2 h-2 rounded-full mr-1.5" :class="statusDotClasses"></span>
        {{ statusText }}
      </span>
      
      <!-- Progress indicator (if applicable) -->
      <div v-if="progressPercentage !== null" class="text-xs text-gray-500 dark:text-gray-400">
        {{ progressPercentage }}% completado
      </div>
    </div>

    <!-- Project stats -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ project.tasks?.length || 0 }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ (project.tasks?.length || 0) === 1 ? 'Tarea' : 'Tareas' }}
        </div>
      </div>
      <div class="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ project.teamMembers?.length || 0 }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ (project.teamMembers?.length || 0) === 1 ? 'Miembro' : 'Miembros' }}
        </div>
      </div>
    </div>

    <!-- Project dates -->
    <div class="space-y-2 mb-4">
      <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <i class="pi pi-calendar mr-2 text-xs"></i>
        <span class="truncate">Inicio: {{ formatDate(project.startDate) }}</span>
      </div>
      <div v-if="project.endDate" class="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <i class="pi pi-calendar-times mr-2 text-xs"></i>
        <span class="truncate">Fin: {{ formatDate(project.endDate) }}</span>
      </div>
      <div v-if="daysRemaining !== null" class="flex items-center text-sm">
        <i class="pi pi-clock mr-2 text-xs"></i>
        <span :class="daysRemainingClasses">
          {{ daysRemainingText }}
        </span>
      </div>
    </div>

    <template #footer>
      <button
        @click="$emit('view', project)"
        class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg transition-colors duration-200 font-medium text-sm"
      >
        Ver Proyecto
      </button>
    </template>
  </ResponsiveCard>
</template>

<script>
import ResponsiveCard from '../ui/ResponsiveCard.vue'

export default {
  name: 'ProjectCard',
  components: {
    ResponsiveCard
  },
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  emits: ['edit', 'delete', 'view'],
  computed: {
    statusClasses() {
      const classes = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      }
      return classes[this.project.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    },
    statusDotClasses() {
      const classes = {
        active: 'bg-green-400',
        completed: 'bg-blue-400',
        paused: 'bg-yellow-400'
      }
      return classes[this.project.status] || 'bg-gray-400'
    },
    statusText() {
      const texts = {
        active: 'Activo',
        completed: 'Completado',
        paused: 'Pausado'
      }
      return texts[this.project.status] || 'Desconocido'
    },
    progressPercentage() {
      const tasks = this.project.tasks || []
      if (tasks.length === 0) return null
      
      const completedTasks = tasks.filter(task => task.status === 'completed').length
      return Math.round((completedTasks / tasks.length) * 100)
    },
    daysRemaining() {
      if (!this.project.endDate || this.project.status === 'completed') return null
      
      const today = new Date()
      const endDate = new Date(this.project.endDate)
      const diffTime = endDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    },
    daysRemainingText() {
      if (this.daysRemaining === null) return ''
      
      if (this.daysRemaining < 0) {
        const overdue = Math.abs(this.daysRemaining)
        return `${overdue} ${overdue === 1 ? 'día' : 'días'} de retraso`
      } else if (this.daysRemaining === 0) {
        return 'Vence hoy'
      } else if (this.daysRemaining === 1) {
        return 'Vence mañana'
      } else {
        return `${this.daysRemaining} días restantes`
      }
    },
    daysRemainingClasses() {
      if (this.daysRemaining === null) return ''
      
      if (this.daysRemaining < 0) {
        return 'text-red-600 dark:text-red-400 font-medium'
      } else if (this.daysRemaining <= 3) {
        return 'text-yellow-600 dark:text-yellow-400 font-medium'
      } else {
        return 'text-gray-500 dark:text-gray-400'
      }
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return 'No definida'
      const d = new Date(date)
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>