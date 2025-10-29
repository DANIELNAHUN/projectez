/**
 * Configuration for AI services
 * Defines parameters and limits for different AI providers
 */

export const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: {
      basic: 2500,
      medium: 3500,
      detailed: 4000
    },
    responseFormat: { type: 'json_object' }
  },

  // Gemini Configuration
  gemini: {
    model: 'gemini-pro',
    // Gemini doesn't have temperature or response format options like OpenAI
    // but we can configure other parameters here if needed
  },

  // General Configuration
  general: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    
    // Task limits by complexity
    taskLimits: {
      basic: { min: 3, max: 8 },
      medium: { min: 5, max: 15 },
      detailed: { min: 10, max: 20 }
    },

    // Description length limits to prevent token overflow
    descriptionLimits: {
      project: 200,
      task: 100,
      subtask: 80,
      deliverable: 60
    },

    // Validation rules
    validation: {
      minProjectNameLength: 3,
      maxProjectNameLength: 100,
      minTaskTitleLength: 3,
      maxTaskTitleLength: 80,
      minDuration: 1,
      maxDuration: 365,
      validPriorities: ['low', 'medium', 'high'],
      validTaskTypes: ['simple', 'with_deliverable'],
      validDeliverableTypes: ['presentation', 'file', 'exposition', 'other']
    }
  },

  // Error handling configuration
  errorHandling: {
    // Errors that should not be retried
    permanentErrors: {
      openai: [
        'insufficient_quota',
        'invalid_api_key',
        'model_not_found',
        'invalid_request_error'
      ],
      gemini: [
        'API_KEY_INVALID',
        'QUOTA_EXCEEDED',
        'PERMISSION_DENIED',
        'INVALID_ARGUMENT'
      ]
    },

    // Errors that should be retried
    retryableErrors: {
      openai: [
        'rate_limit_exceeded',
        'server_error',
        'timeout',
        'network_error',
        'service_unavailable'
      ],
      gemini: [
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_ERROR',
        'TIMEOUT',
        'NETWORK_ERROR',
        'SERVICE_UNAVAILABLE'
      ]
    },

    // Error messages for users
    userMessages: {
      quota_exceeded: 'Cuota de API agotada. Verifica tu configuración de facturación.',
      invalid_key: 'Clave API inválida. Verifica que sea correcta y tenga permisos.',
      rate_limit: 'Límite de velocidad excedido. Espera unos minutos antes de intentar nuevamente.',
      json_parse: 'Respuesta inválida de la IA. Intenta con una descripción más simple.',
      network_error: 'Error de conexión. Verifica tu conexión a internet.',
      service_unavailable: 'Servicio temporalmente no disponible. Intenta más tarde.',
      unknown_error: 'Error desconocido. Intenta nuevamente o contacta soporte.'
    }
  },

  // Prompt optimization
  prompts: {
    // System prompt templates
    systemPromptTemplate: {
      header: `You are an expert project manager and software architect. Your task is to generate a comprehensive project structure from user descriptions.`,
      
      criticalInstructions: [
        'You MUST respond with ONLY valid, complete JSON',
        'Do NOT include any explanations, comments, or text outside the JSON',
        'Ensure the JSON is properly closed with all braces and brackets',
        'Keep descriptions concise to avoid token limits',
        'ENSURE the JSON response is complete and properly formatted'
      ],

      guidelines: [
        'Duration should be realistic working days (Monday-Saturday, excluding Sunday)',
        'Create a logical hierarchy with main tasks and subtasks',
        'Include dependencies between tasks where appropriate',
        'Only include deliverable object if type is "with_deliverable"',
        'Dependencies should reference exact task titles',
        'Ensure all durations are positive integers',
        'Assign appropriate priorities based on task importance and dependencies'
      ]
    },

    // User prompt enhancements
    userPromptEnhancements: {
      prefix: 'Create a project for:',
      suffix: 'Please ensure the project structure is realistic and follows software development best practices. Include appropriate task dependencies and realistic time estimates.'
    }
  }
};

/**
 * Get configuration for a specific provider and complexity
 * @param {string} provider - Provider name ('openai' or 'gemini')
 * @param {string} complexity - Complexity level ('basic', 'medium', 'detailed')
 * @returns {Object} Configuration object
 */
export function getProviderConfig(provider, complexity = 'medium') {
  const providerConfig = AI_CONFIG[provider] || {};
  const generalConfig = AI_CONFIG.general;
  
  return {
    ...providerConfig,
    maxTasks: generalConfig.taskLimits[complexity]?.max || 15,
    minTasks: generalConfig.taskLimits[complexity]?.min || 5,
    maxTokens: providerConfig.maxTokens?.[complexity] || 3500,
    ...generalConfig
  };
}

/**
 * Get error handling configuration for a provider
 * @param {string} provider - Provider name
 * @returns {Object} Error handling configuration
 */
export function getErrorConfig(provider) {
  return {
    permanent: AI_CONFIG.errorHandling.permanentErrors[provider] || [],
    retryable: AI_CONFIG.errorHandling.retryableErrors[provider] || [],
    messages: AI_CONFIG.errorHandling.userMessages
  };
}

/**
 * Get prompt configuration
 * @returns {Object} Prompt configuration
 */
export function getPromptConfig() {
  return AI_CONFIG.prompts;
}

export default AI_CONFIG;