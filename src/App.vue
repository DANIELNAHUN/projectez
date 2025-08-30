<script setup>
import { onMounted, ref } from 'vue'
import AppLayout from './components/common/AppLayout.vue'
import ErrorBoundary from './components/common/ErrorBoundary.vue'
import StorageErrorHandler from './components/common/StorageErrorHandler.vue'
import HelpModal from './components/ui/HelpModal.vue'
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal.vue'
import { useErrorHandler } from './composables/useErrorHandler.js'
import { useStorageError } from './composables/useStorageError.js'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts.js'

const { handleError } = useErrorHandler()
const { checkStorageHealth } = useStorageError()

// Initialize keyboard shortcuts
useKeyboardShortcuts()

// Modal states
const showHelpModal = ref(false)
const showKeyboardShortcutsModal = ref(false)

// Initialize error handling and storage checks
onMounted(async () => {
  try {
    // Check storage health on app startup
    await checkStorageHealth()
    
    // Setup global error listeners
    setupGlobalErrorHandling()
    
    // Setup global event listeners for modals
    setupGlobalEventListeners()
  } catch (error) {
    handleError(error, 'App initialization')
  }
})

const setupGlobalErrorHandling = () => {
  // Handle storage events
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith('pm_')) {
      console.log('Storage changed externally:', event.key)
      // Could trigger a refresh or sync
    }
  })
  
  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('Connection restored')
  })
  
  window.addEventListener('offline', () => {
    console.log('Connection lost')
  })
}

const setupGlobalEventListeners = () => {
  // Listen for help modal events
  window.addEventListener('show-help', () => {
    showHelpModal.value = true
  })
  
  // Listen for keyboard shortcuts modal events
  window.addEventListener('show-keyboard-shortcuts', () => {
    showKeyboardShortcutsModal.value = true
  })
}
</script>

<template>
  <ErrorBoundary>
    <StorageErrorHandler />
    <AppLayout />
    
    <!-- Global Modals -->
    <HelpModal 
      :visible="showHelpModal" 
      @close="showHelpModal = false" 
    />
    
    <KeyboardShortcutsModal 
      :visible="showKeyboardShortcutsModal" 
      @close="showKeyboardShortcutsModal = false" 
    />
  </ErrorBoundary>
</template>
