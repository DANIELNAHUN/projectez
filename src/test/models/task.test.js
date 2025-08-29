import { describe, it, expect, beforeEach } from 'vitest';
import { Task } from '../../models/index.js';

describe('Task Model - Duration Management', () => {
  let taskData;

  beforeEach(() => {
    taskData = {
      id: 'test-task-1',
      title: 'Test Task',
      description: 'Test task description',
      startDate: new Date('2024-01-16'), // Monday
      endDate: new Date('2024-01-20'),   // Friday
      projectId: 'test-project'
    };
  });

  describe('constructor', () => {
    it('should calculate duration automatically when not provided', () => {
      const task = new Task(taskData);
      expect(task.duration).toBe(5); // Mon, Tue, Wed, Thu, Fri
    });

    it('should use provided duration when specified', () => {
      const task = new Task({ ...taskData, duration: 10 });
      expect(task.duration).toBe(10);
    });

    it('should set adjustStartDate to false by default', () => {
      const task = new Task(taskData);
      expect(task.adjustStartDate).toBe(false);
    });

    it('should respect provided adjustStartDate flag', () => {
      const task = new Task({ ...taskData, adjustStartDate: true });
      expect(task.adjustStartDate).toBe(true);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration correctly for working days', () => {
      const task = new Task(taskData);
      const duration = task.calculateDuration(
        new Date('2024-01-16'), // Monday
        new Date('2024-01-20')  // Friday
      );
      expect(duration).toBe(5);
    });

    it('should handle weekends correctly', () => {
      const task = new Task(taskData);
      const duration = task.calculateDuration(
        new Date('2024-01-20'), // Friday
        new Date('2024-01-23')  // Monday (skipping weekend)
      );
      expect(duration).toBe(3); // Fri, Sat, Mon
    });

    it('should return 0 for invalid date ranges', () => {
      const task = new Task(taskData);
      const duration = task.calculateDuration(
        new Date('2024-01-20'),
        new Date('2024-01-15')
      );
      expect(duration).toBe(0);
    });
  });

  describe('calculateEndDate', () => {
    it('should calculate end date correctly', () => {
      const task = new Task(taskData);
      const endDate = task.calculateEndDate(
        new Date('2024-01-16'), // Monday
        4 // 4 working days after Monday
      );
      expect(endDate.toDateString()).toBe(new Date('2024-01-20').toDateString()); // Friday
    });

    it('should skip weekends when calculating end date', () => {
      const task = new Task(taskData);
      const endDate = task.calculateEndDate(
        new Date('2024-01-20'), // Friday
        2 // 2 working days
      );
      expect(endDate.toDateString()).toBe(new Date('2024-01-23').toDateString()); // Monday
    });
  });

  describe('calculateStartDate', () => {
    it('should calculate start date correctly', () => {
      const task = new Task(taskData);
      const startDate = task.calculateStartDate(
        new Date('2024-01-20'), // Friday
        4 // 4 working days before Friday
      );
      expect(startDate.toDateString()).toBe(new Date('2024-01-16').toDateString()); // Monday
    });

    it('should skip weekends when calculating start date', () => {
      const task = new Task(taskData);
      const startDate = task.calculateStartDate(
        new Date('2024-01-23'), // Monday
        2 // 2 working days
      );
      expect(startDate.toDateString()).toBe(new Date('2024-01-20').toDateString()); // Friday
    });
  });

  describe('updateDuration', () => {
    it('should update duration when called', () => {
      const task = new Task(taskData);
      task.startDate = new Date('2024-01-16'); // Monday
      task.endDate = new Date('2024-01-21'); // Saturday
      task.updateDuration();
      expect(task.duration).toBe(6); // Mon-Sat
    });

    it('should update updatedAt timestamp', () => {
      const task = new Task(taskData);
      const originalUpdatedAt = task.updatedAt;
      setTimeout(() => {
        task.updateDuration();
        expect(task.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('updateEndDate', () => {
    it('should update end date when adjustStartDate is false', () => {
      const task = new Task({ ...taskData, adjustStartDate: false });
      task.duration = 5; // 5 working days from Monday should end on Saturday
      task.updateEndDate();
      expect(task.endDate.toDateString()).toBe(new Date('2024-01-21').toDateString()); // Saturday
    });

    it('should not update end date when adjustStartDate is true', () => {
      const task = new Task({ ...taskData, adjustStartDate: true });
      const originalEndDate = task.endDate;
      task.duration = 7;
      task.updateEndDate();
      expect(task.endDate).toEqual(originalEndDate);
    });
  });

  describe('updateStartDate', () => {
    it('should update start date when adjustStartDate is true', () => {
      const task = new Task({ ...taskData, adjustStartDate: true });
      task.duration = 4; // 4 working days before Friday should start on Monday same week
      task.updateStartDate();
      expect(task.startDate.toDateString()).toBe(new Date('2024-01-16').toDateString()); // Monday same week
    });

    it('should not update start date when adjustStartDate is false', () => {
      const task = new Task({ ...taskData, adjustStartDate: false });
      const originalStartDate = task.startDate;
      task.duration = 7;
      task.updateStartDate();
      expect(task.startDate).toEqual(originalStartDate);
    });
  });

  describe('setDuration', () => {
    it('should update end date when adjustStartDate is false', () => {
      const task = new Task({ ...taskData, adjustStartDate: false });
      task.setDuration(5);
      expect(task.duration).toBe(5);
      expect(task.endDate.toDateString()).toBe(new Date('2024-01-21').toDateString());
    });

    it('should update start date when adjustStartDate is true', () => {
      const task = new Task({ ...taskData, adjustStartDate: true });
      task.setDuration(4);
      expect(task.duration).toBe(4);
      expect(task.startDate.toDateString()).toBe(new Date('2024-01-16').toDateString());
    });
  });

  describe('setStartDate', () => {
    it('should update start date and recalculate duration', () => {
      const task = new Task(taskData);
      task.setStartDate(new Date('2024-01-17')); // Tuesday
      expect(task.startDate.toDateString()).toBe(new Date('2024-01-17').toDateString());
      expect(task.duration).toBe(4); // Tue, Wed, Thu, Fri
    });

    it('should handle string dates', () => {
      const task = new Task(taskData);
      task.setStartDate('2024-01-17');
      expect(task.startDate.toDateString()).toBe(new Date('2024-01-17').toDateString());
    });
  });

  describe('setEndDate', () => {
    it('should update end date and recalculate duration', () => {
      const task = new Task(taskData);
      task.setEndDate(new Date('2024-01-19')); // Friday
      expect(task.endDate.toDateString()).toBe(new Date('2024-01-19').toDateString());
      expect(task.duration).toBe(4); // Mon, Tue, Wed, Thu
    });

    it('should handle string dates', () => {
      const task = new Task(taskData);
      task.setEndDate('2024-01-19');
      expect(task.endDate.toDateString()).toBe(new Date('2024-01-19').toDateString());
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should include duration and adjustStartDate in JSON', () => {
      const task = new Task({ ...taskData, duration: 10, adjustStartDate: true });
      const json = task.toJSON();
      expect(json.duration).toBe(10);
      expect(json.adjustStartDate).toBe(true);
    });

    it('should restore duration and adjustStartDate from JSON', () => {
      const taskJson = {
        ...taskData,
        duration: 10,
        adjustStartDate: true,
        startDate: taskData.startDate.toISOString(),
        endDate: taskData.endDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const task = Task.fromJSON(taskJson);
      expect(task.duration).toBe(10);
      expect(task.adjustStartDate).toBe(true);
    });

    it('should default adjustStartDate to false when not provided in JSON', () => {
      const taskJson = {
        ...taskData,
        startDate: taskData.startDate.toISOString(),
        endDate: taskData.endDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const task = Task.fromJSON(taskJson);
      expect(task.adjustStartDate).toBe(false);
    });
  });
});