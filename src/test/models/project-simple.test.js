import { describe, it, expect } from 'vitest';
import { Project, Task } from '../../models/index.js';

describe('Project Model - Simple Test', () => {
  it('should create a project', () => {
    const project = new Project({
      id: 'test-project',
      name: 'Test Project',
      startDate: new Date('2024-01-16'),
      tasks: []
    });
    
    expect(project.name).toBe('Test Project');
  });

  it('should adjust project dates', () => {
    const task = new Task({
      id: 'task-1',
      title: 'Task 1',
      startDate: new Date('2024-01-16'),
      endDate: new Date('2024-01-18'),
      duration: 3
    });
    
    const project = new Project({
      id: 'test-project',
      name: 'Test Project',
      startDate: new Date('2024-01-16'),
      tasks: [task]
    });
    
    project.adjustProjectDates(new Date('2024-01-23'));
    
    expect(project.startDate.toDateString()).toBe(new Date('2024-01-23').toDateString());
  });
});