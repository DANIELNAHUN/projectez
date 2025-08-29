import { describe, it, expect, beforeEach } from 'vitest';
import { Project, Task } from '../../models/index.js';

describe('Project Model - Date Adjustment', () => {
  let project;
  let tasks;

  beforeEach(() => {
    tasks = [
      new Task({
        id: 'task-1',
        title: 'Task 1',
        startDate: new Date('2024-01-15'), // Sunday (actual date created due to timezone)
        endDate: new Date('2024-01-17'),   // Tuesday
        duration: 3
      }),
      new Task({
        id: 'task-2',
        title: 'Task 2',
        startDate: new Date('2024-01-18'), // Wednesday
        endDate: new Date('2024-01-20'),   // Friday
        duration: 3
      })
    ];

    project = new Project({
      id: 'test-project',
      name: 'Test Project',
      startDate: new Date('2024-01-15'), // Sunday (actual date created due to timezone)
      endDate: new Date('2024-01-25'),   // Wednesday
      tasks: tasks
    });
  });

  describe('adjustProjectDates', () => {
    it('should move all task dates forward when project start date moves forward', () => {
      const newStartDate = new Date('2024-01-22'); // Sunday, 1 week later (actual date created)
      project.adjustProjectDates(newStartDate);

      expect(project.startDate.toDateString()).toBe(newStartDate.toDateString());
      
      // Task 1 should move by the same number of working days (6 working days forward)
      // Original: Jan 14 (Sun) -> New: Jan 21 (Sun) - moves 6 working days forward
      expect(project.tasks[0].startDate.toDateString()).toBe(new Date('2024-01-21').toDateString());
      expect(project.tasks[0].endDate.toDateString()).toBe(new Date('2024-01-25').toDateString());
      
      // Task 2 should move by 6 working days forward
      expect(project.tasks[1].startDate.toDateString()).toBe(new Date('2024-01-25').toDateString());
      expect(project.tasks[1].endDate.toDateString()).toBe(new Date('2024-01-28').toDateString());
    });

    it('should move all task dates backward when project start date moves backward', () => {
      const newStartDate = new Date('2024-01-08'); // Sunday, 1 week earlier (actual date created)
      project.adjustProjectDates(newStartDate);

      expect(project.startDate.toDateString()).toBe(newStartDate.toDateString());
      
      // Task 1 should move backward by the same number of working days (6 working days backward)
      // Original: Jan 14 (Sun) -> New: Jan 7 (Sun) - moves 6 working days backward
      expect(project.tasks[0].startDate.toDateString()).toBe(new Date('2024-01-09').toDateString());
      expect(project.tasks[0].endDate.toDateString()).toBe(new Date('2024-01-12').toDateString());
      
      // Task 2 should move by 6 working days backward
      expect(project.tasks[1].startDate.toDateString()).toBe(new Date('2024-01-11').toDateString());
      expect(project.tasks[1].endDate.toDateString()).toBe(new Date('2024-01-14').toDateString());
    });

    it('should maintain task durations after date adjustment', () => {
      const originalDurations = project.tasks.map(task => task.duration);
      const newStartDate = new Date('2024-01-23');
      
      project.adjustProjectDates(newStartDate);
      
      project.tasks.forEach((task, index) => {
        expect(task.duration).toBe(originalDurations[index]);
      });
    });

    it('should handle string dates', () => {
      project.adjustProjectDates('2024-01-23');
      expect(project.startDate.toDateString()).toBe(new Date('2024-01-23').toDateString());
    });

    it('should throw error for null date', () => {
      expect(() => {
        project.adjustProjectDates(null);
      }).toThrow('New start date is required');
    });

    it('should handle empty task list', () => {
      const emptyProject = new Project({
        id: 'empty-project',
        name: 'Empty Project',
        startDate: new Date('2024-01-16'),
        tasks: []
      });

      expect(() => {
        emptyProject.adjustProjectDates(new Date('2024-01-23'));
      }).not.toThrow();
      
      expect(emptyProject.startDate.toDateString()).toBe(new Date('2024-01-23').toDateString());
    });
  });

  describe('recalculateProjectEndDate', () => {
    it('should set project end date to latest task end date', () => {
      // Add a task that ends later
      const lateTask = new Task({
        id: 'late-task',
        title: 'Late Task',
        startDate: new Date('2024-01-26'),
        endDate: new Date('2024-01-31'),
        duration: 4
      });
      project.tasks.push(lateTask);

      project.recalculateProjectEndDate();
      
      expect(project.endDate.toDateString()).toBe(new Date('2024-01-31').toDateString());
    });

    it('should handle empty task list', () => {
      const emptyProject = new Project({
        id: 'empty-project',
        name: 'Empty Project',
        startDate: new Date('2024-01-16'),
        endDate: new Date('2024-01-21'),
        tasks: []
      });

      expect(() => {
        emptyProject.recalculateProjectEndDate();
      }).not.toThrow();
      
      // End date should remain unchanged
      expect(emptyProject.endDate.toDateString()).toBe(new Date('2024-01-21').toDateString());
    });
  });
});