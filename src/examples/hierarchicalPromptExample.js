/**
 * Example demonstrating enhanced hierarchical prompt generation
 * This example shows how the OpenAI service now automatically detects
 * hierarchical project structures and generates appropriate prompts
 */

import { openAIService } from '../services/openAIService.js';
import { promptAnalyzer } from '../utils/promptAnalyzer.js';

/**
 * Demonstrate hierarchical prompt generation with the eficlub example
 */
export async function demonstrateHierarchicalPrompts() {
  console.log('=== Hierarchical Prompt Generation Demo ===\n');

  // Example project description with hierarchical structure
  const hierarchicalPrompt = `
Crear sistema eficlub con los siguientes módulos:

Módulo 1: INTRANET
- Gestión de usuarios y perfiles
- Sistema de notificaciones
- Panel de administración

Módulo 2: COMERCIAL  
- Gestión de clientes
- Seguimiento de ventas
- Reportes comerciales

Módulo 3: OPERACIONES
- Control de inventario
- Gestión de pedidos
- Logística y distribución
  `;

  // Simple flat project description for comparison
  const simplePrompt = 'Create a basic task management application with user authentication and task CRUD operations';

  console.log('1. Analyzing hierarchical project prompt...');
  const hierarchicalAnalysis = promptAnalyzer.analyzeStructure(hierarchicalPrompt);
  console.log('Analysis Result:');
  console.log(promptAnalyzer.getAnalysisSummary(hierarchicalAnalysis));
  console.log('\n');

  console.log('2. Analyzing simple project prompt...');
  const simpleAnalysis = promptAnalyzer.analyzeStructure(simplePrompt);
  console.log('Analysis Result:');
  console.log(promptAnalyzer.getAnalysisSummary(simpleAnalysis));
  console.log('\n');

  console.log('3. Generating enhanced system prompts...\n');

  // Generate hierarchical system prompt
  console.log('--- HIERARCHICAL SYSTEM PROMPT ---');
  const hierarchicalSystemPrompt = openAIService.createSystemPrompt('medium', true, 20, hierarchicalAnalysis);
  console.log(hierarchicalSystemPrompt.substring(0, 800) + '...\n');

  // Generate simple system prompt
  console.log('--- SIMPLE SYSTEM PROMPT ---');
  const simpleSystemPrompt = openAIService.createSystemPrompt('medium', true, 20, simpleAnalysis);
  console.log(simpleSystemPrompt.substring(0, 500) + '...\n');

  console.log('4. Generating enhanced user prompts...\n');

  // Generate hierarchical user prompt
  console.log('--- HIERARCHICAL USER PROMPT ---');
  const hierarchicalUserPrompt = openAIService.enhanceUserPrompt(hierarchicalPrompt, 45, hierarchicalAnalysis);
  console.log(hierarchicalUserPrompt);
  console.log('\n');

  // Generate simple user prompt
  console.log('--- SIMPLE USER PROMPT ---');
  const simpleUserPrompt = openAIService.enhanceUserPrompt(simplePrompt, 15, simpleAnalysis);
  console.log(simpleUserPrompt);
  console.log('\n');

  console.log('5. Key differences in hierarchical enhancement:');
  console.log('✓ Automatic detection of module-based structure');
  console.log('✓ Spanish language support and preservation');
  console.log('✓ Hierarchical instructions in system prompt');
  console.log('✓ JSON structure examples for main tasks and subtasks');
  console.log('✓ Module-specific guidelines');
  console.log('✓ Enhanced user prompt with module context');
  console.log('✓ Conditional prompt enhancement based on analysis');
  console.log('\n');

  return {
    hierarchicalAnalysis,
    simpleAnalysis,
    hierarchicalSystemPrompt,
    simpleSystemPrompt,
    hierarchicalUserPrompt,
    simpleUserPrompt
  };
}

/**
 * Demonstrate different complexity levels with hierarchical enhancement
 */
export function demonstrateComplexityLevels() {
  console.log('=== Complexity Level Demonstration ===\n');

  const analysisResult = {
    isHierarchical: true,
    modules: [
      { name: 'USER_MANAGEMENT', components: [{ name: 'Authentication' }, { name: 'Profiles' }] },
      { name: 'DATA_LAYER', components: [{ name: 'Database' }, { name: 'API' }] },
      { name: 'UI_COMPONENTS', components: [{ name: 'Dashboard' }, { name: 'Forms' }] }
    ],
    language: 'english',
    suggestedLevels: 2,
    complexity: 'detailed'
  };

  const complexities = ['basic', 'medium', 'detailed'];
  const maxTasks = [8, 15, 25];

  complexities.forEach((complexity, index) => {
    console.log(`--- ${complexity.toUpperCase()} COMPLEXITY ---`);
    const prompt = openAIService.createSystemPrompt(complexity, true, maxTasks[index], analysisResult);
    
    // Extract key sections to show differences
    const lines = prompt.split('\n');
    const maxTasksLine = lines.find(line => line.includes('Maximum'));
    const complexityLine = lines.find(line => line.includes(`Complexity level: ${complexity}`));
    const guidelinesLine = lines.find(line => line.includes('complexity:'));
    
    console.log(`Max Tasks: ${maxTasksLine?.trim()}`);
    console.log(`Complexity: ${complexityLine?.trim()}`);
    console.log(`Guidelines: ${guidelinesLine?.trim()}`);
    console.log('');
  });
}

/**
 * Demonstrate language-specific enhancements
 */
export function demonstrateLanguageSupport() {
  console.log('=== Language Support Demonstration ===\n');

  const spanishAnalysis = {
    isHierarchical: true,
    modules: [{ name: 'ADMINISTRACIÓN', components: [{ name: 'Usuarios' }] }],
    language: 'spanish',
    suggestedLevels: 2,
    complexity: 'medium'
  };

  const englishAnalysis = {
    isHierarchical: true,
    modules: [{ name: 'ADMINISTRATION', components: [{ name: 'Users' }] }],
    language: 'english',
    suggestedLevels: 2,
    complexity: 'medium'
  };

  console.log('--- SPANISH HIERARCHICAL INSTRUCTIONS ---');
  const spanishPrompt = openAIService.createSystemPrompt('medium', true, 15, spanishAnalysis);
  const spanishInstructions = spanishPrompt.split('CRITICAL INSTRUCTIONS:')[0];
  console.log(spanishInstructions);

  console.log('--- ENGLISH HIERARCHICAL INSTRUCTIONS ---');
  const englishPrompt = openAIService.createSystemPrompt('medium', true, 15, englishAnalysis);
  const englishInstructions = englishPrompt.split('CRITICAL INSTRUCTIONS:')[0];
  console.log(englishInstructions);
}

// Run demonstrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Hierarchical Prompt Generation Examples...\n');
  
  demonstrateHierarchicalPrompts()
    .then(() => {
      console.log('\n');
      demonstrateComplexityLevels();
      console.log('\n');
      demonstrateLanguageSupport();
    })
    .catch(error => {
      console.error('Demo error:', error.message);
    });
}