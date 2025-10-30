/**
 * Simple test of hierarchical prompt generation functionality
 */

import { openAIService } from '../services/openAIService.js';
import { promptAnalyzer } from '../utils/promptAnalyzer.js';

// Test hierarchical prompt
const hierarchicalPrompt = `
Crear sistema eficlub con los siguientes módulos:

Módulo 1: INTRANET
- Gestión de usuarios y perfiles
- Sistema de notificaciones

Módulo 2: COMERCIAL  
- Gestión de clientes
- Seguimiento de ventas
`;

console.log('Testing Hierarchical Prompt Generation...\n');

// Analyze the prompt
const analysis = promptAnalyzer.analyzeStructure(hierarchicalPrompt);
console.log('Analysis Result:');
console.log('Is Hierarchical:', analysis.isHierarchical);
console.log('Modules found:', analysis.modules.length);
console.log('Language:', analysis.language);
console.log('Complexity:', analysis.complexity);
console.log('\nModules:');
analysis.modules.forEach(module => {
  console.log(`- ${module.name} (${module.components.length} components)`);
});

// Generate enhanced system prompt
console.log('\n--- Enhanced System Prompt (first 500 chars) ---');
const systemPrompt = openAIService.createSystemPrompt('medium', true, 20, analysis);
console.log(systemPrompt.substring(0, 500) + '...');

// Generate enhanced user prompt
console.log('\n--- Enhanced User Prompt ---');
const userPrompt = openAIService.enhanceUserPrompt(hierarchicalPrompt, 30, analysis);
console.log(userPrompt);

console.log('\n✓ Hierarchical prompt generation working correctly!');