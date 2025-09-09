<template>
  <div>
    <header
      class="shadow-sm dark:shadow-earth-brown/100 border-b px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 bg-earth-light-gray dark:bg-earth-dark-olive border-earth-light-gray dark:border-earth-brown transition-all duration-300">
      <!-- Left side -->
      <div class="flex items-center space-x-4">
        <!-- Mobile menu button -->
        <button @click="$emit('toggle-sidebar')" data-sidebar-toggle
          class="lg:hidden p-2 rounded-lg text-earth-brown dark:text-earth-light-yellow hover:bg-white dark:hover:bg-earth-brown focus:outline-none focus:ring-2 focus:ring-earth-golden transition-all duration-300 hover:scale-105">
          <i class="pi pi-bars text-lg"></i>
        </button>

        <!-- Page title -->
        <div class="flex items-center min-w-0">
          <h1 class="text-lg sm:text-xl font-semibold text-earth-dark-olive dark:text-earth-light-yellow truncate">
            {{ pageTitle }}
          </h1>
          <!-- Breadcrumb for larger screens -->
          <nav v-if="breadcrumbs.length > 0" class="hidden sm:flex ml-4">
            <ol class="flex items-center space-x-2 text-sm text-earth-brown dark:text-earth-light-gray">
              <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
                <i class="pi pi-chevron-right text-xs mr-2" v-if="index > 0"></i>
                <router-link v-if="crumb.path" :to="crumb.path"
                  class="hover:text-earth-dark-olive dark:hover:text-earth-light-yellow transition-colors">
                  {{ crumb.name }}
                </router-link>
                <span v-else>{{ crumb.name }}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Right side actions -->
      <div class="flex items-center space-x-2 sm:space-x-3">
        <!-- Project actions (only show on project pages) -->
        <div v-if="showImportButton" class="flex items-center space-x-2">
          <button @click="handleImportProject"
            class="p-2 rounded-lg text-earth-brown dark:text-earth-light-yellow hover:bg-white dark:hover:bg-earth-brown focus:outline-none focus:ring-2 focus:ring-earth-golden transition-all duration-300 hover:scale-105"
            title="Importar Proyecto (Ctrl+Shift+I)">
            <i class="pi pi-upload text-lg"></i>
          </button>
        </div>

        <div v-if="showExportButton" class="flex items-center space-x-2">
          <button @click="handleExportProject"
            class="p-2 rounded-lg text-earth-brown dark:text-earth-light-yellow hover:bg-white dark:hover:bg-earth-brown focus:outline-none focus:ring-2 focus:ring-earth-golden transition-all duration-300 hover:scale-105"
            title="Exportar Proyecto (Ctrl+Shift+E)">
            <i class="pi pi-download text-lg"></i>
          </button>
        </div>

        <!-- Search (hidden on mobile) -->
        <button
          class="hidden sm:flex p-2 rounded-lg text-earth-brown dark:text-earth-light-yellow hover:bg-white dark:hover:bg-earth-brown focus:outline-none focus:ring-2 focus:ring-earth-golden transition-all duration-300 hover:scale-105"
          title="Buscar">
          <i class="pi pi-search text-lg"></i>
        </button>

        <!-- Theme toggle -->
        <div class="relative">
          <ThemeToggle />
          <!-- Dark mode indicator -->
          <div v-if="isDarkMode" class="absolute -top-1 -right-1 w-2 h-2 bg-earth-golden rounded-full animate-pulse">
          </div>
        </div>

        <!-- Notifications -->
        <div class="relative">
          <button
            class="p-2 rounded-lg text-earth-brown dark:text-earth-light-yellow hover:bg-white dark:hover:bg-earth-brown focus:outline-none focus:ring-2 focus:ring-earth-golden transition-all duration-300 hover:scale-105"
            title="Notificaciones">
            <i class="pi pi-bell text-lg"></i>
            <!-- Notification badge -->
            <span class="absolute -top-1 -right-1 w-3 h-3 bg-earth-golden rounded-full"></span>
          </button>
        </div>

        <!-- Settings dropdown -->
        <div class="relative">
          <button @click="toggleSettingsMenu"
            class="p-2 rounded-lg text-earth-brown dark:text-earth-light-yellow hover:bg-white dark:hover:bg-earth-brown focus:outline-none focus:ring-2 focus:ring-earth-golden transition-all duration-300 hover:scale-105"
            title="Configuración">
            <i class="pi pi-cog text-lg"></i>
          </button>

          <!-- Settings dropdown menu -->
          <div v-if="settingsMenuOpen" v-click-outside="closeSettingsMenu"
            class="absolute right-0 mt-2 w-56 bg-white dark:bg-earth-dark-olive rounded-lg shadow-lg dark:shadow-earth-brown/30 border border-earth-light-gray dark:border-earth-brown py-1 z-50 backdrop-blur-sm">
            <a href="#"
              class="flex items-center px-4 py-2 text-sm text-earth-brown dark:text-earth-light-yellow hover:bg-earth-light-gray dark:hover:bg-earth-brown transition-all duration-200 hover:translate-x-1">
              <i class="pi pi-user mr-3"></i>
              Perfil
            </a>
            <a href="#"
              class="flex items-center px-4 py-2 text-sm text-earth-brown dark:text-earth-light-yellow hover:bg-earth-light-gray dark:hover:bg-earth-brown transition-all duration-200 hover:translate-x-1">
              <i class="pi pi-cog mr-3"></i>
              Configuración
            </a>
            <hr class="my-1 border-earth-light-gray dark:border-earth-brown">
            <button @click="handleShowHelp"
              class="w-full flex items-center px-4 py-2 text-sm text-earth-brown dark:text-earth-light-yellow hover:bg-earth-light-gray dark:hover:bg-earth-brown transition-all duration-200 hover:translate-x-1">
              <i class="pi pi-question-circle mr-3"></i>
              Ayuda
              <span class="ml-auto text-xs text-gray-500">Ctrl+Shift+H</span>
            </button>
            <button @click="handleShowKeyboardShortcuts"
              class="w-full flex items-center px-4 py-2 text-sm text-earth-brown dark:text-earth-light-yellow hover:bg-earth-light-gray dark:hover:bg-earth-brown transition-all duration-200 hover:translate-x-1">
              <i class="pi pi-keyboard mr-3"></i>
              Atajos de Teclado
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Import Modal -->
    <ImportProjectModal v-model:visible="showImportModal" @project-imported="handleProjectImported" />

    <!-- Export Modal -->
    <ExportProjectModal v-model:visible="showExportModal" :project-id="route.params.id"
      @project-exported="handleProjectExported" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '../../composables/useTheme'
import ThemeToggle from '../ui/ThemeToggle.vue'
import ImportProjectModal from '../ui/ImportProjectModal.vue'
import ExportProjectModal from '../ui/ExportProjectModal.vue'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const { isDarkMode, toggleTheme } = useTheme()
const settingsMenuOpen = ref(false)
const showImportModal = ref(false)
const showExportModal = ref(false)

const pageTitle = computed(() => {
  return route.meta.title || 'ProjectEZ'
})

const breadcrumbs = computed(() => {
  const crumbs = []

  // Generate breadcrumbs based on route
  if (route.path.startsWith('/projects/') && route.params.id) {
    crumbs.push({ name: 'Proyectos', path: '/projects' })
    crumbs.push({ name: 'Proyecto', path: null }) // Current page
  }

  return crumbs
})

const showImportButton = computed(() => {
  // Show import button only on projects list page
  return route.path === '/projects'
})

const showExportButton = computed(() => {
  // Show export button only on project detail pages
  return route.path.startsWith('/projects/') && route.params.id
})

const toggleSettingsMenu = () => {
  settingsMenuOpen.value = !settingsMenuOpen.value
}

const closeSettingsMenu = () => {
  settingsMenuOpen.value = false
}

const handleImportProject = () => {
  showImportModal.value = true
}

const handleExportProject = () => {
  showExportModal.value = true
}

const handleShowHelp = () => {
  window.dispatchEvent(new CustomEvent('show-help'))
  closeSettingsMenu()
}

const handleShowKeyboardShortcuts = () => {
  window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'))
  closeSettingsMenu()
}

const handleProjectImported = (data) => {
  // Emit event to notify parent components
  window.dispatchEvent(new CustomEvent('project-imported', { detail: data }))
}

const handleProjectExported = (data) => {
  // Emit event to notify parent components
  window.dispatchEvent(new CustomEvent('project-exported', { detail: data }))
}

// Click outside directive implementation
const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function (event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

onMounted(() => {
  // Close settings menu on escape key
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      settingsMenuOpen.value = false
    }
  }
  document.addEventListener('keydown', handleEscape)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>