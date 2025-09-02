// Test data utility for task functionality
import { Project, Task, TeamMember, Deliverable } from '../models/index.js'
import { storageService } from '../services/storageService.js'

export const createTestProject = () => {
  const project = new Project({
    name: 'Proyecto de Prueba - Tareas',
    description: 'Proyecto creado para probar la funcionalidad de gestión de tareas',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'active'
  })

  // Add some team members
  const teamMembers = [
    new TeamMember({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      role: 'Desarrollador'
    }),
    new TeamMember({
      name: 'María García',
      email: 'maria@example.com',
      role: 'Diseñadora'
    }),
    new TeamMember({
      name: 'Carlos López',
      email: 'carlos@example.com',
      role: 'Project Manager'
    })
  ]

  project.teamMembers = teamMembers.map(member => member.toJSON())

  // Save project
  storageService.saveProject(project)
  
  return project
}

export const createTestTasks = (projectId) => {
  // Create root level tasks first
  const rootTasks = [
    new Task({
      projectId,
      title: 'Configurar entorno de desarrollo',
      description: 'Instalar y configurar todas las herramientas necesarias para el desarrollo',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      status: 'completed',
      type: 'simple',
      priority: 'high',
      progress: 100,
      level: 0
    }),
    new Task({
      projectId,
      title: 'Diseñar interfaz de usuario',
      description: 'Crear mockups y prototipos de la interfaz de usuario',
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'in_progress',
      type: 'with_deliverable',
      priority: 'medium',
      progress: 60,
      level: 0,
      deliverable: new Deliverable({
        type: 'presentation',
        description: 'Presentación con mockups y flujo de usuario',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: 'in_review'
      })
    }),
    new Task({
      projectId,
      title: 'Implementar autenticación',
      description: 'Desarrollar sistema de login y registro de usuarios',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days
      status: 'pending',
      type: 'simple',
      priority: 'high',
      progress: 0,
      level: 0
    }),
    new Task({
      projectId,
      title: 'Crear documentación técnica',
      description: 'Documentar APIs y arquitectura del sistema',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
      status: 'pending',
      type: 'with_deliverable',
      priority: 'low',
      progress: 0,
      level: 0,
      deliverable: new Deliverable({
        type: 'file',
        description: 'Documento técnico en formato PDF',
        dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        status: 'pending',
        notes: 'Incluir diagramas de arquitectura'
      })
    })
  ]

  // Save root tasks first
  rootTasks.forEach(task => {
    storageService.saveTask(task, projectId)
  })

  // Create nested tasks to test hierarchy
  const nestedTasks = [
    // Level 1 subtasks for "Diseñar interfaz de usuario"
    new Task({
      projectId,
      parentTaskId: rootTasks[1].id,
      title: 'Investigar patrones de diseño',
      description: 'Analizar patrones de UI/UX modernos',
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'completed',
      type: 'simple',
      priority: 'medium',
      progress: 100,
      level: 1
    }),
    new Task({
      projectId,
      parentTaskId: rootTasks[1].id,
      title: 'Crear wireframes',
      description: 'Diseñar wireframes de las pantallas principales',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      type: 'simple',
      priority: 'high',
      progress: 75,
      level: 1
    }),
    new Task({
      projectId,
      parentTaskId: rootTasks[1].id,
      title: 'Desarrollar prototipos interactivos',
      description: 'Crear prototipos clickeables en Figma',
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'with_deliverable',
      priority: 'medium',
      progress: 0,
      level: 1,
      deliverable: new Deliverable({
        type: 'file',
        description: 'Archivo Figma con prototipos',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: 'pending'
      })
    }),

    // Level 1 subtasks for "Implementar autenticación"
    new Task({
      projectId,
      parentTaskId: rootTasks[2].id,
      title: 'Configurar base de datos de usuarios',
      description: 'Crear tablas y esquemas para autenticación',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'simple',
      priority: 'high',
      progress: 0,
      level: 1
    }),
    new Task({
      projectId,
      parentTaskId: rootTasks[2].id,
      title: 'Implementar sistema de login',
      description: 'Desarrollar funcionalidad de inicio de sesión',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'simple',
      priority: 'high',
      progress: 0,
      level: 1
    }),
    new Task({
      projectId,
      parentTaskId: rootTasks[2].id,
      title: 'Implementar registro de usuarios',
      description: 'Desarrollar funcionalidad de registro',
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'simple',
      priority: 'high',
      progress: 0,
      level: 1
    })
  ]

  // Save level 1 tasks
  nestedTasks.forEach(task => {
    storageService.saveTask(task, projectId)
  })

  // Create level 2 subtasks to test deeper nesting
  const level2Tasks = [
    // Level 2 subtasks for "Crear wireframes"
    new Task({
      projectId,
      parentTaskId: nestedTasks[1].id, // "Crear wireframes"
      title: 'Wireframe de página de inicio',
      description: 'Diseñar wireframe de la landing page',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'completed',
      type: 'simple',
      priority: 'medium',
      progress: 100,
      level: 2
    }),
    new Task({
      projectId,
      parentTaskId: nestedTasks[1].id, // "Crear wireframes"
      title: 'Wireframe de dashboard',
      description: 'Diseñar wireframe del panel principal',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      type: 'simple',
      priority: 'high',
      progress: 50,
      level: 2
    }),
    new Task({
      projectId,
      parentTaskId: nestedTasks[1].id, // "Crear wireframes"
      title: 'Wireframe de formularios',
      description: 'Diseñar wireframes de formularios de entrada',
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'simple',
      priority: 'medium',
      progress: 0,
      level: 2
    }),

    // Level 2 subtasks for "Implementar sistema de login"
    new Task({
      projectId,
      parentTaskId: nestedTasks[4].id, // "Implementar sistema de login"
      title: 'Validación de credenciales',
      description: 'Implementar lógica de validación de usuario/contraseña',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'simple',
      priority: 'high',
      progress: 0,
      level: 2
    }),
    new Task({
      projectId,
      parentTaskId: nestedTasks[4].id, // "Implementar sistema de login"
      title: 'Manejo de sesiones',
      description: 'Implementar gestión de sesiones de usuario',
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'simple',
      priority: 'high',
      progress: 0,
      level: 2
    })
  ]

  // Save level 2 tasks
  level2Tasks.forEach(task => {
    storageService.saveTask(task, projectId)
  })

  // Create level 3 subtasks to test even deeper nesting
  const level3Tasks = [
    // Level 3 subtasks for "Wireframe de dashboard"
    new Task({
      projectId,
      parentTaskId: level2Tasks[1].id, // "Wireframe de dashboard"
      title: 'Sección de estadísticas',
      description: 'Diseñar área de métricas y gráficos',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      type: 'simple',
      priority: 'medium',
      progress: 30,
      level: 3
    }),
    new Task({
      projectId,
      parentTaskId: level2Tasks[1].id, // "Wireframe de dashboard"
      title: 'Menú de navegación',
      description: 'Diseñar estructura del menú principal',
      startDate: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'pending',
      type: 'simple',
      priority: 'medium',
      progress: 0,
      level: 3
    })
  ]

  // Save level 3 tasks
  level3Tasks.forEach(task => {
    storageService.saveTask(task, projectId)
  })

  return [...rootTasks, ...nestedTasks, ...level2Tasks, ...level3Tasks]
}

export const initializeTestData = () => {
  try {
    // Check if test project already exists
    const projects = storageService.getAllProjects()
    let testProject = projects.find(p => p.name === 'Proyecto de Prueba - Tareas')
    
    if (!testProject) {
      testProject = createTestProject()
      createTestTasks(testProject.id)
      console.log('Test project and tasks created successfully')
    } 
    // else {
    //   console.log('Test project already exists')
    // }
    
    return testProject
  } catch (error) {
    console.error('Error initializing test data:', error)
    throw error
  }
}