/**
 * Tests for hierarchical prompt generation enhancements
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAIService } from '../../services/openAIService.js';
import { promptAnalyzer } from '../../utils/promptAnalyzer.js';

describe('Hierarchical Prompt Generation', () => {
  let openAIService;

  beforeEach(() => {
    openAIService = new OpenAIService();
  });

  describe('Enhanced System Prompt Generation', () => {
    it('should generate basic prompt when no analysis result provided', () => {
      const prompt = openAIService.createSystemPrompt('medium', true, 20);
      
      expect(prompt).toContain('You are an expert project manager');
      expect(prompt).toContain('Maximum 20 main tasks');
      expect(prompt).not.toContain('HIERARCHICAL PROJECT DETECTED');
    });

    it('should enhance prompt for hierarchical projects', () => {
      const analysisResult = {
        isHierarchical: true,
        modules: [
          { name: 'INTRANET', components: [{ name: 'User management' }] },
          { name: 'COMERCIAL', components: [{ name: 'Sales tracking' }] }
        ],
        language: 'spanish',
        suggestedLevels: 2,
        complexity: 'medium'
      };

      const prompt = openAIService.createSystemPrompt('medium', true, 20, analysisResult);
      
      expect(prompt).toContain('HIERARCHICAL PROJECT DETECTED');
      expect(prompt).toContain('INTRANET, COMERCIAL');
      expect(prompt).toContain('Cada módulo debe convertirse en una TAREA PRINCIPAL');
      expect(prompt).toContain('EXAMPLE HIERARCHICAL STRUCTURE');
    });

    it('should create English hierarchical instructions for English projects', () => {
      const analysisResult = {
        isHierarchical: true,
        modules: [
          { name: 'USER_MANAGEMENT', components: [{ name: 'Authentication' }] }
        ],
        language: 'english',
        suggestedLevels: 2,
        complexity: 'medium'
      };

      const prompt = openAIService.createSystemPrompt('medium', true, 20, analysisResult);
      
      expect(prompt).toContain('HIERARCHICAL STRUCTURE DETECTED');
      expect(prompt).toContain('Each module should become a MAIN TASK');
      expect(prompt).not.toContain('módulo');
    });

    it('should include module-specific guidelines', () => {
      const analysisResult = {
        isHierarchical: true,
        modules: [
          { name: 'ADMIN_PANEL', components: [] },
          { name: 'API_LAYER', components: [] }
        ],
        language: 'english',
        suggestedLevels: 2,
        complexity: 'detailed'
      };

      const prompt = openAIService.createSystemPrompt('detailed', true, 25, analysisResult);
      
      expect(prompt).toContain('MODULE-SPECIFIC GUIDELINES');
      expect(prompt).toContain('"ADMIN_PANEL", "API_LAYER"');
      expect(prompt).toContain('Main task duration should be the sum of its subtasks');
    });
  });

  describe('Enhanced User Prompt Generation', () => {
    it('should enhance user prompt with hierarchical context', () => {
      const originalPrompt = 'Create a system with INTRANET and COMERCIAL modules';
      const analysisResult = {
        isHierarchical: true,
        modules: [
          { name: 'INTRANET', components: [{ name: 'User auth' }] },
          { name: 'COMERCIAL', components: [{ name: 'Sales' }] }
        ],
        language: 'spanish'
      };

      const enhanced = openAIService.enhanceUserPrompt(originalPrompt, null, analysisResult);
      
      expect(enhanced).toContain('ESTRUCTURA JERÁRQUICA REQUERIDA');
      expect(enhanced).toContain('Módulo: "INTRANET"');
      expect(enhanced).toContain('Módulo: "COMERCIAL"');
      expect(enhanced).toContain('con componentes: User auth');
    });

    it('should work with English hierarchical context', () => {
      const originalPrompt = 'Build system with AUTH and DATA modules';
      const analysisResult = {
        isHierarchical: true,
        modules: [
          { name: 'AUTH', components: [{ name: 'Login' }] },
          { name: 'DATA', components: [{ name: 'Storage' }] }
        ],
        language: 'english'
      };

      const enhanced = openAIService.enhanceUserPrompt(originalPrompt, 30, analysisResult);
      
      expect(enhanced).toContain('HIERARCHICAL STRUCTURE REQUIRED');
      expect(enhanced).toContain('Module: "AUTH"');
      expect(enhanced).toContain('with components: Login');
      expect(enhanced).toContain('Estimated total duration: 30 working days');
    });

    it('should preserve original prompt without hierarchical analysis', () => {
      const originalPrompt = 'Simple project with basic tasks';
      const enhanced = openAIService.enhanceUserPrompt(originalPrompt, 15);
      
      expect(enhanced).toContain('Create a project for: Simple project with basic tasks');
      expect(enhanced).toContain('Estimated total duration: 15 working days');
      expect(enhanced).not.toContain('HIERARCHICAL');
    });
  });

  describe('Integration with Prompt Analysis', () => {
    it('should integrate analysis result into prompt generation workflow', () => {
      const testPrompt = 'Crear sistema eficlub con módulos: INTRANET, COMERCIAL, OPERACIONES';
      
      // This would normally be called by generateProjectWithAnalysis
      const analysisResult = promptAnalyzer.analyzeStructure(testPrompt);
      
      expect(analysisResult.isHierarchical).toBe(true);
      expect(analysisResult.modules.length).toBeGreaterThan(0);
      expect(analysisResult.language).toBe('spanish');

      const systemPrompt = openAIService.createSystemPrompt('medium', true, 20, analysisResult);
      const userPrompt = openAIService.enhanceUserPrompt(testPrompt, null, analysisResult);
      
      expect(systemPrompt).toContain('HIERARCHICAL PROJECT DETECTED');
      expect(userPrompt).toContain('ESTRUCTURA JERÁRQUICA REQUERIDA');
    });
  });

  describe('Complexity-based Prompt Templates', () => {
    it('should adjust prompt complexity based on analysis', () => {
      const basicAnalysis = {
        isHierarchical: true,
        modules: [{ name: 'SIMPLE', components: [] }],
        language: 'english',
        suggestedLevels: 1,
        complexity: 'basic'
      };

      const detailedAnalysis = {
        isHierarchical: true,
        modules: [
          { name: 'MODULE1', components: [] },
          { name: 'MODULE2', components: [] },
          { name: 'MODULE3', components: [] }
        ],
        language: 'english',
        suggestedLevels: 3,
        complexity: 'detailed'
      };

      const basicPrompt = openAIService.createSystemPrompt('basic', true, 10, basicAnalysis);
      const detailedPrompt = openAIService.createSystemPrompt('detailed', true, 25, detailedAnalysis);
      
      expect(basicPrompt).toContain('Maximum 10 main tasks');
      expect(detailedPrompt).toContain('Maximum 25 main tasks');
      expect(detailedPrompt).toContain('"MODULE1", "MODULE2", "MODULE3"');
    });
  });
});