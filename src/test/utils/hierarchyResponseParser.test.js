/**
 * Unit tests for HierarchyResponseParser
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HierarchyResponseParser } from '../../utils/hierarchyResponseParser.js';

describe('HierarchyResponseParser', () => {
  let parser;

  beforeEach(() => {
    parser = new HierarchyResponseParser();
  });

  describe('parseHierarchicalResponse', () => {
    it('should parse simple hierarchical response', () => {
      const response = {
        tasks: [
          {
            title: 'Main Task',
            description: 'A main task',
            duration: 10,
            priority: 'high',
            type: 'simple',
            subtasks: [
              {
                title: 'Subtask 1',
                description: 'First subtask',
                duration: 3,
                priority: 'medium',
                type: 'simple'
              },
              {
                title: 'Subtask 2',
                description: 'Second subtask',
                duration: 5,
                priority: 'medium',
                type: 'simple'
              }
            ]
          }
        ]
      };

      const result = parser.parseHierarchicalResponse(response);

      expect(result.mainTasks).toHaveLength(1);
      expect(result.mainTasks[0].title).toBe('Main Task');
      expect(result.mainTasks[0].level).toBe(0);
      expect(result.mainTasks[0].isMainTask).toBe(true);
      expect(result.mainTasks[0].hasSubtasks).toBe(true);
      expect(result.mainTasks[0].subtasks).toHaveLength(2);
      
      // Check subtasks have proper flags
      expect(result.mainTasks[0].subtasks[0].hasSubtasks).toBe(false);
      expect(result.mainTasks[0].subtasks[1].hasSubtasks).toBe(false);
      
      expect(result.mainTasks[0].aggregatedDuration).toBe(8); // 3 + 5
      expect(result.validationResults.isValid).toBe(true);
    });

    it('should handle tasks without subtasks', () => {
      const response = {
        tasks: [
          {
            title: 'Simple Task',
            description: 'A simple task',
            duration: 5,
            priority: 'medium',
            type: 'simple'
          }
        ]
      };

      const result = parser.parseHierarchicalResponse(response);

      expect(result.mainTasks).toHaveLength(1);
      expect(result.mainTasks[0].hasSubtasks).toBe(false);
      expect(result.mainTasks[0].subtasks).toHaveLength(0);
      expect(result.mainTasks[0].aggregatedDuration).toBe(5);
      expect(result.validationResults.isValid).toBe(true);
    });

    it('should validate hierarchy depth', () => {
      const response = {
        tasks: [
          {
            title: 'Level 0',
            duration: 10,
            subtasks: [
              {
                title: 'Level 1',
                duration: 5,
                subtasks: [
                  {
                    title: 'Level 2',
                    duration: 3,
                    subtasks: [
                      {
                        title: 'Level 3',
                        duration: 2,
                        subtasks: [
                          {
                            title: 'Level 4 - Too Deep',
                            duration: 1
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      expect(() => parser.parseHierarchicalResponse(response))
        .toThrow('Maximum hierarchy depth');
    });

    it('should throw error for invalid response', () => {
      expect(() => parser.parseHierarchicalResponse(null))
        .toThrow('Invalid response object provided');

      expect(() => parser.parseHierarchicalResponse({}))
        .toThrow('Response must contain a tasks array');

      expect(() => parser.parseHierarchicalResponse({ tasks: 'not an array' }))
        .toThrow('Response must contain a tasks array');
    });
  });

  describe('buildTaskHierarchy', () => {
    it('should build hierarchy with proper relationships', () => {
      const tasks = [
        {
          title: 'Parent Task',
          duration: 10,
          subtasks: [
            { title: 'Child 1', duration: 3 },
            { title: 'Child 2', duration: 4 }
          ]
        }
      ];

      const hierarchy = parser.buildTaskHierarchy(tasks);

      expect(hierarchy.tasks).toHaveLength(1);
      expect(hierarchy.taskCount).toBe(3); // 1 parent + 2 children
      expect(hierarchy.relationships.size).toBe(2); // 2 parent-child relationships
      
      const parentTask = hierarchy.tasks[0];
      expect(parentTask.level).toBe(0);
      expect(parentTask.subtasks).toHaveLength(2);
      expect(parentTask.subtasks[0].level).toBe(1);
      expect(parentTask.subtasks[0].parentTaskId).toBe(parentTask.id);
    });
  });

  describe('calculateAggregatedDuration', () => {
    it('should calculate aggregated duration correctly', () => {
      // Create a processed task with proper structure
      const task = {
        title: 'Parent',
        duration: 10,
        hasSubtasks: true,
        subtasks: [
          { title: 'Child 1', duration: 3, hasSubtasks: false, subtasks: [] },
          { title: 'Child 2', duration: 5, hasSubtasks: false, subtasks: [] }
        ]
      };

      const aggregated = parser.calculateAggregatedDuration(task);
      expect(aggregated).toBe(8); // 3 + 5
    });

    it('should handle nested subtasks', () => {
      // Create a processed task with proper nested structure
      const task = {
        title: 'Grandparent',
        duration: 20,
        hasSubtasks: true,
        subtasks: [
          {
            title: 'Parent 1',
            duration: 10,
            hasSubtasks: true,
            aggregatedDuration: 7, // 3 + 4
            subtasks: [
              { title: 'Child 1', duration: 3, hasSubtasks: false, subtasks: [] },
              { title: 'Child 2', duration: 4, hasSubtasks: false, subtasks: [] }
            ]
          },
          { title: 'Parent 2', duration: 5, hasSubtasks: false, subtasks: [] }
        ]
      };

      const aggregated = parser.calculateAggregatedDuration(task);
      expect(aggregated).toBe(12); // 7 + 5 = 12
    });

    it('should return task duration when no subtasks', () => {
      const task = {
        title: 'Simple Task',
        duration: 5,
        hasSubtasks: false,
        subtasks: []
      };

      const aggregated = parser.calculateAggregatedDuration(task);
      expect(aggregated).toBe(5);
    });
  });

  describe('validateHierarchy', () => {
    it('should validate correct hierarchy', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'task1',
            title: 'Task 1',
            duration: 5,
            level: 0,
            isMainTask: true,
            hasSubtasks: false,
            subtasks: []
          }
        ],
        relationships: new Map(),
        taskCount: 1,
        maxDepth: 0
      };

      const result = parser.validateHierarchy(hierarchyData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'task1',
            title: '', // Missing title
            duration: -1, // Invalid duration
            level: 0,
            isMainTask: true,
            hasSubtasks: false,
            subtasks: []
          }
        ],
        relationships: new Map(),
        taskCount: 1,
        maxDepth: 0
      };

      const result = parser.validateHierarchy(hierarchyData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});