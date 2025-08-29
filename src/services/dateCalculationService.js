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
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      throw new Error('Start date cannot be after end date');
    }

    let workingDays = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      if (this.isWorkingDay(currentDate)) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
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
      throw new Error('Start date is required');
    }

    if (days < 0) {
      throw new Error('Days must be a positive number');
    }

    if (days === 0) {
      return new Date(startDate);
    }

    const result = new Date(startDate);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      if (this.isWorkingDay(result)) {
        addedDays++;
      }
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