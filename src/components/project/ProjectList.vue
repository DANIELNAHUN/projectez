<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Loading state -->
    <LoadingSpinner 
      v-if="isLoading" 
      size="lg" 
      text="Cargando proyectos..." 
      class="py-8 sm:py-12"
    />

    <!-- Error state -->
    <ErrorState
      v-else-if="error"
      :message="error"
      :retry-handler="() => $emit('retry')"
    />

    <!-- Empty state -->
    <ResponsiveCard v-else-if="projects.length === 0">
      <EmptyState
        icon="pi pi-folder-open"
        title="No tienes proyectos aún"
        description="Crea tu primer proyecto para comenzar a organizar tu trabajo"
        action-text="Crear Proyecto"
        action-icon="pi pi-plus"
        :action-handler="() => $emit('create-project')"
      />
    </ResponsiveCard>

    <!-- Projects grid -->
    <div v-else>
      <!-- Grid view toggle (for future enhancement) -->
      <div class="flex justify-between items-center mb-4 sm:mb-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ projects.length }} {{ projects.length === 1 ? 'proyecto' : 'proyectos' }}
        </p>
        
        <!-- View toggle buttons for future enhancement -->
        <div class="hidden sm:flex items-center space-x-2">
          <button
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Vista de cuadrícula"
          >
            <i class="pi pi-th-large"></i>
          </button>
          <button
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Vista de lista"
          >
            <i class="pi pi-list"></i>
          </button>
        </div>
      </div>

      <!-- Projects grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          @edit="$emit('edit-project', $event)"
          @delete="$emit('delete-project', $event)"
          @view="$emit('view-project', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ProjectCard from './ProjectCard.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import ErrorState from '../ui/ErrorState.vue'
import EmptyState from '../ui/EmptyState.vue'
import ResponsiveCard from '../ui/ResponsiveCard.vue'

export default {
  name: 'ProjectList',
  components: {
    ProjectCard,
    LoadingSpinner,
    ErrorState,
    EmptyState,
    ResponsiveCard
  },
  emits: ['create-project', 'edit-project', 'delete-project', 'view-project', 'retry'],
  computed: {
    ...mapGetters('projects', {
      projects: 'allProjects',
      isLoading: 'isLoading',
      error: 'error'
    })
  }
}
</script>