import { describe, it, expect } from 'vitest';
import { Task } from '../../models/index.js';

describe('Task Duration Management - Requirements Validation', () => {
  describe('Requirement 1.1: Automatic duration calculation from dates', () => {
    it('should calculate duration automatically when selecting start and end dates', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-20'),   // Friday
      });
      
      // Should calculate 5 working days (Mon-Fri)
      expect(task.duration).toBe(5);
    });
  });

  describe('Requirement 1.2: Reactive duration updates when dates change', () => {
    it('should recalculate duration when end date is modified', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-18'),   // Wednesday
      });
      
      expect(task.duration).toBe(3); // Mon, Tue, Wed
      
      // Modify end date
      task.setEndDate(new Date('2024-01-19')); // Thursday
      expect(task.duration).toBe(4); // Mon, Tue, Wed, Thu
    });

    it('should recalculate duration when start date is modified', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-19'),   // Thursday
      });
      
      expect(task.duration).toBe(4); // Mon, Tue, Wed, Thu
      
      // Modify start date
      task.setStartDate(new Date('2024-01-17')); // Tuesday
      expect(task.duration).toBe(3); // Tue, Wed, Thu
    });
  });

  describe('Requirement 1.3: Automatic end date calculation from duration', () => {
    it('should calculate end date when duration is set (default behavior)', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-20'),   // Friday
        adjustStartDate: false // Default behavior
      });
      
      // Set duration to 3 days
      task.setDuration(3);
      expect(task.duration).toBe(3);
      expect(task.endDate.toDateString()).toBe('Thu Jan 18 2024'); // 3 working days from Monday
    });
  });

  describe('Requirement 1.4: Date range validation', () => {
    it('should handle invalid date ranges gracefully', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-20'), // Friday
        endDate: new Date('2024-01-16'),   // Monday (before start)
      });
      
      // Should handle gracefully without crashing
      expect(task.duration).toBe(0);
    });
  });

  describe('Requirement 2.1: Duration-based end date calculation', () => {
    it('should calculate end date excluding Sundays when setting duration', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-20'), // Friday
        adjustStartDate: false
      });
      
      // Set 2 working days from Friday
      task.setDuration(2);
      expect(task.endDate.toDateString()).toBe('Mon Jan 22 2024'); // Monday (skipping Sunday)
    });
  });

  describe('Requirement 2.2: Reactive end date recalculation', () => {
    it('should recalculate end date when duration is modified', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-16'), // Monday
        adjustStartDate: false
      });
      
      task.setDuration(5);
      expect(task.endDate.toDateString()).toBe('Sat Jan 20 2024'); // 5 working days from Monday
      
      task.setDuration(3);
      expect(task.endDate.toDateString()).toBe('Thu Jan 18 2024'); // 3 working days from Monday
    });
  });

  describe('Requirement 2.3: Start date adjustment behavior', () => {
    it('should recalculate start date when adjustStartDate flag is true', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-20'),   // Friday
        adjustStartDate: true
      });
      
      // Set duration to 3 days ending on Friday
      task.setDuration(3);
      expect(task.duration).toBe(3);
      expect(task.startDate.toDateString()).toBe('Tue Jan 16 2024'); // 3 working days before Friday
      expect(task.endDate.toDateString()).toBe('Fri Jan 19 2024'); // Friday (unchanged)
    });
  });

  describe('Requirement 2.4: Working day calculations (Monday-Saturday)', () => {
    it('should consider Monday through Saturday as working days', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-21'),   // Saturday
      });
      
      // Should include Monday through Saturday (6 working days)
      expect(task.duration).toBe(6);
    });

    it('should exclude Sundays from working day calculations', () => {
      const task = new Task({
        title: 'Test Task',
        startDate: new Date('2024-01-20'), // Friday
        endDate: new Date('2024-01-23'),   // Monday (next week)
      });
      
      // Should include Friday, Saturday, Monday (3 working days, excluding Sunday)
      expect(task.duration).toBe(3);
    });
  });

  describe('Integration: All requirements working together', () => {
    it('should handle complete workflow with all features', () => {
      // Create task with automatic duration calculation
      const task = new Task({
        title: 'Complete Workflow Test',
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-19'),   // Thursday
        adjustStartDate: false
      });
      
      // Verify initial automatic calculation
      expect(task.duration).toBe(4); // Mon, Tue, Wed, Thu
      
      // Test reactive duration updates
      task.setEndDate(new Date('2024-01-21')); // Saturday
      expect(task.duration).toBe(6); // Mon-Sat
      
      // Test automatic end date calculation
      task.setDuration(3);
      expect(task.endDate.toDateString()).toBe('Thu Jan 18 2024');
      
      // Test start date adjustment behavior
      task.adjustStartDate = true;
      task.setDuration(2);
      expect(task.startDate.toDateString()).toBe('Tue Jan 16 2024'); // 2 working days before Thursday
      expect(task.endDate.toDateString()).toBe('Thu Jan 18 2024'); // End date unchanged
      
      // Verify working day calculations exclude Sundays
      task.adjustStartDate = false;
      task.setStartDate(new Date('2024-01-20')); // Friday
      task.setDuration(3);
      expect(task.endDate.toDateString()).toBe('Tue Jan 23 2024'); // Skips Sunday
    });
  });
});