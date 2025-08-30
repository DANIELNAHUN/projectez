import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskForm from '../../../components/task/TaskForm.vue'
import { Task } from '../../../models/index.js'

// Mock PrimeVue components
vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}))

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    template: '<textarea v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}))

vi.mock('primevue/datepicker', () => ({
  default: {
    name: 'DatePicker',
    template: '<input type="date" v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', new Date($event.target.value))" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select v-bind="$attrs" v-model="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
  }
}))

vi.mock('primevue/radiobutton', () => ({
  default: {
    name: 'RadioButton',
    template: '<input type="radio" v-bind="$attrs" v-model="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
    props: ['label'],
    emits: ['click']
  }
}))

vi.mock('primevue/slider', () => ({
  default: {
    name: 'Slider',
    template: '<input type="range" v-bind="$attrs" v-model="modelValue" @input="$emit(\'update:modelValue\', parseInt($event.target.value))" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}))

// Mock EnhancedDatePicker
vi.mock('../../../components/ui/EnhancedDatePicker.vue', () => ({
  default: {
    name: 'EnhancedDatePicker',
    template: `
      <div class="enhanced-date-picker-mock">
        <input 
          type="date" 
          :value="startDate ? startDate.toISOString().split('T')[0] : ''"
          @input="$emit('update:startDate', new Date($event.target.value))"
        />
        <input 
          type="date" 
          :value="endDate ? endDate.toISOString().split('T')[0] : ''"
          @input="$emit('update:endDate', new Date($event.target.value))"
        />
        <input 
          type="number" 
          :value="duration"
          @input="$emit('update:duration', parseInt($event.target.value))"
        />
        <input 
          type="checkbox" 
          :checked="adjustStartDate"
          @change="$emit('update:adjustStartDate', $event.target.checked)"
        />
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
    mounted() {
      // Emit initial validation state
      this.$emit('validation-change', { isValid: true, errors: {} })
    }
  }
}))

describe('TaskForm', () => {
  let wrapper

  const defaultProps = {
    projectId: 'test-project-id',
    teamMembers: []
  }

  beforeEach(() => {
    wrapper = mount(TaskForm, {
      props: defaultProps,
      global: {
        stubs: {
          'router-link': true
        }
      }
    })
  })

  it('renders correctly for new task creation', () => {
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('.enhanced-date-picker-mock').exists()).toBe(true)
  })

  it('includes duration and adjustStartDate fields in form data', async () => {
    const formData = wrapper.vm.formData
    
    expect(formData).toHaveProperty('duration')
    expect(formData).toHaveProperty('adjustStartDate')
    expect(typeof formData.duration).toBe('number')
    expect(typeof formData.adjustStartDate).toBe('boolean')
  })

  it('initializes with default duration for new tasks', () => {
    const formData = wrapper.vm.formData
    expect(formData.duration).toBe(1) // Default to 1 working day
    expect(formData.adjustStartDate).toBe(false)
  })

  it('loads existing task data correctly', async () => {
    const existingTask = new Task({
      id: 'test-task',
      title: 'Test Task',
      description: 'Test Description',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05'),
      duration: 5,
      adjustStartDate: true,
      status: 'in_progress',
      type: 'simple',
      priority: 'high'
    })

    await wrapper.setProps({ task: existingTask })
    
    const formData = wrapper.vm.formData
    expect(formData.title).toBe('Test Task')
    expect(formData.duration).toBe(5)
    expect(formData.adjustStartDate).toBe(true)
    expect(formData.status).toBe('in_progress')
    expect(formData.priority).toBe('high')
  })

  it('handles date validation changes', async () => {
    const validationResult = {
      isValid: false,
      errors: { startDate: 'Invalid start date' }
    }

    await wrapper.vm.onDateValidationChange(validationResult)
    
    expect(wrapper.vm.isDateValidationValid).toBe(false)
    expect(wrapper.vm.dateValidationErrors).toEqual(validationResult.errors)
  })

  it('includes duration and adjustStartDate in form submission', async () => {
    const submitSpy = vi.fn()
    wrapper.vm.$emit = submitSpy

    // Set form data
    wrapper.vm.formData.title = 'Test Task'
    wrapper.vm.formData.duration = 3
    wrapper.vm.formData.adjustStartDate = true

    await wrapper.vm.handleSubmit()

    expect(submitSpy).toHaveBeenCalledWith('submit', expect.objectContaining({
      title: 'Test Task',
      duration: 3,
      adjustStartDate: true,
      projectId: 'test-project-id'
    }))
  })

  it('validates form including date validation', async () => {
    // Set invalid state from date picker
    wrapper.vm.isDateValidationValid = false
    wrapper.vm.dateValidationErrors = { startDate: 'Invalid date' }

    const isValid = wrapper.vm.validateForm()
    
    expect(isValid).toBe(false)
    expect(wrapper.vm.errors.startDate).toBe('Invalid date')
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