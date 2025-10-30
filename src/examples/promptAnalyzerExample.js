/**
 * Example usage of PromptAnalyzer utility
 * Demonstrates how to analyze project prompts for hierarchical structure detection
 */

import { PromptAnalyzer } from '../utils/promptAnalyzer.js';

// Create analyzer instance
const analyzer = new PromptAnalyzer();

// Example 1: Complex hierarchical project (eficlub example)
export const analyzeComplexProject = () => {
  const complexPrompt = `
    Crear un sistema integral para eficlub con los siguientes módulos:

    Módulo 1: INTRANET
    - Gestión de usuarios y perfiles
    - Sistema de comunicación interna
    - Repositorio de documentos
    - Calendario de eventos

    Módulo 2: COMERCIAL
    - Gestión de clientes y prospectos
    - Sistema de ventas y cotizaciones
    - Control de comisiones
    - Reportes comerciales

    Módulo 3: OPERACIONES
    - Gestión de servicios
    - Control de calidad
    - Programación de actividades
    - Seguimiento de proyectos
  `;

  console.log('=== Complex Project Analysis ===');
  const analysis = analyzer.analyzeStructure(complexPrompt);
  
  console.log('Analysis Result:');
  console.log(`- Hierarchical: ${analysis.isHierarchical}`);
  console.log(`- Language: ${analysis.language}`);
  console.log(`- Complexity: ${analysis.complexity}`);
  console.log(`- Suggested Levels: ${analysis.suggestedLevels}`);
  console.log(`- Confidence: ${analysis.confidence}%`);
  console.log(`- Modules Found: ${analysis.modules.length}`);
  
  analysis.modules.forEach((module, index) => {
    console.log(`  ${index + 1}. ${module.name} (${module.components.length} components)`);
  });

  console.log('\nFull Summary:');
  console.log(analyzer.getAnalysisSummary(analysis));
  
  return analysis;
};

// Example 2: Simple project without hierarchy
export const analyzeSimpleProject = () => {
  const simplePrompt = 'Create a basic todo list application with add, edit, and delete functionality';

  console.log('\n=== Simple Project Analysis ===');
  const analysis = analyzer.analyzeStructure(simplePrompt);
  
  console.log('Analysis Result:');
  console.log(`- Hierarchical: ${analysis.isHierarchical}`);
  console.log(`- Language: ${analysis.language}`);
  console.log(`- Complexity: ${analysis.complexity}`);
  console.log(`- Suggested Levels: ${analysis.suggestedLevels}`);
  console.log(`- Confidence: ${analysis.confidence}%`);
  
  return analysis;
};

// Example 3: English e-commerce project
export const analyzeEnglishProject = () => {
  const englishPrompt = `
    Create an e-commerce platform with the following modules:

    Module 1: CUSTOMER MANAGEMENT
    - User registration and authentication
    - Profile management
    - Order history

    Module 2: PRODUCT CATALOG
    - Product listings
    - Category management
    - Inventory tracking

    Module 3: PAYMENT PROCESSING
    - Shopping cart
    - Payment gateway integration
    - Order fulfillment
  `;

  console.log('\n=== English E-commerce Project Analysis ===');
  const analysis = analyzer.analyzeStructure(englishPrompt);
  
  console.log('Analysis Result:');
  console.log(`- Hierarchical: ${analysis.isHierarchical}`);
  console.log(`- Language: ${analysis.language}`);
  console.log(`- Complexity: ${analysis.complexity}`);
  console.log(`- Modules Found: ${analysis.modules.length}`);
  
  analysis.modules.forEach((module, index) => {
    console.log(`  ${index + 1}. ${module.name}`);
  });
  
  return analysis;
};

// Example 4: Demonstrate how to use analysis results for prompt enhancement
export const demonstratePromptEnhancement = () => {
  const prompt = 'Sistema con módulos INTRANET, COMERCIAL y OPERACIONES';
  
  console.log('\n=== Prompt Enhancement Example ===');
  console.log(`Original prompt: "${prompt}"`);
  
  const analysis = analyzer.analyzeStructure(prompt);
  
  console.log('\nAnalysis suggests:');
  if (analysis.isHierarchical) {
    console.log('✓ Use hierarchical prompt generation');
    console.log(`✓ Target complexity: ${analysis.complexity}`);
    console.log(`✓ Suggested hierarchy levels: ${analysis.suggestedLevels}`);
    console.log(`✓ Language: ${analysis.language}`);
    
    if (analysis.modules.length > 0) {
      console.log('✓ Detected modules:');
      analysis.modules.forEach(module => {
        console.log(`  - ${module.name}`);
      });
    }
  } else {
    console.log('✓ Use flat/simple prompt generation');
    console.log('✓ No hierarchical structure needed');
  }
  
  return analysis;
};

// Example 5: Batch analysis of multiple prompts
export const batchAnalysis = () => {
  const prompts = [
    'Simple task manager',
    'Sistema con módulos INTRANET y COMERCIAL',
    `
      Complex enterprise system:
      
      Module 1: USER MANAGEMENT
      - Authentication
      - Authorization
      - Profile management
      
      Module 2: REPORTING
      - Dashboard
      - Analytics
      - Export functionality
    `,
    'Create a blog application',
    'Desarrollar una aplicación móvil con gestión de usuarios, productos y ventas'
  ];

  console.log('\n=== Batch Analysis Example ===');
  
  const results = prompts.map((prompt, index) => {
    const analysis = analyzer.analyzeStructure(prompt);
    
    console.log(`\nPrompt ${index + 1}: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
    console.log(`  Hierarchical: ${analysis.isHierarchical}`);
    console.log(`  Complexity: ${analysis.complexity}`);
    console.log(`  Language: ${analysis.language}`);
    console.log(`  Modules: ${analysis.modules.length}`);
    
    return {
      prompt,
      analysis
    };
  });
  
  return results;
};

// Run all examples
export const runAllExamples = () => {
  console.log('PromptAnalyzer Examples\n');
  
  analyzeComplexProject();
  analyzeSimpleProject();
  analyzeEnglishProject();
  demonstratePromptEnhancement();
  batchAnalysis();
  
  console.log('\n=== Examples Complete ===');
};

// Export the analyzer instance for direct use
export { analyzer as promptAnalyzer };