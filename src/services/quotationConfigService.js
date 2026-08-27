const STORAGE_KEY = 'pm_quotation_config'

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DEFAULT_CONFIG = {
  hourlyRate: 0,
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  hoursPerDay: 8
}

const QuotationConfigService = {
  /**
   * Loads quotation config from localStorage.
   * Returns default values if data is absent or corrupt.
   * @returns {Object} QuotationConfig
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) {
        return { ...DEFAULT_CONFIG, workingDays: [...DEFAULT_CONFIG.workingDays] }
      }

      const parsed = JSON.parse(raw)
      const { valid } = this.validate(parsed)

      if (!valid) {
        console.warn(
          '[QuotationConfigService] Stored config is invalid or corrupt. Restoring defaults.',
          parsed
        )
        return { ...DEFAULT_CONFIG, workingDays: [...DEFAULT_CONFIG.workingDays] }
      }

      return {
        hourlyRate: parsed.hourlyRate,
        workingDays: [...parsed.workingDays],
        hoursPerDay: parsed.hoursPerDay
      }
    } catch (e) {
      console.warn('[QuotationConfigService] Failed to parse stored config. Restoring defaults.', e)
      return { ...DEFAULT_CONFIG, workingDays: [...DEFAULT_CONFIG.workingDays] }
    }
  },

  /**
   * Serializes and writes config to localStorage.
   * @param {Object} config - QuotationConfig to persist
   * @throws {Error} if saving fails
   */
  save(config) {
    try {
      const serialized = JSON.stringify({
        hourlyRate: config.hourlyRate,
        workingDays: config.workingDays,
        hoursPerDay: config.hoursPerDay
      })
      localStorage.setItem(STORAGE_KEY, serialized)
    } catch (e) {
      throw new Error(`[QuotationConfigService] Failed to save config: ${e.message}`)
    }
  },

  /**
   * Validates a config object, checking types and ranges.
   * @param {*} data - Data to validate
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(data) {
    const errors = []

    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, errors: ['Config must be a plain object'] }
    }

    // Validate hourlyRate
    if (typeof data.hourlyRate !== 'number' || isNaN(data.hourlyRate)) {
      errors.push('hourlyRate must be a number')
    } else if (data.hourlyRate <= 0) {
      errors.push('hourlyRate must be greater than 0')
    }

    // Validate workingDays
    if (!Array.isArray(data.workingDays)) {
      errors.push('workingDays must be an array')
    } else if (data.workingDays.length === 0) {
      errors.push('workingDays must contain at least one day')
    } else {
      const invalidDays = data.workingDays.filter(d => !VALID_DAYS.includes(d))
      if (invalidDays.length > 0) {
        errors.push(`workingDays contains invalid values: ${invalidDays.join(', ')}`)
      }
    }

    // Validate hoursPerDay
    if (typeof data.hoursPerDay !== 'number' || isNaN(data.hoursPerDay)) {
      errors.push('hoursPerDay must be a number')
    } else if (!Number.isInteger(data.hoursPerDay)) {
      errors.push('hoursPerDay must be an integer')
    } else if (data.hoursPerDay < 1 || data.hoursPerDay > 24) {
      errors.push('hoursPerDay must be between 1 and 24 inclusive')
    }

    return { valid: errors.length === 0, errors }
  }
}

export default QuotationConfigService
export { STORAGE_KEY, DEFAULT_CONFIG, VALID_DAYS }
