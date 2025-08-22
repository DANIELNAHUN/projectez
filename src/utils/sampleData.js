import { Project, Task, TeamMember } from '../models/index.js'
import { storageService } from '../services/storageService.js'

export function initializeSampleData() {
  // Check if we already have projects
  const existingProjects = storageService.getAllProjects()
  if (existingProjects.length > 0) {
    console.log('Sample data already exists, skipping initialization')
    return
  }

  console.log('Initializing sample data...')

  // Create sample team members
  const teamMembers = [
    new TeamMember({
      name: 'Ana García',
      email: 'ana.garcia@example.com',
      role: 'Project Manager',
      avatar: null
    }),
    new TeamMember({
      name: 'Carlos López',
      email: 'carlos.lopez@example.com',
      role: 'Developer',
      avatar: null
    }),
    new TeamMember({
      name: 'María Rodríguez',
      email: 'maria.rodriguez@example.com',
      role: 'Designer',
      avatar: null
    })
  ]

  // Create sample project 1
  const project1 = new Project({
    name: 'Desarrollo de Aplicación Web',
    description: 'Proyecto para desarrollar una aplicación web moderna con Vue.js',
    status: 'active',
    priority: 'high',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-04-15'),
    teamMembers: teamMembers
  })

  // Create sample tasks for project 1
  const tasks1 = [
    new Task({
      title: 'Planificación del Proyecto',
      description: 'Definir alcance, objetivos y cronograma del proyecto',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-25'),
      status: 'completed',
      priority: 'high',
      type: 'simple',
      progress: 100,
      assignedTo: teamMembers[0].id,
      level: 0
    }),
    new Task({
      title: 'Diseño de la Interfaz',
      description: 'Crear mockups y prototipos de la interfaz de usuario',
      startDate: new Date('2024-01-26'),
      endDate: new Date('2024-02-15'),
      status: 'completed',
      priority: 'high',
      type: 'with_deliverable',
      progress: 100,
      assignedTo: teamMembers[2].id,
      level: 0
    }),
    new Task({
      title: 'Desarrollo del Frontend',
      description: 'Implementación de la interfaz de usuario',
      startDate: new Date('2024-02-16'),
      endDate: new Date('2024-03-15'),
      status: 'in_progress',
      priority: 'high',
      type: 'simple',
      progress: 65,
      assignedTo: teamMembers[1].id,
      level: 0
    }),
    new Task({
      title: 'Configuración del Proyecto Vue',
      description: 'Configurar el entorno de desarrollo y estructura inicial',
      startDate: new Date('2024-02-16'),
      endDate: new Date('2024-02-20'),
      status: 'completed',
      priority: 'medium',
      type: 'simple',
      progress: 100,
      assignedTo: teamMembers[1].id,
      level: 1,
      parentTaskId: null // Will be set after parent task is created
    }),
    new Task({
      title: 'Implementación de Componentes',
      description: 'Crear componentes reutilizables de la interfaz',
      startDate: new Date('2024-02-21'),
      endDate: new Date('2024-03-10'),
      status: 'in_progress',
      priority: 'high',
      type: 'simple',
      progress: 70,
      assignedTo: teamMembers[1].id,
      level: 1,
      parentTaskId: null // Will be set after parent task is created
    }),
    new Task({
      title: 'Integración con API',
      description: 'Conectar el frontend con los servicios backend',
      startDate: new Date('2024-03-11'),
      endDate: new Date('2024-03-15'),
      status: 'pending',
      priority: 'medium',
      type: 'simple',
      progress: 0,
      assignedTo: teamMembers[1].id,
      level: 1,
      parentTaskId: null // Will be set after parent task is created
    }),
    new Task({
      title: 'Desarrollo del Backend',
      description: 'Implementación de la lógica del servidor y APIs',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-30'),
      status: 'in_progress',
      priority: 'high',
      type: 'simple',
      progress: 40,
      assignedTo: teamMembers[1].id,
      level: 0
    }),
    new Task({
      title: 'Pruebas y QA',
      description: 'Realizar pruebas exhaustivas de la aplicación',
      startDate: new Date('2024-03-31'),
      endDate: new Date('2024-04-10'),
      status: 'pending',
      priority: 'high',
      type: 'simple',
      progress: 0,
      assignedTo: teamMembers[0].id,
      level: 0
    }),
    new Task({
      title: 'Despliegue',
      description: 'Configurar y desplegar la aplicación en producción',
      startDate: new Date('2024-04-11'),
      endDate: new Date('2024-04-15'),
      status: 'pending',
      priority: 'high',
      type: 'with_deliverable',
      progress: 0,
      assignedTo: teamMembers[1].id,
      level: 0
    })
  ]

  // Set parent task IDs for subtasks
  const frontendTaskId = tasks1[2].id
  tasks1[3].parentTaskId = frontendTaskId
  tasks1[4].parentTaskId = frontendTaskId
  tasks1[5].parentTaskId = frontendTaskId

  // Save project 1 with tasks
  project1.tasks = tasks1.map(task => task.toJSON())
  storageService.saveProject(project1)

  // Create sample project 2
  const project2 = new Project({
    name: 'Rediseño de Sitio Web',
    description: 'Modernizar el sitio web corporativo con nuevo diseño y funcionalidades',
    status: 'active',
    priority: 'medium',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-01'),
    teamMembers: [teamMembers[0], teamMembers[2]]
  })

  // Create sample tasks for project 2
  const tasks2 = [
    new Task({
      title: 'Análisis del Sitio Actual',
      description: 'Evaluar el sitio web existente y identificar áreas de mejora',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-10'),
      status: 'completed',
      priority: 'medium',
      type: 'simple',
      progress: 100,
      assignedTo: teamMembers[0].id,
      level: 0
    }),
    new Task({
      title: 'Nuevo Diseño Visual',
      description: 'Crear el nuevo diseño visual y sistema de colores',
      startDate: new Date('2024-02-11'),
      endDate: new Date('2024-03-15'),
      status: 'in_progress',
      priority: 'high',
      type: 'with_deliverable',
      progress: 80,
      assignedTo: teamMembers[2].id,
      level: 0
    }),
    new Task({
      title: 'Desarrollo de Templates',
      description: 'Implementar los nuevos templates y componentes',
      startDate: new Date('2024-03-16'),
      endDate: new Date('2024-04-20'),
      status: 'pending',
      priority: 'medium',
      type: 'simple',
      progress: 0,
      assignedTo: teamMembers[1].id,
      level: 0
    }),
    new Task({
      title: 'Migración de Contenido',
      description: 'Migrar el contenido existente al nuevo diseño',
      startDate: new Date('2024-04-21'),
      endDate: new Date('2024-04-30'),
      status: 'pending',
      priority: 'medium',
      type: 'simple',
      progress: 0,
      assignedTo: teamMembers[0].id,
      level: 0
    })
  ]

  // Save project 2 with tasks
  project2.tasks = tasks2.map(task => task.toJSON())
  storageService.saveProject(project2)

  console.log('Sample data initialized successfully!')
  console.log(`Created ${2} projects with tasks`)
}