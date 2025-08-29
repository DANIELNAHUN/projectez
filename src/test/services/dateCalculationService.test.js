import { describe, it, expect } from 'vitest';
import { DateCalculationService } from '../../services/dateCalculationService.js';

describe('DateCalculationService', () => {
  describe('calculateWorkingDays', () => {
    it('should calculate working days correctly for same day', () => {
      const date = new Date('2024-01-16'); // Monday
      const result = DateCalculationService.calculateWorkingDays(date, date);
      expect(result).toBe(1);
    });

    it('should calculate working days for a full week (Mon-Sat)', () => {
      const monday = new Date('2024-01-16'); // Monday
      const saturday = new Date('2024-01-21'); // Saturday
      const result = DateCalculationService.calculateWorkingDays(monday, saturday);
      expect(result).toBe(6); // Mon, Tue, Wed, Thu, Fri, Sat
    });

    it('should exclude Sundays from working days', () => {
      const friday = new Date('2024-01-20'); // Friday
      const monday = new Date('2024-01-23'); // Monday (next week)
      const result = DateCalculationService.calculateWorkingDays(friday, monday);
      expect(result).toBe(3); // Fri, Sat, Mon
    });

    it('should handle multiple weeks correctly', () => {
      const start = new Date('2024-01-16'); // Monday
      const end = new Date('2024-01-30'); // Tuesday (2 weeks later)
      const result = DateCalculationService.calculateWorkingDays(start, end);
      expect(result).toBe(13); // 2 full weeks (12) + 1 day
    });

    it('should throw error for invalid date range', () => {
      const start = new Date('2024-01-20');
      const end = new Date('2024-01-15');
      expect(() => {
        DateCalculationService.calculateWorkingDays(start, end);
      }).toThrow('Start date cannot be after end date');
    });

    it('should throw error for missing dates', () => {
      expect(() => {
        DateCalculationService.calculateWorkingDays(null, new Date());
      }).toThrow('Start date and end date are required');
    });
  });

  describe('addWorkingDays', () => {
    it('should add working days correctly', () => {
      const monday = new Date('2024-01-16'); // Monday
      const result = DateCalculationService.addWorkingDays(monday, 5);
      const expected = new Date('2024-01-21'); // Saturday
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should skip Sundays when adding days', () => {
      const friday = new Date('2024-01-20'); // Friday
      const result = DateCalculationService.addWorkingDays(friday, 2);
      const expected = new Date('2024-01-23'); // Monday (skipping Sunday)
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should handle adding zero days', () => {
      const date = new Date('2024-01-15');
      const result = DateCalculationService.addWorkingDays(date, 0);
      expect(result.toDateString()).toBe(date.toDateString());
    });

    it('should throw error for negative days', () => {
      const date = new Date('2024-01-15');
      expect(() => {
        DateCalculationService.addWorkingDays(date, -5);
      }).toThrow('Days must be a positive number');
    });
  });

  describe('subtractWorkingDays', () => {
    it('should subtract working days correctly', () => {
      const saturday = new Date('2024-01-21'); // Saturday
      const result = DateCalculationService.subtractWorkingDays(saturday, 5);
      const expected = new Date('2024-01-16'); // Monday
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should skip Sundays when subtracting days', () => {
      const monday = new Date('2024-01-23'); // Monday
      const result = DateCalculationService.subtractWorkingDays(monday, 2);
      const expected = new Date('2024-01-20'); // Friday (skipping Sunday)
      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should throw error for negative days', () => {
      const date = new Date('2024-01-15');
      expect(() => {
        DateCalculationService.subtractWorkingDays(date, -5);
      }).toThrow('Days must be a positive number');
    });
  });

  describe('isWorkingDay', () => {
    it('should return true for Monday through Saturday', () => {
      const monday = new Date('2024-01-16');    // Monday
      const tuesday = new Date('2024-01-17');   // Tuesday
      const wednesday = new Date('2024-01-18'); // Wednesday
      const thursday = new Date('2024-01-19');  // Thursday
      const friday = new Date('2024-01-20');    // Friday
      const saturday = new Date('2024-01-21');  // Saturday

      expect(DateCalculationService.isWorkingDay(monday)).toBe(true);
      expect(DateCalculationService.isWorkingDay(tuesday)).toBe(true);
      expect(DateCalculationService.isWorkingDay(wednesday)).toBe(true);
      expect(DateCalculationService.isWorkingDay(thursday)).toBe(true);
      expect(DateCalculationService.isWorkingDay(friday)).toBe(true);
      expect(DateCalculationService.isWorkingDay(saturday)).toBe(true);
    });

    it('should return false for Sunday', () => {
      const sunday = new Date('2024-01-22'); // Sunday
      expect(DateCalculationService.isWorkingDay(sunday)).toBe(false);
    });

    it('should throw error for null date', () => {
      expect(() => {
        DateCalculationService.isWorkingDay(null);
      }).toThrow('Date is required');
    });
  });

  describe('validateDateRange', () => {
    it('should return true for valid date range', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-20');
      expect(DateCalculationService.validateDateRange(start, end)).toBe(true);
    });

    it('should return true for same dates', () => {
      const date = new Date('2024-01-15');
      expect(DateCalculationService.validateDateRange(date, date)).toBe(true);
    });

    it('should return false for invalid date range', () => {
      const start = new Date('2024-01-20');
      const end = new Date('2024-01-15');
      expect(DateCalculationService.validateDateRange(start, end)).toBe(false);
    });

    it('should return false for null dates', () => {
      expect(DateCalculationService.validateDateRange(null, new Date())).toBe(false);
      expect(DateCalculationService.validateDateRange(new Date(), null)).toBe(false);
    });
  });
});