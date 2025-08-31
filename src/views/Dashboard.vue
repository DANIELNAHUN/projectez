<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Header -->
    <div class="mb-6 sm:mb-8">
      <h2 class="text-2xl sm:text-3xl font-bold mb-2" :style="{ color: isDarkMode ? '#f9fafb' : '#111827' }">
        Dashboard
      </h2>
      <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        Resumen general de tus proyectos y tareas
      </p>
    </div>

    <!-- Loading State -->
    <LoadingSpinner 
      v-if="isLoading" 
      size="lg" 
      text="Cargando dashboard..." 
      class="py-12"
    />

    <!-- Error State -->
    <ErrorState
      v-else-if="error"
      :message="error"
      :retry-handler="loadDashboardData"
      class="mb-8"
    />

    <!-- Dashboard Content -->
    <div v-else class="space-y-6 sm:space-y-8">
      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ResponsiveCard
          v-for="stat in stats"
          :key="stat.key"
          size="sm"
          hoverable
          class="transition-all duration-200"
        >
          <div class="flex items-center">
            <div :class="['p-2 sm:p-3 rounded-lg', stat.iconBg]">
              <i :class="[stat.icon, stat.iconColor, 'text-lg sm:text-xl']"></i>
            </div>
            <div class="ml-3 sm:ml-4 min-w-0 flex-1">
              <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                {{ stat.label }}
              </p>
              <p class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {{ stat.value }}
              </p>
            </div>
          </div>
        </ResponsiveCard>
      </div>

      <!-- Store Test Component (temporary for testing) -->
      <ResponsiveCard 
        v-if="showStoreTest"
        title="Store Test (Development)"
        class="mb-6 sm:mb-8"
      >
        <StoreTest />
      </ResponsiveCard>

      <!-- Recent activity -->
      <ResponsiveCard title="Actividad Reciente">
        <EmptyState
          icon="pi pi-inbox"
          title="No hay actividad reciente"
          description="Crea tu primer proyecto para comenzar a ver la actividad"
          action-text="Crear Proyecto"
          action-icon="pi pi-plus"
          :action-handler="() => $router.push('/projects')"
          variant="compact"
        />
      </ResponsiveCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useTheme } from '../composables/useTheme'
import StoreTest from '../components/StoreTest.vue'
import LoadingSpinner from '../components/ui/LoadingSpinner.vue'
import ErrorState from '../components/ui/ErrorState.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import ResponsiveCard from '../components/ui/ResponsiveCard.vue'

const store = useStore()
const { isDarkMode } = useTheme()
const isLoading = ref(false)
const error = ref(null)
const showStoreTest = ref(import.meta.env.VITE_APP_ENVIROMENT === "DEV")

// Computed stats
const stats = computed(() => [
  {
    key: 'active-projects',
    label: 'Proyectos Activos',
    value: activeProjectsCount.value,
    icon: 'pi pi-folder',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30'
  },
  {
    key: 'completed-tasks',
    label: 'Tareas Completadas',
    value: completedTasksCount.value,
    icon: 'pi pi-check-circle',
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30'
  },
  {
    key: 'pending-tasks',
    label: 'Tareas Pendientes',
    value: pendingTasksCount.value,
    icon: 'pi pi-clock',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  {
    key: 'team-members',
    label: 'Miembros del Equipo',
    value: teamMembersCount.value,
    icon: 'pi pi-users',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30'
  }
])

const activeProjectsCount = computed(() => {
  const projects = store.getters['projects/allProjects'] || []
  return projects.filter(p => p.status === 'active').length
})

const completedTasksCount = computed(() => {
  const tasks = store.getters['tasks/allTasks'] || []
  return tasks.filter(t => t.status === 'completed').length
})

const pendingTasksCount = computed(() => {
  const tasks = store.getters['tasks/allTasks'] || []
  return tasks.filter(t => t.status === 'pending').length
})

const teamMembersCount = computed(() => {
  const projects = store.getters['projects/allProjects'] || []
  const allMembers = projects.flatMap(p => p.teamMembers || [])
  const uniqueMembers = new Set(allMembers.map(m => m.id))
  return uniqueMembers.size
})

const loadDashboardData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Load projects and tasks data
    await Promise.all([
      store.dispatch('projects/loadProjects'),
      store.dispatch('tasks/loadTasks')
    ])
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    error.value = 'Error al cargar los datos del dashboard. Por favor, intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>