import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

// Mock store factory
export function createMockStore(initialState = {}) {
  return createStore({
    modules: {
      projects: {
        namespaced: true,
        state: {
          projects: [],
          currentProject: null,
          loading: false,
          error: null,
          ...initialState.projects
        },
        mutations: {
          SET_PROJECTS: (state, projects) => { state.projects = projects },
          SET_CURRENT_PROJECT: (state, project) => { state.currentProject = project },
          SET_LOADING: (state, loading) => { state.loading = loading },
          SET_ERROR: (state, error) => { state.error = error }
        },
        actions: {
          loadProjects: ({ commit }) => commit('SET_PROJECTS', []),
          createProject: ({ commit }, project) => commit('SET_PROJECTS', [project]),
          updateProject: ({ commit }, project) => commit('SET_CURRENT_PROJECT', project),
          deleteProject: ({ commit }) => commit('SET_PROJECTS', [])
        },
        getters: {
          allProjects: state => state.projects,
          currentProject: state => state.currentProject,
          isLoading: state => state.loading
        }
      },
      tasks: {
        namespaced: true,
        state: {
          tasks: [],
          currentTask: null,
          taskFilter: {},
          maxNestingLevel: 100,
          ...initialState.tasks
        },
        mutations: {
          SET_TASKS: (state, tasks) => { state.tasks = tasks },
          SET_CURRENT_TASK: (state, task) => { state.currentTask = task },
          SET_MAX_NESTING_LEVEL: (state, level) => { state.maxNestingLevel = level }
        },
        actions: {
          loadTasks: ({ commit }) => commit('SET_TASKS', []),
          createTask: ({ commit }, task) => commit('SET_TASKS', [task]),
          updateTask: ({ commit }, task) => commit('SET_CURRENT_TASK', task),
          deleteTask: ({ commit }) => commit('SET_TASKS', [])
        },
        getters: {
          allTasks: state => state.tasks,
          currentTask: state => state.currentTask,
          maxNestingLevel: state => state.maxNestingLevel,
          tasksByProject: state => projectId => state.tasks.filter(task => task.projectId === projectId)
        }
      }
    }
  })
}

// Mock router factory
export function createMockRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/projects', name: 'Projects', component: { template: '<div>Projects</div>' } },
      { path: '/calendar', name: 'Calendar', component: { template: '<div>Calendar</div>' } },
      { path: '/gantt', name: 'Gantt', component: { template: '<div>Gantt</div>' } }
    ]
  })
}

// Component mounting helper
export function mountComponent(component, options = {}) {
  const store = options.store || createMockStore()
  const router = options.router || createMockRouter()
  
  return mount(component, {
    global: {
      plugins: [
        store,
        router,
        [PrimeVue, { theme: { preset: Aura } }]
      ],
      stubs: {
        'router-link': true,
        'router-view': true
      }
    },
    ...options
  })
}

// Mock data factories
export const mockProject = (overrides = {}) => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'A test project',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  status: 'active',
  teamMembers: [],
  tasks: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
})

export const mockTask = (overrides = {}) => ({
  id: 'task-1',
  projectId: 'project-1',
  parentTaskId: null,
  title: 'Test Task',
  description: 'A test task',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  status: 'pending',
  type: 'simple',
  assignedTo: null,
  priority: 'medium',
  progress: 0,
  subtasks: [],
  level: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
})

export const mockTeamMember = (overrides = {}) => ({
  id: 'member-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Developer',
  avatar: null,
  joinedAt: new Date('2024-01-01'),
  ...overrides
})

// Test data generators
export function generateNestedTasks(levels, tasksPerLevel = 2) {
  const tasks = []
  let taskId = 1
  
  function createTasksAtLevel(parentId, currentLevel, maxLevel) {
    if (currentLevel > maxLevel) return
    
    for (let i = 0; i < tasksPerLevel; i++) {
      const task = mockTask({
        id: `task-${taskId++}`,
        title: `Task Level ${currentLevel} - ${i + 1}`,
        parentTaskId: parentId,
        level: currentLevel
      })
      
      tasks.push(task)
      
      if (currentLevel < maxLevel) {
        createTasksAtLevel(task.id, currentLevel + 1, maxLevel)
      }
    }
  }
  
  createTasksAtLevel(null, 0, levels - 1)
  return tasks
}

// localStorage test helpers
export function mockLocalStorage(data = {}) {
  const storage = { ...data }
  
  window.localStorage.getItem.mockImplementation((key) => {
    return storage[key] || null
  })
  
  window.localStorage.setItem.mockImplementation((key, value) => {
    storage[key] = value
  })
  
  window.localStorage.removeItem.mockImplementation((key) => {
    delete storage[key]
  })
  
  window.localStorage.clear.mockImplementation(() => {
    Object.keys(storage).forEach(key => delete storage[key])
  })
  
  return storage
}