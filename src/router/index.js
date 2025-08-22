import { createRouter, createWebHistory } from 'vue-router'

// Import views (will be created)
import Dashboard from '../views/Dashboard.vue'
import Projects from '../views/Projects.vue'
import Calendar from '../views/Calendar.vue'
import Gantt from '../views/Gantt.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: Projects,
    meta: { title: 'Proyectos' }
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: () => import('../views/ProjectDetail.vue'),
    meta: { title: 'Detalle del Proyecto' }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { title: 'Calendario' }
  },
  {
    path: '/gantt',
    name: 'Gantt',
    component: Gantt,
    meta: { title: 'Diagrama de Gantt' }
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: () => import('../views/UserManagement.vue'),
    meta: { title: 'Gestión de Usuarios' }
  },
  {
    path: '/task-test',
    name: 'TaskTest',
    component: () => import('../views/TaskTest.vue'),
    meta: { title: 'Test de Tareas' }
  },
  {
    path: '/color-demo',
    name: 'ColorDemo',
    component: () => import('../components/ColorPaletteDemo.vue'),
    meta: { title: 'Demostración de Colores' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to update page title
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - ProjectEZ` : 'ProjectEZ'
  next()
})

export default router