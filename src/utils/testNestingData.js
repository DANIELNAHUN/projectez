// Test data utility for task nesting functionality
import { Project, Task, TeamMember } from '../models/index.js'
import { storageService } from '../services/storageService.js'

export const createNestingTestProject = () => {
  const project = new Project({
    name: 'Proyecto de Prueba - Anidación',
    description: 'Proyecto creado para probar la funcionalidad de anidación de tareas',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    status: 'active'
  })

  // Add team members
  const teamMembers = [
    new TeamMember({
      name: 'Ana Rodríguez',
      email: 'ana@example.com',
      role: 'Team Lead'
    }),
    new TeamMember({
      name: 'Luis Martínez',
      email: 'luis@example.com',
      role: 'Developer'
    }),
    new TeamMember({
      name: 'Sofia Chen',
      email: 'sofia@example.com',
      role: 'Designer'
    })
  ]

  project.teamMembers = teamMembers.map(member => member.toJSON())
  storageService.saveProject(project)
  
  return project
}

export const createNestedTasks = (projectId) => {
  const tasks = []
  
  // Level 1 - Root tasks
  const rootTask1 = new Task({
    projectId,
    title: 'Fase 1: Planificación',
    description: 'Fase inicial de planificación del proyecto',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    type: 'simple',
    priority: 'high',
    progress: 30,
    level: 0
  })
  tasks.push(rootTask1)
  
  const rootTask2 = new Task({
    projectId,
    title: 'Fase 2: Desarrollo',
    description: 'Fase de desarrollo e implementación',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    status: 'pending',
    type: 'simple',
    priority: 'high',
    progress: 0,
    level: 0
  })
  tasks.push(rootTask2)
  
  // Level 2 - Subtasks of Fase 1
  const subtask1_1 = new Task({
    projectId,
    parentTaskId: rootTask1.id,
    title: 'Análisis de Requisitos',
    description: 'Análisis detallado de los requisitos del proyecto',
    startDate: new Date(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'completed',
    type: 'with_deliverable',
    priority: 'high',
    progress: 100,
    level: 1,
    deliverable: {
      type: 'file',
      description: 'Documento de requisitos',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'completed'
    }
  })
  tasks.push(subtask1_1)
  
  const subtask1_2 = new Task({
    projectId,
    parentTaskId: rootTask1.id,
    title: 'Diseño de Arquitectura',
    description: 'Diseño de la arquitectura del sistema',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    type: 'simple',
    priority: 'high',
    progress: 60,
    level: 1
  })
  tasks.push(subtask1_2)
  
  // Level 3 - Sub-subtasks of Análisis de Requisitos
  const subtask1_1_1 = new Task({
    projectId,
    parentTaskId: subtask1_1.id,
    title: 'Entrevistas con Stakeholders',
    description: 'Realizar entrevistas con los stakeholders principales',
    startDate: new Date(),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'completed',
    type: 'simple',
    priority: 'medium',
    progress: 100,
    level: 2
  })
  tasks.push(subtask1_1_1)
  
  const subtask1_1_2 = new Task({
    projectId,
    parentTaskId: subtask1_1.id,
    title: 'Documentación de Casos de Uso',
    description: 'Documentar todos los casos de uso identificados',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'completed',
    type: 'with_deliverable',
    priority: 'medium',
    progress: 100,
    level: 2,
    deliverable: {
      type: 'file',
      description: 'Documento de casos de uso',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'completed'
    }
  })
  tasks.push(subtask1_1_2)
  
  // Level 4 - Deep nesting example
  const subtask1_1_1_1 = new Task({
    projectId,
    parentTaskId: subtask1_1_1.id,
    title: 'Preparar Preguntas de Entrevista',
    description: 'Preparar el cuestionario para las entrevistas',
    startDate: new Date(),
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: 'completed',
    type: 'simple',
    priority: 'low',
    progress: 100,
    level: 3
  })
  tasks.push(subtask1_1_1_1)
  
  const subtask1_1_1_2 = new Task({
    projectId,
    parentTaskId: subtask1_1_1.id,
    title: 'Agendar Reuniones',
    description: 'Coordinar horarios con los stakeholders',
    startDate: new Date(),
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: 'completed',
    type: 'simple',
    priority: 'low',
    progress: 100,
    level: 3
  })
  tasks.push(subtask1_1_1_2)
  
  // Level 3 - Sub-subtasks of Diseño de Arquitectura
  const subtask1_2_1 = new Task({
    projectId,
    parentTaskId: subtask1_2.id,
    title: 'Diagrama de Componentes',
    description: 'Crear diagrama de componentes del sistema',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    type: 'with_deliverable',
    priority: 'medium',
    progress: 40,
    level: 2,
    deliverable: {
      type: 'presentation',
      description: 'Diagrama de arquitectura',
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      status: 'in_review'
    }
  })
  tasks.push(subtask1_2_1)
  
  // Level 2 - Subtasks of Fase 2
  const subtask2_1 = new Task({
    projectId,
    parentTaskId: rootTask2.id,
    title: 'Configuración del Entorno',
    description: 'Configurar el entorno de desarrollo',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: 'pending',
    type: 'simple',
    priority: 'high',
    progress: 0,
    level: 1
  })
  tasks.push(subtask2_1)
  
  const subtask2_2 = new Task({
    projectId,
    parentTaskId: rootTask2.id,
    title: 'Implementación de Módulos',
    description: 'Implementar los módulos principales del sistema',
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    status: 'pending',
    type: 'simple',
    priority: 'high',
    progress: 0,
    level: 1
  })
  tasks.push(subtask2_2)

  // Save all tasks
  tasks.forEach(task => {
    storageService.saveTask(task, projectId)
  })

  return tasks
}

export const initializeNestingTestData = () => {
  try {
    // Check if nesting test project already exists
    const projects = storageService.getAllProjects()
    let testProject = projects.find(p => p.name === 'Proyecto de Prueba - Anidación')
    
    if (!testProject) {
      testProject = createNestingTestProject()
      createNestedTasks(testProject.id)
      console.log('Nesting test project and tasks created successfully')
    } else {
      console.log('Nesting test project already exists')
    }
    
    return testProject
  } catch (error) {
    console.error('Error initializing nesting test data:', error)
    throw error
  }
}

// Test function to validate nesting levels
export const validateNestingLevels = (projectId) => {
  const tasks = storageService.getTasksForProject(projectId)
  const issues = []
  
  tasks.forEach(task => {
    // Check if parent exists and level is correct
    if (task.parentTaskId) {
      const parent = tasks.find(t => t.id === task.parentTaskId)
      if (!parent) {
        issues.push(`Task "${task.title}" has invalid parent ID: ${task.parentTaskId}`)
      } else if (task.level !== parent.level + 1) {
        issues.push(`Task "${task.title}" has incorrect level. Expected: ${parent.level + 1}, Actual: ${task.level}`)
      }
    } else if (task.level !== 0) {
      issues.push(`Root task "${task.title}" should have level 0, but has level ${task.level}`)
    }
  })
  
  return {
    isValid: issues.length === 0,
    issues,
    taskCount: tasks.length,
    maxLevel: Math.max(...tasks.map(t => t.level))
  }
}