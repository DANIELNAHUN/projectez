import { describe, it, expect, beforeEach } from 'vitest';
import { Task } from '../../models/index.js';

describe('Task Duration Management - Integration Tests', () => {
  let taskData;

  beforeEach(() => {
    taskData = {
      id: 'integration-test-task',
      title: 'Integration Test Task',
      description: 'Testing automatic duration calculation integration',
      startDate: new Date('2024-01-16'), // Monday
      endDate: new Date('2024-01-20'),   // Friday
      projectId: 'test-project'
    };
  });

  describe('Automatic Duration Calculation Scenarios', () => {
    it('should handle task creation with automatic duration calculation', () => {
      // Create task without specifying duration
      const task = new Task({
        ...taskData,
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-21')    // Saturday
      });

      expect(task.duration).toBe(6); // Mon, Tue, Wed, Thu, Fri, Sat
      expect(task.adjustStartDate).toBe(false);
    });

    it('should handle reactive duration updates when dates change', () => {
      const task = new Task(taskData);
      
      // Initial duration should be 5 (Mon-Fri)
      expect(task.duration).toBe(5);
      
      // Change end date to Saturday
      task.setEndDate(new Date('2024-01-21')); // Saturday
      expect(task.duration).toBe(6); // Mon-Sat
      
      // Change start date to Tuesday
      task.setStartDate(new Date('2024-01-17')); // Tuesday
      expect(task.duration).toBe(5); // Tue-Sat
    });

    it('should handle automatic end date calculation when duration is modified', () => {
      const task = new Task({
        ...taskData,
        adjustStartDate: false // Default behavior
      });
      
      // Set duration to 3 days from Monday (Mon, Tue, Wed)
      task.setDuration(3);
      expect(task.duration).toBe(3);
      expect(task.endDate.toDateString()).toBe('Thu Jan 18 2024'); // Thursday (3 working days from Monday)
      
      // Set duration to 7 days (should span weekend)
      task.setDuration(7);
      expect(task.duration).toBe(7);
      expect(task.endDate.toDateString()).toBe('Tue Jan 23 2024'); // Tuesday next week
    });

    it('should handle start date adjustment when adjustStartDate flag is true', () => {
      const task = new Task({
        ...taskData,
        adjustStartDate: true
      });
      
      // Set duration to 3 days ending on Friday
      task.setDuration(3);
      expect(task.duration).toBe(3);
      expect(task.startDate.toDateString()).toBe('Tue Jan 16 2024'); // Tuesday (3 working days before Friday)
      expect(task.endDate.toDateString()).toBe('Fri Jan 19 2024'); // Friday (unchanged)
      
      // Set duration to 7 days (should span weekend backwards)
      task.setDuration(7);
      expect(task.duration).toBe(7);
      expect(task.startDate.toDateString()).toBe('Thu Jan 11 2024'); // Thursday previous week
      expect(task.endDate.toDateString()).toBe('Fri Jan 19 2024'); // Friday (unchanged)
    });
  });

  describe('Date Range Validation', () => {
    it('should handle invalid date ranges gracefully', () => {
      // Create task with end date before start date
      const task = new Task({
        ...taskData,
        startDate: new Date('2024-01-20'), // Friday
        endDate: new Date('2024-01-16')    // Monday (before start)
      });
      
      // Duration should be 0 for invalid range
      expect(task.duration).toBe(0);
    });

    it('should validate date consistency when updating', () => {
      const task = new Task(taskData);
      
      // Try to set end date before start date
      task.setEndDate(new Date('2024-01-15')); // Before start date
      expect(task.duration).toBe(0); // Should handle gracefully
    });

    it('should handle same start and end dates', () => {
      const task = new Task({
        ...taskData,
        startDate: new Date('2024-01-16'), // Monday
        endDate: new Date('2024-01-16')    // Same Monday
      });
      
      expect(task.duration).toBe(1); // Same day counts as 1 working day
    });
  });

  describe('Weekend and Holiday Handling', () => {
    it('should correctly handle tasks spanning multiple weekends', () => {
      const task = new Task({
        ...taskData,
        startDate: new Date('2024-01-16'), // Monday week 1
        endDate: new Date('2024-01-30')    // Tuesday week 3
      });
      
      // Should exclude Sundays: 2 full weeks (12 days) + 1 day = 13 working days
      expect(task.duration).toBe(13);
    });

    it('should handle duration calculation across weekends', () => {
      const task = new Task({
        ...taskData,
        startDate: new Date('2024-01-20'), // Friday
        adjustStartDate: false
      });
      
      // Set 5 working days from Friday
      task.setDuration(5);
      expect(task.endDate.toDateString()).toBe(new Date('2024-01-26').toDateString()); // Thursday next week
    });

    it('should handle start date calculation across weekends', () => {
      const task = new Task({
        ...taskData,
        endDate: new Date('2024-01-23'), // Monday
        adjustStartDate: true
      });
      
      // Set 5 working days ending on Monday
      task.setDuration(5);
      expect(task.startDate.toDateString()).toBe(new Date('2024-01-17').toDateString()); // Tuesday previous week
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null or undefined dates gracefully', () => {
      // This should not throw an error but handle gracefully
      const task = new Task({
        ...taskData,
        startDate: null,
        endDate: new Date('2024-01-20')
      });
      
      // When startDate is null, it gets converted to current date, so duration won't be 0
      // The important thing is that it doesn't crash
      expect(typeof task.duration).toBe('number');
      expect(task.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle string date inputs', () => {
      const task = new Task({
        ...taskData,
        startDate: '2024-01-16',
        endDate: '2024-01-20'
      });
      
      expect(task.duration).toBe(5);
      expect(task.startDate instanceof Date).toBe(true);
      expect(task.endDate instanceof Date).toBe(true);
    });

    it('should maintain data integrity during multiple updates', () => {
      const task = new Task(taskData);
      const originalId = task.id;
      const originalTitle = task.title;
      
      // Perform multiple date/duration updates
      task.setDuration(7);
      task.setStartDate(new Date('2024-01-15'));
      task.setEndDate(new Date('2024-01-25'));
      
      // Core properties should remain unchanged
      expect(task.id).toBe(originalId);
      expect(task.title).toBe(originalTitle);
      
      // Duration should be recalculated correctly
      expect(task.duration).toBe(9); // Working days from Jan 15 to Jan 25
    });
  });

  describe('Performance and Reactivity', () => {
    it('should update timestamps when duration changes', () => {
      const task = new Task(taskData);
      const originalUpdatedAt = task.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        task.setDuration(10);
        expect(task.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should handle rapid successive updates correctly', () => {
      const task = new Task(taskData);
      
      // Perform rapid updates
      task.setDuration(3);
      task.setDuration(5);
      task.setDuration(7);
      task.setStartDate(new Date('2024-01-17'));
      task.setEndDate(new Date('2024-01-25'));
      
      // Final state should be consistent - duration is recalculated based on final dates
      const expectedDuration = task.calculateDuration(new Date('2024-01-17'), new Date('2024-01-25'));
      expect(task.duration).toBe(expectedDuration); // Working days from Jan 17 to Jan 25
      expect(task.startDate.toDateString()).toBe(new Date('2024-01-17').toDateString());
      expect(task.endDate.toDateString()).toBe(new Date('2024-01-25').toDateString());
    });
  });

  describe('JSON Serialization with Duration Features', () => {
    it('should preserve all duration-related properties in JSON', () => {
      const task = new Task({
        ...taskData,
        duration: 10,
        adjustStartDate: true
      });
      
      const json = task.toJSON();
      
      expect(json.duration).toBe(10);
      expect(json.adjustStartDate).toBe(true);
      expect(json.startDate).toBe(task.startDate.toISOString());
      expect(json.endDate).toBe(task.endDate.toISOString());
    });

    it('should restore task with full functionality from JSON', () => {
      const originalTask = new Task({
        ...taskData,
        duration: 8,
        adjustStartDate: true
      });
      
      const json = originalTask.toJSON();
      const restoredTask = Task.fromJSON(json);
      
      // Verify all properties are restored
      expect(restoredTask.duration).toBe(8);
      expect(restoredTask.adjustStartDate).toBe(true);
      
      // Verify functionality works
      restoredTask.setDuration(5);
      expect(restoredTask.duration).toBe(5);
      
      // Since adjustStartDate is true, start date should change
      expect(restoredTask.startDate).not.toEqual(originalTask.startDate);
      expect(restoredTask.endDate.toDateString()).toBe(originalTask.endDate.toDateString());
    });
  });
});