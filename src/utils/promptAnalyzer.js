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

    // Flexible format detection patterns
    this.formatPatterns = {
      // Detect format specifications like "Titulo / Asignado a / Duracion (días)"
      formatSpec: /Formato:\s*(.+?)(?:\n|$)/i,
      // Common separators used in task formats
      separators: ['/', '|', '-', '\\', '→', '>', '•'],
      // Duration patterns in different languages
      durationPatterns: {
        spanish: /\b(duraci[oó]n|d[ií]as?|semanas?|meses?|horas?)\b/gi,
        english: /\b(duration|days?|weeks?|months?|hours?)\b/gi
      },
      // Assignment patterns
      assignmentPatterns: {
        spanish: /\b(asignado\s+a|responsable|encargado|equipo)\b/gi,
        english: /\b(assigned\s+to|responsible|in\s+charge|team)\b/gi
      }
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
        confidence: 0,
        formatInfo: null
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
      confidence: 0,
      formatInfo: null,
      teamInfo: null
    };

    // Detect flexible format specification
    const formatAnalysis = this.detectFlexibleFormat(cleanPrompt, language);
    analysis.formatInfo = formatAnalysis;

    // Extract team member information
    const teamInfo = this.extractTeamInformation(cleanPrompt, language);
    analysis.teamInfo = teamInfo;

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
   * Detect flexible format specification in the prompt
   * @param {string} prompt - User prompt
   * @param {string} language - Detected language
   * @returns {Object|null} Format information or null if no format detected
   */
  detectFlexibleFormat(prompt, language) {
    // Look for explicit format specification
    const formatSpecMatch = prompt.match(this.formatPatterns.formatSpec);
    
    if (formatSpecMatch) {
      const formatString = formatSpecMatch[1].trim();
      return this.parseFormatString(formatString, language);
    }

    // Look for implicit format patterns in task lines
    const implicitFormat = this.detectImplicitFormat(prompt, language);
    if (implicitFormat) {
      return implicitFormat;
    }

    return null;
  }

  /**
   * Parse a format string to extract field information
   * @param {string} formatString - Format specification string
   * @param {string} language - Detected language
   * @returns {Object} Parsed format information
   */
  parseFormatString(formatString, language) {
    if (!formatString || formatString.trim() === '') {
      return null;
    }

    const format = {
      hasFormat: true,
      separator: null,
      fields: [],
      originalFormat: formatString
    };

    // Detect separator
    for (const sep of this.formatPatterns.separators) {
      if (formatString.includes(sep)) {
        format.separator = sep;
        break;
      }
    }

    if (!format.separator) {
      // Default to '/' if no separator found
      format.separator = '/';
    }

    // Split by separator and analyze each field
    const parts = formatString.split(format.separator).map(part => part.trim()).filter(part => part.length > 0);
    
    if (parts.length === 0) {
      return null;
    }

    parts.forEach((part, index) => {
      const field = {
        name: part,
        type: this.detectFieldType(part, language),
        position: index,
        required: true
      };
      format.fields.push(field);
    });

    return format;
  }

  /**
   * Detect the type of a format field
   * @param {string} fieldName - Field name from format
   * @param {string} language - Detected language
   * @returns {string} Field type
   */
  detectFieldType(fieldName, language) {
    const lowerField = fieldName.toLowerCase();
    
    // Duration patterns
    const durationPattern = this.formatPatterns.durationPatterns[language];
    if (durationPattern.test(fieldName)) {
      return 'duration';
    }

    // Assignment patterns
    const assignmentPattern = this.formatPatterns.assignmentPatterns[language];
    if (assignmentPattern.test(fieldName)) {
      return 'assignment';
    }

    // Common field types
    if (lowerField.includes('titulo') || lowerField.includes('title') || lowerField.includes('nombre') || lowerField.includes('name')) {
      return 'title';
    }

    if (lowerField.includes('descripci') || lowerField.includes('description')) {
      return 'description';
    }

    if (lowerField.includes('prioridad') || lowerField.includes('priority')) {
      return 'priority';
    }

    if (lowerField.includes('estado') || lowerField.includes('status')) {
      return 'status';
    }

    return 'custom';
  }

  /**
   * Detect implicit format patterns in task lines
   * @param {string} prompt - User prompt
   * @param {string} language - Detected language
   * @returns {Object|null} Detected format or null
   */
  detectImplicitFormat(prompt, language) {
    const lines = prompt.split('\n');
    const taskLines = [];

    // Find lines that look like tasks with separators
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 10) continue; // Skip very short lines

      // Look for lines with multiple separators
      for (const sep of this.formatPatterns.separators) {
        const parts = trimmed.split(sep);
        if (parts.length >= 3 && parts.length <= 5) { // Require at least 3 parts for meaningful format
          // Filter out empty parts
          const nonEmptyParts = parts.map(p => p.trim()).filter(p => p.length > 0);
          
          if (nonEmptyParts.length >= 3) {
            // Check if this looks like a task format
            const hasAssignment = this.formatPatterns.assignmentPatterns[language].test(trimmed) ||
                                 /\b[A-Z]{2,3}\b/.test(trimmed); // Initials like DC, DZ
            const hasDuration = this.formatPatterns.durationPatterns[language].test(trimmed) ||
                               /\b\d+\s*(d[ií]as?|days?|meses?|months?|horas?|hours?)\b/i.test(trimmed);

            // Also check for task-like patterns (starts with dash, bullet, etc.)
            const isTaskLike = /^\s*[-\*\+•]\s+/.test(trimmed) || 
                              /^\s*\d+[\.\)]\s+/.test(trimmed);

            // Require both task-like structure AND format indicators
            if (isTaskLike && (hasAssignment || hasDuration)) {
              taskLines.push({
                line: trimmed,
                separator: sep,
                parts: nonEmptyParts
              });
              break; // Found a separator for this line, move to next line
            }
          }
        }
      }
    }

    // Require at least 3 consistent task lines for format detection
    if (taskLines.length >= 3) {
      return this.analyzeTaskLineFormat(taskLines, language);
    }

    return null;
  }

  /**
   * Analyze task lines to determine format
   * @param {Array} taskLines - Array of task line objects
   * @param {string} language - Detected language
   * @returns {Object} Format information
   */
  analyzeTaskLineFormat(taskLines, language) {
    if (taskLines.length === 0) return null;

    // Find the most common separator and part count
    const separatorCounts = {};
    const partCounts = {};

    taskLines.forEach(taskLine => {
      separatorCounts[taskLine.separator] = (separatorCounts[taskLine.separator] || 0) + 1;
      partCounts[taskLine.parts.length] = (partCounts[taskLine.parts.length] || 0) + 1;
    });

    const mostCommonSeparator = Object.keys(separatorCounts).reduce((a, b) => 
      separatorCounts[a] > separatorCounts[b] ? a : b
    );

    const mostCommonPartCount = parseInt(Object.keys(partCounts).reduce((a, b) => 
      partCounts[a] > partCounts[b] ? a : b
    ));

    // Require at least 2 parts for a valid format
    if (mostCommonPartCount < 2) return null;

    // Analyze the structure of the most common format
    const sampleLines = taskLines.filter(tl => 
      tl.separator === mostCommonSeparator && tl.parts.length === mostCommonPartCount
    );

    // Require at least 50% consistency for format detection
    const consistencyRatio = sampleLines.length / taskLines.length;
    if (consistencyRatio < 0.5) return null;

    const format = {
      hasFormat: true,
      separator: mostCommonSeparator,
      fields: [],
      originalFormat: `Detected format with ${mostCommonPartCount} fields separated by '${mostCommonSeparator}'`,
      confidence: Math.min(95, consistencyRatio * 100)
    };

    // Analyze each position to determine field types
    for (let i = 0; i < mostCommonPartCount; i++) {
      const samples = sampleLines.map(sl => sl.parts[i]).filter(Boolean);
      const fieldType = this.inferFieldTypeFromSamples(samples, language);
      
      format.fields.push({
        name: `Field ${i + 1}`,
        type: fieldType,
        position: i,
        required: true,
        samples: samples.slice(0, 3) // Keep first 3 samples for reference
      });
    }

    return format;
  }

  /**
   * Infer field type from sample values
   * @param {Array} samples - Sample values for this field position
   * @param {string} language - Detected language
   * @returns {string} Inferred field type
   */
  inferFieldTypeFromSamples(samples, language) {
    if (samples.length === 0) return 'unknown';

    // Check for duration patterns
    const durationPattern = this.formatPatterns.durationPatterns[language];
    if (samples.some(sample => durationPattern.test(sample) || /\b\d+\s*(d[ií]as?|days?)\b/i.test(sample))) {
      return 'duration';
    }

    // Check for assignment patterns (initials, names)
    if (samples.some(sample => /\b[A-Z]{2,3}\b/.test(sample))) {
      return 'assignment';
    }

    // Check if first position (likely title)
    if (samples.every(sample => sample.length > 10)) {
      return 'title';
    }

    // Check for numeric values
    if (samples.every(sample => /^\d+$/.test(sample))) {
      return 'numeric';
    }

    return 'custom';
  }

  /**
   * Extract team member information from the prompt
   * @param {string} prompt - User prompt
   * @param {string} language - Detected language
   * @returns {Object} Team information
   */
  extractTeamInformation(prompt, language) {
    const teamInfo = {
      hasTeamInfo: false,
      members: [],
      assignments: {} // Map initials to full names
    };

    // Look for team declarations like "Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)"
    // Use a unified pattern that works for both languages
    const teamPattern = /(?:equipo|team|members):\s*(.+?)(?:\n|$)/gi;
    let teamMatch;
    
    // Reset regex lastIndex to avoid issues with global flag
    teamPattern.lastIndex = 0;
    teamMatch = teamPattern.exec(prompt);

    if (teamMatch) {
      const teamLine = teamMatch[1]; // Get the captured group, not the full match
      
      // Extract member patterns like "Daniel Calcina (DC)" or "Dayana Zegarra (DZ)"
      const memberPattern = /([A-Za-zÀ-ÿ\s]+?)\s*\(([A-Z]{2,4})\)/g;
      let memberMatch;

      while ((memberMatch = memberPattern.exec(teamLine)) !== null) {
        const fullName = memberMatch[1].trim();
        const initials = memberMatch[2].trim();
        
        teamInfo.members.push({
          name: fullName,
          initials: initials,
          role: this.inferRoleFromName(fullName, language)
        });

        teamInfo.assignments[initials] = fullName;
        teamInfo.hasTeamInfo = true;
      }
    }

    // Also extract assignments from task lines to build a more complete picture
    if (teamInfo.hasTeamInfo) {
      this.extractTaskAssignments(prompt, teamInfo);
    }

    return teamInfo;
  }

  /**
   * Infer role from team member name (basic heuristics)
   * @param {string} name - Full name
   * @param {string} language - Language
   * @returns {string} Inferred role
   */
  inferRoleFromName(name, language) {
    // Basic role inference - could be enhanced with more sophisticated logic
    const defaultRoles = {
      spanish: 'Desarrollador',
      english: 'Developer'
    };

    return defaultRoles[language] || defaultRoles.spanish;
  }

  /**
   * Extract task assignments from the prompt to validate team member usage
   * @param {string} prompt - User prompt
   * @param {Object} teamInfo - Team information object to update
   */
  extractTaskAssignments(prompt, teamInfo) {
    const lines = prompt.split('\n');
    const assignmentCounts = new Map();

    // Initialize counts for known team members
    teamInfo.members.forEach(member => {
      assignmentCounts.set(member.initials, 0);
    });

    // Count assignments in task lines
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 10) { // Skip very short lines
        
        // Look for initials in the line
        teamInfo.members.forEach(member => {
          // Check if the initials appear in the line (with word boundaries)
          const initialsPattern = new RegExp(`\\b${member.initials}\\b`, 'g');
          const matches = (trimmed.match(initialsPattern) || []).length;
          if (matches > 0) {
            assignmentCounts.set(member.initials, assignmentCounts.get(member.initials) + matches);
          }
        });
      }
    });

    // Add assignment statistics to team info
    teamInfo.assignmentStats = Object.fromEntries(assignmentCounts);
  }

  /**
   * Detect the primary language of the prompt
   * @param {string} prompt - User prompt
   * @returns {string} Detected language ('spanish' or 'english')
   */
  detectLanguage(prompt) {
    const spanishMatches = (prompt.match(this.languagePatterns.spanish) || []).length;
    const englishMatches = (prompt.match(this.languagePatterns.english) || []).length;

    // Check for specific Spanish indicators
    const spanishIndicators = /\b(equipo|módulo|modulo|tarea|días|duración|asignado)\b/gi;
    const englishIndicators = /\b(team|module|task|days|duration|assigned)\b/gi;
    
    const spanishIndicatorMatches = (prompt.match(spanishIndicators) || []).length;
    const englishIndicatorMatches = (prompt.match(englishIndicators) || []).length;

    // Combine pattern matches with indicator matches
    const totalSpanish = spanishMatches + spanishIndicatorMatches;
    const totalEnglish = englishMatches + englishIndicatorMatches;

    // Default to Spanish if no clear indication (since original example was in Spanish)
    return totalSpanish >= totalEnglish ? 'spanish' : 'english';
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
    
    if (analysis.formatInfo && analysis.formatInfo.hasFormat) {
      summary.push(`Format Detected: Yes`);
      summary.push(`Separator: '${analysis.formatInfo.separator}'`);
      summary.push(`Fields: ${analysis.formatInfo.fields.map(f => `${f.name} (${f.type})`).join(', ')}`);
      if (analysis.formatInfo.confidence) {
        summary.push(`Format Confidence: ${Math.round(analysis.formatInfo.confidence)}%`);
      }
    } else {
      summary.push(`Format Detected: No`);
    }

    if (analysis.teamInfo && analysis.teamInfo.hasTeamInfo) {
      summary.push(`Team Members: ${analysis.teamInfo.members.map(m => `${m.name} (${m.initials})`).join(', ')}`);
      if (analysis.teamInfo.assignmentStats) {
        const stats = Object.entries(analysis.teamInfo.assignmentStats)
          .map(([initials, count]) => `${initials}: ${count}`)
          .join(', ');
        summary.push(`Assignment Distribution: ${stats}`);
      }
    }
    
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