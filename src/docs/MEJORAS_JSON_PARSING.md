# Mejoras en el Parsing de JSON para APIs de IA

## Problema Identificado

El error original era:
```
Error al generar el proyecto: openai: Intento 1: OpenAI API error: Failed to parse AI response as JSON: Unterminated string in JSON at position 9254 (line 283 column 31)
```

Este error indica que la respuesta JSON de OpenAI se estaba cortando debido al límite de tokens, resultando en JSON incompleto.

## Soluciones Implementadas

### 1. Aumento del Límite de Tokens

**Antes:**
```javascript
max_tokens: 2000
```

**Después:**
```javascript
max_tokens: {
  basic: 2500,
  medium: 3500,
  detailed: 4000
}
```

### 2. Mejora en el Procesamiento de Respuestas JSON

#### Nuevo Método `cleanAndFixJSON`
- Elimina bloques de código markdown (`\`\`\`json`)
- Extrae solo el contenido JSON válido
- Encuentra los límites correctos del objeto JSON

#### Nuevo Método `attemptJSONFix`
- Detecta y corrige JSON incompleto
- Cierra llaves y corchetes faltantes
- Maneja cadenas no terminadas
- Valida el JSON corregido antes de devolverlo

### 3. Configuración Centralizada

**Nuevo archivo:** `src/config/aiConfig.js`

Características:
- Configuración específica por proveedor
- Límites de tokens por complejidad
- Manejo de errores centralizado
- Plantillas de prompts optimizadas

### 4. Prompts Mejorados

**Instrucciones más específicas:**
```
CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY valid, complete JSON
2. Do NOT include any explanations, comments, or text outside the JSON
3. Ensure the JSON is properly closed with all braces and brackets
4. Keep descriptions concise to avoid token limits
5. Maximum X main tasks
```

**Límites de descripción:**
- Descripciones de proyecto: máximo 200 caracteres
- Descripciones de tareas: máximo 100 caracteres
- Descripciones de subtareas: máximo 80 caracteres

### 5. Logging de Debugging Mejorado

Cuando ocurre un error de parsing JSON, ahora se registra:
- Longitud de la respuesta original
- Longitud de la respuesta limpia
- Vista previa del inicio y final de la respuesta
- Mensaje de error específico

### 6. Manejo de Errores Específicos

**Errores permanentes (no se reintentan):**
- OpenAI: `insufficient_quota`, `invalid_api_key`, `model_not_found`
- Gemini: `API_KEY_INVALID`, `QUOTA_EXCEEDED`, `PERMISSION_DENIED`

**Errores temporales (se reintentan):**
- OpenAI: `rate_limit_exceeded`, `server_error`, `timeout`
- Gemini: `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`, `TIMEOUT`

## Casos de Uso Manejados

### 1. JSON Truncado por Límite de Tokens
```json
{"name": "Project", "tasks": [{"title": "Task 1", "description": "Long desc
```
**Solución:** Detecta estructura incompleta y cierra apropiadamente.

### 2. JSON con Bloques de Código
```
```json
{"name": "Project", "tasks": []}
```
```
**Solución:** Extrae solo el contenido JSON.

### 3. JSON con Texto Adicional
```
Here is your project:

{"name": "Project", "tasks": []}

This should work well.
```
**Solución:** Identifica y extrae solo la parte JSON.

### 4. Cadenas No Terminadas
```json
{"name": "Project", "description": "This is a long description that gets cut
```
**Solución:** Detecta cadenas abiertas y las cierra apropiadamente.

## Beneficios de las Mejoras

### 1. Mayor Confiabilidad
- Reduce significativamente los errores de parsing JSON
- Manejo robusto de respuestas incompletas
- Fallback automático entre proveedores

### 2. Mejor Experiencia de Usuario
- Mensajes de error más informativos
- Sugerencias específicas para resolver problemas
- Reintentos automáticos inteligentes

### 3. Debugging Mejorado
- Logs detallados para identificar problemas
- Información de longitud de respuestas
- Vista previa de contenido problemático

### 4. Configuración Flexible
- Límites de tokens ajustables por complejidad
- Configuración centralizada y mantenible
- Fácil adición de nuevos proveedores

## Uso Recomendado

### Para Proyectos Simples
- Usar complejidad "basic"
- Descripciones concisas
- Máximo 8 tareas principales

### Para Proyectos Complejos
- Usar complejidad "detailed"
- Dividir en múltiples generaciones si es necesario
- Considerar usar Gemini para proyectos muy grandes

### Manejo de Errores
1. **Error de cuota:** Verificar configuración de facturación
2. **Error de clave API:** Verificar validez y permisos
3. **Error de parsing JSON:** Simplificar descripción del proyecto
4. **Error de red:** Esperar y reintentar

## Monitoreo y Mantenimiento

### Métricas a Observar
- Tasa de éxito de parsing JSON
- Frecuencia de uso del método `attemptJSONFix`
- Distribución de errores por proveedor
- Tiempo promedio de generación

### Posibles Mejoras Futuras
1. **Streaming de respuestas:** Para manejar respuestas muy largas
2. **Validación semántica:** Verificar coherencia del proyecto generado
3. **Optimización de prompts:** Basada en análisis de respuestas
4. **Cache inteligente:** Para evitar regeneraciones innecesarias

## Pruebas

Las mejoras incluyen pruebas automatizadas en `src/test/json-parsing-fix.test.js`:
- Limpieza de respuestas JSON
- Corrección de JSON incompleto
- Manejo de errores específicos por proveedor
- Validación de configuración

Para ejecutar las pruebas:
```bash
npm run test src/test/json-parsing-fix.test.js
```

## Conclusión

Estas mejoras resuelven el problema original de JSON truncado y proporcionan una base sólida para el manejo robusto de respuestas de IA. El sistema ahora es más confiable, informativo y mantenible.