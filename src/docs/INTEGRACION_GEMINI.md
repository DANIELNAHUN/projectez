# Integración de Google Gemini con el Chatbot

## Resumen

Se ha integrado exitosamente Google Gemini como proveedor adicional de IA para el generador de proyectos, junto con el OpenAI existente. Ahora el sistema soporta múltiples proveedores de IA con funcionalidad de fallback automático.

## Nuevas Funcionalidades

### 1. Servicio Unificado de IA (`aiService`)
- **Archivo**: `src/services/aiService.js`
- **Funcionalidad**: Maneja múltiples proveedores de IA (OpenAI y Gemini)
- **Características**:
  - Configuración automática desde variables de entorno
  - Fallback automático entre proveedores
  - Gestión centralizada de configuraciones
  - Pruebas de conexión para todos los proveedores

### 2. Servicio de Gemini (`geminiService`)
- **Archivo**: `src/services/geminiService.js`
- **Funcionalidad**: Implementación específica para Google Gemini
- **Características**:
  - API compatible con la estructura existente
  - Manejo de errores específicos de Gemini
  - Procesamiento de respuestas JSON
  - Reintentos automáticos con backoff exponencial

### 3. Componente de Configuración Avanzada
- **Archivo**: `src/components/ui/AIConfigurationModal.vue`
- **Funcionalidad**: Interfaz para gestionar proveedores de IA
- **Características**:
  - Vista del estado de todos los proveedores
  - Configuración individual de APIs
  - Pruebas de conexión
  - Cambio de proveedor activo

### 4. Generador de Proyectos Mejorado
- **Archivo**: `src/components/ui/AIProjectGenerator.vue` (actualizado)
- **Mejoras**:
  - Soporte para múltiples proveedores
  - Selector de proveedor en la configuración
  - Fallback automático en caso de fallo
  - Información del proveedor usado en los resultados

## Configuración

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# AI API Keys
VITE_OPENAI_API_KEY="tu_clave_openai_aqui"
VITE_GEMINI_API_KEY="tu_clave_gemini_aqui"

# Default AI Provider (openai or gemini)
VITE_DEFAULT_AI_PROVIDER="openai"
```

### Obtener Claves API

#### OpenAI
1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" en tu dashboard
4. Crea una nueva clave API
5. Copia la clave (formato: `sk-...`)

#### Google Gemini
1. Ve a [Google AI Studio](https://makersuite.google.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "Get API Key"
4. Crea una nueva clave API
5. Copia la clave (formato: `AIza...`)

## Uso

### Configuración Automática
Si tienes las variables de entorno configuradas, el sistema se configurará automáticamente al cargar la aplicación.

### Configuración Manual
1. Abre el generador de proyectos con IA
2. Si no hay proveedores configurados, aparecerá la interfaz de configuración
3. Selecciona el proveedor deseado (OpenAI o Gemini)
4. Ingresa tu clave API
5. Haz clic en "Configurar API"

### Configuración Avanzada
1. En el generador de proyectos, haz clic en "Configurar" (ícono de engranaje)
2. Se abrirá el modal de configuración avanzada
3. Puedes:
   - Ver el estado de todos los proveedores
   - Configurar múltiples APIs
   - Probar conexiones
   - Cambiar el proveedor activo

### Generación de Proyectos
1. Una vez configurado, usa el generador normalmente
2. El sistema usará el proveedor activo
3. Si falla, automáticamente intentará con otros proveedores configurados
4. El resultado mostrará qué proveedor se usó exitosamente

## Características Técnicas

### Fallback Automático
- Si el proveedor principal falla, el sistema automáticamente prueba otros proveedores configurados
- Manejo inteligente de errores (no reintenta errores permanentes como claves inválidas)
- Información detallada de intentos y tiempos de respuesta

### Manejo de Errores
- Errores específicos por proveedor
- Mensajes de error informativos
- Sugerencias de solución automáticas
- Logging detallado para debugging

### Seguridad
- Las claves API se limpian de la memoria después de la configuración
- Campos de contraseña para entrada de claves
- No se almacenan claves en localStorage

### Compatibilidad
- Mantiene compatibilidad total con el sistema existente
- Los proyectos generados tienen el mismo formato
- Migración transparente desde OpenAI solo

## Dependencias Agregadas

```json
{
  "@google/generative-ai": "^latest"
}
```

## Estructura de Archivos

```
src/
├── services/
│   ├── openAIService.js      # Servicio OpenAI existente
│   ├── geminiService.js      # Nuevo servicio Gemini
│   └── aiService.js          # Servicio unificado
└── components/
    └── ui/
        ├── AIProjectGenerator.vue      # Actualizado
        └── AIConfigurationModal.vue   # Nuevo
```

## Próximos Pasos

1. **Prueba ambos proveedores** con diferentes tipos de proyectos
2. **Configura las variables de entorno** para tu equipo
3. **Documenta las mejores prácticas** para cada proveedor
4. **Considera agregar más proveedores** (Claude, etc.) siguiendo el mismo patrón

## Solución de Problemas

### Error: "No AI providers are configured"
- Verifica que al menos una clave API esté configurada
- Revisa las variables de entorno
- Usa la configuración manual en la interfaz

### Error: "Invalid API key"
- Verifica que la clave API sea correcta
- Asegúrate de que la clave tenga permisos suficientes
- Para Gemini, verifica que la API esté habilitada en Google Cloud

### Error: "Quota exceeded"
- Verifica tu configuración de facturación
- Considera cambiar al otro proveedor temporalmente
- Revisa los límites de uso en el dashboard del proveedor

### Fallback no funciona
- Verifica que múltiples proveedores estén configurados
- Revisa la consola para logs detallados
- Asegúrate de que el error no sea permanente (como clave inválida)