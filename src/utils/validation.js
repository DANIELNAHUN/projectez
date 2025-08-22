// Data validation utilities for the Personal Project Manager

import { 
  PROJECT_STATUSES, 
  TASK_STATUSES, 
  TASK_TYPES, 
  TASK_PRIORITIES, 
  DELIVERABLE_TYPES, 
  DELIVERABLE_STATUSES 
} from '../models/index.js';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Generic validation utilities
 */
export const validators = {
  required: (value, fieldName) => {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} es requerido`, fieldName);
    }
    return true;
  },

  email: (value, fieldName) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new ValidationError(`${fieldName} debe ser un email válido`, fieldName);
    }
    return true;
  },

  date: (value, fieldName) => {
    if (value && !(value instanceof Date) && isNaN(new Date(value))) {
      throw new ValidationError(`${fieldName} debe ser una fecha válida`, fieldName);
    }
    return true;
  },

  dateRange: (startDate, endDate, startFieldName, endFieldName) => {
    if (startDate && endDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      if (start > end) {
        throw new ValidationError(`${endFieldName} debe ser posterior a ${startFieldName}`, endFieldName);
      }
    }
    return true;
  },

  inArray: (value, array, fieldName) => {
    if (value && !array.includes(value)) {
      throw new ValidationError(`${fieldName} debe ser uno de: ${array.join(', ')}`, fieldName);
    }
    return true;
  },

  range: (value, min, max, fieldName) => {
    if (value !== null && value !== undefined) {
      const num = Number(value);
      if (isNaN(num) || num < min || num > max) {
        throw new ValidationError(`${fieldName} debe estar entre ${min} y ${max}`, fieldName);
      }
    }
    return true;
  },

  maxLength: (value, maxLength, fieldName) => {
    if (value && value.length > maxLength) {
      throw new ValidationError(`${fieldName} no puede exceder ${maxLength} caracteres`, fieldName);
    }
    return true;
  }
};

/**
 * Project validation
 */
export const validateProject = (project) => {
  const errors = [];

  try {
    validators.required(project.name, 'Nombre del proyecto');
    validators.maxLength(project.name, 100, 'Nombre del proyecto');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.maxLength(project.description, 500, 'Descripción del proyecto');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.required(project.startDate, 'Fecha de inicio');
    validators.date(project.startDate, 'Fecha de inicio');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.date(project.endDate, 'Fecha de fin');
    validators.dateRange(project.startDate, project.endDate, 'Fecha de inicio', 'Fecha de fin');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.inArray(project.status, PROJECT_STATUSES, 'Estado del proyecto');
  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    throw new ValidationError('Errores de validación en el proyecto', null, errors);
  }

  return true;
};

/**
 * Task validation
 */
export const validateTask = (task, maxNestingLevel = 100) => {
  const errors = [];

  try {
    validators.required(task.title, 'Título de la tarea');
    validators.maxLength(task.title, 200, 'Título de la tarea');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.maxLength(task.description, 1000, 'Descripción de la tarea');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.required(task.startDate, 'Fecha de inicio');
    validators.date(task.startDate, 'Fecha de inicio');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.required(task.endDate, 'Fecha de fin');
    validators.date(task.endDate, 'Fecha de fin');
    validators.dateRange(task.startDate, task.endDate, 'Fecha de inicio', 'Fecha de fin');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.inArray(task.status, TASK_STATUSES, 'Estado de la tarea');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.inArray(task.type, TASK_TYPES, 'Tipo de tarea');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.inArray(task.priority, TASK_PRIORITIES, 'Prioridad de la tarea');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.range(task.progress, 0, 100, 'Progreso de la tarea');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.range(task.level, 0, maxNestingLevel, 'Nivel de anidación');
  } catch (error) {
    errors.push(error);
  }

  // Validate deliverable if task type is 'with_deliverable'
  if (task.type === 'with_deliverable' && task.deliverable) {
    try {
      validateDeliverable(task.deliverable);
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Errores de validación en la tarea', null, errors);
  }

  return true;
};/**
 
* TeamMember validation
 */
export const validateTeamMember = (member) => {
  const errors = [];

  try {
    validators.required(member.name, 'Nombre del miembro');
    validators.maxLength(member.name, 100, 'Nombre del miembro');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.required(member.email, 'Email del miembro');
    validators.email(member.email, 'Email del miembro');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.required(member.role, 'Rol del miembro');
    validators.maxLength(member.role, 50, 'Rol del miembro');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.date(member.joinedAt, 'Fecha de ingreso');
  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    throw new ValidationError('Errores de validación en el miembro del equipo', null, errors);
  }

  return true;
};

/**
 * Deliverable validation
 */
export const validateDeliverable = (deliverable) => {
  const errors = [];

  try {
    validators.inArray(deliverable.type, DELIVERABLE_TYPES, 'Tipo de entregable');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.required(deliverable.description, 'Descripción del entregable');
    validators.maxLength(deliverable.description, 500, 'Descripción del entregable');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.required(deliverable.dueDate, 'Fecha de entrega');
    validators.date(deliverable.dueDate, 'Fecha de entrega');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.inArray(deliverable.status, DELIVERABLE_STATUSES, 'Estado del entregable');
  } catch (error) {
    errors.push(error);
  }

  try {
    validators.maxLength(deliverable.notes, 1000, 'Notas del entregable');
  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    throw new ValidationError('Errores de validación en el entregable', null, errors);
  }

  return true;
};

/**
 * Batch validation utility
 */
export const validateBatch = (items, validator) => {
  const errors = [];
  
  items.forEach((item, index) => {
    try {
      validator(item);
    } catch (error) {
      errors.push({
        index,
        error: error.message,
        field: error.field
      });
    }
  });

  if (errors.length > 0) {
    throw new ValidationError('Errores de validación en lote', null, errors);
  }

  return true;
};