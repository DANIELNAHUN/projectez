<template>
  <div class="enhanced-date-picker">
    <!-- Date Input Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Start Date -->
      <div class="form-group">
        <label :for="startDateId" class="block text-sm font-medium text-gray-700 mb-2">
          {{ startDateLabel }}
        </label>
        <DatePicker
          :id="startDateId"
          v-model="internalStartDate"
          :class="{ 'p-invalid': validationErrors.startDate }"
          dateFormat="dd/mm/yy"
          :showIcon="true"
          class="w-full"
          @update:modelValue="onStartDateChange"
        />
        <small v-if="validationErrors.startDate" class="p-error">
          {{ validationErrors.startDate }}
        </small>
      </div>

      <!-- End Date -->
      <div class="form-group">
        <label :for="endDateId" class="block text-sm font-medium text-gray-700 mb-2">
          {{ endDateLabel }}
        </label>
        <DatePicker
          :id="endDateId"
          v-model="internalEndDate"
          :class="{ 'p-invalid': validationErrors.endDate }"
          dateFormat="dd/mm/yy"
          :showIcon="true"
          :minDate="internalStartDate"
          class="w-full"
          @update:modelValue="onEndDateChange"
        />
        <small v-if="validationErrors.endDate" class="p-error">
          {{ validationErrors.endDate }}
        </small>
      </div>
    </div>

    <!-- Duration Display and Input -->
    <div class="mt-4 p-4 bg-gray-50 rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <!-- Duration Input -->
        <div class="form-group">
          <label :for="durationId" class="block text-sm font-medium text-gray-700 mb-2">
            Duración (días laborales)
          </label>
          <div class="flex items-center gap-2">
            <InputNumber
              :id="durationId"
              v-model="internalDuration"
              :min="1"
              :max="365"
              :class="{ 'p-invalid': validationErrors.duration }"
              class="flex-1"
              @update:modelValue="onDurationChange"
            />
            <span class="text-sm text-gray-500">días</span>
          </div>
          <small v-if="validationErrors.duration" class="p-error">
            {{ validationErrors.duration }}
          </small>
        </div>

        <!-- Adjust Start Date Toggle -->
        <div class="form-group">
          <div class="flex items-center gap-2">
            <Checkbox
              :id="adjustStartDateId"
              v-model="internalAdjustStartDate"
              :binary="true"
              @update:modelValue="onAdjustStartDateChange"
            />
            <label :for="adjustStartDateId" class="text-sm text-gray-700">
              Ajustar fecha de inicio al cambiar duración
            </label>
          </div>
          <small class="text-xs text-gray-500 mt-1 block">
            {{ adjustStartDateHelpText }}
          </small>
        </div>
      </div>

      <!-- Duration Information Display -->
      <div class="mt-3 pt-3 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-blue-500"></i>
            <span class="text-gray-600">Duración calculada:</span>
            <span class="font-medium text-blue-600">{{ calculatedDuration }} días</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-clock text-green-500"></i>
            <span class="text-gray-600">Días laborales:</span>
            <span class="font-medium text-green-600">{{ workingDaysInfo }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-amber-500"></i>
            <span class="text-gray-600">Incluye domingos:</span>
            <span class="font-medium text-amber-600">{{ includesSundays ? 'Sí' : 'No' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Summary -->
    <div v-if="hasValidationErrors" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-start gap-2">
        <i class="pi pi-exclamation-triangle text-red-500 mt-0.5"></i>
        <div>
          <h4 class="text-sm font-medium text-red-800 mb-1">Errores de validación:</h4>
          <ul class="text-sm text-red-700 space-y-1">
            <li v-for="error in allValidationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import { DateCalculationService } from '../../services/dateCalculationService.js'

export default {
  name: 'EnhancedDatePicker',
  components: {
    DatePicker,
    InputNumber,
    Checkbox
  },
  props: {
    // Date values
    startDate: {
      type: Date,
      default: () => new Date()
    },
    endDate: {
      type: Date,
      default: () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow
      }
    },
    duration: {
      type: Number,
      default: null
    },
    adjustStartDate: {
      type: Boolean,
      default: false
    },
    
    // Labels
    startDateLabel: {
      type: String,
      default: 'Fecha de inicio'
    },
    endDateLabel: {
      type: String,
      default: 'Fecha de fin'
    },
    
    // IDs for accessibility
    startDateId: {
      type: String,
      default: 'enhanced-start-date'
    },
    endDateId: {
      type: String,
      default: 'enhanced-end-date'
    },
    durationId: {
      type: String,
      default: 'enhanced-duration'
    },
    adjustStartDateId: {
      type: String,
      default: 'enhanced-adjust-start-date'
    },
    
    // Validation
    required: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'update:startDate',
    'update:endDate', 
    'update:duration',
    'update:adjustStartDate',
    'validation-change'
  ],
  setup(props, { emit }) {
    // Internal reactive values
    const internalStartDate = ref(props.startDate ? new Date(props.startDate) : null)
    const internalEndDate = ref(props.endDate ? new Date(props.endDate) : null)
    const internalDuration = ref(props.duration)
    const internalAdjustStartDate = ref(props.adjustStartDate)
    const validationErrors = ref({})
    
    // Computed properties
    const calculatedDuration = computed(() => {
      try {
        if (internalStartDate.value && internalEndDate.value) {
          return DateCalculationService.calculateWorkingDays(
            internalStartDate.value, 
            internalEndDate.value
          )
        }
        return 0
      } catch (error) {
        return 0
      }
    })
    
    const workingDaysInfo = computed(() => {
      return `Lun-Sáb (${calculatedDuration.value} días)`
    })
    
    const includesSundays = computed(() => {
      if (!internalStartDate.value || !internalEndDate.value) return false
      
      const start = new Date(internalStartDate.value)
      const end = new Date(internalEndDate.value)
      const current = new Date(start)
      
      while (current <= end) {
        if (current.getDay() === 0) { // Sunday
          return true
        }
        current.setDate(current.getDate() + 1)
      }
      return false
    })
    
    const adjustStartDateHelpText = computed(() => {
      return internalAdjustStartDate.value 
        ? 'Al cambiar la duración, se ajustará la fecha de inicio'
        : 'Al cambiar la duración, se ajustará la fecha de fin'
    })
    
    const hasValidationErrors = computed(() => {
      return Object.keys(validationErrors.value).length > 0
    })
    
    const allValidationErrors = computed(() => {
      return Object.values(validationErrors.value).filter(error => error)
    })
    
    // Validation functions
    const validateDates = () => {
      const errors = {}
      
      if (props.required) {
        if (!internalStartDate.value) {
          errors.startDate = 'La fecha de inicio es requerida'
        }
        if (!internalEndDate.value) {
          errors.endDate = 'La fecha de fin es requerida'
        }
      }
      
      if (internalStartDate.value && internalEndDate.value) {
        if (!DateCalculationService.validateDateRange(internalStartDate.value, internalEndDate.value)) {
          errors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio'
        }
        
        // Check if start date is a working day
        if (!DateCalculationService.isWorkingDay(internalStartDate.value)) {
          errors.startDate = 'La fecha de inicio cae en domingo (día no laboral)'
        }
        
        // Check if end date is a working day
        if (!DateCalculationService.isWorkingDay(internalEndDate.value)) {
          errors.endDate = 'La fecha de fin cae en domingo (día no laboral)'
        }
      }
      
      if (internalDuration.value !== null && internalDuration.value < 1) {
        errors.duration = 'La duración debe ser al menos 1 día'
      }
      
      validationErrors.value = errors
      emit('validation-change', {
        isValid: Object.keys(errors).length === 0,
        errors
      })
    }
    
    // Event handlers
    const onStartDateChange = (newStartDate) => {
      if (newStartDate) {
        internalStartDate.value = newStartDate
        
        // Update duration based on new start date
        if (internalEndDate.value) {
          internalDuration.value = calculatedDuration.value
        }
        
        validateDates()
        emit('update:startDate', newStartDate)
        emit('update:duration', internalDuration.value)
      }
    }
    
    const onEndDateChange = (newEndDate) => {
      if (newEndDate) {
        internalEndDate.value = newEndDate
        
        // Update duration based on new end date
        if (internalStartDate.value) {
          internalDuration.value = calculatedDuration.value
        }
        
        validateDates()
        emit('update:endDate', newEndDate)
        emit('update:duration', internalDuration.value)
      }
    }
    
    const onDurationChange = (newDuration) => {
      if (newDuration && newDuration > 0) {
        internalDuration.value = newDuration
        
        try {
          if (internalAdjustStartDate.value) {
            // Adjust start date, keep end date fixed
            if (internalEndDate.value) {
              const newStartDate = DateCalculationService.subtractWorkingDays(
                internalEndDate.value, 
                newDuration
              )
              internalStartDate.value = newStartDate
              emit('update:startDate', newStartDate)
            }
          } else {
            // Adjust end date, keep start date fixed (default behavior)
            if (internalStartDate.value) {
              const newEndDate = DateCalculationService.addWorkingDays(
                internalStartDate.value, 
                newDuration
              )
              internalEndDate.value = newEndDate
              emit('update:endDate', newEndDate)
            }
          }
          
          validateDates()
          emit('update:duration', newDuration)
        } catch (error) {
          console.warn('Error calculating dates from duration:', error.message)
          validationErrors.value.duration = 'Error al calcular fechas con esta duración'
        }
      }
    }
    
    const onAdjustStartDateChange = (newValue) => {
      internalAdjustStartDate.value = newValue
      emit('update:adjustStartDate', newValue)
    }
    
    // Watch for prop changes
    watch(() => props.startDate, (newValue) => {
      if (newValue && newValue.getTime() !== internalStartDate.value.getTime()) {
        internalStartDate.value = new Date(newValue)
        validateDates()
      }
    })
    
    watch(() => props.endDate, (newValue) => {
      if (newValue && newValue.getTime() !== internalEndDate.value.getTime()) {
        internalEndDate.value = new Date(newValue)
        validateDates()
      }
    })
    
    watch(() => props.duration, (newValue) => {
      if (newValue !== internalDuration.value) {
        internalDuration.value = newValue
      }
    })
    
    watch(() => props.adjustStartDate, (newValue) => {
      if (newValue !== internalAdjustStartDate.value) {
        internalAdjustStartDate.value = newValue
      }
    })
    
    // Initialize duration if not provided
    onMounted(() => {
      if (internalDuration.value === null && internalStartDate.value && internalEndDate.value) {
        internalDuration.value = calculatedDuration.value
        emit('update:duration', internalDuration.value)
      }
      validateDates()
    })
    
    return {
      internalStartDate,
      internalEndDate,
      internalDuration,
      internalAdjustStartDate,
      validationErrors,
      calculatedDuration,
      workingDaysInfo,
      includesSundays,
      adjustStartDateHelpText,
      hasValidationErrors,
      allValidationErrors,
      onStartDateChange,
      onEndDateChange,
      onDurationChange,
      onAdjustStartDateChange,
      validateDates
    }
  }
}
</script>

<style scoped>
.enhanced-date-picker {
  width: 100%;
}

.form-group {
  margin-bottom: 0.5rem;
}

.p-error {
  color: #ef4444;
  font-size: 0.875rem;
}

.p-invalid {
  border-color: #ef4444 !important;
}

/* Custom styling for the duration info section */
.duration-info {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .grid-cols-1.md\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>