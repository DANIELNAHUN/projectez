<template>
  <!-- Overlay for mobile -->
  <div v-if="isOpen && isMobile" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" @click="$emit('close')">
  </div>

  <!-- Sidebar -->
  <aside :class="[
    'fixed inset-y-0 left-0 z-50 bg-gray-900 dark:bg-gray-950 transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col',
    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    isCollapsed ? 'w-16' : 'w-64'
  ]">
    <!-- Logo/Brand -->
    <div class="flex items-center justify-between h-16 px-4 bg-gray-800 dark:bg-gray-900">
      <div class="flex items-center min-w-0">
        <i class="pi pi-briefcase text-blue-400 text-2xl flex-shrink-0" :class="isCollapsed ? '' : 'mr-3'"></i>
        <span v-show="!isCollapsed" class="text-white text-xl font-bold truncate">ProjectEZ</span>
      </div>
      <div class="flex items-center space-x-2">
        <!-- Toggle collapse button -->
        <button @click="toggleCollapse"
          class="hidden lg:block p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors duration-200"
          :title="isCollapsed ? 'Expandir sidebar' : 'Minimizar sidebar'">
          <i :class="isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"></i>
        </button>
        <!-- Close button for mobile -->
        <button @click="$emit('close')"
          class="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors duration-200">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="mt-8 px-4 flex-1 overflow-y-auto">
      <ul class="space-y-2">
        <li v-for="item in navigationItems" :key="item.name" class="relative group">
          <router-link :to="item.path" :class="[
            'flex items-center text-sm font-medium rounded-lg transition-all duration-200 relative',
            isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
            $route.path === item.path
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white hover:translate-x-1'
          ]" @click="$emit('navigate')">
            <i :class="[item.icon, 'text-lg flex-shrink-0', isCollapsed ? '' : 'mr-3']"></i>
            <span v-show="!isCollapsed" class="truncate">{{ item.label }}</span>

            <!-- Tooltip for collapsed state -->
            <div v-if="isCollapsed"
              class="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              {{ item.label }}
            </div>
          </router-link>
        </li>
      </ul>

      <!-- Projects section -->
      <div v-show="!isCollapsed" class="mt-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Proyectos Recientes
          </h3>
          <button @click="toggleProjectsSection"
            class="p-1 rounded text-gray-400 hover:text-gray-300 transition-colors">
            <i
              :class="['pi text-xs transition-transform duration-200', projectsSectionOpen ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
          </button>
        </div>

        <div v-show="projectsSectionOpen" class="space-y-1 transition-all duration-200">
          <div v-if="recentProjects.length === 0" class="px-4 py-2 text-xs text-gray-500">
            No hay proyectos recientes
          </div>
          <router-link v-for="project in recentProjects" :key="project.id" :to="`/projects/${project.id}`"
            class="flex items-center px-4 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white transition-all duration-200 hover:translate-x-1 group"
            @click="$emit('navigate')">
            <div
              class="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0 group-hover:scale-110 transition-transform">
            </div>
            <span class="truncate">{{ project.name }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div v-show="!isCollapsed" class="p-4 border-t border-gray-800 dark:border-gray-900">
      <div class="text-xs text-gray-500 text-center">
        ProjectEZ v1.0
      </div>
    </div>
  </aside>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits(['close', 'navigate', 'collapse-change'])

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const isMobile = ref(false)
const projectsSectionOpen = ref(true)
const isCollapsed = ref(false)

const navigationItems = [
  {
    name: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'pi pi-home'
  },
  {
    name: 'projects',
    path: '/projects',
    label: 'Proyectos',
    icon: 'pi pi-folder'
  },
  {
    name: 'users',
    path: '/users',
    label: 'Gestión de Usuarios',
    icon: 'pi pi-users'
  },
  {
    name: 'calendar',
    path: '/calendar',
    label: 'Calendario',
    icon: 'pi pi-calendar'
  },
  {
    name: 'gantt',
    path: '/gantt',
    label: 'Diagrama de Gantt',
    icon: 'pi pi-chart-bar'
  }
]

// Mock recent projects - will be replaced with store data in later tasks
const recentProjects = ref([
  { id: '1', name: 'Proyecto Demo 1' },
  { id: '2', name: 'Proyecto Demo 2' }
])

const toggleProjectsSection = () => {
  projectsSectionOpen.value = !projectsSectionOpen.value
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('collapse-change', isCollapsed.value)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>