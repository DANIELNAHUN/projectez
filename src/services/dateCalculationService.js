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

    if (typeof days !== 'number' || days < 0 || isNaN(days)) {
      throw new Error('El número de días debe ser un número positivo válido');
    }

    if (days > 365) {
      throw new Error('No se pueden agregar más de 365 días laborales de una vez (máximo 1 año)');
    }

    if (days === 0) {
      return new Date(startDate);
    }

    const result = new Date(start);
    let addedDays = 0;
    let iterations = 0;
    const maxIterations = Math.min(days * 3, 1000); // More conservative limit

    try {
      while (addedDays < days && iterations < maxIterations) {
        result.setDate(result.getDate() + 1);
        
        // Additional safety check for date validity
        if (isNaN(result.getTime())) {
          throw new Error('Fecha calculada inválida durante el proceso');
        }
        
        if (this.isWorkingDay(result)) {
          addedDays++;
        }
        iterations++;
      }

      if (iterations >= maxIterations) {
        throw new Error(`Se alcanzó el límite máximo de iteraciones (${maxIterations}) al calcular ${days} días laborales`);
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
      throw new Error('La fecha de fin es requerida');
    }

    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new Error('La fecha de fin no es válida');
    }

    if (typeof days !== 'number' || days < 0 || isNaN(days)) {
      throw new Error('El número de días debe ser un número positivo válido');
    }

    if (days > 365) {
      throw new Error('No se pueden restar más de 365 días laborales de una vez (máximo 1 año)');
    }

    if (days === 0) {
      return new Date(endDate);
    }

    const result = new Date(end);
    let subtractedDays = 0;
    let iterations = 0;
    const maxIterations = Math.min(days * 3, 1000);

    try {
      while (subtractedDays < days && iterations < maxIterations) {
        result.setDate(result.getDate() - 1);
        
        // Additional safety check for date validity
        if (isNaN(result.getTime())) {
          throw new Error('Fecha calculada inválida durante el proceso');
        }
        
        if (this.isWorkingDay(result)) {
          subtractedDays++;
        }
        iterations++;
      }

      if (iterations >= maxIterations) {
        throw new Error(`Se alcanzó el límite máximo de iteraciones (${maxIterations}) al restar ${days} días laborales`);
      }
    } catch (error) {
      throw new Error(`Error al restar días laborales: ${error.message}`);
    }

    return result;
  }

  /**
   * Check if a date is a working day (Monday-Saturday, excluding Sunday)
   * Uses local timezone to avoid timezone-related issues
   * @param {Date} date - Date to check
   * @returns {boolean} True if it's a working day
   */
  static isWorkingDay(date) {
    if (!date) {
      throw new Error('Date is required');
    }

    // Create a new date in local timezone to avoid UTC/local timezone issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = localDate.getDay();
    
    // Sunday is 0, Monday is 1, Saturday is 6
    return dayOfWeek >= 1 && dayOfWeek <= 6;
  }

  /**
   * Create a date from string input, handling different formats consistently
   * @param {string|Date} dateInput - Date input in various formats
   * @returns {Date} Parsed date in local timezone
   */
  static parseDate(dateInput) {
    if (dateInput instanceof Date) {
      return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }

    if (typeof dateInput === 'string') {
      // Handle different date formats
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // ISO format: YYYY-MM-DD
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day); // Month is 0-indexed
      } else if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // Ambiguous format: DD/MM/YYYY or MM/DD/YYYY
        // We'll assume DD/MM/YYYY (European format) for consistency
        const [first, second, year] = dateInput.split('/').map(Number);
        // Assume DD/MM/YYYY format
        return new Date(year, second - 1, first);
      } else {
        // Let JavaScript parse it, but convert to local timezone
        const parsed = new Date(dateInput);
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      }
    }

    throw new Error('Invalid date input format');
  }

  /**
   * Get day name for debugging purposes
   * @param {Date} date - Date to get day name for
   * @returns {string} Day name
   */
  static getDayName(date) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dayNames[localDate.getDay()];
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