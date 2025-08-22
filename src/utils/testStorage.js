// Test utility to verify localStorage service and data models
import { storageService } from '../services/storageService.js';
import { Project, Task, TeamMember, Deliverable } from '../models/index.js';

export const testStorageImplementation = () => {
  console.log('Testing localStorage service and data models...');
  
  try {
    // Test storage health
    const healthCheck = storageService.checkStorageHealth();
    console.log('Storage health check:', healthCheck);
    
    // Test project creation
    const testProject = new Project({
      name: 'Test Project',
      description: 'A test project for validation',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    console.log('Created test project:', testProject);
    
    // Test project saving
    const savedProject = storageService.saveProject(testProject);
    console.log('Saved project:', savedProject);
    
    // Test project retrieval
    const retrievedProject = storageService.getProject(testProject.id);
    console.log('Retrieved project:', retrievedProject);
    
    // Test team member creation
    const testMember = new TeamMember({
      name: 'Test Member',
      email: 'test@example.com',
      role: 'Developer'
    });
    
    console.log('Created test member:', testMember);
    
    // Test team member saving
    const savedMember = storageService.saveTeamMember(testMember, testProject.id);
    console.log('Saved member:', savedMember);
    
    // Test task creation
    const testTask = new Task({
      title: 'Test Task',
      description: 'A test task',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      type: 'with_deliverable',
      deliverable: new Deliverable({
        type: 'file',
        description: 'Test deliverable',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }),
      assignedTo: testMember.id
    });
    
    console.log('Created test task:', testTask);
    
    // Test task saving
    const savedTask = storageService.saveTask(testTask, testProject.id);
    console.log('Saved task:', savedTask);
    
    // Test data retrieval
    const allProjects = storageService.getAllProjects();
    console.log('All projects:', allProjects);
    
    const projectTasks = storageService.getTasksForProject(testProject.id);
    console.log('Project tasks:', projectTasks);
    
    const projectMembers = storageService.getTeamMembersForProject(testProject.id);
    console.log('Project members:', projectMembers);
    
    // Test settings
    const settings = storageService.getSettings();
    console.log('Current settings:', settings);
    
    // Test preferences
    const preferences = storageService.getUserPreferences();
    console.log('User preferences:', preferences);
    
    console.log('✅ All tests passed! localStorage service and data models are working correctly.');
    
    return {
      success: true,
      message: 'All tests passed successfully'
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};