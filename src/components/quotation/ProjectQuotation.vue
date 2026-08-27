<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Cotización del Proyecto</h1>

    <!-- Project not found -->
    <div v-if="!project" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-yellow-800 dark:text-yellow-300">
      No se encontró el proyecto.
    </div>

    <template v-else>
      <!-- Project name -->
      <p class="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Proyecto: <span class="font-semibold text-gray-900 dark:text-gray-100">{{ project.name }}</span>
      </p>

      <!-- Warning: no end date -->
      <div
        v-if="!project.endDate"
        class="mb-4 flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4"
      >
        <svg class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <p class="text-sm text-yellow-800 dark:text-yellow-300">
          Este proyecto no tiene fecha de fin definida. No es posible calcular la cotización.
        </p>
      </div>

      <!-- Warning: hourlyRate === 0 -->
      <div
        v-if="hourlyRate === 0"
        class="mb-4 flex items-start gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4"
      >
        <svg class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <p class="text-sm text-orange-800 dark:text-orange-300">
          La tarifa horaria no ha sido configurada.
          <router-link to="/quotation-config" class="underline font-medium hover:text-orange-600 dark:hover:text-orange-200">
            Ir a configuración de cotización
          </router-link>
        </p>
      </div>

      <!-- Quotation breakdown -->
      <div
        v-if="quotation && project.endDate"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4"
      >
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
          Desglose de cotización
        </h2>

        <dl class="space-y-3">
          <div class="flex justify-between text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Días laborables</dt>
            <dd class="font-medium text-gray-900 dark:text-gray-100">{{ quotation.projectDays }} días</dd>
          </div>
          <div class="flex justify-between text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Total de horas</dt>
            <dd class="font-medium text-gray-900 dark:text-gray-100">{{ quotation.totalHours }} h</dd>
          </div>
          <div class="flex justify-between text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Tarifa aplicada</dt>
            <dd class="font-medium text-gray-900 dark:text-gray-100">{{ quotation.hourlyRate }} / h</dd>
          </div>
          <div class="flex justify-between text-sm pt-3 border-t border-gray-200 dark:border-gray-700">
            <dt class="font-semibold text-gray-700 dark:text-gray-300">Costo total</dt>
            <dd class="font-bold text-lg text-blue-600 dark:text-blue-400">{{ quotation.totalCost }}</dd>
          </div>
        </dl>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { QuotationCalculator } from '../../services/quotationCalculator.js'

export default {
  name: 'ProjectQuotation',

  props: {
    projectId: {
      type: [String, Number],
      required: true
    }
  },

  setup(props) {
    const store = useStore()

    const project = computed(() => {
      const projects = store.state.projects.projects
      const id = props.projectId
      return projects.find(p => String(p.id) === String(id)) || null
    })

    const hourlyRate = computed(() => store.state.quotation.hourlyRate)

    const config = computed(() => store.getters['quotation/configSummary'])

    const quotation = computed(() => {
      if (!project.value) return null
      return QuotationCalculator.calculateProjectQuotation(project.value, config.value)
    })

    onMounted(async () => {
      await store.dispatch('quotation/loadConfig')
      if (!store.state.projects.projects.length) {
        await store.dispatch('projects/loadProjects')
      }
    })

    return {
      project,
      hourlyRate,
      quotation
    }
  }
}
</script>
