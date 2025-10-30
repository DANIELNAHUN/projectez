/**
 * PromptAnalyzer - Analyzes user prompts to detect hierarchical patterns and structure requirements
 * Supports Spanish and English language project descriptions
 */

export class PromptAnalyzer {
  constructor() {
    // Module detection keywords in Spanish and English
    this.moduleKeywords = {
      spanish: ['módulos', 'módulo', 'modulos', 'modulo', 'secciones', 'sección', 'areas', 'área'],
      english: ['modules', 'module', 'sections', 'section', 'areas', 'area', 'components', 'component']
    };

    // Common module types found in project descriptions
    this.moduleTypes = {
      spanish: ['INTRANET', 'COMERCIAL', 'OPERACIONES', 'ADMINISTRACIÓN', 'VENTAS', 'MARKETING', 'RECURSOS HUMANOS'],
      english: ['INTRANET', 'COMMERCIAL', 'OPERATIONS', 'ADMINISTRATION', 'SALES', 'MARKETING', 'FINANCE', 'HUMAN RESOURCES']
    };

    // Hierarchical structure indicators
    this.hierarchyIndicators = {
      // Patterns that suggest nested structure
      colons: /:\s*\n/g,
      numberedLists: /^\s*\d+[\.\)]\s+/gm,
      bulletPoints: /^\s*[-\*\+]\s+/gm,
      indentation: /^\s{2,}/gm,
      subItems: /^\s*[-\*\+]\s+.+\n(\s{2,}[-\*\+]\s+.+\n?)+/gm
    };

    // Language detection patterns
    this.languagePatterns = {
      spanish: /\b(crear|desarrollar|implementar|sistema|aplicación|proyecto|gestión|administración|módulos|secciones)\b/gi,
      english: /\b(create|develop|implement|system|application|project|management|administration|modules|sections)\b/gi
    };
  }

  /**
   * Analyze prompt structure to determine if hierarchical generation is needed
   * @param {string} prompt - User project description
   * @returns {Object} Analysis result with structure information
   */
  analyzeStructure(prompt) {
    if (prompt === null || prompt === undefined || typeof prompt !== 'string') {
      throw new Error('Valid prompt string is required');
    }

    const cleanPrompt = prompt.trim();
    
    // Handle empty prompts gracefully
    if (cleanPrompt === '') {
      return {
        isHierarchical: false,
        modules: [],
        complexity: 'simple',
        suggestedLevels: 1,
        language: 'spanish',
        indicators: {
          hasModules: false,
          hasNestedStructure: false,
          hasNumberedLists: false,
          hasIndentation: false,
          hasColons: false
        },
        confidence: 0
      };
    }
    const language = this.detectLanguage(cleanPrompt);
    
    const analysis = {
      isHierarchical: false,
      modules: [],
      complexity: 'simple',
      suggestedLevels: 1,
      language: language,
      indicators: {
        hasModules: false,
        hasNestedStructure: false,
        hasNumberedLists: false,
        hasIndentation: false,
        hasColons: false
      },
      confidence: 0
    };

    // Detect modules
    const moduleAnalysis = this.detectModules(cleanPrompt, language);
    analysis.modules = moduleAnalysis.modules;
    analysis.indicators.hasModules = moduleAnalysis.hasModules;

    // Detect hierarchical structure indicators
    analysis.indicators.hasNestedStructure = this.detectNestedStructure(cleanPrompt);
    analysis.indicators.hasNumberedLists = this.hierarchyIndicators.numberedLists.test(cleanPrompt);
    analysis.indicators.hasIndentation = this.hierarchyIndicators.indentation.test(cleanPrompt);
    analysis.indicators.hasColons = this.hierarchyIndicators.colons.test(cleanPrompt);

    // Calculate complexity and hierarchy requirements
    const complexityAnalysis = this.calculateComplexity(cleanPrompt, analysis.indicators, analysis.modules);
    analysis.complexity = complexityAnalysis.level;
    analysis.suggestedLevels = complexityAnalysis.levels;
    analysis.confidence = complexityAnalysis.confidence;

    // Determine if hierarchical structure is needed
    analysis.isHierarchical = this.shouldUseHierarchy(analysis.indicators, analysis.modules, analysis.confidence);

    return analysis;
  }

  /**
   * Detect the primary language of the prompt
   * @param {string} prompt - User prompt
   * @returns {string} Detected language ('spanish' or 'english')
   */
  detectLanguage(prompt) {
    const spanishMatches = (prompt.match(this.languagePatterns.spanish) || []).length;
    const englishMatches = (prompt.match(this.languagePatterns.english) || []).length;

    // Default to Spanish if no clear indication (since original example was in Spanish)
    return spanishMatches >= englishMatches ? 'spanish' : 'english';
  }

  /**
   * Detect modules and module-like structures in the prompt
   * @param {string} prompt - User prompt
   * @param {string} language - Detected language
   * @returns {Object} Module detection result
   */
  detectModules(prompt, language) {
    const result = {
      hasModules: false,
      modules: []
    };

    const keywords = this.moduleKeywords[language] || this.moduleKeywords.spanish;
    const moduleTypes = this.moduleTypes[language] || this.moduleTypes.spanish;

    // Check for explicit module keywords
    const hasModuleKeywords = keywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasModuleKeywords) {
      result.hasModules = true;
    }

    // Extract potential modules from the text
    const extractedModules = this.extractModuleNames(prompt, language);
    result.modules = extractedModules;

    // Check for known module types (like INTRANET, COMERCIAL, etc.)
    const knownModules = moduleTypes.filter(moduleType =>
      prompt.toUpperCase().includes(moduleType)
    );

    // Add known modules to the result
    knownModules.forEach(moduleName => {
      if (!result.modules.some(m => m.name.toUpperCase() === moduleName)) {
        result.modules.push({
          name: moduleName,
          type: 'module',
          components: [],
          estimatedDuration: 0,
          priority: 'medium',
          order: result.modules.length
        });
      }
    });

    if (result.modules.length > 0) {
      result.hasModules = true;
    }

    return result;
  }

  /**
   * Extract module names and their components from the prompt
   * @param {string} prompt - User prompt
   * @param {string} language - Detected language
   * @returns {Array} Array of module objects
   */
  extractModuleNames(prompt, language) {
    const modules = [];
    const lines = prompt.split('\n');

    // Look for patterns like "Módulo 1: INTRANET" or "Module: COMMERCIAL" - prioritize numbered modules
    const modulePattern = language === 'spanish' 
      ? /(?:módulo|modulo)\s*\d+\s*[\.\:]\s*([A-Z][A-Z\s]+)/gi
      : /(?:module)\s*\d+\s*[\.\:]\s*([A-Z][A-Z\s]+)/gi;

    let match;
    while ((match = modulePattern.exec(prompt)) !== null) {
      const moduleName = match[1].trim();
      if (moduleName && !modules.some(m => m.name === moduleName)) {
        modules.push({
          name: moduleName,
          type: 'module',
          components: [],
          estimatedDuration: 0,
          priority: 'medium',
          order: modules.length
        });
      }
    }

    // Only look for explicitly known module types if no numbered modules were found
    if (modules.length === 0) {
      const capitalizedPattern = /\b([A-Z]{4,}(?:\s+[A-Z]{4,})*)\b/g;
      while ((match = capitalizedPattern.exec(prompt)) !== null) {
        const potentialModule = match[1].trim();
        
        // Skip common words that aren't modules and be more restrictive
        const skipWords = ['THE', 'AND', 'FOR', 'WITH', 'FROM', 'TODO', 'PARA', 'CON', 'DESDE', 'SISTEMA', 'SYSTEM', 'FINANZAS'];
        const isKnownModuleType = this.moduleTypes.spanish.includes(potentialModule) || 
                                 this.moduleTypes.english.includes(potentialModule);
        
        if (!skipWords.includes(potentialModule) && 
            potentialModule.length >= 4 && 
            isKnownModuleType &&
            !modules.some(m => m.name === potentialModule)) {
          
          modules.push({
            name: potentialModule,
            type: 'module',
            components: [],
            estimatedDuration: 0,
            priority: 'medium',
            order: modules.length
          });
        }
      }
    }

    // Extract components for each module by looking at text following module declarations
    this.extractModuleComponents(prompt, modules, language);

    return modules;
  }

  /**
   * Extract components for detected modules
   * @param {string} prompt - User prompt
   * @param {Array} modules - Array of detected modules
   * @param {string} language - Detected language
   */
  extractModuleComponents(prompt, modules, language) {
    const lines = prompt.split('\n');

    modules.forEach(module => {
      // Find lines that mention this module
      const moduleLines = lines.filter(line => 
        line.toUpperCase().includes(module.name.toUpperCase())
      );

      moduleLines.forEach(moduleLine => {
        const lineIndex = lines.indexOf(moduleLine);
        
        // Look at the next few lines for potential components
        for (let i = lineIndex + 1; i < Math.min(lineIndex + 5, lines.length); i++) {
          const nextLine = lines[i].trim();
          
          // Skip empty lines
          if (!nextLine) continue;
          
          // Stop if we hit another module
          if (modules.some(m => nextLine.toUpperCase().includes(m.name.toUpperCase()))) {
            break;
          }

          // Look for list items or components
          if (this.isComponentLine(nextLine, language)) {
            const componentName = this.extractComponentName(nextLine);
            if (componentName && !module.components.some(c => c.name === componentName)) {
              module.components.push({
                name: componentName,
                description: nextLine,
                duration: 0,
                dependencies: [],
                subComponents: []
              });
            }
          }
        }
      });
    });
  }

  /**
   * Check if a line represents a component
   * @param {string} line - Text line to check
   * @param {string} language - Detected language
   * @returns {boolean} Whether the line represents a component
   */
  isComponentLine(line, language) {
    // Check for list indicators
    if (/^\s*[-\*\+]\s+/.test(line) || /^\s*\d+[\.\)]\s+/.test(line)) {
      return true;
    }

    // Check for component keywords
    const componentKeywords = language === 'spanish'
      ? ['gestión', 'administración', 'control', 'registro', 'sistema', 'módulo']
      : ['management', 'administration', 'control', 'registration', 'system', 'module'];

    return componentKeywords.some(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Extract component name from a line
   * @param {string} line - Text line
   * @returns {string} Extracted component name
   */
  extractComponentName(line) {
    // Remove list indicators
    let cleaned = line.replace(/^\s*[-\*\+]\s+/, '').replace(/^\s*\d+[\.\)]\s+/, '');
    
    // Take the first part before any description
    const parts = cleaned.split(/[:\-\(]/);
    return parts[0].trim();
  }

  /**
   * Detect nested structure patterns in the prompt
   * @param {string} prompt - User prompt
   * @returns {boolean} Whether nested structure is detected
   */
  detectNestedStructure(prompt) {
    // Check for sub-items pattern (indented list items)
    if (this.hierarchyIndicators.subItems.test(prompt)) {
      return true;
    }

    // Check for multiple levels of numbering (1.1, 1.2, etc.)
    const multiLevelNumbering = /^\s*\d+\.\d+[\.\)]*\s+/gm;
    if (multiLevelNumbering.test(prompt)) {
      return true;
    }

    // Check for nested bullet points with different indentation levels
    const lines = prompt.split('\n');
    let hasNestedBullets = false;
    let previousIndent = -1;
    let foundBullet = false;

    for (const line of lines) {
      const bulletMatch = line.match(/^(\s*)[-\*\+]\s+/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length;
        
        if (foundBullet && indent > previousIndent) {
          hasNestedBullets = true;
          break;
        }
        
        previousIndent = indent;
        foundBullet = true;
      }
    }

    return hasNestedBullets;
  }

  /**
   * Calculate project complexity based on various indicators
   * @param {string} prompt - User prompt
   * @param {Object} indicators - Structure indicators
   * @param {Array} modules - Detected modules
   * @returns {Object} Complexity analysis
   */
  calculateComplexity(prompt, indicators, modules) {
    let score = 0;
    let confidence = 0;

    // Base score from prompt length
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount > 100) score += 2;
    else if (wordCount > 50) score += 1;

    // Score from modules
    if (modules.length > 3) {
      score += 3;
      confidence += 30;
    } else if (modules.length > 1) {
      score += 2;
      confidence += 20;
    } else if (modules.length === 1) {
      score += 1;
      confidence += 10;
    }

    // Score from structure indicators
    if (indicators.hasNestedStructure) {
      score += 2;
      confidence += 25;
    }
    if (indicators.hasNumberedLists) {
      score += 1;
      confidence += 15;
    }
    if (indicators.hasIndentation) {
      score += 1;
      confidence += 15;
    }
    if (indicators.hasColons) {
      score += 1;
      confidence += 10;
    }

    // Determine complexity level
    let level = 'simple';
    let suggestedLevels = 1;

    if (score >= 6) {
      level = 'detailed';
      suggestedLevels = 3;
      confidence += 20;
    } else if (score >= 3) {
      level = 'medium';
      suggestedLevels = 2;
      confidence += 15;
    }

    // Cap confidence at 100
    confidence = Math.min(confidence, 100);

    return {
      level,
      levels: suggestedLevels,
      confidence,
      score
    };
  }

  /**
   * Determine if hierarchical structure should be used
   * @param {Object} indicators - Structure indicators
   * @param {Array} modules - Detected modules
   * @param {number} confidence - Confidence score
   * @returns {boolean} Whether to use hierarchical structure
   */
  shouldUseHierarchy(indicators, modules, confidence) {
    // High confidence threshold
    if (confidence >= 60) {
      return true;
    }

    // Multiple modules strongly suggest hierarchy
    if (modules.length >= 2) {
      return true;
    }

    // Strong structural indicators
    if (indicators.hasNestedStructure && indicators.hasModules) {
      return true;
    }

    // Multiple indicators suggest hierarchy
    const indicatorCount = Object.values(indicators).filter(Boolean).length;
    if (indicatorCount >= 3) {
      return true;
    }

    return false;
  }

  /**
   * Get analysis summary for debugging or logging
   * @param {Object} analysis - Analysis result
   * @returns {string} Human-readable summary
   */
  getAnalysisSummary(analysis) {
    const summary = [];
    
    summary.push(`Language: ${analysis.language}`);
    summary.push(`Hierarchical: ${analysis.isHierarchical ? 'Yes' : 'No'}`);
    summary.push(`Complexity: ${analysis.complexity}`);
    summary.push(`Suggested Levels: ${analysis.suggestedLevels}`);
    summary.push(`Confidence: ${analysis.confidence}%`);
    
    if (analysis.modules.length > 0) {
      summary.push(`Modules (${analysis.modules.length}): ${analysis.modules.map(m => m.name).join(', ')}`);
    }

    const activeIndicators = Object.entries(analysis.indicators)
      .filter(([key, value]) => value)
      .map(([key]) => key);
    
    if (activeIndicators.length > 0) {
      summary.push(`Indicators: ${activeIndicators.join(', ')}`);
    }

    return summary.join('\n');
  }
}

// Export singleton instance
export const promptAnalyzer = new PromptAnalyzer();