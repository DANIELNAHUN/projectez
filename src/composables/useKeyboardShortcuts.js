import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composable for managing keyboard shortcuts throughout the application
 */
export function useKeyboardShortcuts() {
  const router = useRouter()
  
  const shortcuts = {
    // Navigation shortcuts
    'ctrl+1': () => router.push('/dashboard'),
    'ctrl+2': () => router.push('/projects'),
    'ctrl+3': () => router.push('/calendar'),
    'ctrl+4': () => router.push('/gantt'),
    'ctrl+5': () => router.push('/users'),
    
    // AI and project shortcuts
    'ctrl+shift+a': () => {
      // Trigger AI chatbot - will emit event for components to listen
      window.dispatchEvent(new CustomEvent('open-ai-chatbot'))
    },
    'ctrl+shift+n': () => {
      // Trigger new project - will emit event for components to listen
      window.dispatchEvent(new CustomEvent('create-new-project'))
    },
    'ctrl+shift+i': () => {
      // Trigger import project - will emit event for components to listen
      window.dispatchEvent(new CustomEvent('import-project'))
    },
    'ctrl+shift+e': () => {
      // Trigger export project - will emit event for components to listen
      window.dispatchEvent(new CustomEvent('export-project'))
    },
    
    // Help shortcut
    'ctrl+shift+h': () => {
      window.dispatchEvent(new CustomEvent('show-help'))
    }
  }
  
  const handleKeyDown = (event) => {
    // Skip if user is typing in an input field
    const activeElement = document.activeElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )) {
      return
    }
    
    // Build shortcut key combination
    const keys = []
    if (event.ctrlKey || event.metaKey) keys.push('ctrl') // Support both Ctrl and Cmd
    if (event.shiftKey) keys.push('shift')
    if (event.altKey) keys.push('alt')
    
    // Add the actual key (convert to lowercase)
    const key = event.key.toLowerCase()
    if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
      keys.push(key)
    }
    
    const shortcut = keys.join('+')
    
    // Execute shortcut if it exists
    if (shortcuts[shortcut]) {
      event.preventDefault()
      shortcuts[shortcut]()
    }
  }
  
  const registerShortcut = (key, callback) => {
    shortcuts[key] = callback
  }
  
  const unregisterShortcut = (key) => {
    delete shortcuts[key]
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
  
  return {
    registerShortcut,
    unregisterShortcut,
    get shortcuts() {
      return Object.keys(shortcuts)
    }
  }
}