# Guía de Pruebas - Configuración de IA

## Problemas Resueltos

### ✅ Error 404 de Gemini
- **Problema**: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent 404 (Not Found)`
- **Causa**: El modelo `gemini-pro` ya no está disponible
- **Solución**: Actualizado a `gemini-1.5-flash`

### ✅ Errores no visibles en la interfaz
- **Problema**: Los errores no se mostraban al usuario al hacer clic en "Configurar API"
- **Solución**: Mejorado el manejo de errores con mensajes específicos

## Cómo Probar la Funcionalidad

### 1. Probar con Gemini (Recomendado)

1. **Obtener API Key de Gemini**:
   - Ir a [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Crear una nueva API key
   - Copiar la clave (formato: `AIza...`)

2. **Configurar en la aplicación**:
   - Ir a la vista de Proyectos
   - Hacer clic en "Generar con IA"
   - Seleccionar "Google Gemini"
   - Pegar la API key
   - Hacer clic en "Configurar API"

3. **Verificar configuración**:
   - Debe aparecer un mensaje: "🔧 Configurando Google Gemini..."
   - Seguido de: "✅ Google Gemini configurado correctamente..."
   - La interfaz debe cambiar para mostrar el chat de generación

### 2. Probar con OpenAI

1. **Obtener API Key de OpenAI**:
   - Ir a [OpenAI Platform](https://platform.openai.com/api-keys)
   - Crear una nueva API key
   - Copiar la clave (formato: `sk-...`)

2. **Configurar en la aplicación**:
   - Seguir los mismos pasos que con Gemini
   - Seleccionar "OpenAI" en lugar de Gemini

### 3. Probar Persistencia

1. **Configurar una API**:
   - Seguir los pasos anteriores para configurar cualquier proveedor

2. **Verificar persistencia**:
   - Recargar la página (F5)
   - Ir nuevamente a "Generar con IA"
   - Debe aparecer configurado automáticamente
   - Mensaje: "✅ [Proveedor] configurado desde configuración personalizada..."

### 4. Probar Gestión de Configuración

1. **Acceder al modal de configuración**:
   - En el generador de IA, hacer clic en "Configurar" (ícono de engranaje)

2. **Probar funciones**:
   - **Cambiar proveedor**: Seleccionar otro proveedor en el dropdown
   - **Probar conexión**: Hacer clic en "Probar conexión"
   - **Limpiar configuración**: Hacer clic en "Limpiar configuración guardada"
   - **Recargar**: Hacer clic en "Recargar configuración"

## Mensajes de Error Esperados

### Errores de API Key Inválida
- **Gemini**: "API key de Gemini inválida. Verifica tu configuración en Google AI Studio."
- **OpenAI**: "Invalid OpenAI API key. Please check your configuration."

### Errores de Cuota/Límites
- **Gemini**: "Cuota de Gemini excedida. Verifica tu configuración de facturación."
- **OpenAI**: "OpenAI API quota exceeded. Please check your billing settings."

### Errores de Red
- "Error del servidor. Intenta nuevamente en unos minutos."
- "Límite de velocidad excedido. Espera unos minutos antes de intentar nuevamente."

## Verificación de Funcionalidad

### ✅ Configuración Exitosa
- [ ] Mensaje de inicio: "🔧 Configurando [Proveedor]..."
- [ ] Mensaje de éxito: "✅ [Proveedor] configurado correctamente..."
- [ ] Interfaz cambia a modo de chat
- [ ] Campo de API key se limpia automáticamente

### ✅ Persistencia
- [ ] Configuración se mantiene después de recargar
- [ ] Mensaje indica origen: "configuración personalizada" vs "variables de entorno"
- [ ] Botón de limpiar configuración funciona

### ✅ Manejo de Errores
- [ ] Errores se muestran claramente en la interfaz
- [ ] Mensajes específicos según el tipo de error
- [ ] No hay errores silenciosos en consola

### ✅ Cambio de Proveedores
- [ ] Puede cambiar entre OpenAI y Gemini
- [ ] Estado se actualiza correctamente
- [ ] Configuración se mantiene para ambos proveedores

## Casos de Prueba Específicos

### Caso 1: Primera Configuración
1. Aplicación sin configuración previa
2. Configurar Gemini con API key válida
3. Verificar que funciona la generación de proyectos

### Caso 2: Configuración Múltiple
1. Configurar OpenAI
2. Configurar Gemini
3. Cambiar entre proveedores
4. Verificar que ambos funcionan

### Caso 3: Recuperación de Errores
1. Intentar configurar con API key inválida
2. Verificar mensaje de error claro
3. Corregir con API key válida
4. Verificar que funciona correctamente

### Caso 4: Persistencia y Limpieza
1. Configurar un proveedor
2. Recargar la página
3. Verificar que se mantiene la configuración
4. Limpiar configuración
5. Verificar que vuelve a variables de entorno (si existen)

## Notas Técnicas

### Almacenamiento
- Las API keys se guardan en `localStorage` con la clave `ai_api_config`
- Formato JSON con metadatos de fecha de actualización
- Se pueden inspeccionar en DevTools > Application > Local Storage

### Logging
- Errores detallados en consola del navegador
- Información de configuración (sin exponer API keys)
- Estados de conexión y pruebas

### Modelos Actualizados
- **Gemini**: Ahora usa `gemini-1.5-flash` (más rápido y económico)
- **OpenAI**: Sigue usando `gpt-3.5-turbo` y `gpt-4`