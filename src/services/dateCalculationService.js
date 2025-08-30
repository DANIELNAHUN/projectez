/**
 * DateCalculationService - Handles working day calculations and date operations
 * Working days are Monday through Saturday (excluding Sunday)
 */
export class DateCalculationService {
  /**
   * Calculate working days between two dates (Monday-Saturday, excluding Sunday)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Number of working days
   */
  static calculateWorkingDays(startDate, endDate) {
    // Enhanced validation with user-friendly error messages
    if (!startDate || !endDate) {
      throw new Error('Las fechas de inicio y fin son requeridas para el cálculo');
    }

    // Validate date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime())) {
      throw new Error('La fecha de inicio no es válida. Usa el formato correcto de fecha');
    }
    
    if (isNaN(end.getTime())) {
      throw new Error('La fecha de fin no es válida. Usa el formato correcto de fecha');
    }
    
    if (start > end) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
    }

    // Check for reasonable date range (not more than 10 years)
    const maxDays = 10 * 365; // 10 years
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (totalDays > maxDays) {
      throw new Error(`El rango de fechas es demasiado amplio (${totalDays} días). Máximo permitido: ${maxDays} días`);
    }

    let workingDays = 0;
    const currentDate = new Date(start);

    try {
      while (currentDate <= end) {
        if (this.isWorkingDay(currentDate)) {
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      throw new Error(`Error durante el cálculo de días laborales: ${error.message}`);
    }

    return workingDays;
  }

  /**
   * Add working days to a date
   * @param {Date} startDate - Starting date
   * @param {number} days - Number of working days to add
   * @returns {Date} New date after adding working days
   */
  static addWorkingDays(startDate, days) {
    if (!startDate) {
      throw new Error('La fecha de inicio es requerida para agregar días laborales');
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error('La fecha de inicio no es válida');
    }

    if (typeof days !== 'number' || days < 0) {
      throw new Error('El número de días debe ser un número positivo');
    }

    if (days > 1000) {
      throw new Error('No se pueden agregar más de 1000 días laborales de una vez');
    }

    if (days === 0) {
      return new Date(startDate);
    }

    const result = new Date(start);
    let addedDays = 0;
    let iterations = 0;
    const maxIterations = days * 2; // Safety limit

    try {
      while (addedDays < days && iterations < maxIterations) {
        result.setDate(result.getDate() + 1);
        if (this.isWorkingDay(result)) {
          addedDays++;
        }
        iterations++;
      }

      if (iterations >= maxIterations) {
        throw new Error('Se alcanzó el límite máximo de iteraciones en el cálculo de fechas');
      }
    } catch (error) {
      throw new Error(`Error al agregar días laborales: ${error.message}`);
    }

    return result;
  }

  /**
   * Subtract working days from a date
   * @param {Date} endDate - End date
   * @param {number} days - Number of working days to subtract
   * @returns {Date} New date after subtracting working days
   */
  static subtractWorkingDays(endDate, days) {
    if (!endDate) {
      throw new Error('End date is required');
    }

    if (days < 0) {
      throw new Error('Days must be a positive number');
    }

    if (days === 0) {
      return new Date(endDate);
    }

    const result = new Date(endDate);
    let subtractedDays = 0;

    while (subtractedDays < days) {
      result.setDate(result.getDate() - 1);
      if (this.isWorkingDay(result)) {
        subtractedDays++;
      }
    }

    return result;
  }

  /**
   * Check if a date is a working day (Monday-Saturday, excluding Sunday)
   * @param {Date} date - Date to check
   * @returns {boolean} True if it's a working day
   */
  static isWorkingDay(date) {
    if (!date) {
      throw new Error('Date is required');
    }

    const dayOfWeek = date.getDay();
    // Sunday is 0, Monday is 1, Saturday is 6
    return dayOfWeek >= 1 && dayOfWeek <= 6;
  }

  /**
   * Validate date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {boolean} True if date range is valid
   */
  static validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return false;
    }

    return startDate <= endDate;
  }
}