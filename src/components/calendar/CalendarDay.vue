<template>
  <div class="calendar-day">
    <!-- Day Header -->
    <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ dayTitle }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ daySubtitle }}
          </p>
        </div>
        <div class="text-sm text-gray-500">
          {{ eventsCount }} {{ eventsCount === 1 ? 'tarea' : 'tareas' }}
        </div>
      </div>
    </div>

    <!-- Time Grid -->
    <div class="bg-white rounded-b-lg overflow-hidden">
      <div class="grid grid-cols-2 gap-px bg-gray-200">
        <!-- Time column -->
        <div class="bg-gray-50">
          <div
            v-for="hour in hours"
            :key="hour"
            class="px-4 py-4 text-sm text-gray-500 text-right border-b border-gray-200"
          >
            {{ formatHour(hour) }}
          </div>
        </div>

        <!-- Events column -->
        <div class="bg-white">
          <div
            v-for="hour in hours"
            :key="hour"
            :class="[
              'min-h-16 p-2 cursor-pointer transition-colors relative border-b border-gray-200 group',
              {
                'hover:bg-gray-50': true,
                'bg-green-50': isDragOver && dragOverHour === hour
              }
            ]"
            @click="handleTimeSlotClick(hour, getEventsForHour(hour).length === 0)"
            @dragover.prevent="handleDragOver(hour)"
            @dragleave="handleDragLeave"
            @drop="handleDrop(hour, $event)"
          >
            <!-- Task Events for this hour -->
            <div class="space-y-2">
              <TaskEventCard
                v-for="event in getEventsForHour(hour)"
                :key="event.id"
                :task="event.task"
                @edit-task="handleTaskEdit"
                @drag-start="handleTaskDragStart"
                @drag-end="handleTaskDragEnd"
                class="text-sm"
              />
            </div>

            <!-- Drop zone indicator -->
            <div
              v-if="isDragOver && dragOverHour === hour"
              class="absolute inset-0 border-2 border-dashed border-green-400 bg-green-50 bg-opacity-50 rounded flex items-center justify-center"
            >
              <span class="text-green-600 font-medium text-sm">
                Soltar aquí
              </span>
            </div>

            <!-- Empty state for hour -->
            <div
              v-if="getEventsForHour(hour).length === 0"
              class="text-center py-4 text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Clic para crear tarea
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- All Day Events Section -->
    <div v-if="allDayEvents.length > 0" class="mt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Tareas de todo el día</h4>
      <div class="space-y-2">
        <TaskEventCard
          v-for="event in allDayEvents"
          :key="event.id"
          :task="event.task"
          @edit-task="handleTaskEdit"
          @drag-start="handleTaskDragStart"
          @drag-end="handleTaskDragEnd"
          class="bg-gray-50 border border-gray-200 rounded-lg"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import TaskEventCard from './TaskEventCard.vue'

const props = defineProps({
  selectedDate: {
    type: Date,
    required: true
  },
  events: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'date-click',
  'task-edit',
  'task-drag-start',
  'task-drag-end', 
  'date-drop'
])

const store = useStore()

// Reactive data
const isDragOver = ref(false)
const dragOverHour = ref(null)

// Hours for the day (6 AM to 10 PM)
const hours = Array.from({ length: 17 }, (_, i) => i + 6)

// Computed properties
const dayTitle = computed(() => {
  return props.selectedDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
})

const daySubtitle = computed(() => {
  return props.selectedDate.toLocaleDateString('es-ES', {
    year: 'numeric'
  })
})

const eventsCount = computed(() => props.events.length)

const allDayEvents = computed(() => {
  return props.events.filter(event => {
    // Consider events that span the entire day or more as all-day events
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    const duration = eventEnd - eventStart
    
    // If duration is 24 hours or more, consider it all-day
    return duration >= 24 * 60 * 60 * 1000
  })
})

const timedEvents = computed(() => {
  return props.events.filter(event => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    const duration = eventEnd - eventStart
    
    // If duration is less than 24 hours, it's a timed event
    return duration < 24 * 60 * 60 * 1000
  })
})

// Helper methods
const formatHour = (hour) => {
  return `${hour.toString().padStart(2, '0')}:00`
}

const getEventsForHour = (hour) => {
  return timedEvents.value.filter(event => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    
    // Check if event overlaps with this hour
    const hourStart = new Date(props.selectedDate)
    hourStart.setHours(hour, 0, 0, 0)
    const hourEnd = new Date(props.selectedDate)
    hourEnd.setHours(hour + 1, 0, 0, 0)
    
    return eventStart < hourEnd && eventEnd > hourStart
  })
}

// Event handlers
const handleTimeSlotClick = (hour, isEmpty = false) => {
  const clickDate = new Date(props.selectedDate)
  clickDate.setHours(hour, 0, 0, 0)
  emit('date-click', clickDate, isEmpty)
}

const handleTaskEdit = (task) => {
  emit('task-edit', task)
}

const handleTaskDragStart = (data) => {
  emit('task-drag-start', data)
}

const handleTaskDragEnd = (data) => {
  emit('task-drag-end', data)
}

const handleDragOver = (hour) => {
  isDragOver.value = true
  dragOverHour.value = hour
}

const handleDragLeave = () => {
  isDragOver.value = false
  dragOverHour.value = null
}

const handleDrop = (hour, event) => {
  event.preventDefault()
  isDragOver.value = false
  dragOverHour.value = null
  
  try {
    const dragData = JSON.parse(event.dataTransfer.getData('application/json'))
    if (dragData.type === 'task-event') {
      const draggedTask = store.getters['calendar/draggedTask']
      if (draggedTask) {
        const dropDate = new Date(props.selectedDate)
        dropDate.setHours(hour, 0, 0, 0)
        emit('date-drop', { date: dropDate, draggedTask })
      }
    }
  } catch (error) {
    console.error('Error handling drop:', error)
  }
}
</script>

<style scoped>
.calendar-day {
  user-select: none;
}

.min-h-16 {
  min-height: 4rem;
}
</style>