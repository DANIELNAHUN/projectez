import { ref, watch } from 'vue'

// Estado global del tema
const isDarkMode = ref(false)

// Función para alternar el tema
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
}

// Función para establecer el tema
const setTheme = (dark) => {
  isDarkMode.value = dark
}

// Función para aplicar el tema al DOM
const applyTheme = (dark) => {
  const html = document.documentElement
  
  if (dark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
  
  // Guardar preferencia en localStorage
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

// Función para inicializar el tema
const initializeTheme = () => {
  // Siempre iniciar en modo claro, ignorando la preferencia del sistema
  const savedTheme = localStorage.getItem('theme')
  
  // Solo usar el tema guardado si existe, sino usar modo claro
  const shouldUseDark = savedTheme === 'dark'
  
  isDarkMode.value = shouldUseDark
  applyTheme(shouldUseDark)
}

// Watcher para aplicar cambios de tema
watch(isDarkMode, (newValue) => {
  applyTheme(newValue)
}, { immediate: false })

export function useTheme() {
  return {
    isDarkMode,
    toggleTheme,
    setTheme,
    initializeTheme
  }
}