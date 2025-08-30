<template>
  <ResponsiveModal
    :visible="visible"
    title="Atajos de Teclado"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Navigation Shortcuts -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <i class="pi pi-compass mr-2 text-blue-600"></i>
          Navegación
        </h3>
        <div class="space-y-2">
          <div v-for="shortcut in navigationShortcuts" :key="shortcut.key" 
               class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center">
              <i :class="[shortcut.icon, 'mr-3 text-gray-600 dark:text-gray-400']"></i>
              <span class="text-gray-900 dark:text-gray-100">{{ shortcut.description }}</span>
            </div>
            <kbd class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">
              {{ shortcut.key }}
            </kbd>
          </div>
        </div>
      </section>

      <!-- Action Shortcuts -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <i class="pi pi-bolt mr-2 text-yellow-600"></i>
          Acciones
        </h3>
        <div class="space-y-2">
          <div v-for="shortcut in actionShortcuts" :key="shortcut.key" 
               class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center">
              <i :class="[shortcut.icon, 'mr-3', shortcut.color]"></i>
              <span class="text-gray-900 dark:text-gray-100">{{ shortcut.description }}</span>
            </div>
            <kbd class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">
              {{ shortcut.key }}
            </kbd>
          </div>
        </div>
      </section>

      <!-- Help -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <i class="pi pi-question-circle mr-2 text-green-600"></i>
          Ayuda
        </h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center">
              <i class="pi pi-question-circle mr-3 text-gray-600 dark:text-gray-400"></i>
              <span class="text-gray-900 dark:text-gray-100">Mostrar Ayuda</span>
            </div>
            <kbd class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">
              Ctrl+Shift+H
            </kbd>
          </div>
        </div>
      </section>

      <!-- Tips -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-start">
          <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0"></i>
          <div class="text-sm">
            <p class="text-blue-800 dark:text-blue-200 font-medium mb-1">Consejo</p>
            <p class="text-blue-700 dark:text-blue-300">
              Los atajos de teclado funcionan en toda la aplicación. Mantén presionadas las teclas modificadoras (Ctrl, Shift) y luego presiona la tecla correspondiente.
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Cerrar
        </button>
      </div>
    </template>
  </ResponsiveModal>
</template>

<script setup>
import ResponsiveModal from './ResponsiveModal.vue'

defineEmits(['close'])

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const navigationShortcuts = [
  {
    key: 'Ctrl+1',
    description: 'Ir a Dashboard',
    icon: 'pi pi-home'
  },
  {
    key: 'Ctrl+2',
    description: 'Ir a Proyectos',
    icon: 'pi pi-folder'
  },
  {
    key: 'Ctrl+3',
    description: 'Ir a Calendario',
    icon: 'pi pi-calendar'
  },
  {
    key: 'Ctrl+4',
    description: 'Ir a Diagrama de Gantt',
    icon: 'pi pi-chart-bar'
  },
  {
    key: 'Ctrl+5',
    description: 'Ir a Gestión de Usuarios',
    icon: 'pi pi-users'
  }
]

const actionShortcuts = [
  {
    key: 'Ctrl+Shift+A',
    description: 'Abrir Chatbot IA',
    icon: 'pi pi-sparkles',
    color: 'text-purple-600'
  },
  {
    key: 'Ctrl+Shift+N',
    description: 'Crear Nuevo Proyecto',
    icon: 'pi pi-plus',
    color: 'text-blue-600'
  },
  {
    key: 'Ctrl+Shift+I',
    description: 'Importar Proyecto',
    icon: 'pi pi-upload',
    color: 'text-green-600'
  },
  {
    key: 'Ctrl+Shift+E',
    description: 'Exportar Proyecto',
    icon: 'pi pi-download',
    color: 'text-orange-600'
  }
]
</script>