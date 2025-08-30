import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EnhancedDatePicker from '../../../components/ui/EnhancedDatePicker.vue'
import { DateCalculationService } from '../../../services/dateCalculationService.js'

// Mock PrimeVue components
vi.mock('primevue/datepicker', () => ({
  default: {
    name: 'DatePicker',
    template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['id', 'modelValue', 'dateFormat', 'showIcon', 'minDate', 'class'],
    emits: ['update:modelValue']
  }
}))

vi.mock('primevue/inputnumber', () => ({
  default: {
    name: 'InputNumber',
    template: '<input :id="id" type="number" :value="modelValue" @input="$emit(\'update:modelValue\', parseInt($event.target.value))" />',
    props: ['id', 'modelValue', 'min', 'max', 'class'],
    emits: ['update:modelValue']
  }
}))

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: '<input :id="id" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['id', 'modelValue', 'binary'],
    emits: ['update:modelValue']
  }
}))

describe('EnhancedDatePicker', () => {
  let wrapper
  const defaultProps = {
    startDate: new Date('2024-01-02'), // Tuesday (working day)
    endDate: new Date('2024-01-08'),   // Monday (working day)  
    duration: 5,
    adjustStartDate: false
  }

  beforeEach(() => {
    wrapper = mount(EnhancedDatePicker, {
      props: defaultProps
    })
  })

  describe('Component Initialization', () => {
    it('should render with default props', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="enhanced-date-picker"]').exists()).toBe(false) // No data-testid in template
      expect(wrapper.find('.enhanced-date-picker').exists()).toBe(true)
    })

    it('should initialize with provided props', () => {
      expect(wrapper.vm.internalStartDate).toEqual(defaultProps.startDate)
      expect(wrapper.vm.internalEndDate).toEqual(defaultProps.endDate)
      expect(wrapper.vm.internalDuration).toBe(defaultProps.duration)
      expect(wrapper.vm.internalAdjustStartDate).toBe(defaultProps.adjustStartDate)
    })

    it('should calculate duration from dates when duration is null', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'), // Tuesday
          endDate: new Date('2024-01-08'),   // Monday (next week)
          duration: null
        }
      })

      await wrapper.vm.$nextTick()
      
      // Should calculate working days (Tue-Mon = 6 working days, excluding Sunday)
      expect(wrapper.vm.calculatedDuration).toBe(6)
    })
  })

  describe('Date Validation', () => {
    it('should validate required dates', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: null,
          endDate: null,
          required: true
        }
      })

      // Trigger validation manually
      wrapper.vm.validateDates()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.validationErrors.startDate).toBe('La fecha de inicio es requerida')
      expect(wrapper.vm.validationErrors.endDate).toBe('La fecha de fin es requerida')
    })

    it('should validate date range', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-08'), // Monday
          endDate: new Date('2024-01-02') // Tuesday (before start)
        }
      })

      // Trigger validation manually
      wrapper.vm.validateDates()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.validationErrors.endDate).toBe('La fecha de fin debe ser posterior a la fecha de inicio')
    })

    it('should warn about non-working days (Sundays)', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-15'), // Sunday
          endDate: new Date('2024-01-16')    // Monday
        }
      })

      // Trigger validation manually
      wrapper.vm.validateDates()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.validationErrors.startDate).toBe('La fecha de inicio cae en domingo (día no laboral)')
    })

    it('should validate minimum duration', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-02'),
          duration: 0
        }
      })

      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.validationErrors.duration).toBe('La duración debe ser al menos 1 día')
    })
  })

  describe('Duration Calculations', () => {
    it('should calculate working days correctly', () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'), // Tuesday
          endDate: new Date('2024-01-08')    // Monday (next week)
        }
      })

      expect(wrapper.vm.calculatedDuration).toBe(6) // Tue-Mon = 6 working days
    })

    it('should exclude Sundays from working days calculation', () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'), // Tuesday
          endDate: new Date('2024-01-14')    // Sunday (next week)
        }
      })

      expect(wrapper.vm.calculatedDuration).toBe(12) // Tue-Sat = 12 working days (excluding Sunday)
    })

    it('should detect when date range includes Sundays', () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'), // Tuesday
          endDate: new Date('2024-01-14')    // Sunday (next week)
        }
      })

      expect(wrapper.vm.includesSundays).toBe(true)
    })

    it('should detect when date range does not include Sundays', () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'), // Tuesday
          endDate: new Date('2024-01-06')    // Saturday
        }
      })

      expect(wrapper.vm.includesSundays).toBe(false)
    })
  })

  describe('Date Change Events', () => {
    it('should emit events when start date changes', async () => {
      const newStartDate = new Date('2024-01-02')
      
      await wrapper.vm.onStartDateChange(newStartDate)
      
      expect(wrapper.emitted('update:startDate')).toBeTruthy()
      expect(wrapper.emitted('update:startDate')[0]).toEqual([newStartDate])
      expect(wrapper.emitted('update:duration')).toBeTruthy()
    })

    it('should emit events when end date changes', async () => {
      const newEndDate = new Date('2024-01-10')
      
      await wrapper.vm.onEndDateChange(newEndDate)
      
      expect(wrapper.emitted('update:endDate')).toBeTruthy()
      expect(wrapper.emitted('update:endDate')[0]).toEqual([newEndDate])
      expect(wrapper.emitted('update:duration')).toBeTruthy()
    })

    it('should emit validation-change events', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-01') // Invalid range
        }
      })

      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('validation-change')).toBeTruthy()
      const validationEvent = wrapper.emitted('validation-change')[0][0]
      expect(validationEvent.isValid).toBe(false)
      expect(validationEvent.errors).toBeDefined()
    })
  })

  describe('Duration Adjustment Behavior', () => {
    it('should adjust end date when duration changes (default behavior)', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'), // Tuesday
          endDate: new Date('2024-01-08'),   // Monday
          duration: 5,
          adjustStartDate: false
        }
      })

      // Change duration to 10 days
      await wrapper.vm.onDurationChange(10)
      
      expect(wrapper.emitted('update:endDate')).toBeTruthy()
      expect(wrapper.emitted('update:duration')).toBeTruthy()
      expect(wrapper.emitted('update:duration')[0]).toEqual([10])
    })

    it('should adjust start date when adjustStartDate is true', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'),
          endDate: new Date('2024-01-08'),
          duration: 5,
          adjustStartDate: true
        }
      })

      // Change duration to 3 days
      await wrapper.vm.onDurationChange(3)
      
      expect(wrapper.emitted('update:startDate')).toBeTruthy()
      expect(wrapper.emitted('update:duration')).toBeTruthy()
      expect(wrapper.emitted('update:duration')[0]).toEqual([3])
    })

    it('should emit adjustStartDate change events', async () => {
      await wrapper.vm.onAdjustStartDateChange(true)
      
      expect(wrapper.emitted('update:adjustStartDate')).toBeTruthy()
      expect(wrapper.emitted('update:adjustStartDate')[0]).toEqual([true])
    })
  })

  describe('Computed Properties', () => {
    it('should display correct working days info', () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-02'), // Tuesday
          endDate: new Date('2024-01-08')    // Monday
        }
      })

      expect(wrapper.vm.workingDaysInfo).toBe('Lun-Sáb (6 días)')
    })

    it('should display correct help text for adjustStartDate', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          adjustStartDate: false
        }
      })

      expect(wrapper.vm.adjustStartDateHelpText).toBe('Al cambiar la duración, se ajustará la fecha de fin')

      await wrapper.setProps({ adjustStartDate: true })
      expect(wrapper.vm.adjustStartDateHelpText).toBe('Al cambiar la duración, se ajustará la fecha de inicio')
    })

    it('should correctly identify validation errors', async () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: null,
          endDate: null,
          required: true
        }
      })

      // Trigger validation manually
      wrapper.vm.validateDates()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.hasValidationErrors).toBe(true)
      expect(wrapper.vm.allValidationErrors).toHaveLength(2)
    })
  })

  describe('Props Watching', () => {
    it('should update internal values when props change', async () => {
      const newStartDate = new Date('2024-02-01')
      const newEndDate = new Date('2024-02-05')
      
      await wrapper.setProps({
        startDate: newStartDate,
        endDate: newEndDate,
        duration: 10,
        adjustStartDate: true
      })

      expect(wrapper.vm.internalStartDate).toEqual(newStartDate)
      expect(wrapper.vm.internalEndDate).toEqual(newEndDate)
      expect(wrapper.vm.internalDuration).toBe(10)
      expect(wrapper.vm.internalAdjustStartDate).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid duration calculations gracefully', async () => {
      // Mock DateCalculationService to throw an error
      const originalAddWorkingDays = DateCalculationService.addWorkingDays
      DateCalculationService.addWorkingDays = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await wrapper.vm.onDurationChange(5)
      
      expect(consoleSpy).toHaveBeenCalledWith('Error calculating dates from duration:', 'Test error')
      expect(wrapper.vm.validationErrors.duration).toBe('Error al calcular fechas con esta duración')

      // Restore original function
      DateCalculationService.addWorkingDays = originalAddWorkingDays
      consoleSpy.mockRestore()
    })

    it('should handle invalid date calculations in computed properties', () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: null,
          endDate: null
        }
      })

      expect(wrapper.vm.calculatedDuration).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels and IDs', () => {
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDateId: 'custom-start-date',
          endDateId: 'custom-end-date',
          durationId: 'custom-duration',
          adjustStartDateId: 'custom-adjust-start-date',
          startDateLabel: 'Custom Start Date',
          endDateLabel: 'Custom End Date'
        }
      })

      const startDateLabel = wrapper.find('label[for="custom-start-date"]')
      const endDateLabel = wrapper.find('label[for="custom-end-date"]')
      
      expect(startDateLabel.text()).toBe('Custom Start Date')
      expect(endDateLabel.text()).toBe('Custom End Date')
    })
  })

  describe('Integration with DateCalculationService', () => {
    it('should use DateCalculationService for working day calculations', () => {
      const spy = vi.spyOn(DateCalculationService, 'calculateWorkingDays')
      
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05')
        }
      })

      // Access computed property to trigger calculation
      const duration = wrapper.vm.calculatedDuration
      
      expect(spy).toHaveBeenCalledWith(
        wrapper.vm.internalStartDate,
        wrapper.vm.internalEndDate
      )
      
      spy.mockRestore()
    })

    it('should use DateCalculationService for date validation', async () => {
      const spy = vi.spyOn(DateCalculationService, 'validateDateRange')
      
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05')
        }
      })

      await wrapper.vm.$nextTick()
      
      expect(spy).toHaveBeenCalled()
      
      spy.mockRestore()
    })

    it('should use DateCalculationService for working day validation', async () => {
      const spy = vi.spyOn(DateCalculationService, 'isWorkingDay')
      
      const wrapper = mount(EnhancedDatePicker, {
        props: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05')
        }
      })

      await wrapper.vm.$nextTick()
      
      expect(spy).toHaveBeenCalled()
      
      spy.mockRestore()
    })
  })
})