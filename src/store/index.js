import { createStore } from 'vuex'
import projects from './modules/projects.js'
import tasks from './modules/tasks.js'
import calendar from './modules/calendar.js'
import gantt from './modules/gantt.js'
import { createPersistencePlugin } from './plugins/persistencePlugin.js'

const store = createStore({
  modules: {
    projects,
    tasks,
    calendar,
    gantt
  },
  plugins: [createPersistencePlugin()],
  strict: process.env.NODE_ENV !== 'production'
})

export default store