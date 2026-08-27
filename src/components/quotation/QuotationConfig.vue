<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Configuración de Cotización</h1>

    <form @submit.prevent="handleSubmit" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">

      <!-- Tarifa por hora -->
      <div>
        <label for="hourlyRate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tarifa por hora
        </label>
        <input
          id="hourlyRate"
          v-model.number="form.hourlyRate"
          type="number"
          min="0"
          step="0.01"
          @blur="touchField('hourlyRate')"
          :class="[
            'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            hasFieldError('hourlyRate') ? 'border-red-500 dark:border-red-400' : ''
          ]"
          placeholder="Ej: 50.00"
        />
        <p v-if="hasFieldError('hourlyRate')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getFieldError('hourlyRate') }}
        </p>
      </div>

      <!-- Días laborables -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Días laborables
        </label>
        <div class="flex flex-wrap gap-3">
          <label
            v-for="day in days"
            :key="day.value"
            class="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="day.value"
              v-model="form.workingDays"
              @change="touchField('workingDays')"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ day.label }}</span>
          </label>
        </div>
        <p v-if="hasFieldError('workingDays')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getFieldError('workingDays') }}
        </p>
      </div>

      <!-- Horas por día -->
      <div>
        <label for="hoursPerDay" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Horas por día
        </label>
        <input
          id="hoursPerDay"
          v-model.number="form.hoursPerDay"
          type="number"
          min="1"
          max="24"
          step="1"
          @blur="touchField('hoursPerDay')"
          :class="[
            'w-full px-3 py-2 border rounded-lg transition-colors duration-200',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            hasFieldError('hoursPerDay') ? 'border-red-500 dark:border-red-400' : ''
          ]"
          placeholder="Ej: 8"
        />
        <p v-if="hasFieldError('hoursPerDay')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getFieldError('hoursPerDay') }}
        </p>
      </div>

      <!-- Guardar -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          :disabled="isSaving"
          class="px-6 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {{ isSaving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </form>

    <!-- Resumen de configuración activa -->
    <div class="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
        Configuración activa
      </h2>
      <dl class="space-y-2">
        <div class="flex justify-between text-sm">
          <dt class="text-gray-500 dark:text-gray-400">Tarifa por hora</dt>
          <dd class="font-medium text-gray-900 dark:text-gray-100">
            {{ configSummary.hourlyRate > 0 ? configSummary.hourlyRate : 'No configurada' }}
          </dd>
        </div>
        <div class="flex justify-between text-sm">
          <dt class="text-gray-500 dark:text-gray-400">Días laborables</dt>
          <dd class="font-medium text-gray-900 dark:text-gray-100">
            {{ activeDayLabels.length > 0 ? activeDayLabels.join(', ') : 'Ninguno' }}
          </dd>
        </div>
        <div class="flex justify-between text-sm">
          <dt class="text-gray-500 dark:text-gray-400">Horas por día</dt>
          <dd class="font-medium text-gray-900 dark:text-gray-100">{{ configSummary.hoursPerDay }}h</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useFormValidation } from '../../composables/useFormValidation.js'
import { useToast } from '../../composables/useToast.js'

const DAYS = [
  { value: 'monday',    label: 'lunes' },
  { value: 'tuesday',   label: 'martes' },
  { value: 'wednesday', label: 'miércoles' },
  { value: 'thursday',  label: 'jueves' },
  { value: 'friday',    label: 'viernes' },
  { value: 'saturday',  label: 'sábado' },
  { value: 'sunday',    label: 'domingo' }
]

const quotationValidationRules = {
  hourlyRate: [
    (value) => {
      if (value === null || value === undefined || value === '' || isNaN(value) || Number(value) <= 0) {
        throw new Error('La tarifa por hora debe ser un número mayor que cero')
      }
    }
  ],
  workingDays: [
    (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('Debe seleccionar al menos un día laborable')
      }
    }
  ],
  hoursPerDay: [
    (value) => {
      const n = Number(value)
      if (!Number.isInteger(n) || n < 1 || n > 24) {
        throw new Error('Las horas por día deben ser un número entero entre 1 y 24')
      }
    }
  ]
}

export default {
  name: 'QuotationConfig',

  setup() {
    const store = useStore()
    const { success: showSuccess, error: showError } = useToast()
    const isSaving = ref(false)

    const form = ref({
      hourlyRate: 0,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      hoursPerDay: 8
    })

    const {
      hasErrors,
      validateForm,
      touchField,
      getFieldError,
      hasFieldError,
      clearErrors
    } = useFormValidation(quotationValidationRules)

    const configSummary = computed(() => store.getters['quotation/configSummary'])

    const activeDayLabels = computed(() => {
      return DAYS
        .filter(d => configSummary.value.workingDays.includes(d.value))
        .map(d => d.label)
    })

    const loadFromStore = () => {
      const summary = store.getters['quotation/configSummary']
      form.value.hourlyRate = summary.hourlyRate
      form.value.workingDays = [...summary.workingDays]
      form.value.hoursPerDay = summary.hoursPerDay
    }

    const handleSubmit = async () => {
      const isValid = await validateForm(form.value)
      if (!isValid) return

      isSaving.value = true
      try {
        await store.dispatch('quotation/saveConfig', {
          hourlyRate: form.value.hourlyRate,
          workingDays: [...form.value.workingDays],
          hoursPerDay: form.value.hoursPerDay
        })
        showSuccess('Configuración guardada', 'Los parámetros de cotización se han guardado correctamente.')
        clearErrors()
      } catch (err) {
        showError('Error al guardar', err.message || 'No se pudo guardar la configuración.')
        // Store keeps previous values on error — reload them
        loadFromStore()
      } finally {
        isSaving.value = false
      }
    }

    onMounted(async () => {
      await store.dispatch('quotation/loadConfig')
      loadFromStore()
    })

    return {
      days: DAYS,
      form,
      isSaving,
      hasErrors,
      configSummary,
      activeDayLabels,
      touchField,
      getFieldError,
      hasFieldError,
      handleSubmit
    }
  }
}
</script>
