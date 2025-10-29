/**
 * Ejemplo de uso de la integración de múltiples proveedores de IA
 * Este archivo demuestra cómo usar el nuevo sistema unificado de IA
 */

import { aiService } from '../services/aiService.js'

// Ejemplo 1: Configuración básica
export const configureAIProviders = () => {
  // Configurar ambos proveedores
  const config = {
    openaiKey: 'sk-your-openai-key-here',
    geminiKey: 'AIza-your-gemini-key-here',
    defaultProvider: 'openai' // Proveedor por defecto
  }
  
  aiService.configure(config)
  
  console.log('Proveedores configurados:', aiService.getProviderStatus())
}

// Ejemplo 2: Generar proyecto con fallback automático
export const generateProjectWithFallback = async () => {
  const prompt = "Crear una aplicación web de e-commerce con carrito de compras, sistema de pagos y gestión de inventario"
  
  const options = {
    complexity: 'detailed',
    includeTeamMembers: true,
    maxTasks: 20
  }
  
  try {
    const result = await aiService.generateProjectWithFallback(prompt, options)
    
    if (result.success) {
      console.log('✅ Proyecto generado exitosamente!')
      console.log('Proveedor usado:', result.provider)
      console.log('Proyecto:', result.project.name)
      console.log('Tareas:', result.project.tasks.length)
      console.log('Intentos realizados:', result.attempts.length)
      
      return result.project
    } else {
      console.error('❌ Error al generar proyecto:', result.errors)
      return null
    }
  } catch (error) {
    console.error('Error inesperado:', error)
    return null
  }
}

// Ejemplo 3: Cambiar proveedor manualmente
export const switchProvider = (providerName) => {
  try {
    aiService.setProvider(providerName)
    console.log(`Cambiado a proveedor: ${providerName}`)
    return true
  } catch (error) {
    console.error(`Error al cambiar proveedor: ${error.message}`)
    return false
  }
}

// Ejemplo 4: Probar todos los proveedores
export const testAllProviders = async () => {
  console.log('Probando todos los proveedores...')
  
  const results = await aiService.testAllConnections()
  
  Object.entries(results).forEach(([provider, result]) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${provider}: ${result.message || result.error}`)
  })
  
  return results
}

// Ejemplo 5: Obtener información de proveedores
export const getProviderInfo = () => {
  const info = aiService.getProviderInfo()
  const status = aiService.getProviderStatus()
  
  console.log('Información de proveedores:')
  Object.entries(info).forEach(([key, data]) => {
    const configured = status.configured.includes(key) ? '✅' : '❌'
    console.log(`${configured} ${data.name}: ${data.description}`)
    console.log(`   Modelos: ${data.models.join(', ')}`)
  })
  
  console.log(`\nProveedor actual: ${status.current}`)
  console.log(`Proveedores configurados: ${status.configured.join(', ')}`)
  
  return { info, status }
}

// Ejemplo 6: Generar múltiples proyectos con diferentes proveedores
export const generateMultipleProjects = async () => {
  const prompts = [
    "Desarrollar una aplicación móvil de fitness con seguimiento de ejercicios",
    "Crear un sistema de gestión de biblioteca con préstamos y devoluciones",
    "Implementar una plataforma de cursos online con videos y evaluaciones"
  ]
  
  const results = []
  
  for (const [index, prompt] of prompts.entries()) {
    console.log(`\nGenerando proyecto ${index + 1}...`)
    
    const result = await aiService.generateProjectWithFallback(prompt, {
      complexity: 'medium',
      includeTeamMembers: true
    })
    
    if (result.success) {
      console.log(`✅ Proyecto "${result.project.name}" generado con ${result.provider}`)
      results.push({
        prompt,
        project: result.project,
        provider: result.provider,
        success: true
      })
    } else {
      console.log(`❌ Error generando proyecto: ${result.errors[0]}`)
      results.push({
        prompt,
        error: result.errors,
        success: false
      })
    }
    
    // Esperar un poco entre requests para evitar rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  return results
}

// Ejemplo 7: Manejo de errores específicos
export const handleSpecificErrors = async (prompt) => {
  try {
    const result = await aiService.generateProjectWithFallback(prompt)
    
    if (!result.success) {
      // Analizar tipos de errores
      const hasQuotaError = result.errors.some(e => 
        e.includes('quota') || e.includes('QUOTA')
      )
      
      const hasKeyError = result.errors.some(e => 
        e.includes('api key') || e.includes('API_KEY')
      )
      
      const hasRateLimitError = result.errors.some(e => 
        e.includes('rate limit') || e.includes('RATE_LIMIT')
      )
      
      if (hasQuotaError) {
        console.log('💡 Sugerencia: Verifica tu configuración de facturación')
        return { error: 'quota_exceeded', suggestion: 'check_billing' }
      } else if (hasKeyError) {
        console.log('💡 Sugerencia: Verifica que tus claves API sean válidas')
        return { error: 'invalid_key', suggestion: 'check_api_keys' }
      } else if (hasRateLimitError) {
        console.log('💡 Sugerencia: Espera unos minutos antes de intentar nuevamente')
        return { error: 'rate_limit', suggestion: 'wait_and_retry' }
      }
    }
    
    return result
  } catch (error) {
    console.error('Error no manejado:', error)
    return { error: 'unexpected', message: error.message }
  }
}

// Ejemplo de uso completo
export const fullExample = async () => {
  console.log('🚀 Iniciando ejemplo completo de integración de IA...\n')
  
  // 1. Configurar proveedores
  console.log('1. Configurando proveedores...')
  configureAIProviders()
  
  // 2. Obtener información
  console.log('\n2. Información de proveedores:')
  getProviderInfo()
  
  // 3. Probar conexiones
  console.log('\n3. Probando conexiones...')
  await testAllProviders()
  
  // 4. Generar proyecto
  console.log('\n4. Generando proyecto de ejemplo...')
  const project = await generateProjectWithFallback()
  
  if (project) {
    console.log('\n✅ Ejemplo completado exitosamente!')
    return project
  } else {
    console.log('\n❌ El ejemplo falló')
    return null
  }
}

// Exportar todas las funciones para uso en otros archivos
export default {
  configureAIProviders,
  generateProjectWithFallback,
  switchProvider,
  testAllProviders,
  getProviderInfo,
  generateMultipleProjects,
  handleSpecificErrors,
  fullExample
}