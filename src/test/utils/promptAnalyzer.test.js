/**
 * Tests for PromptAnalyzer utility
 * Validates hierarchical pattern detection and module analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PromptAnalyzer } from '../../utils/promptAnalyzer.js';

describe('PromptAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new PromptAnalyzer();
  });

  describe('Language Detection', () => {
    it('should detect Spanish language correctly', () => {
      const spanishPrompt = 'Crear un sistema de gestión con módulos de administración';
      const result = analyzer.detectLanguage(spanishPrompt);
      expect(result).toBe('spanish');
    });

    it('should detect English language correctly', () => {
      const englishPrompt = 'Create a management system with administration modules';
      const result = analyzer.detectLanguage(englishPrompt);
      expect(result).toBe('english');
    });

    it('should default to Spanish when language is ambiguous', () => {
      const ambiguousPrompt = 'Sistema INTRANET COMERCIAL';
      const result = analyzer.detectLanguage(ambiguousPrompt);
      expect(result).toBe('spanish');
    });
  });

  describe('Module Detection', () => {
    it('should detect modules with Spanish keywords', () => {
      const prompt = 'Sistema con módulos: INTRANET, COMERCIAL, OPERACIONES';
      const result = analyzer.detectModules(prompt, 'spanish');
      
      expect(result.hasModules).toBe(true);
      expect(result.modules).toHaveLength(3);
      expect(result.modules.map(m => m.name)).toContain('INTRANET');
      expect(result.modules.map(m => m.name)).toContain('COMERCIAL');
      expect(result.modules.map(m => m.name)).toContain('OPERACIONES');
    });

    it('should detect modules with English keywords', () => {
      const prompt = 'System with modules: INTRANET, COMMERCIAL, OPERATIONS';
      const result = analyzer.detectModules(prompt, 'english');
      
      expect(result.hasModules).toBe(true);
      expect(result.modules).toHaveLength(3);
      expect(result.modules.map(m => m.name)).toContain('INTRANET');
      expect(result.modules.map(m => m.name)).toContain('COMMERCIAL');
      expect(result.modules.map(m => m.name)).toContain('OPERATIONS');
    });

    it('should extract module names from structured text', () => {
      const prompt = `
        Módulo 1: INTRANET
        - Gestión de usuarios
        - Control de acceso
        
        Módulo 2: COMERCIAL
        - Ventas
        - Facturación
      `;
      const result = analyzer.detectModules(prompt, 'spanish');
      
      expect(result.hasModules).toBe(true);
      expect(result.modules.length).toBeGreaterThanOrEqual(2);
      
      const intranetModule = result.modules.find(m => m.name === 'INTRANET');
      expect(intranetModule).toBeDefined();
      expect(intranetModule.components).toHaveLength(2);
    });

    it('should handle prompts without modules', () => {
      const prompt = 'Simple task management application';
      const result = analyzer.detectModules(prompt, 'english');
      
      expect(result.hasModules).toBe(false);
      expect(result.modules).toHaveLength(0);
    });
  });

  describe('Hierarchical Structure Detection', () => {
    it('should detect nested bullet points', () => {
      const prompt = `
        - Main task 1
          - Subtask 1.1
          - Subtask 1.2
        - Main task 2
          - Subtask 2.1
      `;
      const result = analyzer.detectNestedStructure(prompt);
      expect(result).toBe(true);
    });

    it('should detect numbered lists with sub-items', () => {
      const prompt = `
        1. Main task
        1.1. Subtask
        1.2. Another subtask
        2. Second main task
      `;
      const result = analyzer.detectNestedStructure(prompt);
      expect(result).toBe(true);
    });

    it('should not detect hierarchy in flat lists', () => {
      const prompt = `Task 1
Task 2
Task 3`;
      const result = analyzer.detectNestedStructure(prompt);
      expect(result).toBe(false);
    });
  });

  describe('Complexity Calculation', () => {
    it('should calculate high complexity for detailed prompts with modules', () => {
      const prompt = `
        Sistema complejo con múltiples módulos:
        
        Módulo 1: INTRANET
        - Gestión de usuarios
        - Control de acceso
        - Reportes
        
        Módulo 2: COMERCIAL
        - Ventas
        - Facturación
        - Inventario
        
        Módulo 3: OPERACIONES
        - Logística
        - Distribución
      `;
      
      const indicators = {
        hasModules: true,
        hasNestedStructure: true,
        hasNumberedLists: false,
        hasIndentation: true,
        hasColons: true
      };
      
      const modules = [
        { name: 'INTRANET', components: ['Gestión de usuarios', 'Control de acceso', 'Reportes'] },
        { name: 'COMERCIAL', components: ['Ventas', 'Facturación', 'Inventario'] },
        { name: 'OPERACIONES', components: ['Logística', 'Distribución'] }
      ];
      
      const result = analyzer.calculateComplexity(prompt, indicators, modules);
      
      expect(result.level).toBe('detailed');
      expect(result.levels).toBe(3);
      expect(result.confidence).toBeGreaterThan(60);
    });

    it('should calculate medium complexity for moderate prompts', () => {
      const prompt = 'Sistema con dos módulos: INTRANET y COMERCIAL';
      
      const indicators = {
        hasModules: true,
        hasNestedStructure: false,
        hasNumberedLists: false,
        hasIndentation: false,
        hasColons: true
      };
      
      const modules = [
        { name: 'INTRANET' },
        { name: 'COMERCIAL' }
      ];
      
      const result = analyzer.calculateComplexity(prompt, indicators, modules);
      
      expect(result.level).toBe('medium');
      expect(result.levels).toBe(2);
    });

    it('should calculate simple complexity for basic prompts', () => {
      const prompt = 'Simple task manager';
      
      const indicators = {
        hasModules: false,
        hasNestedStructure: false,
        hasNumberedLists: false,
        hasIndentation: false,
        hasColons: false
      };
      
      const modules = [];
      
      const result = analyzer.calculateComplexity(prompt, indicators, modules);
      
      expect(result.level).toBe('simple');
      expect(result.levels).toBe(1);
    });
  });

  describe('Full Analysis', () => {
    it('should analyze the eficlub project example correctly', () => {
      const eficlubPrompt = `
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

      const analysis = analyzer.analyzeStructure(eficlubPrompt);

      expect(analysis.isHierarchical).toBe(true);
      expect(analysis.language).toBe('spanish');
      expect(analysis.complexity).toBe('detailed');
      expect(analysis.suggestedLevels).toBe(3);
      expect(analysis.modules.length).toBeGreaterThanOrEqual(3);
      expect(analysis.confidence).toBeGreaterThan(60);
      
      // Check specific modules
      const moduleNames = analysis.modules.map(m => m.name);
      expect(moduleNames).toContain('INTRANET');
      expect(moduleNames).toContain('COMERCIAL');
      expect(moduleNames).toContain('OPERACIONES');
      
      // Check indicators
      expect(analysis.indicators.hasModules).toBe(true);
      expect(analysis.indicators.hasNestedStructure).toBe(true);
    });

    it('should handle simple prompts without forcing hierarchy', () => {
      const simplePrompt = 'Create a basic todo list application';
      const analysis = analyzer.analyzeStructure(simplePrompt);

      expect(analysis.isHierarchical).toBe(false);
      expect(analysis.language).toBe('english');
      expect(analysis.complexity).toBe('simple');
      expect(analysis.suggestedLevels).toBe(1);
      expect(analysis.modules).toHaveLength(0);
    });

    it('should provide analysis summary', () => {
      const prompt = 'Sistema con módulos INTRANET y COMERCIAL';
      const analysis = analyzer.analyzeStructure(prompt);
      const summary = analyzer.getAnalysisSummary(analysis);

      expect(summary).toContain('Language: spanish');
      expect(summary).toContain('INTRANET');
      expect(typeof summary).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid prompt input', () => {
      expect(() => analyzer.analyzeStructure(null)).toThrow('Valid prompt string is required');
      expect(() => analyzer.analyzeStructure(undefined)).toThrow('Valid prompt string is required');
      expect(() => analyzer.analyzeStructure(123)).toThrow('Valid prompt string is required');
    });

    it('should handle empty prompts gracefully', () => {
      const analysis = analyzer.analyzeStructure('   ');
      expect(analysis.isHierarchical).toBe(false);
      expect(analysis.modules).toHaveLength(0);
    });
  });

  describe('Component Extraction', () => {
    it('should extract components from module descriptions', () => {
      const prompt = `
        Módulo INTRANET:
        - Gestión de usuarios
        - Control de acceso
        - Sistema de reportes
      `;
      
      const result = analyzer.detectModules(prompt, 'spanish');
      const intranetModule = result.modules.find(m => m.name === 'INTRANET');
      
      expect(intranetModule).toBeDefined();
      expect(intranetModule.components).toHaveLength(3);
      expect(intranetModule.components.map(c => c.name)).toContain('Gestión de usuarios');
      expect(intranetModule.components.map(c => c.name)).toContain('Control de acceso');
      expect(intranetModule.components.map(c => c.name)).toContain('Sistema de reportes');
    });

    it('should handle numbered component lists', () => {
      const prompt = `
        Módulo COMERCIAL:
        1. Gestión de ventas
        2. Control de inventario
        3. Reportes financieros
      `;
      
      const result = analyzer.detectModules(prompt, 'spanish');
      const comercialModule = result.modules.find(m => m.name === 'COMERCIAL');
      
      expect(comercialModule).toBeDefined();
      expect(comercialModule.components).toHaveLength(3);
    });
  });
});