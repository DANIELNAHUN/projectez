/**
 * Tests for team information extraction in PromptAnalyzer
 * Validates extraction of team members and assignment mapping
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PromptAnalyzer } from '../../utils/promptAnalyzer.js';

describe('Team Information Extraction', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new PromptAnalyzer();
  });

  describe('Team Member Detection', () => {
    it('should extract team members from Eficlub format', () => {
      const prompt = `Proyecto Eficlub

Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)
Formato: Titulo / Asignado a / Duracion (días)

MODULO 1. ANALISIS DEL SISTEMA / DC
- Definir Modulos, permisos y roles del Sistema / DC / 1`;

      const analysis = analyzer.analyzeStructure(prompt);
      
      expect(analysis.teamInfo).toBeTruthy();
      expect(analysis.teamInfo.hasTeamInfo).toBe(true);
      expect(analysis.teamInfo.members).toHaveLength(2);
      
      const dc = analysis.teamInfo.members.find(m => m.initials === 'DC');
      const dz = analysis.teamInfo.members.find(m => m.initials === 'DZ');
      
      expect(dc).toBeTruthy();
      expect(dc.name).toBe('Daniel Calcina');
      expect(dc.initials).toBe('DC');
      
      expect(dz).toBeTruthy();
      expect(dz.name).toBe('Dayana Zegarra');
      expect(dz.initials).toBe('DZ');
    });

    it('should create assignment mapping', () => {
      const prompt = `Proyecto Test

Equipo: Ana García (AG), Luis Pérez (LP)

- Tarea 1 / AG / 2
- Tarea 2 / LP / 3`;

      const analysis = analyzer.analyzeStructure(prompt);
      
      expect(analysis.teamInfo.assignments['AG']).toBe('Ana García');
      expect(analysis.teamInfo.assignments['LP']).toBe('Luis Pérez');
    });

    it('should handle English team format', () => {
      const prompt = `Project Management

Team: John Smith (JS), Mary Johnson (MJ)

- Task 1 / JS / 2 days
- Task 2 / MJ / 3 days`;

      const analysis = analyzer.analyzeStructure(prompt);
      
      expect(analysis.teamInfo.hasTeamInfo).toBe(true);
      expect(analysis.teamInfo.members).toHaveLength(2);
      
      const js = analysis.teamInfo.members.find(m => m.initials === 'JS');
      expect(js.name).toBe('John Smith');
    });
  });

  describe('Assignment Statistics', () => {
    it('should count task assignments per team member', () => {
      const prompt = `Proyecto Test

Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)

MODULO 1 / DC
- Tarea 1 / DC / 1
- Tarea 2 / DC / 2
- Tarea 3 / DZ / 1`;

      const analysis = analyzer.analyzeStructure(prompt);
      
      expect(analysis.teamInfo.assignmentStats).toBeTruthy();
      expect(analysis.teamInfo.assignmentStats.DC).toBeGreaterThan(2); // Should find DC multiple times
      expect(analysis.teamInfo.assignmentStats.DZ).toBeGreaterThan(0); // Should find DZ at least once
    });
  });

  describe('Integration with Analysis Summary', () => {
    it('should include team information in analysis summary', () => {
      const prompt = `Proyecto Eficlub

Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)
Formato: Titulo / Asignado a / Duracion (días)

- Tarea 1 / DC / 1
- Tarea 2 / DZ / 2`;

      const analysis = analyzer.analyzeStructure(prompt);
      const summary = analyzer.getAnalysisSummary(analysis);
      
      expect(summary).toContain('Team Members: Daniel Calcina (DC), Dayana Zegarra (DZ)');
      expect(summary).toContain('Assignment Distribution:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle no team information', () => {
      const prompt = `Simple Project

- Task 1
- Task 2`;

      const analysis = analyzer.analyzeStructure(prompt);
      
      expect(analysis.teamInfo.hasTeamInfo).toBe(false);
      expect(analysis.teamInfo.members).toHaveLength(0);
    });

    it('should handle malformed team declarations', () => {
      const prompt = `Project

Equipo: Daniel Calcina, Dayana Zegarra

- Task 1
- Task 2`;

      const analysis = analyzer.analyzeStructure(prompt);
      
      expect(analysis.teamInfo.hasTeamInfo).toBe(false);
    });

    it('should handle team with three-letter initials', () => {
      const prompt = `Project

Equipo: Daniel Calcina (DCL), Ana María García (AMG)

- Task 1 / DCL / 1
- Task 2 / AMG / 2`;

      const analysis = analyzer.analyzeStructure(prompt);
      
      expect(analysis.teamInfo.hasTeamInfo).toBe(true);
      expect(analysis.teamInfo.members).toHaveLength(2);
      
      const dcl = analysis.teamInfo.members.find(m => m.initials === 'DCL');
      expect(dcl.name).toBe('Daniel Calcina');
    });
  });
});