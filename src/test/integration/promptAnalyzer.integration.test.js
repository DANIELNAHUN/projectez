/**
 * Integration tests for PromptAnalyzer with real-world examples
 */

import { describe, it, expect } from 'vitest';
import { PromptAnalyzer } from '../../utils/promptAnalyzer.js';

describe('PromptAnalyzer Integration Tests', () => {
  const analyzer = new PromptAnalyzer();

  describe('Real-world Project Examples', () => {
    it('should analyze eficlub project correctly', () => {
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
      expect(analysis.confidence).toBeGreaterThan(60);
      
      // Should detect the three main modules
      const moduleNames = analysis.modules.map(m => m.name);
      expect(moduleNames).toContain('INTRANET');
      expect(moduleNames).toContain('COMERCIAL');
      expect(moduleNames).toContain('OPERACIONES');

      // Should detect hierarchical structure
      expect(analysis.indicators.hasModules).toBe(true);
      expect(analysis.indicators.hasNestedStructure).toBe(true);
    });

    it('should handle English e-commerce project', () => {
      const ecommercePrompt = `
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

      const analysis = analyzer.analyzeStructure(ecommercePrompt);

      expect(analysis.isHierarchical).toBe(true);
      expect(analysis.language).toBe('english');
      expect(analysis.complexity).toBe('medium');
      
      const moduleNames = analysis.modules.map(m => m.name);
      expect(moduleNames.some(name => name.includes('CUSTOMER'))).toBe(true);
      expect(moduleNames.some(name => name.includes('PRODUCT'))).toBe(true);
      expect(moduleNames.some(name => name.includes('PAYMENT'))).toBe(true);
    });

    it('should handle simple project without forcing hierarchy', () => {
      const simplePrompt = 'Create a basic todo list application with add, edit, and delete functionality';
      
      const analysis = analyzer.analyzeStructure(simplePrompt);

      expect(analysis.isHierarchical).toBe(false);
      expect(analysis.complexity).toBe('simple');
      expect(analysis.suggestedLevels).toBe(1);
      expect(analysis.modules).toHaveLength(0);
    });

    it('should detect moderate complexity projects', () => {
      const moderatePrompt = `
        Sistema de gestión de biblioteca con:
        - Módulo de usuarios
        - Módulo de libros
        - Sistema de préstamos
      `;

      const analysis = analyzer.analyzeStructure(moderatePrompt);

      expect(analysis.isHierarchical).toBe(true);
      expect(analysis.complexity).toBe('detailed');
      expect(analysis.suggestedLevels).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed language content', () => {
      const mixedPrompt = 'Create a sistema with módulos: INTRANET and COMMERCIAL sections';
      
      const analysis = analyzer.analyzeStructure(mixedPrompt);

      expect(analysis.language).toBe('spanish'); // Should default to Spanish
      expect(analysis.modules.length).toBeGreaterThan(0);
    });

    it('should handle prompts with special characters', () => {
      const specialPrompt = `
        Sistema de gestión con módulos:
        • ADMINISTRACIÓN
        • OPERACIONES & LOGÍSTICA
        • FINANZAS/CONTABILIDAD
      `;

      const analysis = analyzer.analyzeStructure(specialPrompt);

      expect(analysis.isHierarchical).toBe(true);
      expect(analysis.modules.length).toBeGreaterThan(0);
    });

    it('should handle very long prompts', () => {
      const longPrompt = `
        Crear un sistema empresarial completo para la gestión integral de una empresa de servicios tecnológicos.
        
        El sistema debe incluir los siguientes módulos principales:
        
        Módulo 1: INTRANET CORPORATIVA
        - Gestión completa de usuarios y perfiles de empleados
        - Sistema de comunicación interna con chat y mensajería
        - Repositorio centralizado de documentos corporativos
        - Calendario compartido de eventos y reuniones
        - Portal de noticias y anuncios internos
        - Sistema de evaluación de desempeño
        
        Módulo 2: GESTIÓN COMERCIAL
        - CRM completo para gestión de clientes y prospectos
        - Sistema de ventas con cotizaciones y propuestas
        - Control detallado de comisiones por vendedor
        - Reportes comerciales y análisis de ventas
        - Seguimiento de oportunidades de negocio
        - Integración con sistemas de facturación
        
        Módulo 3: OPERACIONES Y PROYECTOS
        - Gestión integral de servicios y proyectos
        - Control de calidad y seguimiento de entregas
        - Programación y asignación de recursos
        - Seguimiento de tiempos y costos por proyecto
        - Dashboard ejecutivo con métricas clave
        - Sistema de alertas y notificaciones
      `;

      const analysis = analyzer.analyzeStructure(longPrompt);

      expect(analysis.isHierarchical).toBe(true);
      expect(analysis.complexity).toBe('detailed');
      expect(analysis.confidence).toBeGreaterThan(80);
      expect(analysis.modules.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Analysis Summary', () => {
    it('should provide comprehensive analysis summary', () => {
      const prompt = 'Sistema con módulos INTRANET, COMERCIAL y OPERACIONES';
      const analysis = analyzer.analyzeStructure(prompt);
      const summary = analyzer.getAnalysisSummary(analysis);

      expect(summary).toContain('Language:');
      expect(summary).toContain('Hierarchical:');
      expect(summary).toContain('Complexity:');
      expect(summary).toContain('Confidence:');
      expect(summary).toContain('Modules');
    });
  });
});