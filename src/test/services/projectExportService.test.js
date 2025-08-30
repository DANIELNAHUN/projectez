import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProjectExportService } from '../../services/projectExportService.js';
import { Project, Task, TeamMember, Deliverable } from '../../models/index.js';

describe('ProjectExportService', () => {
  let mockProject;
  let mockTask;
  let mockTeamMember;
  let mockDeliverable;

  beforeEach(() => {
    // Create mock deliverable
    mockDeliverable = new Deliverable({
      type: 'presentation',
      description: 'Final presentation',
      dueDate: new Date('2024-03-15'),
      status: 'pending',
      notes: 'Prepare slides'
    });

    // Create mock team member
    mockTeamMember = new TeamMember({
      id: 'member_1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      avatar: 'avatar.jpg',
      joinedAt: new Date('2024-01-01')
    });

    // Create mock task
    mockTask = new Task({
      id: 'task_1',
      projectId: 'project_1',
      parentTaskId: null,
      title: 'Test Task',
      description: 'A test task',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-05'),
      status: 'pending',
      type: 'with_deliverable',
      assignedTo: 'member_1',
      priority: 'high',
      progress: 25,
      level: 0,
      duration: 4,
      adjustStartDate: false,
      deliverable: mockDeliverable,
      subtasks: [],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-15')
    });

    // Create mock project
    mockProject = new Project({
      id: 'project_1',
      name: 'Test Project',
      description: 'A test project',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-31'),
      status: 'active',
      teamMembers: [mockTeamMember],
      tasks: [mockTask],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-15')
    });
  });

  describe('exportProject', () => {
    it('should export a complete project to JSON string', () => {
      const result = ProjectExportService.exportProject(mockProject);
      
      expect(typeof result).toBe('string');
      
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('project_1');
      expect(parsed.name).toBe('Test Project');
      expect(parsed.description).toBe('A test project');
      expect(parsed.status).toBe('active');
      expect(parsed.exportVersion).toBe('1.0.0');
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should include all project components in export', () => {
      const result = ProjectExportService.exportProject(mockProject);
      const parsed = JSON.parse(result);
      
      // Check team members
      expect(parsed.teamMembers).toHaveLength(1);
      expect(parsed.teamMembers[0].id).toBe('member_1');
      expect(parsed.teamMembers[0].name).toBe('John Doe');
      expect(parsed.teamMembers[0].email).toBe('john@example.com');
      
      // Check tasks
      expect(parsed.tasks).toHaveLength(1);
      expect(parsed.tasks[0].id).toBe('task_1');
      expect(parsed.tasks[0].title).toBe('Test Task');
      expect(parsed.tasks[0].duration).toBe(4);
      
      // Check deliverable
      expect(parsed.tasks[0].deliverable).toBeDefined();
      expect(parsed.tasks[0].deliverable.type).toBe('presentation');
      expect(parsed.tasks[0].deliverable.description).toBe('Final presentation');
    });

    it('should use ISO date format for all dates', () => {
      const result = ProjectExportService.exportProject(mockProject);
      const parsed = JSON.parse(result);
      
      // Check project dates
      expect(parsed.startDate).toBe('2024-03-01T00:00:00.000Z');
      expect(parsed.endDate).toBe('2024-03-31T00:00:00.000Z');
      expect(parsed.createdAt).toBe('2024-02-01T00:00:00.000Z');
      expect(parsed.updatedAt).toBe('2024-02-15T00:00:00.000Z');
      
      // Check task dates
      expect(parsed.tasks[0].startDate).toBe('2024-03-01T00:00:00.000Z');
      expect(parsed.tasks[0].endDate).toBe('2024-03-05T00:00:00.000Z');
      
      // Check deliverable date
      expect(parsed.tasks[0].deliverable.dueDate).toBe('2024-03-15T00:00:00.000Z');
      
      // Check team member date
      expect(parsed.teamMembers[0].joinedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle project with no team members', () => {
      mockProject.teamMembers = [];
      
      const result = ProjectExportService.exportProject(mockProject);
      const parsed = JSON.parse(result);
      
      expect(parsed.teamMembers).toEqual([]);
    });

    it('should handle project with no tasks', () => {
      mockProject.tasks = [];
      
      const result = ProjectExportService.exportProject(mockProject);
      const parsed = JSON.parse(result);
      
      expect(parsed.tasks).toEqual([]);
    });

    it('should handle tasks with subtasks', () => {
      const subtask = new Task({
        id: 'subtask_1',
        projectId: 'project_1',
        parentTaskId: 'task_1',
        title: 'Subtask',
        description: 'A subtask',
        startDate: new Date('2024-03-02'),
        endDate: new Date('2024-03-03'),
        level: 1
      });
      
      mockTask.subtasks = [subtask];
      
      const result = ProjectExportService.exportProject(mockProject);
      const parsed = JSON.parse(result);
      
      expect(parsed.tasks[0].subtasks).toHaveLength(1);
      expect(parsed.tasks[0].subtasks[0].id).toBe('subtask_1');
      expect(parsed.tasks[0].subtasks[0].title).toBe('Subtask');
      expect(parsed.tasks[0].subtasks[0].level).toBe(1);
    });

    it('should throw error for null project', () => {
      expect(() => {
        ProjectExportService.exportProject(null);
      }).toThrow('Project is required for export');
    });

    it('should throw error for project without id', () => {
      mockProject.id = null;
      
      expect(() => {
        ProjectExportService.exportProject(mockProject);
      }).toThrow('Project must have an id and name');
    });

    it('should throw error for project without name', () => {
      mockProject.name = '';
      
      expect(() => {
        ProjectExportService.exportProject(mockProject);
      }).toThrow('Project must have an id and name');
    });

    it('should handle null dates gracefully', () => {
      mockProject.startDate = null;
      mockProject.endDate = null;
      
      const result = ProjectExportService.exportProject(mockProject);
      const parsed = JSON.parse(result);
      
      expect(parsed.startDate).toBeNull();
      expect(parsed.endDate).toBeNull();
    });
  });

  describe('serializeTeamMembers', () => {
    it('should serialize team members correctly', () => {
      const members = [mockTeamMember];
      const result = ProjectExportService.serializeTeamMembers(members);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('member_1');
      expect(result[0].name).toBe('John Doe');
      expect(result[0].email).toBe('john@example.com');
      expect(result[0].role).toBe('Developer');
      expect(result[0].avatar).toBe('avatar.jpg');
      expect(result[0].joinedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle empty team members array', () => {
      const result = ProjectExportService.serializeTeamMembers([]);
      expect(result).toEqual([]);
    });

    it('should handle team members with missing fields', () => {
      const incompleteMembers = [new TeamMember({ id: 'member_2' })];
      const result = ProjectExportService.serializeTeamMembers(incompleteMembers);
      
      expect(result[0].id).toBe('member_2');
      expect(result[0].name).toBe('');
      expect(result[0].email).toBe('');
      expect(result[0].role).toBe('');
      expect(result[0].avatar).toBeNull();
    });
  });

  describe('serializeTasks', () => {
    it('should serialize tasks correctly', () => {
      const tasks = [mockTask];
      const result = ProjectExportService.serializeTasks(tasks);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task_1');
      expect(result[0].title).toBe('Test Task');
      expect(result[0].duration).toBe(4);
      expect(result[0].adjustStartDate).toBe(false);
      expect(result[0].deliverable).toBeDefined();
      expect(result[0].subtasks).toEqual([]);
    });

    it('should handle tasks without deliverables', () => {
      mockTask.deliverable = null;
      const tasks = [mockTask];
      const result = ProjectExportService.serializeTasks(tasks);
      
      expect(result[0].deliverable).toBeNull();
    });

    it('should serialize nested subtasks', () => {
      const subtask = new Task({
        id: 'subtask_1',
        title: 'Subtask',
        level: 1,
        subtasks: []
      });
      
      mockTask.subtasks = [subtask];
      const tasks = [mockTask];
      const result = ProjectExportService.serializeTasks(tasks);
      
      expect(result[0].subtasks).toHaveLength(1);
      expect(result[0].subtasks[0].id).toBe('subtask_1');
      expect(result[0].subtasks[0].title).toBe('Subtask');
    });
  });

  describe('serializeDeliverable', () => {
    it('should serialize deliverable correctly', () => {
      const result = ProjectExportService.serializeDeliverable(mockDeliverable);
      
      expect(result.type).toBe('presentation');
      expect(result.description).toBe('Final presentation');
      expect(result.dueDate).toBe('2024-03-15T00:00:00.000Z');
      expect(result.status).toBe('pending');
      expect(result.notes).toBe('Prepare slides');
    });

    it('should handle deliverable with null date', () => {
      mockDeliverable.dueDate = null;
      const result = ProjectExportService.serializeDeliverable(mockDeliverable);
      
      expect(result.dueDate).toBeNull();
    });
  });

  describe('downloadJSON', () => {
    let mockCreateElement;
    let mockAppendChild;
    let mockRemoveChild;
    let mockCreateObjectURL;
    let mockRevokeObjectURL;
    let mockLink;

    beforeEach(() => {
      // Mock DOM elements and methods
      mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };

      mockCreateElement = vi.fn(() => mockLink);
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();
      mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      mockRevokeObjectURL = vi.fn();

      // Mock global objects
      global.document = {
        createElement: mockCreateElement,
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild
        }
      };

      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      };

      global.Blob = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create and trigger download', () => {
      const jsonData = '{"test": "data"}';
      const filename = 'test-export';

      ProjectExportService.downloadJSON(jsonData, filename);

      expect(global.Blob).toHaveBeenCalledWith([jsonData], { type: 'application/json' });
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test-export.json');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should use default filename when not provided', () => {
      const jsonData = '{"test": "data"}';

      ProjectExportService.downloadJSON(jsonData);

      expect(mockLink.download).toBe('project-export.json');
    });

    it('should throw error for null JSON data', () => {
      expect(() => {
        ProjectExportService.downloadJSON(null);
      }).toThrow('JSON data is required for download');
    });

    it('should throw error for non-string JSON data', () => {
      expect(() => {
        ProjectExportService.downloadJSON({ test: 'data' });
      }).toThrow('JSON data must be a string');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        ProjectExportService.downloadJSON('invalid json');
      }).toThrow('Invalid JSON data provided for download');
    });
  });

  describe('exportAndDownload', () => {
    let downloadJSONSpy;

    beforeEach(() => {
      downloadJSONSpy = vi.spyOn(ProjectExportService, 'downloadJSON').mockImplementation(() => {});
    });

    afterEach(() => {
      downloadJSONSpy.mockRestore();
    });

    it('should export and download project', () => {
      ProjectExportService.exportAndDownload(mockProject, 'custom-filename');

      expect(downloadJSONSpy).toHaveBeenCalledWith(
        expect.stringContaining('"id": "project_1"'),
        'custom-filename'
      );
    });

    it('should use sanitized project name as filename when not provided', () => {
      mockProject.name = 'Test Project With Spaces';
      
      ProjectExportService.exportAndDownload(mockProject);

      expect(downloadJSONSpy).toHaveBeenCalledWith(
        expect.any(String),
        'test-project-with-spaces'
      );
    });

    it('should throw error for null project', () => {
      expect(() => {
        ProjectExportService.exportAndDownload(null);
      }).toThrow('Project is required for export and download');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filename with invalid characters', () => {
      const result = ProjectExportService.sanitizeFilename('Test<>:"/\\|?*Project');
      expect(result).toBe('test-project');
    });

    it('should replace spaces with dashes', () => {
      const result = ProjectExportService.sanitizeFilename('Test Project Name');
      expect(result).toBe('test-project-name');
    });

    it('should remove multiple consecutive dashes', () => {
      const result = ProjectExportService.sanitizeFilename('Test---Project');
      expect(result).toBe('test-project');
    });

    it('should remove leading and trailing dashes', () => {
      const result = ProjectExportService.sanitizeFilename('-Test Project-');
      expect(result).toBe('test-project');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(100);
      const result = ProjectExportService.sanitizeFilename(longName);
      expect(result.length).toBe(50);
    });

    it('should return default for null or empty filename', () => {
      expect(ProjectExportService.sanitizeFilename(null)).toBe('project-export');
      expect(ProjectExportService.sanitizeFilename('')).toBe('project-export');
      expect(ProjectExportService.sanitizeFilename('   ')).toBe('project-export');
    });
  });

  describe('validateProjectForExport', () => {
    it('should validate a complete project successfully', () => {
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for null project', () => {
      const result = ProjectExportService.validateProjectForExport(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project is required');
    });

    it('should return error for project without id', () => {
      mockProject.id = null;
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have an id');
    });

    it('should return error for project without name', () => {
      mockProject.name = '';
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project must have a name');
    });

    it('should return error for invalid project dates', () => {
      mockProject.startDate = new Date('invalid');
      mockProject.endDate = new Date('invalid');
      
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project start date is invalid');
      expect(result.errors).toContain('Project end date is invalid');
    });

    it('should return error for tasks without id', () => {
      mockTask.id = null;
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task at index 0 is missing an id');
    });

    it('should return warning for tasks without title', () => {
      mockTask.title = '';
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Task at index 0 is missing a title');
    });

    it('should return error for tasks with invalid dates', () => {
      mockTask.startDate = new Date('invalid');
      mockTask.endDate = new Date('invalid');
      
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task "Test Task" has invalid start date');
      expect(result.errors).toContain('Task "Test Task" has invalid end date');
    });

    it('should return error for team members without id', () => {
      mockTeamMember.id = null;
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team member at index 0 is missing an id');
    });

    it('should return warning for team members without name', () => {
      mockTeamMember.name = '';
      const result = ProjectExportService.validateProjectForExport(mockProject);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Team member at index 0 is missing a name');
    });
  });
});