import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import TaskForm from '../../components/task/TaskForm.vue'
import { Task } from '../../models/index.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'

// Mock PrimeVue components
const mockPrimeVueComponents = {
  InputText: {
    name: 'InputText',
    template: '<input v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  Textarea: {
    name: 'Textarea',
    template: '<textarea v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  DatePicker: {
    name: 'DatePicker',
    template: '<input type="date" v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', new Date($event.target.value))" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  Select: {
    name: 'Select',
    template: '<select v-bind="$attrs" v-model="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
  },
  RadioButton: {
    name: 'RadioButton',
    template: '<input type="radio" v-bind="$attrs" v-model="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  Button: {
    name: 'Button',
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
    props: ['label'],
    emits: ['click']
  },
  Slider: {
    name: 'Slider',
    template: '<input type="range" v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', parseInt($event.target.value))" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}

// Mock EnhancedDatePicker with realistic behavior
const MockEnhancedDatePicker = {
  name: 'EnhancedDatePicker',
  template: `
    <div class="enhanced-date-picker-mock">
      <div class="date-inputs">
        <input 
          type="date" 
          :value="startDate ? startDate.toISOString().split('T')[0] : ''"
          @input="handleStartDateChange($event.target.value)"
          data-testid="start-date-input"
        />
        <input 
          type="date" 
          :value="endDate ? endDate.toISOString().split('T')[0] : ''"
          @input="handleEndDateChange($event.target.value)"
          data-testid="end-date-input"
        />
      </div>
      <div class="duration-controls">
        <input 
          type="number" 
          :value="duration"
          @input="handleDurationChange(parseInt($event.target.value))"
          data-testid="duration-input"
          min="1"
        />
        <input 
          type="checkbox" 
          :checked="adjustStartDate"
          @change="handleAdjustStartDateChange($event.target.checked)"
          data-testid="adjust-start-date-checkbox"
        />
      </div>
    </div>
  `,
  props: [
    'startDate', 'endDate', 'duration', 'adjustStartDate',
    'startDateId', 'endDateId', 'durationId', 'adjustStartDateId',
    'startDateLabel', 'endDateLabel', 'required'
  ],
  emits: [
    'update:startDate', 'update:endDate', 'update:duration', 
    'update:adjustStartDate', 'validation-change'
  ],
  methods: {
    handleStartDateChange(value) {
      if (value) {
        const newStartDate = new Date(value)
        this.$emit('update:startDate', newStartDate)
        
        // Calculate new duration if end date exists
        if (this.endDate) {
          const newDuration = DateCalculationService.calculateWorkingDays(newStartDate, this.endDate)
          this.$emit('update:duration', newDuration)
        }
        
        this.emitValidation()
      }
    },
    
    handleEndDateChange(value) {
      if (value) {
        const newEndDate = new Date(value)
        this.$emit('update:endDate', newEndDate)
        
        // Calculate new duration if start date exists
        if (this.startDate) {
          const newDuration = DateCalculationService.calculateWorkingDays(this.startDate, newEndDate)
          this.$emit('update:duration', newDuration)
        }
        
        this.emitValidation()
      }
    },
    
    handleDurationChange(value) {
      if (value && value > 0) {
        this.$emit('update:duration', value)
        
        // Adjust dates based on adjustStartDate flag
        if (this.adjustStartDate && this.endDate) {
          const newStartDate = DateCalculationService.subtractWorkingDays(this.endDate, value)
          this.$emit('update:startDate', newStartDate)
        } else if (this.startDate) {
          const newEndDate = DateCalculationService.addWorkingDays(this.startDate, value)
          this.$emit('update:endDate', newEndDate)
        }
        
        this.emitValidation()
      }
    },
    
    handleAdjustStartDateChange(value) {
      this.$emit('update:adjustStartDate', value)
    },
    
    emitValidation() {
      const isValid = this.startDate && this.endDate && this.duration > 0
      const errors = {}
      
      if (!this.startDate) errors.startDate = 'Start date is required'
      if (!this.endDate) errors.endDate = 'End date is required'
      if (!this.duration || this.duration <= 0) errors.duration = 'Duration must be positive'
      
      this.$emit('validation-change', { isValid, errors })
    }
  },
  
  mounted() {
    // Emit initial validation state
    this.emitValidation()
  }
}

// Mock the EnhancedDatePicker import
vi.mock('../../components/ui/EnhancedDatePicker.vue', () => ({
  default: MockEnhancedDatePicker
}))

// Mock PrimeVue components
Object.entries(mockPrimeVueComponents).forEach(([name, component]) => {
  vi.mock(`primevue/${name.toLowerCase()}`, () => ({ default: component }))
})

describe('TaskForm Integration with Enhanced Date Management', () => {
  let wrapper
  let store

  const defaultProps = {
    projectId: 'test-project-id',
    teamMembers: [
      { id: 'member1', name: 'John Doe', role: 'Developer' },
      { id: 'member2', name: 'Jane Smith', role: 'Designer' }
    ]
  }

  beforeEach(() => {
    // Create a minimal store
    store = createStore({
      modules: {
        tasks: {
          namespaced: true,
          state: { tasks: [] },
          getters: { isLoading: () => false, error: () => null },
          actions: {}
        }
      }
    })

    wrapper = mount(TaskForm, {
      props: defaultProps,
      global: {
        plugins: [store],
        stubs: {
          'router-link': true
        }
      }
    })
  })

  describe('Enhanced Date Picker Integration', () => {
    it('renders EnhancedDatePicker component', () => {
      expect(wrapper.find('.enhanced-date-picker-mock').exists()).toBe(true)
    })

    it('initializes with default duration and adjustStartDate values', () => {
      const formData = wrapper.vm.formData
      expect(formData.duration).toBe(1)
      expect(formData.adjustStartDate).toBe(false)
    })

    it('updates duration when dates change', async () => {
      const startDateInput = wrapper.find('[data-testid="start-date-input"]')
      const endDateInput = wrapper.find('[data-testid="end-date-input"]')

      // Set start date to Monday
      await startDateInput.setValue('2024-02-05') // Monday
      // Set end date to Wednesday (2 working days)
      await endDateInput.setValue('2024-02-07') // Wednesday

      // Duration should be calculated automatically
      expect(wrapper.vm.formData.duration).toBe(3) // Mon, Tue, Wed = 3 working days
    })

    it('updates end date when duration changes (default behavior)', async () => {
      // Set initial start date
      const startDateInput = wrapper.find('[data-testid="start-date-input"]')
      await startDateInput.setValue('2024-02-05') // Monday

      // Change duration
      const durationInput = wrapper.find('[data-testid="duration-input"]')
      await durationInput.setValue('5')

      // End date should be updated (5 working days from Monday = Friday)
      const expectedEndDate = DateCalculationService.addWorkingDays(new Date('2024-02-05'), 5)
      expect(wrapper.vm.formData.endDate.toDateString()).toBe(expectedEndDate.toDateString())
    })

    it('updates start date when duration changes and adjustStartDate is true', async () => {
      // Set adjustStartDate to true
      const adjustCheckbox = wrapper.find('[data-testid="adjust-start-date-checkbox"]')
      await adjustCheckbox.setChecked(true)

      // Set initial end date
      const endDateInput = wrapper.find('[data-testid="end-date-input"]')
      await endDateInput.setValue('2024-02-09') // Friday

      // Change duration
      const durationInput = wrapper.find('[data-testid="duration-input"]')
      await durationInput.setValue('3')

      // Start date should be updated (3 working days before Friday = Wednesday)
      const expectedStartDate = DateCalculationService.subtractWorkingDays(new Date('2024-02-09'), 3)
      expect(wrapper.vm.formData.startDate.toDateString()).toBe(expectedStartDate.toDateString())
    })

    it('handles date validation from EnhancedDatePicker', async () => {
      // Simulate validation error from EnhancedDatePicker
      await wrapper.vm.onDateValidationChange({
        isValid: false,
        errors: { startDate: 'Invalid start date' }
      })

      expect(wrapper.vm.isDateValidationValid).toBe(false)
      expect(wrapper.vm.dateValidationErrors.startDate).toBe('Invalid start date')

      // Form validation should fail
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.startDate).toBe('Invalid start date')
    })
  })

  describe('Backward Compatibility', () => {
    it('loads existing task data with duration properties', async () => {
      const existingTask = new Task({
        id: 'test-task',
        title: 'Existing Task',
        description: 'Test Description',
        startDate: new Date('2024-02-05'),
        endDate: new Date('2024-02-09'),
        duration: 5,
        adjustStartDate: true,
        status: 'in_progress',
        type: 'simple',
        priority: 'high'
      })

      await wrapper.setProps({ task: existingTask })

      const formData = wrapper.vm.formData
      expect(formData.title).toBe('Existing Task')
      expect(formData.duration).toBe(5)
      expect(formData.adjustStartDate).toBe(true)
      expect(formData.status).toBe('in_progress')
      expect(formData.priority).toBe('high')
    })

    it('calculates duration for existing tasks without duration property', async () => {
      const taskWithoutDuration = {
        id: 'test-task',
        title: 'Old Task',
        startDate: new Date('2024-02-05'), // Monday
        endDate: new Date('2024-02-07'),   // Wednesday
        status: 'pending',
        type: 'simple',
        priority: 'medium'
        // No duration property
      }

      await wrapper.setProps({ task: taskWithoutDuration })

      const formData = wrapper.vm.formData
      expect(formData.duration).toBe(3) // Calculated: Mon, Tue, Wed = 3 working days
      expect(formData.adjustStartDate).toBe(false) // Default value
    })
  })

  describe('Form Submission', () => {
    it('includes duration and adjustStartDate in submitted data', async () => {
      const submitSpy = vi.fn()
      wrapper.vm.$emit = submitSpy

      // Set form data
      wrapper.vm.formData.title = 'Test Task'
      wrapper.vm.formData.duration = 3
      wrapper.vm.formData.adjustStartDate = true
      wrapper.vm.formData.startDate = new Date('2024-02-05')
      wrapper.vm.formData.endDate = new Date('2024-02-07')

      await wrapper.vm.handleSubmit()

      expect(submitSpy).toHaveBeenCalledWith('submit', expect.objectContaining({
        title: 'Test Task',
        duration: 3,
        adjustStartDate: true,
        projectId: 'test-project-id'
      }))
    })

    it('validates duration field', async () => {
      wrapper.vm.formData.title = 'Valid Title'
      wrapper.vm.formData.duration = -1 // Invalid duration
      wrapper.vm.isDateValidationValid = true

      const isValid = wrapper.vm.validateForm()

      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.duration).toBe('La duración debe ser al menos 1 día')
    })
  })

  describe('Date Calculation Integration', () => {
    it('uses DateCalculationService for working day calculations', () => {
      const startDate = new Date('2024-02-05') // Monday
      const endDate = new Date('2024-02-09')   // Friday
      
      const duration = DateCalculationService.calculateWorkingDays(startDate, endDate)
      expect(duration).toBe(5) // Mon, Tue, Wed, Thu, Fri = 5 working days
    })

    it('excludes Sundays from working day calculations', () => {
      const startDate = new Date('2024-02-04') // Sunday
      const endDate = new Date('2024-02-06')   // Tuesday
      
      const duration = DateCalculationService.calculateWorkingDays(startDate, endDate)
      expect(duration).toBe(2) // Mon, Tue = 2 working days (Sunday excluded)
    })

    it('handles date range validation', () => {
      const startDate = new Date('2024-02-05')
      const endDate = new Date('2024-02-03') // Before start date
      
      const isValid = DateCalculationService.validateDateRange(startDate, endDate)
      expect(isValid).toBe(false)
    })
  })
})