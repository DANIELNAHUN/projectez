import { ref, createApp } from 'vue'
import Toast from '../components/ui/Toast.vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  const show = (options) => {
    const id = ++toastId
    
    const defaultOptions = {
      type: 'info',
      position: 'top-right',
      duration: 5000,
      persistent: false,
      showProgress: true,
      actions: null,
      icon: null,
      closable: true
    }
    
    const toastOptions = { ...defaultOptions, ...options, id }
    
    // Create toast component
    const toastContainer = document.createElement('div')
    document.body.appendChild(toastContainer)
    
    const toastApp = createApp(Toast, {
      ...toastOptions,
      onClose: () => {
        // Remove from toasts array
        const index = toasts.value.findIndex(t => t.id === id)
        if (index > -1) {
          toasts.value.splice(index, 1)
        }
        
        // Cleanup DOM
        toastApp.unmount()
        document.body.removeChild(toastContainer)
      },
      onAction: () => {
        if (toastOptions.onAction) {
          toastOptions.onAction()
        }
      }
    })
    
    const toastInstance = toastApp.mount(toastContainer)
    
    // Add to toasts array
    toasts.value.push({
      id,
      instance: toastInstance,
      app: toastApp,
      container: toastContainer,
      options: toastOptions
    })
    
    return id
  }
  
  const success = (title, message, options = {}) => {
    return show({
      type: 'success',
      title,
      message,
      ...options
    })
  }
  
  const error = (title, message, options = {}) => {
    return show({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer duration for errors
      showProgress: true,
      ...options
    })
  }
  
  const warning = (title, message, options = {}) => {
    return show({
      type: 'warning',
      title,
      message,
      ...options
    })
  }
  
  const info = (title, message, options = {}) => {
    return show({
      type: 'info',
      title,
      message,
      ...options
    })
  }
  
  const close = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast && toast.instance) {
      toast.instance.close()
    }
  }
  
  const closeAll = () => {
    toasts.value.forEach(toast => {
      if (toast.instance) {
        toast.instance.close()
      }
    })
  }
  
  return {
    show,
    success,
    error,
    warning,
    info,
    close,
    closeAll,
    toasts: toasts.value
  }
}