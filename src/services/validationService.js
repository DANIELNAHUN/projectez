/**
 * Comprehensive validation service
 */

import { 
  validateProject, 
  validateTask, 
  validateTeamMember, 
  validateDeliverable,
  ValidationError,
  validators
} from '../utils/validation.js'
import { useNotifications } from './notificationService.js'

class ValidationService {
  constructor() {
    this.validationCache = new Map()
    this.customValidators = new Map()
  }

  // Get notifications instance
  getNotifications() {
    return useNotifications()
  }

  // Register custom validator
  registerValidator(name, validator) {
    this.customValidators.set(name, validator)
  }

  // Get custom validator
  getValidator(name) {
    return this.customValidators.get(name) || validators[name]
  }

  // Clear validation cache
  clearCache() {
    this.validationCache.clear()
  }

  // Validate with caching
  async validateWithCache(key, data, validator) {
    const cacheKey = `${key}_${JSON.stringify(data)}`
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)
    }

    try {
      const result = await validator(data)
      this.validationCache.set(cacheKey, { success: true, result })
      return { success: true, result }
    } catch (error) {
      const errorResult = { success: false, error }
      this.validationCache.set(cacheKey, errorResult)
      return errorResult
    }
  }

  // Project validation
  async validateProjectData(project, options = {}) {
    const { showNotification = false, context = 'proyecto' } = options

    try {
      const result = await this.validateWithCache('project', project, validateProject)
      
      if (!result.success) {
        if (showNotification) {
          const notifications = this.getNotifications()
          notifications.validationError(result.error, context)
        }
        return { isValid: false, errors: this.formatValidationErrors(result.error) }
      }

      return { isValid: true, errors: [] }
    } catch (error) {
      console.error('Project validation error:', error)
      return { isValid: false, errors: [{ field: 'general', message: error.message }] }
    }
  }

  // Task validation
  async validateTaskData(task, options = {}) {
    const { showNotification = false, context = 'tarea', maxNestingLevel = 100 } = options

    try {
      const result = await this.validateWithCache(
        `task_${maxNestingLevel}`, 
        task, 
        (data) => validateTask(data, maxNestingLevel)
      )
      
      if (!result.success) {
        if (showNotification) {
          const notifications = this.getNotifications()
          notifications.validationError(result.error, context)
        }
        return { isValid: false, errors: this.formatValidationErrors(result.error) }
      }

      return { isValid: true, errors: [] }
    } catch (error) {
      console.error('Task validation error:', error)
      return { isValid: false, errors: [{ field: 'general', message: error.message }] }
    }
  }

  // Team member validation
  async validateTeamMemberData(member, options = {}) {
    const { showNotification = false, context = 'miembro del equipo' } = options

    try {
      const result = await this.validateWithCache('teamMember', member, validateTeamMember)
      
      if (!result.success) {
        if (showNotification) {
          const notifications = this.getNotifications()
          notifications.validationError(result.error, context)
        }
        return { isValid: false, errors: this.formatValidationErrors(result.error) }
      }

      return { isValid: true, errors: [] }
    } catch (error) {
      console.error('Team member validation error:', error)
      return { isValid: false, errors: [{ field: 'general', message: error.message }] }
    }
  }

  // Deliverable validation
  async validateDeliverableData(deliverable, options = {}) {
    const { showNotification = false, context = 'entregable' } = options

    try {
      const result = await this.validateWithCache('deliverable', deliverable, validateDeliverable)
      
      if (!result.success) {
        if (showNotification) {
          const notifications = this.getNotifications()
          notifications.validationError(result.error, context)
        }
        return { isValid: false, errors: this.formatValidationErrors(result.error) }
      }

      return { isValid: true, errors: [] }
    } catch (error) {
      console.error('Deliverable validation error:', error)
      return { isValid: false, errors: [{ field: 'general', message: error.message }] }
    }
  }

  // Batch validation
  async validateBatch(items, validator, options = {}) {
    const { showProgress = false, showNotification = true } = options
    const results = []
    let progressToastId = null

    if (showProgress) {
      const notifications = this.getNotifications()
      progressToastId = notifications.showProgress(
        'Validando Datos',
        `Validando ${items.length} elemento${items.length > 1 ? 's' : ''}...`,
        0
      )
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await validator(items[i])
        results.push({ index: i, success: true, data: items[i] })
      } catch (error) {
        results.push({ 
          index: i, 
          success: false, 
          data: items[i], 
          error: this.formatValidationErrors(error) 
        })
      }

      if (showProgress && progressToastId) {
        const progress = Math.round(((i + 1) / items.length) * 100)
        const notifications = this.getNotifications()
        notifications.updateProgress(
          progressToastId, 
          progress, 
          `${i + 1} de ${items.length} validados`
        )
      }
    }

    const notifications = this.getNotifications()
    
    if (showProgress && progressToastId) {
      notifications.completeProgress(progressToastId, 'Validación completada')
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    if (showNotification && errorCount > 0) {
      notifications.warning(
        'Validación Completada',
        `${successCount} válidos, ${errorCount} con errores`
      )
    }

    return {
      results,
      successCount,
      errorCount,
      isValid: errorCount === 0
    }
  }

  // Real-time validation
  createRealTimeValidator(validationRules, debounceMs = 300) {
    let timeoutId = null
    const errors = new Map()

    return {
      validate: (fieldName, value) => {
        return new Promise((resolve) => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }

          timeoutId = setTimeout(async () => {
            try {
              const rules = validationRules[fieldName]
              if (!rules) {
                resolve({ isValid: true, error: null })
                return
              }

              for (const rule of rules) {
                if (typeof rule === 'function') {
                  await rule(value, fieldName)
                } else if (typeof rule === 'object') {
                  const { validator, message, ...params } = rule
                  const validatorFn = this.getValidator(validator)
                  
                  if (validatorFn) {
                    try {
                      await validatorFn(value, fieldName, ...Object.values(params))
                    } catch (error) {
                      throw new ValidationError(message || error.message, fieldName)
                    }
                  }
                }
              }

              errors.delete(fieldName)
              resolve({ isValid: true, error: null })
            } catch (error) {
              errors.set(fieldName, error.message)
              resolve({ isValid: false, error: error.message })
            }
          }, debounceMs)
        })
      },

      getErrors: () => Object.fromEntries(errors),
      hasErrors: () => errors.size > 0,
      clearError: (fieldName) => errors.delete(fieldName),
      clearAllErrors: () => errors.clear()
    }
  }

  // Cross-field validation
  async validateCrossFields(data, rules) {
    const errors = []

    for (const rule of rules) {
      try {
        await rule(data)
      } catch (error) {
        errors.push({
          fields: rule.fields || [],
          message: error.message
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Business rule validation
  async validateBusinessRules(data, type, context = {}) {
    const errors = []

    switch (type) {
      case 'project':
        errors.push(...await this.validateProjectBusinessRules(data, context))
        break
      case 'task':
        errors.push(...await this.validateTaskBusinessRules(data, context))
        break
      case 'teamMember':
        errors.push(...await this.validateTeamMemberBusinessRules(data, context))
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Project business rules
  async validateProjectBusinessRules(project, context) {
    const errors = []

    // Check for duplicate project names
    if (context.existingProjects) {
      const duplicate = context.existingProjects.find(p => 
        p.name.toLowerCase() === project.name.toLowerCase() && 
        p.id !== project.id
      )
      if (duplicate) {
        errors.push({
          field: 'name',
          message: 'Ya existe un proyecto con este nombre'
        })
      }
    }

    // Check date logic
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate)
      const end = new Date(project.endDate)
      const now = new Date()

      if (start > end) {
        errors.push({
          field: 'endDate',
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        })
      }

      // Warn about past dates for new projects
      if (!project.id && start < now) {
        errors.push({
          field: 'startDate',
          message: 'La fecha de inicio está en el pasado',
          severity: 'warning'
        })
      }
    }

    return errors
  }

  // Task business rules
  async validateTaskBusinessRules(task, context) {
    const errors = []

    // Check nesting level
    if (context.maxNestingLevel && task.level >= context.maxNestingLevel) {
      errors.push({
        field: 'parentTaskId',
        message: `Se ha alcanzado el límite máximo de anidación (${context.maxNestingLevel} niveles)`
      })
    }

    // Check parent task dates
    if (context.parentTask && task.startDate && task.endDate) {
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      const parentStart = new Date(context.parentTask.startDate)
      const parentEnd = new Date(context.parentTask.endDate)

      if (taskStart < parentStart || taskEnd > parentEnd) {
        errors.push({
          field: 'dateRange',
          message: 'Las fechas de la tarea deben estar dentro del rango de la tarea padre'
        })
      }
    }

    // Check deliverable dates
    if (task.type === 'with_deliverable' && task.deliverable) {
      const taskEnd = new Date(task.endDate)
      const deliverableDate = new Date(task.deliverable.dueDate)

      if (deliverableDate > taskEnd) {
        errors.push({
          field: 'deliverable.dueDate',
          message: 'La fecha de entrega no puede ser posterior a la fecha de fin de la tarea'
        })
      }
    }

    return errors
  }

  // Team member business rules
  async validateTeamMemberBusinessRules(member, context) {
    const errors = []

    // Check for duplicate emails
    if (context.existingMembers) {
      const duplicate = context.existingMembers.find(m => 
        m.email.toLowerCase() === member.email.toLowerCase() && 
        m.id !== member.id
      )
      if (duplicate) {
        errors.push({
          field: 'email',
          message: 'Ya existe un miembro con este email'
        })
      }
    }

    return errors
  }

  // Format validation errors
  formatValidationErrors(error) {
    if (error instanceof ValidationError) {
      if (error.errors && Array.isArray(error.errors)) {
        return error.errors.map(err => ({
          field: err.field || 'general',
          message: err.message
        }))
      }
      return [{
        field: error.field || 'general',
        message: error.message
      }]
    }

    return [{
      field: 'general',
      message: error.message || 'Error de validación desconocido'
    }]
  }

  // Get validation summary
  getValidationSummary(errors) {
    const fieldErrors = errors.filter(e => e.field !== 'general')
    const generalErrors = errors.filter(e => e.field === 'general')

    return {
      totalErrors: errors.length,
      fieldErrors: fieldErrors.length,
      generalErrors: generalErrors.length,
      fields: [...new Set(fieldErrors.map(e => e.field))],
      messages: errors.map(e => e.message)
    }
  }
}

// Create singleton instance
export const validationService = new ValidationService()

// Export composable for use in components
export function useValidation() {
  return {
    validate: validationService,
    
    // Convenience methods
    validateProject: (project, options) => validationService.validateProjectData(project, options),
    validateTask: (task, options) => validationService.validateTaskData(task, options),
    validateTeamMember: (member, options) => validationService.validateTeamMemberData(member, options),
    validateDeliverable: (deliverable, options) => validationService.validateDeliverableData(deliverable, options),
    
    // Batch validation
    validateBatch: (items, validator, options) => validationService.validateBatch(items, validator, options),
    
    // Real-time validation
    createRealTimeValidator: (rules, debounce) => validationService.createRealTimeValidator(rules, debounce),
    
    // Business rules
    validateBusinessRules: (data, type, context) => validationService.validateBusinessRules(data, type, context),
    
    // Utilities
    formatErrors: (error) => validationService.formatValidationErrors(error),
    getValidationSummary: (errors) => validationService.getValidationSummary(errors)
  }
}