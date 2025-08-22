<template>
  <div class="min-h-screen" :style="{ backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }">
    <!-- Storage Error Handler -->
    <StorageErrorHandler />

    <!-- Sidebar -->
    <Sidebar :is-open="sidebarOpen" @close="sidebarOpen = false" @navigate="sidebarOpen = false"
      @collapse-change="handleSidebarCollapse" />

    <!-- Main content area -->
    <div :class="[
      'min-h-screen flex flex-col transition-all duration-300 ease-in-out',
      sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
    ]">
      <!-- Header -->
      <Header @toggle-sidebar="toggleSidebar" />

      <!-- Page content -->
      <main class="flex-1 py-4 sm:py-6">
        <div class="mx-auto px-4 sm:px-6 lg:px-8">
          <div class="animate-fade-in">
            <router-view />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../../composables/useTheme'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
import StorageErrorHandler from './StorageErrorHandler.vue'

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const { isDarkMode } = useTheme()

// Debug function
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  console.log('Sidebar toggled:', sidebarOpen.value)
}

// Handle sidebar collapse state
const handleSidebarCollapse = (collapsed) => {
  sidebarCollapsed.value = collapsed
}

// Close sidebar when clicking outside on mobile
const handleClickOutside = (event) => {
  if (window.innerWidth >= 1024) return // Only on mobile

  const sidebar = document.querySelector('aside')
  const toggleButton = document.querySelector('[data-sidebar-toggle]')

  if (sidebar && !sidebar.contains(event.target) && !toggleButton?.contains(event.target)) {
    sidebarOpen.value = false
  }
}

// Close sidebar on escape key
const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>