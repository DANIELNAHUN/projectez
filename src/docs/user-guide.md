# ProjectEZ - Guía de Usuario

## Introducción

ProjectEZ es una aplicación de gestión de proyectos con capacidades de inteligencia artificial que te permite crear, gestionar y organizar proyectos de manera eficiente.

## Características Principales

### 1. Generación de Proyectos con IA

El Chatbot IA te permite generar proyectos completos desde una simple descripción de texto.

**Cómo usar:**
1. Haz clic en el botón "Generar con IA" en la página de Proyectos
2. Describe tu proyecto en el chat (ej: "Crear una aplicación web de e-commerce")
3. Revisa el proyecto generado
4. Confirma para importarlo a tu lista de proyectos

**Consejos:**
- Sé específico en tu descripción para obtener mejores resultados
- Incluye detalles sobre tecnologías, plazos o características especiales
- Puedes iterar con el chatbot para refinar el proyecto

### 2. Gestión Inteligente de Fechas

El sistema calcula automáticamente las duraciones y fechas de las tareas.

**Características:**
- Cálculo automático de duración en días laborales (lunes a sábado)
- Exclusión automática de domingos
- Ajuste automático de fechas cuando cambias la duración
- Opción para ajustar fecha de inicio o fin al modificar duración

**Cómo usar:**
1. Al crear una tarea, selecciona fecha de inicio y fin
2. El sistema calculará automáticamente la duración
3. Alternativamente, ingresa la duración y el sistema calculará la fecha de fin
4. Usa el toggle "Ajustar fecha de inicio" para cambiar el comportamiento

### 3. Ajuste de Fechas de Proyecto

Cambia la fecha de inicio de un proyecto y todas las tareas se ajustarán automáticamente.

**Cómo usar:**
1. Ve al detalle del proyecto
2. Haz clic en "Ajustar Fechas del Proyecto"
3. Selecciona la nueva fecha de inicio
4. Confirma los cambios
5. Todas las tareas mantendrán su duración pero se moverán proporcionalmente

### 4. Importar y Exportar Proyectos

Respalda tus proyectos o compártelos en formato JSON.

**Exportar:**
1. Ve a la página de Proyectos
2. Haz clic en el botón de exportar en la barra superior
3. Selecciona el proyecto a exportar
4. El archivo JSON se descargará automáticamente

**Importar:**
1. Haz clic en el botón de importar en la barra superior
2. Selecciona un archivo JSON válido
3. Opcionalmente, establece una nueva fecha de inicio
4. Confirma la importación

## Atajos de Teclado

### Navegación
- `Ctrl+1`: Ir a Dashboard
- `Ctrl+2`: Ir a Proyectos
- `Ctrl+3`: Ir a Calendario
- `Ctrl+4`: Ir a Diagrama de Gantt
- `Ctrl+5`: Ir a Gestión de Usuarios

### Acciones
- `Ctrl+Shift+A`: Abrir Chatbot IA
- `Ctrl+Shift+N`: Crear Nuevo Proyecto
- `Ctrl+Shift+I`: Importar Proyecto
- `Ctrl+Shift+E`: Exportar Proyecto
- `Ctrl+Shift+H`: Mostrar Ayuda

## Consejos y Mejores Prácticas

### Para Proyectos con IA
1. **Sé específico**: Incluye detalles sobre el tipo de proyecto, tecnologías, y objetivos
2. **Itera**: Puedes refinar el proyecto generado pidiendo modificaciones
3. **Revisa siempre**: Verifica que el proyecto generado cumple tus expectativas antes de importar

### Para Gestión de Fechas
1. **Planifica con días laborales**: El sistema excluye domingos automáticamente
2. **Usa ajuste de proyecto**: Para reprogramar todo el proyecto de una vez
3. **Exporta regularmente**: Mantén respaldos de tus proyectos importantes

### Para Organización
1. **Usa nombres descriptivos**: Para proyectos y tareas
2. **Establece prioridades**: Marca las tareas más importantes
3. **Revisa regularmente**: Mantén tus proyectos actualizados

## Solución de Problemas

### El Chatbot IA no responde
- Verifica tu conexión a internet
- Asegúrate de que la API key de OpenAI esté configurada
- Intenta con una descripción más simple

### Las fechas no se calculan correctamente
- Verifica que las fechas de inicio y fin sean válidas
- Asegúrate de que la fecha de fin sea posterior a la de inicio
- Recuerda que los domingos se excluyen del cálculo

### Error al importar proyecto
- Verifica que el archivo JSON tenga el formato correcto
- Asegúrate de que el archivo no esté corrupto
- Intenta con un archivo exportado previamente de la aplicación

## Soporte

Si necesitas ayuda adicional:
1. Usa `Ctrl+Shift+H` para abrir la ayuda integrada
2. Revisa los atajos de teclado disponibles
3. Consulta esta documentación para referencia detallada

## Actualizaciones

Esta guía se actualiza regularmente con nuevas características. Mantente al día con las últimas funcionalidades revisando periódicamente la ayuda integrada.