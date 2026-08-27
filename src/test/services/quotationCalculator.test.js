import { describe, it, expect } from 'vitest'
import { QuotationCalculator } from '../../services/quotationCalculator.js'

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

describe('QuotationCalculator', () => {
  describe('calculateWorkingDaysInRange', () => {
    it('counts Mon-Fri in a standard work week', () => {
      // 2024-01-08 (Mon) to 2024-01-12 (Fri) = 5 days
      const result = QuotationCalculator.calculateWorkingDaysInRange(
        '2024-01-08', '2024-01-12', WEEKDAYS
      )
      expect(result).toBe(5)
    })

    it('excludes weekend days when only weekdays are configured', () => {
      // 2024-01-08 (Mon) to 2024-01-14 (Sun) = 5 weekdays
      const result = QuotationCalculator.calculateWorkingDaysInRange(
        '2024-01-08', '2024-01-14', WEEKDAYS
      )
      expect(result).toBe(5)
    })

    it('counts all 7 days when all days are configured', () => {
      // 2024-01-08 (Mon) to 2024-01-14 (Sun) = 7 days
      const result = QuotationCalculator.calculateWorkingDaysInRange(
        '2024-01-08', '2024-01-14', ALL_DAYS
      )
      expect(result).toBe(7)
    })

    it('returns 1 when start equals end and that day is a working day', () => {
      // 2024-01-08 is a Monday
      const result = QuotationCalculator.calculateWorkingDaysInRange(
        '2024-01-08', '2024-01-08', WEEKDAYS
      )
      expect(result).toBe(1)
    })

    it('returns 0 when start equals end and that day is not a working day', () => {
      // 2024-01-07 is a Sunday
      const result = QuotationCalculator.calculateWorkingDaysInRange(
        '2024-01-07', '2024-01-07', WEEKDAYS
      )
      expect(result).toBe(0)
    })

    it('returns 0 when workingDays is empty', () => {
      const result = QuotationCalculator.calculateWorkingDaysInRange(
        '2024-01-08', '2024-01-14', []
      )
      expect(result).toBe(0)
    })

    it('accepts Date objects as input', () => {
      const start = new Date(2024, 0, 8) // Mon Jan 8
      const end = new Date(2024, 0, 12)  // Fri Jan 12
      const result = QuotationCalculator.calculateWorkingDaysInRange(start, end, WEEKDAYS)
      expect(result).toBe(5)
    })

    it('counts only saturdays when only saturday is configured', () => {
      // 2024-01-08 (Mon) to 2024-01-14 (Sun) has 1 Saturday (Jan 13)
      const result = QuotationCalculator.calculateWorkingDaysInRange(
        '2024-01-08', '2024-01-14', ['saturday']
      )
      expect(result).toBe(1)
    })
  })

  describe('calculateTotalHours', () => {
    it('multiplies project days by hours per day', () => {
      expect(QuotationCalculator.calculateTotalHours(5, 8)).toBe(40)
    })

    it('returns 0 when project days is 0', () => {
      expect(QuotationCalculator.calculateTotalHours(0, 8)).toBe(0)
    })

    it('handles fractional hours per day', () => {
      expect(QuotationCalculator.calculateTotalHours(2, 7.5)).toBe(15)
    })
  })

  describe('calculateTotalCost', () => {
    it('multiplies total hours by hourly rate', () => {
      expect(QuotationCalculator.calculateTotalCost(40, 50)).toBe(2000)
    })

    it('returns 0 when hourly rate is 0', () => {
      expect(QuotationCalculator.calculateTotalCost(40, 0)).toBe(0)
    })

    it('handles decimal hourly rates', () => {
      expect(QuotationCalculator.calculateTotalCost(10, 12.5)).toBe(125)
    })
  })

  describe('calculateProjectQuotation', () => {
    const config = { workingDays: WEEKDAYS, hoursPerDay: 8, hourlyRate: 50 }

    it('returns correct quotation for a project with start and end dates', () => {
      const project = { startDate: '2024-01-08', endDate: '2024-01-12' }
      const result = QuotationCalculator.calculateProjectQuotation(project, config)
      expect(result).toEqual({
        projectDays: 5,
        totalHours: 40,
        hourlyRate: 50,
        totalCost: 2000
      })
    })

    it('returns null when project has no endDate', () => {
      const project = { startDate: '2024-01-08', endDate: null }
      expect(QuotationCalculator.calculateProjectQuotation(project, config)).toBeNull()
    })

    it('returns null when project is null', () => {
      expect(QuotationCalculator.calculateProjectQuotation(null, config)).toBeNull()
    })

    it('returns null when project has no endDate property', () => {
      const project = { startDate: '2024-01-08' }
      expect(QuotationCalculator.calculateProjectQuotation(project, config)).toBeNull()
    })

    it('totalCost equals projectDays * hoursPerDay * hourlyRate', () => {
      const project = { startDate: '2024-01-08', endDate: '2024-01-19' } // 2 weeks
      const result = QuotationCalculator.calculateProjectQuotation(project, config)
      expect(result.totalCost).toBe(result.projectDays * config.hoursPerDay * config.hourlyRate)
    })
  })
})
