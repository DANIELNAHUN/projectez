/**
 * AIService - Unified service for handling multiple AI providers
 * Supports OpenAI and Google Gemini APIs for project generation
 */

import { openAIService } from './openAIService.js';
import { geminiService } from './geminiService.js';

export class AIService {
  constructor() {
    this.providers = {
      openai: openAIService,
      gemini: geminiService
    };
    this.defaultProvider = 'openai';
    this.currentProvider = null;
  }

  /**
   * Configure AI service with API keys for different providers
   * @param {Object} config - Configuration object with API keys
   * @param {string} config.openaiKey - OpenAI API key
   * @param {string} config.geminiKey - Gemini API key
   * @param {string} config.defaultProvider - Default provider to use ('openai' or 'gemini')
   */
  configure(config = {}) {
    const { openaiKey, geminiKey, defaultProvider = 'openai' } = config;
    
    // Configure OpenAI if key is provided
    if (openaiKey) {
      try {
        this.providers.openai.configure(openaiKey);
        console.log('OpenAI service configured successfully');
      } catch (error) {
        console.error('Failed to configure OpenAI:', error.message);
      }
    }

    // Configure Gemini if key is provided
    if (geminiKey) {
      try {
        this.providers.gemini.configure(geminiKey);
        console.log('Gemini service configured successfully');
      } catch (error) {
        console.error('Failed to configure Gemini:', error.message);
      }
    }

    // Set default provider
    if (this.providers[defaultProvider]) {
      this.defaultProvider = defaultProvider;
      this.currentProvider = defaultProvider;
    }
  }

  /**
   * Set the current AI provider
   * @param {string} provider - Provider name ('openai' or 'gemini')
   */
  setProvider(provider) {
    if (!this.providers[provider]) {
      throw new Error(`Unknown AI provider: ${provider}`);
    }
    
    if (!this.providers[provider].isReady()) {
      throw new Error(`AI provider ${provider} is not configured`);
    }
    
    this.currentProvider = provider;
  }

  /**
   * Get the current AI provider
   * @returns {string} Current provider name
   */
  getCurrentProvider() {
    return this.currentProvider || this.defaultProvider;
  }

  /**
   * Get available and configured providers
   * @returns {Object} Provider status information
   */
  getProviderStatus() {
    return {
      available: Object.keys(this.providers),
      configured: Object.keys(this.providers).filter(name => this.providers[name].isReady()),
      current: this.getCurrentProvider(),
      default: this.defaultProvider
    };
  }

  /**
   * Check if any provider is ready
   * @returns {boolean} True if at least one provider is configured
   */
  isReady() {
    return Object.values(this.providers).some(provider => provider.isReady());
  }

  /**
   * Get the active provider service
   * @returns {Object} Active provider service instance
   */
  getActiveProvider() {
    const providerName = this.getCurrentProvider();
    const provider = this.providers[providerName];
    
    if (!provider || !provider.isReady()) {
      // Try to find any ready provider
      const readyProvider = Object.entries(this.providers).find(([name, service]) => service.isReady());
      
      if (!readyProvider) {
        throw new Error('No AI provider is configured and ready');
      }
      
      console.log(`Switching to available provider: ${readyProvider[0]}`);
      this.currentProvider = readyProvider[0];
      return readyProvider[1];
    }
    
    return provider;
  }

  /**
   * Generate project using the current AI provider
   * @param {string} prompt - User description of the project
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated project data
   */
  async generateProject(prompt, options = {}) {
    const provider = this.getActiveProvider();
    const providerName = this.getCurrentProvider();
    
    console.log(`Generating project using ${providerName}...`);
    
    try {
      const result = await provider.generateProject(prompt, options);
      
      // Add provider information to the result
      if (result && typeof result === 'object') {
        result.generatedBy = providerName;
        result.generatedAt = new Date().toISOString();
      }
      
      return result;
    } catch (error) {
      console.error(`Project generation failed with ${providerName}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate project with automatic fallback to other providers
   * @param {string} prompt - User description of the project
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result with provider information
   */
  async generateProjectWithFallback(prompt, options = {}) {
    const result = {
      success: false,
      project: null,
      provider: null,
      errors: [],
      warnings: [],
      attempts: []
    };

    const configuredProviders = Object.entries(this.providers)
      .filter(([name, service]) => service.isReady())
      .map(([name]) => name);

    if (configuredProviders.length === 0) {
      result.errors.push('No AI providers are configured');
      return result;
    }

    // Start with current provider, then try others
    const currentProvider = this.getCurrentProvider();
    const providersToTry = [currentProvider, ...configuredProviders.filter(p => p !== currentProvider)];

    for (const providerName of providersToTry) {
      const provider = this.providers[providerName];
      
      if (!provider.isReady()) {
        continue;
      }

      const attemptStart = Date.now();
      
      try {
        console.log(`Attempting project generation with ${providerName}...`);
        
        // Use the safe generation method if available
        let generationResult;
        if (provider.generateProjectSafe) {
          generationResult = await provider.generateProjectSafe(prompt, options);
          
          if (generationResult.success) {
            result.success = true;
            result.project = generationResult.project;
            result.provider = providerName;
            result.project.generatedBy = providerName;
            result.project.generatedAt = new Date().toISOString();
            
            result.attempts.push({
              provider: providerName,
              success: true,
              time: Date.now() - attemptStart,
              retryCount: generationResult.retryCount || 0
            });
            
            console.log(`Project generated successfully with ${providerName}`);
            break;
          } else {
            result.attempts.push({
              provider: providerName,
              success: false,
              time: Date.now() - attemptStart,
              errors: generationResult.errors || []
            });
            result.errors.push(`${providerName}: ${generationResult.errors.join(', ')}`);
          }
        } else {
          // Fallback to regular generation method
          const project = await provider.generateProject(prompt, options);
          
          result.success = true;
          result.project = project;
          result.provider = providerName;
          result.project.generatedBy = providerName;
          result.project.generatedAt = new Date().toISOString();
          
          result.attempts.push({
            provider: providerName,
            success: true,
            time: Date.now() - attemptStart
          });
          
          console.log(`Project generated successfully with ${providerName}`);
          break;
        }
        
      } catch (error) {
        const attemptTime = Date.now() - attemptStart;
        
        result.attempts.push({
          provider: providerName,
          success: false,
          time: attemptTime,
          error: error.message
        });
        
        result.errors.push(`${providerName}: ${error.message}`);
        console.error(`Project generation failed with ${providerName}:`, error.message);
        
        // Continue to next provider
        continue;
      }
    }

    if (!result.success) {
      result.errors.unshift('All configured AI providers failed to generate the project');
    }

    return result;
  }

  /**
   * Test connection for all configured providers
   * @returns {Promise<Object>} Test results for all providers
   */
  async testAllConnections() {
    const results = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      if (provider.isReady()) {
        try {
          results[name] = await provider.testConnection();
        } catch (error) {
          results[name] = {
            success: false,
            error: error.message
          };
        }
      } else {
        results[name] = {
          success: false,
          error: 'Provider not configured'
        };
      }
    }
    
    return results;
  }

  /**
   * Test connection for the current provider
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const provider = this.getActiveProvider();
      return await provider.testConnection();
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get provider-specific information and capabilities
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      openai: {
        name: 'OpenAI',
        models: ['gpt-3.5-turbo', 'gpt-4'],
        description: 'OpenAI GPT models for project generation',
        configured: this.providers.openai.isReady()
      },
      gemini: {
        name: 'Google Gemini',
        models: ['gemini-pro'],
        description: 'Google Gemini Pro for project generation',
        configured: this.providers.gemini.isReady()
      }
    };
  }
}

// Export singleton instance
export const aiService = new AIService();