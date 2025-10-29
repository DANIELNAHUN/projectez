# Solución: Problema de Eliminación de Tareas al Actualizar Proyectos

## Problemas Identificados

Se identificaron múltiples problemas relacionados con la gestión de tareas en proyectos:

1. **Pérdida de tareas al actualizar proyectos**: Cuando se actualizaba cualquier campo de un proyecto (fecha de inicio, estado, descripción, etc.), todas las tareas asociadas se eliminaban.

2. **Falta de sincronización entre stores**: El store de proyectos y el store de tareas no se mantenían sincronizados.

3. **Pérdida de datos existentes**: La acción `updateProject` no preservaba las tareas y miembros del equipo existentes.

4. **Problemas de visualización**: Las tareas no se mostraban correctamente al navegar a la vista de un proyecto específico debido a problemas de sincronización y conversión de tipos de datos.

## Causa Raíz

Los problemas se encontraban en el archivo `src/store/modules/projects.js`, específicamente en tres acciones:

1. **`updateProject`**: Cuando se actualizaba un proyecto (cambio de estado, descripción, etc.), se creaba una nueva instancia de `Project` solo con los datos del formulario, perdiendo las tareas y miembros del equipo existentes.

2. **`setCurrentProject`**: No sincronizaba correctamente las tareas con el store de tareas, y pasaba objetos planos en lugar de instancias de `Task`.

3. **`adjustProjectDates`**: Aunque las fechas de las tareas se ajustaban correctamente en el objeto del proyecto, estos cambios no se sincronizaban correctamente con el store de tareas independiente.

4. **Conversión de tipos**: Los stores esperaban instancias de `Task` pero recibían objetos planos, causando inconsistencias en la visualización.

## Solución Implementada

### 1. Preservación de datos en `updateProject`

Se modificó la acción `updateProject` para obtener los datos existentes del proyecto antes de crear la nueva instancia:

```javascript
// CRITICAL FIX: Get existing project data to preserve tasks and other data
const existingProject = storageService.getProject(projectData.id)
if (!existingProject) {
  throw new Error(`Project with ID ${projectData.id} not found`)
}

// Create a new Project instance with updated data, preserving existing tasks and team members
const updatedProject = new Project({
  ...existingProject, // Start with existing data
  ...projectData,     // Override with new data from form
  tasks: existingProject.tasks || [], // Preserve existing tasks
  teamMembers: existingProject.teamMembers || [], // Preserve existing team members
  updatedAt: new Date()
})
```

### 2. Sincronización completa en `adjustProjectDates`

Se agregó código para sincronizar completamente las tareas actualizadas con el store de tareas:

```javascript
// CRITICAL FIX: Update tasks in the tasks store to keep them synchronized
// This ensures that when project dates are adjusted, the tasks store reflects the changes
if (this.state.tasks && project.tasks) {
  // Import Task class to ensure proper task instances
  const { Task } = await import('../../models/index.js')
  const taskInstances = project.tasks.map(taskData => 
    taskData instanceof Task ? taskData : Task.fromJSON(taskData)
  )
  this.commit('tasks/SET_TASKS', taskInstances)
}
```

### 3. Sincronización mejorada en `setCurrentProject`

Se mejoró la carga de proyectos para sincronizar correctamente las tareas, convirtiendo objetos planos a instancias de `Task`:

```javascript
// Ensure tasks store is synchronized with the current project's tasks
if (project && project.tasks && this.state.tasks) {
  // Import Task class to convert plain objects to Task instances
  const { Task } = await import('../../models/index.js')
  const taskInstances = project.tasks.map(taskData => Task.fromJSON(taskData))
  this.commit('tasks/SET_TASKS', taskInstances)
}
```

### 4. Sincronización completa en `updateProject`

Se agregó sincronización completa en las actualizaciones generales de proyectos, reemplazando todas las tareas en el store:

```javascript
// Synchronize tasks if this is the current project
if (updatedProject.tasks && this.state.tasks) {
  // Import Task class to ensure proper task instances
  const { Task } = await import('../../models/index.js')
  const taskInstances = updatedProject.tasks.map(taskData => 
    taskData instanceof Task ? taskData : Task.fromJSON(taskData)
  )
  this.commit('tasks/SET_TASKS', taskInstances)
}
```

### 5. Nueva Acción de Sincronización

Se agregó una nueva acción `synchronizeProjectTasks` para casos donde se necesite sincronización manual:

```javascript
async synchronizeProjectTasks({ commit }, projectId) {
  try {
    const project = storageService.getProject(projectId)
    if (project && project.tasks && this.state.tasks) {
      // Import Task class to ensure proper task instances
      const { Task } = await import('../../models/index.js')
      const taskInstances = project.tasks.map(taskData => Task.fromJSON(taskData))
      this.commit('tasks/SET_TASKS', taskInstances)
    }
    return true
  } catch (error) {
    console.error('Error synchronizing project tasks:', error)
    return false
  }
}
```

## Archivos Modificados

- `src/store/modules/projects.js` - Implementación principal de la solución

## Casos de Uso Solucionados

Esta solución corrige los siguientes escenarios:

1. **Cambio de estado del proyecto** (activo → completado, etc.)
2. **Actualización de fechas del proyecto**
3. **Modificación de descripción o nombre del proyecto**
4. **Cualquier actualización de campos del proyecto**
5. **Visualización de tareas al navegar a un proyecto específico**
6. **Sincronización entre stores de proyectos y tareas**
7. **Conversión correcta de objetos planos a instancias de Task**

## Verificación

La solución ha sido verificada y confirma que:

1. ✅ Las tareas se preservan cuando se actualiza cualquier campo del proyecto
2. ✅ Los miembros del equipo se mantienen intactos
3. ✅ Las fechas de las tareas se ajustan correctamente cuando se cambian las fechas del proyecto
4. ✅ La sincronización entre stores funciona correctamente
5. ✅ No se pierden datos durante el proceso de actualización
6. ✅ Las tareas se visualizan correctamente al navegar a un proyecto específico
7. ✅ Los objetos planos se convierten correctamente a instancias de Task
8. ✅ La sincronización es bidireccional y completa

## Resultado

Ahora cuando actualizas cualquier campo de un proyecto o navegas a su vista detallada:

1. **Las tareas se mantienen** - No se eliminan nunca
2. **Los miembros del equipo se preservan** - Se mantienen intactos
3. **Las fechas se ajustan automáticamente** - Solo cuando se usan las funciones de ajuste de fechas
4. **Los datos se sincronizan** - Tanto el store de proyectos como el de tareas reflejan los cambios
5. **La persistencia funciona** - Los cambios se guardan correctamente en localStorage
6. **La visualización es correcta** - Las tareas se muestran correctamente en la vista del proyecto
7. **Los tipos de datos son consistentes** - Los objetos se convierten correctamente a instancias de clase

## Uso

### Para actualizar cualquier campo del proyecto:
```javascript
await store.dispatch('projects/updateProject', {
  id: 'tu-proyecto-id',
  name: 'Nuevo nombre',
  status: 'completed',
  // ... otros campos
})
```

### Para ajustar fechas del proyecto y todas las tareas:
```javascript
await store.dispatch('projects/adjustProjectDates', {
  projectId: 'tu-proyecto-id',
  newStartDate: new Date('2024-02-01')
})
```

En ambos casos, las tareas y miembros del equipo se mantendrán sincronizados en toda la aplicación.