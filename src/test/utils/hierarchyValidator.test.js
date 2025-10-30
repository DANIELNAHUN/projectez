/**
 * Unit tests for HierarchyValidator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HierarchyValidator } from '../../utils/hierarchyValidator.js';

describe('HierarchyValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new HierarchyValidator();
  });

  describe('validateHierarchy', () => {
    it('should validate correct hierarchy structure', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'task1',
            title: 'Main Task',
            description: 'A main task',
            duration: 10,
            level: 0,
            isMainTask: true,
            hasSubtasks: true,
            aggregatedDuration: 8,
            subtasks: [
              {
                id: 'task2',
                parentTaskId: 'task1',
                title: 'Subtask 1',
                description: 'First subtask',
                duration: 3,
                level: 1,
                isMainTask: false,
                hasSubtasks: false,
                aggregatedDuration: 3,
                subtasks: []
              },
              {
                id: 'task3',
                parentTaskId: 'task1',
                title: 'Subtask 2',
                description: 'Second subtask',
                duration: 5,
                level: 1,
                isMainTask: false,
                hasSubtasks: false,
                aggregatedDuration: 5,
                subtasks: []
              }
            ]
          }
        ],
        relationships: new Map([
          ['task2', 'task1'],
          ['task3', 'task1']
        ]),
        taskCount: 3,
        maxDepth: 1
      };

      const result = validator.validateHierarchy(hierarchyData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.totalTasks).toBe(3);
      expect(result.statistics.mainTasks).toBe(1);
      expect(result.statistics.subtasks).toBe(2);
    });

    it('should detect missing required fields', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'task1',
            title: '', // Empty title
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

      const result = validator.validateHierarchy(hierarchyData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task task1: Missing or invalid title');
      expect(result.errors).toContain('Task task1: Invalid duration (-1). Must be >= 1');
    });

    it('should detect duplicate task IDs', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'duplicate',
            title: 'Task 1',
            duration: 5,
            level: 0,
            isMainTask: true,
            hasSubtasks: false,
            subtasks: []
          },
          {
            id: 'duplicate', // Duplicate ID
            title: 'Task 2',
            duration: 3,
            level: 0,
            isMainTask: true,
            hasSubtasks: false,
            subtasks: []
          }
        ],
        relationships: new Map(),
        taskCount: 2,
        maxDepth: 0
      };

      const result = validator.validateHierarchy(hierarchyData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate task ID detected'))).toBe(true);
    });

    it('should validate hierarchy depth constraints', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'task1',
            title: 'Level 0',
            duration: 10,
            level: 0,
            isMainTask: true,
            hasSubtasks: true,
            subtasks: [
              {
                id: 'task2',
                parentTaskId: 'task1',
                title: 'Level 1',
                duration: 5,
                level: 1,
                isMainTask: false,
                hasSubtasks: true,
                subtasks: [
                  {
                    id: 'task3',
                    parentTaskId: 'task2',
                    title: 'Level 2',
                    duration: 3,
                    level: 2,
                    isMainTask: false,
                    hasSubtasks: true,
                    subtasks: [
                      {
                        id: 'task4',
                        parentTaskId: 'task3',
                        title: 'Level 3',
                        duration: 2,
                        level: 3,
                        isMainTask: false,
                        hasSubtasks: false,
                        subtasks: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        relationships: new Map([
          ['task2', 'task1'],
          ['task3', 'task2'],
          ['task4', 'task3']
        ]),
        taskCount: 4,
        maxDepth: 4 // Exceeds maximum of 3
      };

      const result = validator.validateHierarchy(hierarchyData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Hierarchy too deep'))).toBe(true);
    });

    it('should validate parent-child level consistency', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'task1',
            title: 'Parent',
            duration: 10,
            level: 0,
            isMainTask: true,
            hasSubtasks: true,
            subtasks: [
              {
                id: 'task2',
                parentTaskId: 'task1',
                title: 'Child with wrong level',
                duration: 5,
                level: 2, // Should be 1
                isMainTask: false,
                hasSubtasks: false,
                subtasks: []
              }
            ]
          }
        ],
        relationships: new Map([['task2', 'task1']]),
        taskCount: 2,
        maxDepth: 1
      };

      const result = validator.validateHierarchy(hierarchyData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Subtask level inconsistency'))).toBe(true);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect simple circular dependency', () => {
      const relationships = new Map([
        ['task1', 'task2'],
        ['task2', 'task1'] // Circular dependency
      ]);

      const circularDeps = validator.detectCircularDependencies(relationships);
      
      expect(circularDeps).toHaveLength(1);
      expect(circularDeps[0]).toContain('task1');
      expect(circularDeps[0]).toContain('task2');
    });

    it('should detect complex circular dependency', () => {
      const relationships = new Map([
        ['task1', 'task2'],
        ['task2', 'task3'],
        ['task3', 'task1'] // Creates a cycle: task1 -> task2 -> task3 -> task1
      ]);

      const circularDeps = validator.detectCircularDependencies(relationships);
      
      expect(circularDeps).toHaveLength(1);
      expect(circularDeps[0]).toContain('task1');
      expect(circularDeps[0]).toContain('task2');
      expect(circularDeps[0]).toContain('task3');
    });

    it('should not detect false positives in valid hierarchy', () => {
      const relationships = new Map([
        ['task2', 'task1'],
        ['task3', 'task1'],
        ['task4', 'task2'],
        ['task5', 'task2']
      ]);

      const circularDeps = validator.detectCircularDependencies(relationships);
      
      expect(circularDeps).toHaveLength(0);
    });
  });

  describe('validateMaxDepth', () => {
    it('should validate tasks within depth limit', () => {
      const tasks = [
        {
          id: 'task1',
          title: 'Level 0',
          subtasks: [
            {
              id: 'task2',
              title: 'Level 1',
              subtasks: [
                {
                  id: 'task3',
                  title: 'Level 2',
                  subtasks: []
                }
              ]
            }
          ]
        }
      ];

      const result = validator.validateMaxDepth(tasks, 0, 3);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.maxDepthFound).toBe(2);
    });

    it('should detect depth limit violation', () => {
      const tasks = [
        {
          id: 'task1',
          title: 'Level 0',
          subtasks: [
            {
              id: 'task2',
              title: 'Level 1',
              subtasks: [
                {
                  id: 'task3',
                  title: 'Level 2',
                  subtasks: [
                    {
                      id: 'task4',
                      title: 'Level 3',
                      subtasks: [
                        {
                          id: 'task5',
                          title: 'Level 4 - Too deep',
                          subtasks: []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ];

      const result = validator.validateMaxDepth(tasks, 0, 3);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Maximum hierarchy depth exceeded'))).toBe(true);
      expect(result.maxDepthFound).toBe(4);
    });
  });

  describe('validateBasicStructure', () => {
    it('should validate correct basic structure', () => {
      const hierarchyData = {
        tasks: [],
        relationships: new Map(),
        taskCount: 0,
        maxDepth: 0
      };
      
      const result = { isValid: true, errors: [], warnings: [] };
      validator.validateBasicStructure(hierarchyData, result);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid structure', () => {
      const result = { isValid: true, errors: [], warnings: [] };
      
      // Test null data
      validator.validateBasicStructure(null, result);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid hierarchy data: must be an object');
      
      // Reset result
      result.isValid = true;
      result.errors = [];
      
      // Test invalid tasks
      validator.validateBasicStructure({ tasks: 'not an array' }, result);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid hierarchy data: tasks must be an array');
    });

    it('should detect too many tasks', () => {
      const hierarchyData = {
        tasks: [],
        relationships: new Map(),
        taskCount: 150, // Exceeds limit of 100
        maxDepth: 0
      };
      
      const result = { isValid: true, errors: [], warnings: [] };
      validator.validateBasicStructure(hierarchyData, result);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Too many tasks'))).toBe(true);
    });
  });

  describe('calculateActualMaxDepth', () => {
    it('should calculate correct depth for flat structure', () => {
      const tasks = [
        { id: 'task1', subtasks: [] },
        { id: 'task2', subtasks: [] }
      ];

      const depth = validator.calculateActualMaxDepth(tasks);
      expect(depth).toBe(0);
    });

    it('should calculate correct depth for nested structure', () => {
      const tasks = [
        {
          id: 'task1',
          subtasks: [
            {
              id: 'task2',
              subtasks: [
                {
                  id: 'task3',
                  subtasks: []
                }
              ]
            }
          ]
        }
      ];

      const depth = validator.calculateActualMaxDepth(tasks);
      expect(depth).toBe(2);
    });

    it('should handle mixed depth structures', () => {
      const tasks = [
        {
          id: 'task1',
          subtasks: [
            { id: 'task2', subtasks: [] }
          ]
        },
        {
          id: 'task3',
          subtasks: [
            {
              id: 'task4',
              subtasks: [
                {
                  id: 'task5',
                  subtasks: [
                    { id: 'task6', subtasks: [] }
                  ]
                }
              ]
            }
          ]
        }
      ];

      const depth = validator.calculateActualMaxDepth(tasks);
      expect(depth).toBe(3);
    });
  });

  describe('getValidationStatistics', () => {
    it('should calculate correct statistics', () => {
      const hierarchyData = {
        tasks: [
          {
            id: 'task1',
            duration: 10,
            hasSubtasks: true,
            subtasks: [
              {
                id: 'task2',
                duration: 3,
                hasSubtasks: false,
                subtasks: []
              },
              {
                id: 'task3',
                duration: 5,
                hasSubtasks: true,
                subtasks: [
                  {
                    id: 'task4',
                    duration: 2,
                    hasSubtasks: false,
                    subtasks: []
                  }
                ]
              }
            ]
          }
        ],
        relationships: new Map([
          ['task2', 'task1'],
          ['task3', 'task1'],
          ['task4', 'task3']
        ]),
        taskCount: 4,
        maxDepth: 2
      };

      const stats = validator.getValidationStatistics(hierarchyData);
      
      expect(stats.totalTasks).toBe(4);
      expect(stats.maxDepth).toBe(2);
      expect(stats.mainTasks).toBe(1);
      expect(stats.subtasks).toBe(2);
      expect(stats.subSubtasks).toBe(1);
      expect(stats.tasksWithSubtasks).toBe(2);
      expect(stats.totalDuration).toBe(20); // 10 + 3 + 5 + 2
      expect(stats.averageDuration).toBe(5); // 20 / 4
      expect(stats.relationshipCount).toBe(3);
    });

    it('should handle empty hierarchy', () => {
      const hierarchyData = {
        tasks: [],
        relationships: new Map(),
        taskCount: 0,
        maxDepth: 0
      };

      const stats = validator.getValidationStatistics(hierarchyData);
      
      expect(stats.totalTasks).toBe(0);
      expect(stats.mainTasks).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.relationshipCount).toBe(0);
    });
  });
});