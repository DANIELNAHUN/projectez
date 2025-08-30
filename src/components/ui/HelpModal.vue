<template>
  <ResponsiveModal
    :visible="visible"
    title="Ayuda - ProjectEZ"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Quick Start Guide -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <i class="pi pi-play-circle mr-2 text-blue-600"></i>
          Guía de Inicio Rápido
        </h3>
        <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-start">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Crear un Proyecto</p>
              <p>Ve a la página de Proyectos y haz clic en "Nuevo Proyecto" o usa Ctrl+Shift+N</p>
            </div>
          </div>
          <div class="flex items-start">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Generar con IA</p>
              <p>Usa el Chatbot IA para generar proyectos automáticamente desde una descripción</p>
            </div>
          </div>
          <div class="flex items-start">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Gestionar Tareas</p>
              <p>Agrega tareas con fechas inteligentes que calculan automáticamente la duración</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Overview -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <i class="pi pi-star mr-2 text-yellow-600"></i>
          Características Principales
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <i class="pi pi-sparkles mr-2 text-purple-600 flex-shrink-0"></i>
              <span class="truncate">Generación con IA</span>
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Crea proyectos completos usando inteligencia artificial desde una simple descripción.
            </p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <i class="pi pi-calendar mr-2 text-green-600 flex-shrink-0"></i>
              <span class="truncate">Fechas Inteligentes</span>
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Cálculo automático de duración y fechas de tareas con días laborales.
            </p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <i class="pi pi-download mr-2 text-blue-600 flex-shrink-0"></i>
              <span class="truncate">Importar/Exportar</span>
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Exporta e importa proyectos en formato JSON para respaldos y colaboración.
            </p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <i class="pi pi-refresh mr-2 text-orange-600 flex-shrink-0"></i>
              <span class="truncate">Ajuste de Fechas</span>
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Ajusta fechas de proyecto y todas las tareas se actualizan automáticamente.
            </p>
          </div>
        </div>
      </section>

      <!-- Keyboard Shortcuts -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <i class="pi pi-keyboard mr-2 text-indigo-600"></i>
          Atajos de Teclado
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded gap-2">
            <span class="text-gray-900 dark:text-gray-100">Navegación - Dashboard</span>
            <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs self-start sm:self-center">Ctrl+1</kbd>
          </div>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded gap-2">
            <span class="text-gray-900 dark:text-gray-100">Navegación - Proyectos</span>
            <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs self-start sm:self-center">Ctrl+2</kbd>
          </div>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded gap-2">
            <span class="text-gray-900 dark:text-gray-100">Chatbot IA</span>
            <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs self-start sm:self-center">Ctrl+Shift+A</kbd>
          </div>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded gap-2">
            <span class="text-gray-900 dark:text-gray-100">Nuevo Proyecto</span>
            <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs self-start sm:self-center">Ctrl+Shift+N</kbd>
          </div>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded gap-2">
            <span class="text-gray-900 dark:text-gray-100">Importar Proyecto</span>
            <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs self-start sm:self-center">Ctrl+Shift+I</kbd>
          </div>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded gap-2">
            <span class="text-gray-900 dark:text-gray-100">Exportar Proyecto</span>
            <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs self-start sm:self-center">Ctrl+Shift+E</kbd>
          </div>
        </div>
      </section>

      <!-- Tips and Tricks -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <i class="pi pi-lightbulb mr-2 text-yellow-600"></i>
          Consejos y Trucos
        </h3>
        <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-start">
            <i class="pi pi-check-circle mr-2 text-green-600 mt-0.5 flex-shrink-0"></i>
            <p>Usa descripciones detalladas en el Chatbot IA para obtener proyectos más precisos</p>
          </div>
          <div class="flex items-start">
            <i class="pi pi-check-circle mr-2 text-green-600 mt-0.5 flex-shrink-0"></i>
            <p>Las fechas se calculan automáticamente excluyendo domingos (días laborales: lunes a sábado)</p>
          </div>
          <div class="flex items-start">
            <i class="pi pi-check-circle mr-2 text-green-600 mt-0.5 flex-shrink-0"></i>
            <p>Exporta tus proyectos regularmente como respaldo en formato JSON</p>
          </div>
          <div class="flex items-start">
            <i class="pi pi-check-circle mr-2 text-green-600 mt-0.5 flex-shrink-0"></i>
            <p>Usa el ajuste de fechas de proyecto para reprogramar todo el proyecto de una vez</p>
          </div>
        </div>
      </section>
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
</script>