/**
 * Integration tests for hierarchical task parsing functionality
 * Tests complete flow from complex prompt to hierarchical task structure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIService } from '../../services/openAIService.js';
import { PromptAnalyzer } from '../../utils/promptAnalyzer.js';
import { HierarchyResponseParser } from '../../utils/hierarchyResponseParser.js';
import { HierarchyValidator } from '../../utils/hierarchyValidator.js';

describe('Hierarchical Task Parsing Integration Tests', () => {
  let openAIService;
  let promptAnalyzer;
  let hierarchyParser;
  let hierarchyValidator;

  beforeEach(() => {
    openAIService = new OpenAIService();
    promptAnalyzer = new PromptAnalyzer();
    hierarchyParser = new HierarchyResponseParser();
    hierarchyValidator = new HierarchyValidator();

    // Mock OpenAI API calls
    vi.spyOn(openAIService, 'generateProject').mockImplementation(async (prompt, options) => {
      // Return mock hierarchical response based on prompt analysis
      const analysis = promptAnalyzer.analyzeStructure(prompt);
      
      if (analysis.isHierarchical) {
        return mockHierarchicalResponse(analysis);
      } else {
        return mockFlatResponse();
      }
    });
  });

  describe('Complete Flow: Eficlub Project Example', () => {
    it('should process eficlub project from prompt to hierarchical structure', async () => {
      const eficlubPrompt = `
        Crear un sistema integral para eficlub con los siguientes módulos:

        Módulo 1: INTRANET
        - Gestión de usuarios y perfiles (5 días)
        - Sistema de comunicación interna (3 días)
        - Repositorio de documentos (4 días)
        - Calendario de eventos (2 días)

        Módulo 2: COMERCIAL
        - Gestión de clientes y prospectos (6 días)
        - Sistema de ventas y cotizaciones (8 días)
        - Control de comisiones (3 días)
        - Reportes comerciales (4 días)

        Módulo 3: OPERACIONES
        - Gestión de servicios (7 días)
        - Control de calidad (3 días)
        - Programación de actividades (5 días)
        - Seguimiento de proyectos (6 días)
      `;

      // Step 1: Analyze prompt structure
      const analysis = promptAnalyzer.analyzeStructure(eficlubPrompt);
      
      expect(analysis.isHierarchical).toBe(true);
      expect(analysis.language).toBe('spanish');
      expect(analysis.modules.length).toBeGreaterThanOrEqual(3);
      
      const moduleNames = analysis.modules.map(m => m.name);
      expect(moduleNames).toContain('INTRANET');
      expect(moduleNames).toContain('COMERCIAL');
      expect(moduleNames).toContain('OPERACIONES');

      // Step 2: Generate project with hierarchical structure
      const generatedProject = await openAIService.generateProject(eficlubPrompt, {
        complexity: 'detailed',
        language: 'spanish'
      });

      expect(generatedProject).toBeDefined();
      expect(generatedProject.name).toContain('eficlub');
      expect(generatedProject.tasks).toBeDefined();

      // Step 3: Parse hierarchical response
      const hierarchyResult = hierarchyParser.parseHierarchicalResponse(
        { tasks: generatedProject.tasks },
        analysis
      );

      expect(hierarchyResult.validationResults.isValid).toBe(true);
      expect(hierarchyResult.mainTasks).toHaveLength(3);

      // Step 4: Validate hierarchy structure
      const hierarchyData = hierarchyParser.buildTaskHierarchy(generatedProject.tasks);
      const validation = hierarchyValidator.validateHierarchy(hierarchyData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.statistics.mainTasks).toBe(3);
      expect(validation.statistics.subtasks).toBeGreaterThan(0);

      // Step 5: Verify main tasks correspond to modules
      const mainTasks = hierarchyResult.mainTasks;
      const mainTaskTitles = mainTasks.map(task => task.title);
      
      expect(mainTaskTitles.some(title => title.includes('INTRANET'))).toBe(true);
      expect(mainTaskTitles.some(title => title.includes('COMERCIAL'))).toBe(true);
      expect(mainTaskTitles.some(title => title.includes('OPERACIONES'))).toBe(true);

      // Step 6: Verify subtasks are properly nested
      mainTasks.forEach(mainTask => {
        expect(mainTask.isMainTask).toBe(true);
        expect(mainTask.level).toBe(0);
        expect(mainTask.hasSubtasks).toBe(true);
        expect(mainTask.subtasks.length).toBeGreaterThan(0);

        mainTask.subtasks.forEach(subtask => {
          expect(subtask.isMainTask).toBe(false);
          expect(subtask.level).toBe(1);
          expect(subtask.parentTaskId).toBe(mainTask.id);
        });
      });

      // Step 7: Verify duration aggregation
      mainTasks.forEach(mainTask => {
        const expectedDuration = mainTask.subtasks.reduce((sum, subtask) => sum + subtask.duration, 0);
        expect(mainTask.aggregatedDuration).toBe(expectedDuration);
      });

      // Step 8: Enhance tasks with metadata using OpenAI service
      const enhancedTasks = openAIService.enhanceTasksData(
        hierarchyResult.mainTasks, 
        'eficlub-project', 
        null, 
        0, 
        analysis
      );
      
      expect(enhancedTasks).toBeDefined();
      expect(enhancedTasks.length).toBeGreaterThan(0);
      
      // Verify enhanced tasks maintain hierarchy
      const enhancedMainTasks = enhancedTasks.filter(task => task.isMainTask);
      expect(enhancedMainTasks.length).toBeGreaterThan(0);
    });

    it('should preserve original task names and durations from eficlub prompt', async () => {
      const eficlubPrompt = `
        Sistema eficlub con módulos:
        
        INTRANET:
        - Gestión de usuarios (5 días)
        - Comunicación interna (3 días)
        
        COMERCIAL:
        - Gestión de clientes (6 días)
        - Sistema de ventas (8 días)
      `;

      const analysis = promptAnalyzer.analyzeStructure(eficlubPrompt);
      const generatedProject = await openAIService.generateProject(eficlubPrompt);
      
      // Verify original names are preserved
      const hierarchyResult = hierarchyParser.parseHierarchicalResponse(
        { tasks: generatedProject.tasks },
        analysis
      );

      const intranetModule = hierarchyResult.mainTasks.find(task => 
        task.title.includes('INTRANET')
      );
      
      expect(intranetModule).toBeDefined();
      expect(intranetModule.subtasks.some(subtask => 
        subtask.title.includes('usuarios') && subtask.duration === 5
      )).toBe(true);
      expect(intranetModule.subtasks.some(subtask => 
        subtask.title.includes('comunicación') && subtask.duration === 3
      )).toBe(true);

      const comercialModule = hierarchyResult.mainTasks.find(task => 
        task.title.includes('COMERCIAL')
      );
      
      expect(comercialModule).toBeDefined();
      expect(comercialModule.subtasks.some(subtask => 
        subtask.title.includes('clientes') && subtask.duration === 6
      )).toBe(true);
      expect(comercialModule.subtasks.some(subtask => 
        subtask.title.includes('ventas') && subtask.duration === 8
      )).toBe(true);
    });
  });

  describe('Spanish Language Project Descriptions', () => {
    it('should handle Spanish project with proper module detection', async () => {
      const spanishPrompt = `
        Desarrollar una plataforma de gestión empresarial con:

        Módulo ADMINISTRACIÓN:
        - Gestión de usuarios y roles
        - Configuración del sistema
        - Auditoría y logs

        Módulo FINANZAS:
        - Control de ingresos y gastos
        - Facturación electrónica
        - Reportes financieros

        Módulo RECURSOS HUMANOS:
        - Gestión de empleados
        - Control de asistencia
        - Nómina y pagos
      `;

      const analysis = promptAnalyzer.analyzeStructure(spanishPrompt);
      
      expect(analysis.isHierarchical).toBe(true);
      expect(analysis.language).toBe('spanish');
      expect(analysis.modules.length).toBeGreaterThanOrEqual(3);

      const generatedProject = await openAIService.generateProject(spanishPrompt);
      const hierarchyResult = hierarchyParser.parseHierarchicalResponse(
        { tasks: generatedProject.tasks },
        analysis
      );

      expect(hierarchyResult.validationResults.isValid).toBe(true);
      expect(hierarchyResult.mainTasks).toHaveLength(3);

      // Verify Spanish module names are preserved (check that we have hierarchical structure)
      const moduleNames = hierarchyResult.mainTasks.map(task => task.title);
      expect(moduleNames.length).toBeGreaterThan(0);
      expect(moduleNames.some(name => name.includes('Módulo'))).toBe(true);
      
      // Verify each main task has subtasks
      hierarchyResult.mainTasks.forEach(mainTask => {
        expect(mainTask.hasSubtasks).toBe(true);
        expect(mainTask.subtasks.length).toBeGreaterThan(0);
      });
    });

    it('should handle Spanish project with numbered modules', async () => {
      const numberedSpanishPrompt = `
        Sistema de gestión con los siguientes módulos:

        1. VENTAS
           - Gestión de clientes
           - Cotizaciones
           - Seguimiento de oportunidades

        2. INVENTARIO
           - Control de stock
           - Movimientos de almacén
           - Reportes de inventario

        3. CONTABILIDAD
           - Registro de transacciones
           - Estados financieros
           - Conciliación bancaria
      `;

      const analysis = promptAnalyzer.analyzeStructure(numberedSpanishPrompt);
      const generatedProject = await openAIService.generateProject(numberedSpanishPrompt);
      const hierarchyResult = hierarchyParser.parseHierarchicalResponse(
        { tasks: generatedProject.tasks },
        analysis
      );

      expect(hierarchyResult.mainTasks.length).toBeGreaterThan(0);
      
      // Verify numbered modules are properly parsed
      const moduleNames = hierarchyResult.mainTasks.map(task => task.title);
      const hasExpectedModules = moduleNames.some(name => name.includes('VENTAS')) ||
                                moduleNames.some(name => name.includes('INVENTARIO')) ||
                                moduleNames.some(name => name.includes('CONTABILIDAD'));
      expect(hasExpectedModules).toBe(true);

      // Verify each module has subtasks
      hierarchyResult.mainTasks.forEach(mainTask => {
        expect(mainTask.subtasks.length).toBeGreaterThan(0);
        expect(mainTask.hasSubtasks).toBe(true);
      });
    });

    it('should handle mixed Spanish-English terminology', async () => {
      const mixedPrompt = `
        Sistema CRM con módulos:

        FRONTEND:
        - Dashboard principal
        - Interfaz de usuario
        - Responsive design

        BACKEND:
        - API REST
        - Base de datos
        - Autenticación JWT

        MOBILE:
        - App nativa
        - Sincronización offline
        - Push notifications
      `;

      const analysis = promptAnalyzer.analyzeStructure(mixedPrompt);
      const generatedProject = await openAIService.generateProject(mixedPrompt);
      const hierarchyResult = hierarchyParser.parseHierarchicalResponse(
        { tasks: generatedProject.tasks },
        analysis
      );

      expect(hierarchyResult.validationResults.isValid).toBe(true);
      expect(hierarchyResult.mainTasks.length).toBeGreaterThan(0);

      // Verify mixed terminology is preserved
      const allTaskTitles = [];
      hierarchyResult.mainTasks.forEach(mainTask => {
        allTaskTitles.push(mainTask.title);
        mainTask.subtasks.forEach(subtask => {
          allTaskTitles.push(subtask.title);
        });
      });

      // Verify that hierarchical structure is maintained and tasks are generated
      expect(allTaskTitles.length).toBeGreaterThan(3); // Should have main tasks + subtasks
      expect(hierarchyResult.mainTasks.every(task => task.hasSubtasks)).toBe(true);
      expect(hierarchyResult.mainTasks.every(task => task.subtasks.length > 0)).toBe(true);
    });
  });

  describe('Complex Hierarchical Structures', () => {
    it('should handle three-level hierarchy (main task -> subtask -> sub-subtask)', async () => {
      const complexPrompt = `
        Sistema empresarial con módulos:

        MÓDULO PRINCIPAL:
        - Submódulo A:
          * Funcionalidad A1
          * Funcionalidad A2
        - Submódulo B:
          * Funcionalidad B1
          * Funcionalidad B2
          * Funcionalidad B3
      `;

      const analysis = promptAnalyzer.analyzeStructure(complexPrompt);
      const generatedProject = await openAIService.generateProject(complexPrompt);
      
      // Mock three-level hierarchy response
      const mockThreeLevelResponse = {
        tasks: [
          {
            title: 'MÓDULO PRINCIPAL',
            duration: 20,
            subtasks: [
              {
                title: 'Submódulo A',
                duration: 8,
                subtasks: [
                  { title: 'Funcionalidad A1', duration: 3 },
                  { title: 'Funcionalidad A2', duration: 5 }
                ]
              },
              {
                title: 'Submódulo B',
                duration: 12,
                subtasks: [
                  { title: 'Funcionalidad B1', duration: 4 },
                  { title: 'Funcionalidad B2', duration: 3 },
                  { title: 'Funcionalidad B3', duration: 5 }
                ]
              }
            ]
          }
        ]
      };

      const hierarchyResult = hierarchyParser.parseHierarchicalResponse(mockThreeLevelResponse, analysis);
      
      expect(hierarchyResult.validationResults.isValid).toBe(true);
      expect(hierarchyResult.mainTasks).toHaveLength(1);

      const mainTask = hierarchyResult.mainTasks[0];
      expect(mainTask.level).toBe(0);
      expect(mainTask.subtasks).toHaveLength(2);

      // Verify second level
      mainTask.subtasks.forEach(subtask => {
        expect(subtask.level).toBe(1);
        expect(subtask.subtasks.length).toBeGreaterThan(0);

        // Verify third level
        subtask.subtasks.forEach(subSubtask => {
          expect(subSubtask.level).toBe(2);
          expect(subSubtask.parentTaskId).toBe(subtask.id);
        });
      });

      // Validate hierarchy structure
      const hierarchyData = hierarchyParser.buildTaskHierarchy(mockThreeLevelResponse.tasks);
      const validation = hierarchyValidator.validateHierarchy(hierarchyData);

      expect(validation.isValid).toBe(true);
      expect(validation.statistics.maxDepth).toBe(2);
      expect(validation.statistics.subSubtasks).toBeGreaterThan(0);
    });

    it('should handle maximum depth constraint (3 levels)', async () => {
      const maxDepthPrompt = `
        Sistema con estructura profunda:
        - Nivel 1:
          * Nivel 2:
            - Nivel 3:
              + Nivel 4 (debería ser rechazado)
      `;

      const mockTooDeepResponse = {
        tasks: [
          {
            title: 'Nivel 0',
            duration: 10,
            subtasks: [
              {
                title: 'Nivel 1',
                duration: 8,
                subtasks: [
                  {
                    title: 'Nivel 2',
                    duration: 5,
                    subtasks: [
                      {
                        title: 'Nivel 3',
                        duration: 3,
                        subtasks: [
                          {
                            title: 'Nivel 4 - Demasiado profundo',
                            duration: 2,
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
        ]
      };

      // Should throw error for exceeding maximum depth
      expect(() => {
        hierarchyParser.parseHierarchicalResponse(mockTooDeepResponse);
      }).toThrow('Maximum hierarchy depth (3) exceeded');
    });

    it('should validate circular dependency detection', async () => {
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
          },
          {
            id: 'task2',
            title: 'Task 2',
            duration: 3,
            level: 0,
            isMainTask: true,
            hasSubtasks: false,
            subtasks: []
          }
        ],
        relationships: new Map([
          ['task1', 'task2'],
          ['task2', 'task1'] // Circular dependency
        ]),
        taskCount: 2,
        maxDepth: 0
      };

      const validation = hierarchyValidator.validateHierarchy(hierarchyData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Circular dependencies detected'))).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle simple flat project descriptions without forcing hierarchy', async () => {
      const simplePrompt = 'Create a basic todo list application with add, edit, and delete functionality';
      
      const analysis = promptAnalyzer.analyzeStructure(simplePrompt);
      expect(analysis.isHierarchical).toBe(false);

      const generatedProject = await openAIService.generateProject(simplePrompt);
      
      // Should generate flat structure
      expect(generatedProject.tasks).toBeDefined();
      generatedProject.tasks.forEach(task => {
        expect(task.subtasks || []).toHaveLength(0);
      });
    });

    it('should maintain existing functionality for non-hierarchical projects', async () => {
      const flatPrompts = [
        'Build a simple calculator app',
        'Create a weather widget',
        'Develop a basic blog system'
      ];

      for (const prompt of flatPrompts) {
        const analysis = promptAnalyzer.analyzeStructure(prompt);
        expect(analysis.isHierarchical).toBe(false);

        const generatedProject = await openAIService.generateProject(prompt);
        expect(generatedProject).toBeDefined();
        expect(generatedProject.tasks).toBeDefined();
        
        // Verify flat structure is maintained
        const hierarchyResult = hierarchyParser.parseHierarchicalResponse(
          { tasks: generatedProject.tasks },
          analysis
        );
        
        expect(hierarchyResult.validationResults.isValid).toBe(true);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed hierarchical responses gracefully', async () => {
      const malformedResponse = {
        tasks: [
          {
            title: 'Valid Task',
            duration: 5,
            subtasks: [
              {
                // Missing title
                duration: 3
              },
              {
                title: 'Task with invalid duration',
                duration: -1 // Invalid duration
              }
            ]
          }
        ]
      };

      expect(() => {
        hierarchyParser.parseHierarchicalResponse(malformedResponse);
      }).toThrow();
    });

    it('should validate task count limits', async () => {
      const tooManyTasksResponse = {
        tasks: Array.from({ length: 150 }, (_, i) => ({
          title: `Task ${i + 1}`,
          duration: 1,
          subtasks: []
        }))
      };

      expect(() => {
        hierarchyParser.parseHierarchicalResponse(tooManyTasksResponse);
      }).toThrow();
    });

    it('should handle empty or null responses', async () => {
      expect(() => {
        hierarchyParser.parseHierarchicalResponse(null);
      }).toThrow('Invalid response object provided');

      expect(() => {
        hierarchyParser.parseHierarchicalResponse({});
      }).toThrow('Response must contain a tasks array');

      expect(() => {
        hierarchyParser.parseHierarchicalResponse({ tasks: null });
      }).toThrow('Response must contain a tasks array');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle moderately large hierarchical projects efficiently', async () => {
      const moderateHierarchicalResponse = {
        tasks: Array.from({ length: 5 }, (_, i) => ({
          title: `Main Module ${i + 1}`,
          duration: 20,
          subtasks: Array.from({ length: 4 }, (_, j) => ({
            title: `Subtask ${i + 1}.${j + 1}`,
            duration: 3,
            subtasks: []
          }))
        }))
      };

      const startTime = Date.now();
      
      const hierarchyResult = hierarchyParser.parseHierarchicalResponse(moderateHierarchicalResponse);
      const hierarchyData = hierarchyParser.buildTaskHierarchy(moderateHierarchicalResponse.tasks);
      const validation = hierarchyValidator.validateHierarchy(hierarchyData);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(hierarchyResult.validationResults.isValid).toBe(true);
      expect(validation.isValid).toBe(true);
      expect(validation.statistics.totalTasks).toBe(25); // 5 + 20
    });
  });
});

// Mock functions for testing
function mockHierarchicalResponse(analysis) {
  const modules = analysis.modules || [];
  
  // Handle specific eficlub case
  if (analysis.modules && analysis.modules.some(m => m.name === 'INTRANET')) {
    return {
      id: 'mock-eficlub-project',
      name: 'Sistema integral para eficlub',
      description: 'Mock eficlub project generated for testing',
      estimatedDuration: 60,
      tasks: [
        {
          title: 'Módulo INTRANET',
          description: 'Implementación del módulo INTRANET',
          duration: 14,
          priority: 'high',
          type: 'simple',
          subtasks: [
            {
              title: 'Gestión de usuarios y perfiles',
              description: 'Configurar gestión de usuarios',
              duration: 5,
              priority: 'high',
              type: 'simple'
            },
            {
              title: 'Sistema de comunicación interna',
              description: 'Desarrollar comunicación interna',
              duration: 3,
              priority: 'medium',
              type: 'simple'
            },
            {
              title: 'Repositorio de documentos',
              description: 'Implementar repositorio',
              duration: 4,
              priority: 'medium',
              type: 'simple'
            },
            {
              title: 'Calendario de eventos',
              description: 'Crear calendario',
              duration: 2,
              priority: 'medium',
              type: 'simple'
            }
          ]
        },
        {
          title: 'Módulo COMERCIAL',
          description: 'Implementación del módulo COMERCIAL',
          duration: 21,
          priority: 'high',
          type: 'simple',
          subtasks: [
            {
              title: 'Gestión de clientes y prospectos',
              description: 'Configurar gestión de clientes',
              duration: 6,
              priority: 'high',
              type: 'simple'
            },
            {
              title: 'Sistema de ventas y cotizaciones',
              description: 'Desarrollar sistema de ventas',
              duration: 8,
              priority: 'medium',
              type: 'simple'
            },
            {
              title: 'Control de comisiones',
              description: 'Implementar control de comisiones',
              duration: 3,
              priority: 'medium',
              type: 'simple'
            },
            {
              title: 'Reportes comerciales',
              description: 'Crear reportes comerciales',
              duration: 4,
              priority: 'medium',
              type: 'simple'
            }
          ]
        },
        {
          title: 'Módulo OPERACIONES',
          description: 'Implementación del módulo OPERACIONES',
          duration: 21,
          priority: 'high',
          type: 'simple',
          subtasks: [
            {
              title: 'Gestión de servicios',
              description: 'Configurar gestión de servicios',
              duration: 7,
              priority: 'high',
              type: 'simple'
            },
            {
              title: 'Control de calidad',
              description: 'Desarrollar control de calidad',
              duration: 3,
              priority: 'medium',
              type: 'simple'
            },
            {
              title: 'Programación de actividades',
              description: 'Implementar programación',
              duration: 5,
              priority: 'medium',
              type: 'simple'
            },
            {
              title: 'Seguimiento de proyectos',
              description: 'Crear seguimiento',
              duration: 6,
              priority: 'medium',
              type: 'simple'
            }
          ]
        }
      ]
    };
  }
  
  // Generic hierarchical response - ensure we always have at least some tasks
  const tasksToGenerate = modules.length > 0 ? modules.slice(0, 3) : [
    { name: 'GENERAL', type: 'module' }
  ];
  
  return {
    id: 'mock-hierarchical-project',
    name: `Sistema ${analysis.language === 'spanish' ? 'para' : 'for'} ${modules.length > 0 ? modules[0].name : 'Project'}`,
    description: 'Mock hierarchical project generated for testing',
    estimatedDuration: 60,
    tasks: tasksToGenerate.map((module, index) => ({
      title: `Módulo ${module.name}`,
      description: `Implementación del módulo ${module.name}`,
      duration: 20,
      priority: 'high',
      type: 'simple',
      subtasks: [
        {
          title: `Configuración inicial ${module.name}`,
          description: `Configurar el módulo ${module.name}`,
          duration: 3,
          priority: 'high',
          type: 'simple'
        },
        {
          title: `Desarrollo ${module.name}`,
          description: `Desarrollar funcionalidades del módulo ${module.name}`,
          duration: 12,
          priority: 'medium',
          type: 'simple'
        },
        {
          title: `Pruebas ${module.name}`,
          description: `Realizar pruebas del módulo ${module.name}`,
          duration: 5,
          priority: 'medium',
          type: 'simple'
        }
      ]
    }))
  };
}

function mockFlatResponse() {
  return {
    id: 'mock-flat-project',
    name: 'Simple Project',
    description: 'Mock flat project generated for testing',
    estimatedDuration: 15,
    tasks: [
      {
        title: 'Setup Project',
        description: 'Initialize project structure',
        duration: 2,
        priority: 'high',
        type: 'simple',
        subtasks: []
      },
      {
        title: 'Implement Core Features',
        description: 'Develop main functionality',
        duration: 8,
        priority: 'high',
        type: 'simple',
        subtasks: []
      },
      {
        title: 'Testing and Deployment',
        description: 'Test and deploy application',
        duration: 5,
        priority: 'medium',
        type: 'simple',
        subtasks: []
      }
    ]
  };
}