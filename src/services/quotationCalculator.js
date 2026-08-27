/**
 * QuotationCalculator - Static methods for project quotation calculations
 */

// Day name to JS getDay() value mapping
const DAY_NAME_TO_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

export class QuotationCalculator {
  /**
   * Calculate the number of working days in a date range according to the configured working days.
   * @param {Date|string} startDate - Start date (Date object or ISO string)
   * @param {Date|string} endDate - End date (Date object or ISO string)
   * @param {string[]} workingDays - Array of day name strings (e.g. ['monday','tuesday',...])
   * @returns {number} Number of working days in range
   */
  static calculateWorkingDaysInRange(startDate, endDate, workingDays) {
    const start = QuotationCalculator._parseLocalDate(startDate)
    const end = QuotationCalculator._parseLocalDate(endDate)

    // Build a Set of active day indices for O(1) lookup
    const activeDayIndices = new Set(
      (workingDays || []).map(day => DAY_NAME_TO_INDEX[day.toLowerCase()]).filter(idx => idx !== undefined)
    )

    let count = 0
    const current = new Date(start)

    while (current <= end) {
      if (activeDayIndices.has(current.getDay())) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }

  /**
   * Calculate total hours from project days and hours per day.
   * @param {number} projectDays - Number of working days in the project
   * @param {number} hoursPerDay - Hours worked per day
   * @returns {number} Total hours
   */
  static calculateTotalHours(projectDays, hoursPerDay) {
    return projectDays * hoursPerDay
  }

  /**
   * Calculate total cost from total hours and hourly rate.
   * @param {number} totalHours - Total hours
   * @param {number} hourlyRate - Cost per hour
   * @returns {number} Total cost
   */
  static calculateTotalCost(totalHours, hourlyRate) {
    return totalHours * hourlyRate
  }

  /**
   * Calculate the full project quotation.
   * @param {Object} project - Project object with startDate and endDate
   * @param {Object} config - Quotation config { workingDays, hoursPerDay, hourlyRate }
   * @returns {{ projectDays: number, totalHours: number, hourlyRate: number, totalCost: number } | null}
   */
  /**
   * Parse a date value into a local-timezone midnight Date to avoid UTC offset issues.
   * @param {Date|string} dateInput
   * @returns {Date}
   */
  static _parseLocalDate(dateInput) {
    if (dateInput instanceof Date) {
      return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
    }
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    const d = new Date(dateInput)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

  static calculateProjectQuotation(project, config) {
    if (!project || !project.endDate) {
      return null
    }

    const { workingDays, hoursPerDay, hourlyRate } = config

    const projectDays = QuotationCalculator.calculateWorkingDaysInRange(
      project.startDate,
      project.endDate,
      workingDays
    )

    const totalHours = QuotationCalculator.calculateTotalHours(projectDays, hoursPerDay)
    const totalCost = QuotationCalculator.calculateTotalCost(totalHours, hourlyRate)

    return {
      projectDays,
      totalHours,
      hourlyRate,
      totalCost
    }
  }
}
