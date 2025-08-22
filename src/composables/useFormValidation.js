/**
 * Composable for comprehensive form validation
 */

import { ref, reactive, computed, watch, readonly } from 'vue'
import { validators, ValidationError } from '../utils/validation.js'
import { useToast } from './useToast.js'

export function useFormValidation(validationRules = {}) {
  const { error: showErrorToast } = useToast()
  
  // Form state
  const errors = ref({})
  const touched = ref({})
  const isValidating = ref(false)
  const hasValidated = ref(false)

  // Computed properties
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)
  const isValid = computed(() => !hasErrors.value && hasValidated.value)

  // Clear all errors
  const clearErrors = () => {
    errors.value = {}
    touched.value = {}
    hasValidated.value = false
  }

  // Clear specific field error
  const clearFieldError = (fieldName) => {
    if (errors.value[fieldName]) {
      delete errors.value[fieldName]
      errors.value = { ...errors.value }
    }
  }

  // Set field error
  const setFieldError = (fieldName, message) => {
    errors.value = {
      ...errors.value,
      [fieldName]: message
    }
  }

  // Mark field as touched
  const touchField = (fieldName) => {
    touched.value = {
      ...touched.value,
      [fieldName]: true
    }
  }

  // Validate single field
  const validateField = async (fieldName, value, customRules = null) => {
    const rules = customRules || validationRules[fieldName]
    if (!rules) return true

    try {
      clearFieldError(fieldName)
      
      // Apply validation rules
      for (const rule of rules) {
        if (typeof rule === 'function') {
          await rule(value, fieldName)
        } else if (typeof rule === 'object') {
          const { validator, message, ...params } = rule
          try {
            if (typeof validator === 'string' && validators[validator]) {
              validators[validator](value, fieldName, ...Object.values(params))
            } else if (typeof validator === 'function') {
              await validator(value, fieldName, params)
            }
          } catch (error) {
            throw new ValidationError(message || error.message, fieldName)
          }
        }
      }
      
      return true
    } catch (error) {
      setFieldError(fieldName, error.message)
      return false
    }
  }

  // Validate all fields
  const validateForm = async (formData) => {
    isValidating.value = true
    clearErrors()
    
    try {
      const validationPromises = Object.keys(validationRules).map(async (fieldName) => {
        const value = formData[fieldName]
        return validateField(fieldName, value)
      })

      const results = await Promise.all(validationPromises)
      hasValidated.value = true
      
      const isFormValid = results.every(result => result === true)
      
      if (!isFormValid) {
        // Show error toast with summary
        const errorCount = Object.keys(errors.value).length
        showErrorToast(
          'Errores de Validación',
          `Se encontraron ${errorCount} error${errorCount > 1 ? 'es' : ''} en el formulario. Por favor, revisa los campos marcados.`
        )
      }
      
      return isFormValid
    } catch (error) {
      console.error('Form validation error:', error)
      showErrorToast(
        'Error de Validación',
        'Ocurrió un error inesperado durante la validación del formulario.'
      )
      return false
    } finally {
      isValidating.value = false
    }
  }

  // Real-time validation for a field
  const createFieldValidator = (fieldName) => {
    return async (value) => {
      if (touched.value[fieldName]) {
        await validateField(fieldName, value)
      }
    }
  }

  // Get field error message
  const getFieldError = (fieldName) => {
    return errors.value[fieldName] || null
  }

  // Check if field has error
  const hasFieldError = (fieldName) => {
    return !!errors.value[fieldName]
  }

  // Check if field is touched
  const isFieldTouched = (fieldName) => {
    return !!touched.value[fieldName]
  }

  // Get field validation state
  const getFieldState = (fieldName) => {
    return {
      error: getFieldError(fieldName),
      hasError: hasFieldError(fieldName),
      isTouched: isFieldTouched(fieldName),
      isValid: !hasFieldError(fieldName) && isFieldTouched(fieldName)
    }
  }

  // Custom validation rules
  const customValidators = {
    // Async email uniqueness check (example)
    uniqueEmail: async (value, fieldName, { existingEmails = [] }) => {
      if (value && existingEmails.includes(value.toLowerCase())) {
        throw new ValidationError(`Este email ya está en uso`, fieldName)
      }
    },

    // Project name uniqueness
    uniqueProjectName: async (value, fieldName, { existingNames = [] }) => {
      if (value && existingNames.some(name => name.toLowerCase() === value.toLowerCase())) {
        throw new ValidationError(`Ya existe un proyecto con este nombre`, fieldName)
      }
    },

    // Task title within project uniqueness
    uniqueTaskTitle: async (value, fieldName, { existingTitles = [] }) => {
      if (value && existingTitles.some(title => title.toLowerCase() === value.toLowerCase())) {
        throw new ValidationError(`Ya existe una tarea con este título en el proyecto`, fieldName)
      }
    },

    // Future date validation
    futureDate: (value, fieldName) => {
      if (value) {
        const date = new Date(value)
        const now = new Date()
        now.setHours(0, 0, 0, 0) // Reset time to compare only dates
        
        if (date < now) {
          throw new ValidationError(`${fieldName} debe ser una fecha futura`, fieldName)
        }
      }
    },

    // Business hours validation (example)
    businessHours: (value, fieldName) => {
      if (value) {
        const date = new Date(value)
        const hour = date.getHours()
        const day = date.getDay()
        
        if (day === 0 || day === 6) { // Weekend
          throw new ValidationError(`${fieldName} debe ser en día laboral`, fieldName)
        }
        
        if (hour < 8 || hour > 18) { // Outside business hours
          throw new ValidationError(`${fieldName} debe ser en horario laboral (8:00 - 18:00)`, fieldName)
        }
      }
    },

    // File size validation
    fileSize: (file, fieldName, { maxSize = 5 * 1024 * 1024 }) => { // 5MB default
      if (file && file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024))
        throw new ValidationError(`${fieldName} no puede exceder ${maxSizeMB}MB`, fieldName)
      }
    },

    // File type validation
    fileType: (file, fieldName, { allowedTypes = [] }) => {
      if (file && allowedTypes.length > 0) {
        const fileType = file.type || ''
        const fileName = file.name || ''
        const fileExtension = fileName.split('.').pop()?.toLowerCase()
        
        const isValidType = allowedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.substring(1)
          }
          return fileType.includes(type)
        })
        
        if (!isValidType) {
          throw new ValidationError(`${fieldName} debe ser de tipo: ${allowedTypes.join(', ')}`, fieldName)
        }
      }
    }
  }

  // Add custom validator
  const addCustomValidator = (name, validator) => {
    customValidators[name] = validator
  }

  // Get custom validator
  const getCustomValidator = (name) => {
    return customValidators[name]
  }

  return {
    // State
    errors: readonly(errors),
    touched: readonly(touched),
    isValidating: readonly(isValidating),
    hasValidated: readonly(hasValidated),
    
    // Computed
    hasErrors,
    isValid,
    
    // Methods
    clearErrors,
    clearFieldError,
    setFieldError,
    touchField,
    validateField,
    validateForm,
    createFieldValidator,
    getFieldError,
    hasFieldError,
    isFieldTouched,
    getFieldState,
    
    // Custom validators
    customValidators,
    addCustomValidator,
    getCustomValidator
  }
}

// Predefined validation rule sets
export const validationRules = {
  project: {
    name: [
      { validator: 'required', message: 'El nombre del proyecto es requerido' },
      { validator: 'maxLength', maxLength: 100, message: 'El nombre no puede exceder 100 caracteres' }
    ],
    description: [
      { validator: 'maxLength', maxLength: 500, message: 'La descripción no puede exceder 500 caracteres' }
    ],
    startDate: [
      { validator: 'required', message: 'La fecha de inicio es requerida' },
      { validator: 'date', message: 'Debe ser una fecha válida' }
    ],
    endDate: [
      { validator: 'date', message: 'Debe ser una fecha válida' }
    ]
  },

  task: {
    title: [
      { validator: 'required', message: 'El título de la tarea es requerido' },
      { validator: 'maxLength', maxLength: 200, message: 'El título no puede exceder 200 caracteres' }
    ],
    description: [
      { validator: 'maxLength', maxLength: 1000, message: 'La descripción no puede exceder 1000 caracteres' }
    ],
    startDate: [
      { validator: 'required', message: 'La fecha de inicio es requerida' },
      { validator: 'date', message: 'Debe ser una fecha válida' }
    ],
    endDate: [
      { validator: 'required', message: 'La fecha de fin es requerida' },
      { validator: 'date', message: 'Debe ser una fecha válida' }
    ],
    progress: [
      { validator: 'range', min: 0, max: 100, message: 'El progreso debe estar entre 0 y 100' }
    ]
  },

  teamMember: {
    name: [
      { validator: 'required', message: 'El nombre es requerido' },
      { validator: 'maxLength', maxLength: 100, message: 'El nombre no puede exceder 100 caracteres' }
    ],
    email: [
      { validator: 'required', message: 'El email es requerido' },
      { validator: 'email', message: 'Debe ser un email válido' }
    ],
    role: [
      { validator: 'required', message: 'El rol es requerido' },
      { validator: 'maxLength', maxLength: 50, message: 'El rol no puede exceder 50 caracteres' }
    ]
  },

  deliverable: {
    description: [
      { validator: 'required', message: 'La descripción del entregable es requerida' },
      { validator: 'maxLength', maxLength: 500, message: 'La descripción no puede exceder 500 caracteres' }
    ],
    dueDate: [
      { validator: 'required', message: 'La fecha de entrega es requerida' },
      { validator: 'date', message: 'Debe ser una fecha válida' }
    ],
    notes: [
      { validator: 'maxLength', maxLength: 1000, message: 'Las notas no pueden exceder 1000 caracteres' }
    ]
  }
}