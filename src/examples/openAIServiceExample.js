/**
 * Example usage of OpenAIService
 * This file demonstrates how to use the OpenAIService to generate projects from prompts
 */

import { openAIService } from '../services/openAIService.js';

// Example function to demonstrate OpenAI service usage
export async function demonstrateOpenAIService() {
  console.log('OpenAI Service Demonstration');
  console.log('============================');

  // Step 1: Configure the service (in a real app, this would come from user settings)
  try {
    // Note: In a real application, you would get this from environment variables or user input
    // openAIService.configure('your-openai-api-key-here');
    console.log('⚠️  Service configuration required - API key needed');
    console.log('   Use: openAIService.configure("your-api-key")');
    return;
  } catch (error) {
    console.error('Configuration failed:', error.message);
    return;
  }

  // Step 2: Test connection
  console.log('\n🔍 Testing connection...');
  const connectionTest = await openAIService.testConnection();
  if (!connectionTest.success) {
    console.error('Connection failed:', connectionTest.error);
    return;
  }
  console.log('✅ Connection successful');

  // Step 3: Generate a simple project
  console.log('\n🚀 Generating a simple project...');
  try {
    const simpleProject = await openAIService.generateProject(
      'Create a simple todo list web application',
      {
        complexity: 'basic',
        includeTeamMembers: false,
        maxTasks: 8
      }
    );

    console.log('✅ Simple project generated:');
    console.log(`   Name: ${simpleProject.name}`);
    console.log(`   Tasks: ${simpleProject.tasks.length}`);
    console.log(`   Duration: ${simpleProject.estimatedDuration} days`);

  } catch (error) {
    console.error('Simple project generation failed:', error.message);
  }

  // Step 4: Generate a complex project
  console.log('\n🏗️  Generating a complex project...');
  try {
    const complexProject = await openAIService.generateProject(
      'Create an e-commerce platform with user authentication, product catalog, shopping cart, payment processing, and admin dashboard',
      {
        complexity: 'detailed',
        includeTeamMembers: true,
        maxTasks: 20,
        estimatedDuration: 90
      }
    );

    console.log('✅ Complex project generated:');
    console.log(`   Name: ${complexProject.name}`);
    console.log(`   Tasks: ${complexProject.tasks.length}`);
    console.log(`   Team Members: ${complexProject.teamMembers.length}`);
    console.log(`   Duration: ${complexProject.estimatedDuration} days`);

    // Show task hierarchy
    console.log('\n📋 Task Structure:');
    complexProject.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (${task.duration} days)`);
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
          console.log(`      ${index + 1}.${subIndex + 1} ${subtask.title} (${subtask.duration} days)`);
        });
      }
    });

  } catch (error) {
    console.error('Complex project generation failed:', error.message);
  }

  // Step 5: Demonstrate safe generation with error handling
  console.log('\n🛡️  Demonstrating safe generation...');
  const safeResult = await openAIService.generateProjectSafe(
    'Create a mobile app for fitness tracking',
    {
      complexity: 'medium',
      maxRetries: 2
    }
  );

  if (safeResult.success) {
    console.log('✅ Safe generation successful');
    console.log(`   Project: ${safeResult.project.name}`);
    console.log(`   Retry count: ${safeResult.retryCount}`);
  } else {
    console.log('❌ Safe generation failed');
    console.log(`   Errors: ${safeResult.errors.join(', ')}`);
  }
}

// Example project prompts for testing
export const examplePrompts = {
  basic: [
    'Create a simple blog website',
    'Build a personal portfolio site',
    'Develop a basic calculator app',
    'Create a weather app'
  ],
  
  medium: [
    'Create a task management application with user authentication',
    'Build a restaurant ordering system with menu management',
    'Develop a library management system',
    'Create a social media dashboard'
  ],
  
  detailed: [
    'Create a comprehensive e-learning platform with course management, student tracking, video streaming, assignments, and reporting',
    'Build a complete CRM system with lead management, sales pipeline, customer communication, and analytics',
    'Develop a multi-tenant SaaS application with user management, billing, API integration, and admin dashboard',
    'Create a real estate platform with property listings, virtual tours, mortgage calculator, and agent management'
  ]
};

// Utility function to validate project structure
export function validateProjectStructure(project) {
  const issues = [];
  
  if (!project.name) issues.push('Missing project name');
  if (!project.tasks || project.tasks.length === 0) issues.push('No tasks defined');
  if (!project.estimatedDuration || project.estimatedDuration <= 0) issues.push('Invalid estimated duration');
  
  // Check task structure
  project.tasks.forEach((task, index) => {
    if (!task.title) issues.push(`Task ${index + 1} missing title`);
    if (!task.duration || task.duration <= 0) issues.push(`Task ${index + 1} invalid duration`);
    if (!task.description) issues.push(`Task ${index + 1} missing description`);
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Example of how to integrate with existing project import service
export async function generateAndImportProject(prompt, options = {}) {
  try {
    // Generate project using AI
    const generatedProject = await openAIService.generateProject(prompt, options);
    
    // Validate the generated project
    const validation = validateProjectStructure(generatedProject);
    if (!validation.isValid) {
      throw new Error(`Generated project validation failed: ${validation.issues.join(', ')}`);
    }
    
    // Convert to JSON format for import
    const projectJSON = JSON.stringify(generatedProject, null, 2);
    
    // Here you would typically use the ProjectImportService
    // const importedProject = ProjectImportService.importProject(projectJSON, new Date());
    
    return {
      success: true,
      project: generatedProject,
      json: projectJSON
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateOpenAIService().catch(console.error);
}