/**
 * Unit tests for ProjectImportService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectImportService } from '../../services/projectImportService.js';
import { Project, Task, TeamMember, Deliverable } from '../../models/index.js';

describe('ProjectImportService', () => {
  let validProjectJSON;
  let validProjectData;

  beforeEach(() => {
    validProjectData = {
      id: 'test-project-1',
      name: 'Test Project',
      description: 'A test project for import',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-31T00:00:00.000Z',
      status: 'active',
      teamMembers: [
        {
          id: 'member-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Developer',
          joinedAt: '2024-01-01T00:00:00.000Z'
        }
      ],
      tasks: [
        {
          id: 'task-1',
          projectId: 'test-project-1',
          title: 'Test Task',
          description: 'A test task',
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-05T00:00:00.000Z',
          status: 'pending',
          type: 'simple',
          priority: 'medium',
          progress: 0,
          duration: 5,
          adjustStartDate: false,
          level: 0,
          subtasks: []
        }
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    validProjectJSON = JSON.stringify(validProjectData);
  });

  describe('validateProjectJSON', () => {
    it('should validate a valid project JSON', () => {
      const result = ProjectImportService.validateProjectJSON(validProjectJSON);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null or undefined JSON data', () => {
      const result1 = ProjectImportService.validateProjectJSON(null);
      const result2 = ProjectImportService.validateProjectJSON(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('JSON data is required and must be a string');
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('JSON data is required and must be a string');
    });

    it('should reject non-string JSON data', () => {
      const result = ProjectImportService.validateProjectJSON(123);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('JSON data is required and must be a string');
    });

    it('should reject invalid JSON format', () => {
      const invalidJSON = '{ invalid json }';
      const result = ProjectImportService.validateProjectJSON(invalidJSON);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid JSON format');
    });

    it('should reject project without id', () => {
      const dataWithoutId = { ...validProjectData };
      delete dataWithoutId.id;
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithoutId));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have an id');
    });

    it('should reject project without name', () => {
      const dataWithoutName = { ...validProjectData };
      delete dataWithoutName.name;
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithoutName));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have a valid name');
    });

    it('should reject project with empty name', () => {
      const dataWithEmptyName = { ...validProjectData, name: '' };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithEmptyName));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have a valid name');
    });

    it('should reject project with invalid start date', () => {
      const dataWithInvalidDate = { ...validProjectData, startDate: 'invalid-date' };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithInvalidDate));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project start date is invalid');
    });

    it('should reject project with invalid end date', () => {
      const dataWithInvalidDate = { ...validProjectData, endDate: 'invalid-date' };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithInvalidDate));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project end date is invalid');
    });

    it('should reject project with end date before start date', () => {
      const dataWithInvalidRange = {
        ...validProjectData,
        startDate: '2024-01-31T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z'
      };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithInvalidRange));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project end date must be after start date');
    });

    it('should warn about invalid project status', () => {
      const dataWithInvalidStatus = { ...validProjectData, status: 'invalid-status' };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithInvalidStatus));
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Invalid project status "invalid-status", will default to "active"');
    });

    it('should reject non-array team members', () => {
      const dataWithInvalidTeamMembers = { ...validProjectData, teamMembers: 'not-an-array' };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithInvalidTeamMembers));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team members must be an array');
    });

    it('should reject non-array tasks', () => {
      const dataWithInvalidTasks = { ...validProjectData, tasks: 'not-an-array' };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithInvalidTasks));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tasks must be an array');
    });
  });

  describe('validateTeamMemberData', () => {
    it('should validate valid team member data', () => {
      const member = validProjectData.teamMembers[0];
      const result = ProjectImportService.validateTeamMemberData(member, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object team member', () => {
      const result = ProjectImportService.validateTeamMemberData('not-an-object', 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team member at index 0 must be an object');
    });

    it('should reject team member without id', () => {
      const memberWithoutId = { ...validProjectData.teamMembers[0] };
      delete memberWithoutId.id;
      
      const result = ProjectImportService.validateTeamMemberData(memberWithoutId, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team member at index 0 must have an id');
    });

    it('should warn about team member without name', () => {
      const memberWithoutName = { ...validProjectData.teamMembers[0] };
      delete memberWithoutName.name;
      
      const result = ProjectImportService.validateTeamMemberData(memberWithoutName, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Team member at index 0 should have a name');
    });

    it('should warn about invalid joinedAt date', () => {
      const memberWithInvalidDate = { ...validProjectData.teamMembers[0], joinedAt: 'invalid-date' };
      
      const result = ProjectImportService.validateTeamMemberData(memberWithInvalidDate, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Team member at index 0 has invalid joinedAt date');
    });
  });

  describe('validateTaskData', () => {
    it('should validate valid task data', () => {
      const task = validProjectData.tasks[0];
      const result = ProjectImportService.validateTaskData(task, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object task', () => {
      const result = ProjectImportService.validateTaskData('not-an-object', 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 must be an object');
    });

    it('should reject task without id', () => {
      const taskWithoutId = { ...validProjectData.tasks[0] };
      delete taskWithoutId.id;
      
      const result = ProjectImportService.validateTaskData(taskWithoutId, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 must have an id');
    });

    it('should warn about task without title', () => {
      const taskWithoutTitle = { ...validProjectData.tasks[0] };
      delete taskWithoutTitle.title;
      
      const result = ProjectImportService.validateTaskData(taskWithoutTitle, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 should have a title');
    });

    it('should reject task with invalid start date', () => {
      const taskWithInvalidDate = { ...validProjectData.tasks[0], startDate: 'invalid-date' };
      
      const result = ProjectImportService.validateTaskData(taskWithInvalidDate, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 has invalid start date');
    });

    it('should reject task with invalid end date', () => {
      const taskWithInvalidDate = { ...validProjectData.tasks[0], endDate: 'invalid-date' };
      
      const result = ProjectImportService.validateTaskData(taskWithInvalidDate, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 has invalid end date');
    });

    it('should reject task with end date before start date', () => {
      const taskWithInvalidRange = {
        ...validProjectData.tasks[0],
        startDate: '2024-01-05T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z'
      };
      
      const result = ProjectImportService.validateTaskData(taskWithInvalidRange, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 end date must be after start date');
    });

    it('should warn about invalid task status', () => {
      const taskWithInvalidStatus = { ...validProjectData.tasks[0], status: 'invalid-status' };
      
      const result = ProjectImportService.validateTaskData(taskWithInvalidStatus, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 has invalid status "invalid-status"');
    });

    it('should warn about invalid task type', () => {
      const taskWithInvalidType = { ...validProjectData.tasks[0], type: 'invalid-type' };
      
      const result = ProjectImportService.validateTaskData(taskWithInvalidType, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 has invalid type "invalid-type"');
    });

    it('should warn about invalid task priority', () => {
      const taskWithInvalidPriority = { ...validProjectData.tasks[0], priority: 'invalid-priority' };
      
      const result = ProjectImportService.validateTaskData(taskWithInvalidPriority, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 has invalid priority "invalid-priority"');
    });

    it('should warn about invalid progress value', () => {
      const taskWithInvalidProgress = { ...validProjectData.tasks[0], progress: 150 };
      
      const result = ProjectImportService.validateTaskData(taskWithInvalidProgress, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 progress should be a number between 0 and 100');
    });

    it('should warn about negative duration', () => {
      const taskWithNegativeDuration = { ...validProjectData.tasks[0], duration: -5 };
      
      const result = ProjectImportService.validateTaskData(taskWithNegativeDuration, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 duration should be a positive number');
    });
  });

  describe('validateDeliverableData', () => {
    let taskWithDeliverable;

    beforeEach(() => {
      taskWithDeliverable = {
        ...validProjectData.tasks[0],
        type: 'with_deliverable',
        deliverable: {
          type: 'file',
          description: 'Test deliverable',
          dueDate: '2024-01-05T00:00:00.000Z',
          status: 'pending',
          notes: 'Test notes'
        }
      };
    });

    it('should validate valid deliverable data', () => {
      const result = ProjectImportService.validateDeliverableData(taskWithDeliverable.deliverable, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object deliverable', () => {
      const result = ProjectImportService.validateDeliverableData('not-an-object', 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 deliverable must be an object');
    });

    it('should warn about invalid deliverable type', () => {
      const deliverableWithInvalidType = { ...taskWithDeliverable.deliverable, type: 'invalid-type' };
      
      const result = ProjectImportService.validateDeliverableData(deliverableWithInvalidType, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 deliverable has invalid type "invalid-type"');
    });

    it('should warn about invalid deliverable status', () => {
      const deliverableWithInvalidStatus = { ...taskWithDeliverable.deliverable, status: 'invalid-status' };
      
      const result = ProjectImportService.validateDeliverableData(deliverableWithInvalidStatus, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 deliverable has invalid status "invalid-status"');
    });

    it('should reject deliverable with invalid due date', () => {
      const deliverableWithInvalidDate = { ...taskWithDeliverable.deliverable, dueDate: 'invalid-date' };
      
      const result = ProjectImportService.validateDeliverableData(deliverableWithInvalidDate, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 deliverable has invalid due date');
    });
  });

  describe('importProject', () => {
    it('should import a valid project', () => {
      const project = ProjectImportService.importProject(validProjectJSON);
      
      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(validProjectData.id);
      expect(project.name).toBe(validProjectData.name);
      expect(project.description).toBe(validProjectData.description);
      expect(project.status).toBe(validProjectData.status);
      expect(project.teamMembers).toHaveLength(1);
      expect(project.tasks).toHaveLength(1);
    });

    it('should throw error for null JSON data', () => {
      expect(() => {
        ProjectImportService.importProject(null);
      }).toThrow('JSON data is required and must be a string');
    });

    it('should throw error for non-string JSON data', () => {
      expect(() => {
        ProjectImportService.importProject(123);
      }).toThrow('JSON data is required and must be a string');
    });

    it('should throw error for invalid JSON format', () => {
      expect(() => {
        ProjectImportService.importProject('{ invalid json }');
      }).toThrow('Invalid JSON format');
    });

    it('should throw error for invalid project structure', () => {
      const invalidData = { ...validProjectData };
      delete invalidData.id;
      
      expect(() => {
        ProjectImportService.importProject(JSON.stringify(invalidData));
      }).toThrow('Project validation failed');
    });

    it('should import project with new start date', () => {
      const newStartDate = new Date('2024-02-01');
      const project = ProjectImportService.importProject(validProjectJSON, newStartDate);
      
      expect(project.startDate).toEqual(newStartDate);
      expect(project.tasks[0].startDate).toEqual(newStartDate);
    });

    it('should handle project with team members correctly', () => {
      const project = ProjectImportService.importProject(validProjectJSON);
      
      expect(project.teamMembers).toHaveLength(1);
      expect(project.teamMembers[0]).toBeInstanceOf(TeamMember);
      expect(project.teamMembers[0].name).toBe('John Doe');
      expect(project.teamMembers[0].email).toBe('john@example.com');
    });

    it('should handle project with tasks correctly', () => {
      const project = ProjectImportService.importProject(validProjectJSON);
      
      expect(project.tasks).toHaveLength(1);
      expect(project.tasks[0]).toBeInstanceOf(Task);
      expect(project.tasks[0].title).toBe('Test Task');
      expect(project.tasks[0].projectId).toBe(validProjectData.id);
    });
  });

  describe('createProjectFromData', () => {
    it('should create project instance from valid data', () => {
      const project = ProjectImportService.createProjectFromData(validProjectData);
      
      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(validProjectData.id);
      expect(project.name).toBe(validProjectData.name);
      expect(project.startDate).toEqual(new Date(validProjectData.startDate));
      expect(project.endDate).toEqual(new Date(validProjectData.endDate));
    });

    it('should handle missing optional fields', () => {
      const minimalData = {
        id: 'test-project',
        name: 'Test Project'
      };
      
      const project = ProjectImportService.createProjectFromData(minimalData);
      
      expect(project).toBeInstanceOf(Project);
      expect(project.description).toBe('');
      expect(project.status).toBe('active');
      expect(project.teamMembers).toHaveLength(0);
      expect(project.tasks).toHaveLength(0);
    });
  });

  describe('createTaskFromData', () => {
    it('should create task instance from valid data', () => {
      const taskData = validProjectData.tasks[0];
      const task = ProjectImportService.createTaskFromData(taskData, validProjectData.id);
      
      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe(taskData.id);
      expect(task.title).toBe(taskData.title);
      expect(task.projectId).toBe(validProjectData.id);
    });

    it('should handle task with deliverable', () => {
      const taskWithDeliverable = {
        ...validProjectData.tasks[0],
        type: 'with_deliverable',
        deliverable: {
          type: 'file',
          description: 'Test deliverable',
          dueDate: '2024-01-05T00:00:00.000Z',
          status: 'pending'
        }
      };
      
      const task = ProjectImportService.createTaskFromData(taskWithDeliverable, validProjectData.id);
      
      expect(task.deliverable).toBeInstanceOf(Deliverable);
      expect(task.deliverable.type).toBe('file');
      expect(task.deliverable.description).toBe('Test deliverable');
    });

    it('should handle task with subtasks', () => {
      const taskWithSubtasks = {
        ...validProjectData.tasks[0],
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Subtask 1',
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-02T00:00:00.000Z'
          }
        ]
      };
      
      const task = ProjectImportService.createTaskFromData(taskWithSubtasks, validProjectData.id);
      
      expect(task.subtasks).toHaveLength(1);
      expect(task.subtasks[0]).toBeInstanceOf(Task);
      expect(task.subtasks[0].title).toBe('Subtask 1');
    });
  });

  describe('adjustImportedProjectDates', () => {
    it('should adjust project dates correctly', () => {
      const project = ProjectImportService.createProjectFromData(validProjectData);
      const newStartDate = new Date('2024-02-01');
      
      ProjectImportService.adjustImportedProjectDates(project, newStartDate);
      
      expect(project.startDate).toEqual(newStartDate);
    });

    it('should throw error for null new start date', () => {
      const project = ProjectImportService.createProjectFromData(validProjectData);
      
      expect(() => {
        ProjectImportService.adjustImportedProjectDates(project, null);
      }).toThrow('New start date is required for date adjustment');
    });

    it('should throw error for invalid new start date', () => {
      const project = ProjectImportService.createProjectFromData(validProjectData);
      
      expect(() => {
        ProjectImportService.adjustImportedProjectDates(project, 'invalid-date');
      }).toThrow('Invalid new start date provided');
    });
  });

  describe('importProjectSafe', () => {
    it('should return success result for valid project', () => {
      const result = ProjectImportService.importProjectSafe(validProjectJSON);
      
      expect(result.success).toBe(true);
      expect(result.project).toBeInstanceOf(Project);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error result for invalid project', () => {
      const invalidData = { ...validProjectData };
      delete invalidData.id;
      
      const result = ProjectImportService.importProjectSafe(JSON.stringify(invalidData));
      
      expect(result.success).toBe(false);
      expect(result.project).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate only when validateOnly option is true', () => {
      const result = ProjectImportService.importProjectSafe(validProjectJSON, { validateOnly: true });
      
      expect(result.success).toBe(true);
      expect(result.project).toBeNull();
      expect(result.validation.isValid).toBe(true);
    });

    it('should handle new start date option', () => {
      const newStartDate = new Date('2024-02-01');
      const result = ProjectImportService.importProjectSafe(validProjectJSON, { newStartDate });
      
      expect(result.success).toBe(true);
      expect(result.project.startDate).toEqual(newStartDate);
    });
  });

  describe('generateUniqueProjectId', () => {
    it('should return original ID if not in existing IDs', () => {
      const originalId = 'test-project-1';
      const existingIds = ['other-project-1', 'other-project-2'];
      
      const uniqueId = ProjectImportService.generateUniqueProjectId(originalId, existingIds);
      
      expect(uniqueId).toBe(originalId);
    });

    it('should generate unique ID if original exists', () => {
      const originalId = 'test-project-1';
      const existingIds = ['test-project-1', 'other-project-1'];
      
      const uniqueId = ProjectImportService.generateUniqueProjectId(originalId, existingIds);
      
      expect(uniqueId).toBe('test-project-1_imported_1');
    });

    it('should increment counter for multiple conflicts', () => {
      const originalId = 'test-project-1';
      const existingIds = ['test-project-1', 'test-project-1_imported_1', 'test-project-1_imported_2'];
      
      const uniqueId = ProjectImportService.generateUniqueProjectId(originalId, existingIds);
      
      expect(uniqueId).toBe('test-project-1_imported_3');
    });
  });

  describe('prepareProjectForImport', () => {
    it('should prepare project with unique IDs', () => {
      const existingProjectIds = ['test-project-1'];
      const existingTaskIds = ['task-1'];
      
      const preparedJSON = ProjectImportService.prepareProjectForImport(
        validProjectJSON, 
        existingProjectIds, 
        existingTaskIds
      );
      
      const preparedData = JSON.parse(preparedJSON);
      
      expect(preparedData.id).toBe('test-project-1_imported_1');
      expect(preparedData.tasks[0].id).toBe('task-1_imported_1');
      expect(preparedData.tasks[0].projectId).toBe('test-project-1_imported_1');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        ProjectImportService.prepareProjectForImport('{ invalid json }');
      }).toThrow('Invalid JSON format');
    });
  });

  describe('generateUniqueTaskIds', () => {
    it('should generate unique task IDs', () => {
      const tasks = [
        { id: 'task-1', subtasks: [] },
        { id: 'task-2', subtasks: [{ id: 'subtask-1' }] }
      ];
      const existingIds = ['task-1'];
      const projectId = 'new-project';
      
      const uniqueTasks = ProjectImportService.generateUniqueTaskIds(tasks, existingIds, projectId);
      
      expect(uniqueTasks[0].id).toBe('task-1_imported_1');
      expect(uniqueTasks[0].projectId).toBe(projectId);
      expect(uniqueTasks[1].id).toBe('task-2');
      expect(uniqueTasks[1].projectId).toBe(projectId);
      expect(uniqueTasks[1].subtasks[0].id).toBe('subtask-1');
      expect(uniqueTasks[1].subtasks[0].projectId).toBe(projectId);
    });
  });

  describe('error handling scenarios', () => {
    it('should handle complex nested task validation errors', () => {
      const dataWithNestedErrors = {
        ...validProjectData,
        tasks: [
          {
            ...validProjectData.tasks[0],
            subtasks: [
              {
                id: 'subtask-1',
                title: 'Subtask',
                startDate: 'invalid-date',
                endDate: '2024-01-02T00:00:00.000Z'
              }
            ]
          }
        ]
      };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithNestedErrors));
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('invalid start date'))).toBe(true);
    });

    it('should handle multiple validation errors', () => {
      const dataWithMultipleErrors = {
        name: '', // Invalid name
        startDate: 'invalid-date', // Invalid date
        teamMembers: 'not-an-array', // Invalid team members
        tasks: [
          {
            title: 'Task without ID',
            startDate: '2024-01-05T00:00:00.000Z',
            endDate: '2024-01-01T00:00:00.000Z' // End before start
          }
        ]
      };
      
      const result = ProjectImportService.validateProjectJSON(JSON.stringify(dataWithMultipleErrors));
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should handle import failure gracefully', () => {
      const result = ProjectImportService.importProjectSafe('{ invalid json }');
      
      expect(result.success).toBe(false);
      expect(result.project).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.validation).toBeDefined();
    });
  });
});