<template>
  <div class="enhanced-date-picker-example p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Enhanced Date Picker - Ejemplo de Uso</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Example 1: Basic Usage -->
      <div class="example-section">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Ejemplo Básico</h2>
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <EnhancedDatePicker
            v-model:startDate="example1.startDate"
            v-model:endDate="example1.endDate"
            v-model:duration="example1.duration"
            v-model:adjustStartDate="example1.adjustStartDate"
            startDateLabel="Fecha de inicio del proyecto"
            endDateLabel="Fecha de finalización del proyecto"
            @validation-change="onValidationChange1"
          />
          
          <div class="mt-4 p-3 bg-gray-50 rounded">
            <h3 class="font-medium text-gray-700 mb-2">Valores actuales:</h3>
            <ul class="text-sm text-gray-600 space-y-1">
              <li><strong>Fecha inicio:</strong> {{ formatDate(example1.startDate) }}</li>
              <li><strong>Fecha fin:</strong> {{ formatDate(example1.endDate) }}</li>
              <li><strong>Duración:</strong> {{ example1.duration }} días laborales</li>
              <li><strong>Ajustar fecha inicio:</strong> {{ example1.adjustStartDate ? 'Sí' : 'No' }}</li>
              <li><strong>Válido:</strong> {{ validation1.isValid ? 'Sí' : 'No' }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Example 2: Task Planning -->
      <div class="example-section">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Planificación de Tareas</h2>
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <EnhancedDatePicker
            v-model:startDate="example2.startDate"
            v-model:endDate="example2.endDate"
            v-model:duration="example2.duration"
            v-model:adjustStartDate="example2.adjustStartDate"
            startDateLabel="Inicio de la tarea"
            endDateLabel="Fin de la tarea"
            startDateId="task-start-date"
            endDateId="task-end-date"
            durationId="task-duration"
            adjustStartDateId="task-adjust-start"
            @validation-change="onValidationChange2"
          />
          
          <div class="mt-4 p-3 bg-blue-50 rounded">
            <h3 class="font-medium text-blue-800 mb-2">Información de la tarea:</h3>
            <ul class="text-sm text-blue-700 space-y-1">
              <li><strong>Tarea:</strong> Desarrollo de funcionalidad</li>
              <li><strong>Duración estimada:</strong> {{ example2.duration }} días</li>
              <li><strong>Incluye fines de semana:</strong> No (solo días laborales)</li>
              <li><strong>Estado:</strong> {{ validation2.isValid ? 'Planificación válida' : 'Revisar fechas' }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Example 3: Project Timeline -->
      <div class="example-section lg:col-span-2">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Cronograma de Proyecto</h2>
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de ajuste de duración:
            </label>
            <div class="flex gap-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  :value="false"
                  v-model="example3.adjustStartDate"
                  class="mr-2"
                />
                Ajustar fecha de fin
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  :value="true"
                  v-model="example3.adjustStartDate"
                  class="mr-2"
                />
                Ajustar fecha de inicio
              </label>
            </div>
          </div>

          <EnhancedDatePicker
            v-model:startDate="example3.startDate"
            v-model:endDate="example3.endDate"
            v-model:duration="example3.duration"
            v-model:adjustStartDate="example3.adjustStartDate"
            startDateLabel="Inicio del proyecto"
            endDateLabel="Entrega del proyecto"
            @validation-change="onValidationChange3"
          />
          
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-green-50 rounded-lg">
              <h4 class="font-medium text-green-800 mb-2">Fase 1: Análisis</h4>
              <p class="text-sm text-green-700">
                Duración: {{ Math.ceil(example3.duration * 0.2) }} días<br>
                Inicio: {{ formatDate(example3.startDate) }}
              </p>
            </div>
            <div class="p-4 bg-yellow-50 rounded-lg">
              <h4 class="font-medium text-yellow-800 mb-2">Fase 2: Desarrollo</h4>
              <p class="text-sm text-yellow-700">
                Duración: {{ Math.ceil(example3.duration * 0.6) }} días<br>
                Mayor parte del proyecto
              </p>
            </div>
            <div class="p-4 bg-purple-50 rounded-lg">
              <h4 class="font-medium text-purple-800 mb-2">Fase 3: Testing</h4>
              <p class="text-sm text-purple-700">
                Duración: {{ Math.ceil(example3.duration * 0.2) }} días<br>
                Fin: {{ formatDate(example3.endDate) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Errors Display -->
    <div v-if="hasAnyErrors" class="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 class="font-medium text-red-800 mb-2">Errores de Validación:</h3>
      <div class="space-y-2">
        <div v-if="!validation1.isValid" class="text-sm text-red-700">
          <strong>Ejemplo 1:</strong> {{ validation1.errors ? Object.values(validation1.errors).join(', ') : 'Error de validación' }}
        </div>
        <div v-if="!validation2.isValid" class="text-sm text-red-700">
          <strong>Ejemplo 2:</strong> {{ validation2.errors ? Object.values(validation2.errors).join(', ') : 'Error de validación' }}
        </div>
        <div v-if="!validation3.isValid" class="text-sm text-red-700">
          <strong>Ejemplo 3:</strong> {{ validation3.errors ? Object.values(validation3.errors).join(', ') : 'Error de validación' }}
        </div>
      </div>
    </div>

    <!-- Usage Instructions -->
    <div class="mt-8 p-6 bg-gray-50 rounded-lg">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Características del Componente:</h3>
      <ul class="space-y-2 text-sm text-gray-700">
        <li class="flex items-start gap-2">
          <span class="text-green-500 mt-1">✓</span>
          <span><strong>Cálculo automático de duración:</strong> Calcula días laborales entre fechas (Lunes a Sábado)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-500 mt-1">✓</span>
          <span><strong>Ajuste flexible:</strong> Puede ajustar fecha de inicio o fin al cambiar la duración</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-500 mt-1">✓</span>
          <span><strong>Validación en tiempo real:</strong> Detecta rangos inválidos y días no laborales</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-500 mt-1">✓</span>
          <span><strong>Información visual:</strong> Muestra duración calculada y días incluidos</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-500 mt-1">✓</span>
          <span><strong>Integración con DateCalculationService:</strong> Usa el servicio existente para cálculos</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-500 mt-1">✓</span>
          <span><strong>Eventos reactivos:</strong> Emite cambios para integración con formularios</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import EnhancedDatePicker from '../components/ui/EnhancedDatePicker.vue'

export default {
  name: 'EnhancedDatePickerExample',
  components: {
    EnhancedDatePicker
  },
  setup() {
    // Example 1: Basic usage
    const example1 = ref({
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-15'),
      duration: 10,
      adjustStartDate: false
    })
    const validation1 = ref({ isValid: true, errors: {} })

    // Example 2: Task planning
    const example2 = ref({
      startDate: new Date('2024-02-05'),
      endDate: new Date('2024-02-12'),
      duration: 6,
      adjustStartDate: false
    })
    const validation2 = ref({ isValid: true, errors: {} })

    // Example 3: Project timeline
    const example3 = ref({
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-29'),
      duration: 20,
      adjustStartDate: false
    })
    const validation3 = ref({ isValid: true, errors: {} })

    // Computed properties
    const hasAnyErrors = computed(() => {
      return !validation1.value.isValid || !validation2.value.isValid || !validation3.value.isValid
    })

    // Methods
    const formatDate = (date) => {
      if (!date) return 'No definida'
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const onValidationChange1 = (validation) => {
      validation1.value = validation
    }

    const onValidationChange2 = (validation) => {
      validation2.value = validation
    }

    const onValidationChange3 = (validation) => {
      validation3.value = validation
    }

    return {
      example1,
      example2,
      example3,
      validation1,
      validation2,
      validation3,
      hasAnyErrors,
      formatDate,
      onValidationChange1,
      onValidationChange2,
      onValidationChange3
    }
  }
}
</script>

<style scoped>
.example-section {
  margin-bottom: 2rem;
}

.enhanced-date-picker-example {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Custom radio button styling */
input[type="radio"] {
  accent-color: #3b82f6;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .enhanced-date-picker-example {
    padding: 1rem;
  }
  
  .grid.grid-cols-1.lg\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>