<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Store Test Component</h2>

    <!-- Projects Test -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Projects Module</h3>
      <p>Projects count: {{ projectsCount }}</p>
      <p>Loading: {{ isProjectsLoading }}</p>
      <p>Error: {{ projectsError || 'None' }}</p>
      <button @click="loadProjects" class="bg-blue-500 text-white px-4 py-2 rounded mt-2">
        Load Projects
      </button>
    </div>

    <!-- Tasks Test -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Tasks Module</h3>
      <p>Tasks count: {{ tasksCount }}</p>
      <p>Max nesting level: {{ maxNestingLevel }}</p>
      <p>Loading: {{ isTasksLoading }}</p>
      <p>Error: {{ tasksError || 'None' }}</p>
      <button @click="loadTasks" class="bg-green-500 text-white px-4 py-2 rounded mt-2">
        Load Tasks
      </button>
    </div>

    <!-- Calendar Test -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Calendar Module</h3>
      <p>Current view: {{ currentView }}</p>
      <p>Selected date: {{ formattedSelectedDate }}</p>
      <p>Events count: {{ eventsCount }}</p>
      <div class="mt-2">
        <button @click="setCalendarView('day')" class="bg-purple-500 text-white px-3 py-1 rounded mr-2">
          Day
        </button>
        <button @click="setCalendarView('week')" class="bg-purple-500 text-white px-3 py-1 rounded mr-2">
          Week
        </button>
        <button @click="setCalendarView('month')" class="bg-purple-500 text-white px-3 py-1 rounded">
          Month
        </button>
      </div>
    </div>

    <!-- Gantt Test -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Gantt Module</h3>
      <p>Zoom level: {{ zoomLevel }}</p>
      <p>Project duration: {{ formattedProjectDuration }}</p>
      <p>Gantt tasks count: {{ ganttTasksCount }}</p>
      <div class="mt-2">
        <button @click="setZoomLevel('days')" class="bg-orange-500 text-white px-3 py-1 rounded mr-2">
          Days
        </button>
        <button @click="setZoomLevel('weeks')" class="bg-orange-500 text-white px-3 py-1 rounded mr-2">
          Weeks
        </button>
        <button @click="setZoomLevel('months')" class="bg-orange-500 text-white px-3 py-1 rounded">
          Months
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'StoreTest',
  computed: {
    ...mapState('projects', {
      isProjectsLoading: 'loading',
      projectsError: 'error'
    }),
    ...mapState('tasks', {
      isTasksLoading: 'loading',
      tasksError: 'error',
      maxNestingLevel: 'maxNestingLevel'
    }),
    ...mapState('calendar', {
      currentView: 'currentView'
    }),
    ...mapState('gantt', {
      zoomLevel: 'zoomLevel'
    }),
    ...mapGetters('projects', {
      projectsCount: 'projectsCount'
    }),
    ...mapGetters('tasks', {
      tasksCount: 'tasksCount'
    }),
    ...mapGetters('calendar', {
      formattedSelectedDate: 'formattedSelectedDate'
    }),
    ...mapGetters('gantt', {
      formattedProjectDuration: 'formattedProjectDuration'
    }),
    eventsCount() {
      return this.$store.state.calendar.events.length
    },
    ganttTasksCount() {
      return this.$store.state.gantt.ganttTasks.length
    }
  },
  methods: {
    ...mapActions('projects', {
      loadProjectsAction: 'loadProjects'
    }),
    ...mapActions('tasks', {
      loadTasksAction: 'loadTasks'
    }),
    ...mapActions('calendar', {
      setCurrentView: 'setCurrentView'
    }),
    ...mapActions('gantt', {
      setGanttZoomLevel: 'setZoomLevel'
    }),
    async loadProjects() {
      try {
        await this.loadProjectsAction()
        console.log('Projects loaded successfully')
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    },
    async loadTasks() {
      try {
        await this.loadTasksAction()
        console.log('Tasks loaded successfully')
      } catch (error) {
        console.error('Error loading tasks:', error)
      }
    },
    setCalendarView(view) {
      this.setCurrentView(view)
      console.log(`Calendar view set to: ${view}`)
    },
    setZoomLevel(level) {
      this.setGanttZoomLevel({ level })
      console.log(`Gantt zoom level set to: ${level}`)
    }
  },
  mounted() {
    console.log('StoreTest component mounted')
    console.log('Store modules available:', Object.keys(this.$store.state))
  }
}
</script>