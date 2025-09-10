# Navegación Automática del Calendario

## Descripción

Esta funcionalidad permite que el calendario se ubique automáticamente en el mes de la tarea más temprana cuando se cambia de proyecto.

## Cómo Funciona

### 1. Cambio de Proyecto
Cuando el usuario selecciona un proyecto diferente en el calendario:

```javascript
// En Calendar.vue
const handleProjectChange = async (event) => {
  const projectId = event.value
  
  if (projectId === 'all') {
    // Mostrar todos los proyectos sin navegación automática
    await store.dispatch('projects/clearCurrentProject')
    await loadCalendarEvents()
  } else {
    // Cambiar proyecto y navegar automáticamente
    await store.dispatch('projects/setCurrentProject', projectId)
    await store.dispatch('calendar/onProjectChange', projectId)
  }
}
```

### 2. Navegación Automática
El store del calendario maneja la navegación automática:

```javascript
// En calendar.js store module
async onProjectChange({ dispatch }, projectId) {
  if (projectId) {
    // Cargar eventos y navegar a la tarea más temprana
    await dispatch('loadCalendarEventsAndNavigate')
  } else {
    // Solo cargar eventos sin navegación
    await dispatch('loadCalendarEvents')
  }
}
```

### 3. Búsqueda de la Tarea Más Temprana
La acción `navigateToEarliestTask` encuentra la fecha más temprana:

```javascript
async navigateToEarliestTask({ commit, state, rootGetters }) {
  const currentProject = rootGetters['projects/currentProject']
  if (!currentProject) return

  // Obtener tareas del proyecto actual
  const projectTasks = rootGetters['tasks/tasksByProject'](currentProject.id) || []
  
  // Filtrar tareas con fechas válidas
  const tasksWithDates = projectTasks.filter(task => 
    task.startDate && !isNaN(new Date(task.startDate).getTime())
  )

  if (tasksWithDates.length === 0) return

  // Encontrar la fecha más temprana
  const earliestDate = tasksWithDates.reduce((earliest, task) => {
    const taskDate = new Date(task.startDate)
    return taskDate < earliest ? taskDate : earliest
  }, new Date(tasksWithDates[0].startDate))

  // Navegar al mes de la tarea más temprana
  commit('SET_SELECTED_DATE', earliestDate)
}
```

## Casos de Uso

### ✅ Casos que Activan la Navegación Automática
- Cambiar de un proyecto a otro proyecto específico
- Seleccionar un proyecto que tiene tareas con fechas válidas

### ❌ Casos que NO Activan la Navegación Automática
- Cambiar a "Todos los proyectos"
- Seleccionar un proyecto sin tareas
- Seleccionar un proyecto donde las tareas no tienen fechas válidas

## Getter Adicional

Se agregó un getter para obtener la fecha de la tarea más temprana:

```javascript
// Uso del getter
const earliestDate = store.getters['calendar/getEarliestTaskDate']
if (earliestDate) {
  console.log('Fecha más temprana:', earliestDate)
}
```

## Beneficios

1. **Experiencia de Usuario Mejorada**: El usuario no necesita navegar manualmente para encontrar las tareas del proyecto
2. **Contexto Inmediato**: Al cambiar de proyecto, el calendario muestra inmediatamente el período relevante
3. **Eficiencia**: Reduce el tiempo necesario para encontrar las tareas del proyecto seleccionado

## Compatibilidad

Esta funcionalidad es completamente compatible con:
- Navegación manual del calendario
- Filtros existentes
- Vistas de día, semana y mes
- Funcionalidades de arrastrar y soltar tareas