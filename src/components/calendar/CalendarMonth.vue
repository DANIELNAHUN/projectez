<template>
  <div class="calendar-month">
    <!-- Month Header with Days of Week -->
    <div class="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
      <div
        v-for="day in daysOfWeek"
        :key="day"
        class="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-700"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-px bg-gray-200 rounded-b-lg overflow-hidden">
      <div
        v-for="date in calendarDates"
        :key="date.dateString"
        :class="[
          'bg-white min-h-32 p-2 cursor-pointer transition-colors relative group',
          {
            'bg-gray-50 text-gray-400': !date.isCurrentMonth,
            'bg-blue-50 ring-2 ring-blue-200': date.isToday,
            'hover:bg-gray-50': date.isCurrentMonth,
            'bg-green-50': isDragOver && dragOverDate === date.dateString
          }
        ]"
        @click="handleDateClick(date.date, date.events.length === 0)"
        @dragover.prevent="handleDragOver(date.dateString)"
        @dragleave="handleDragLeave"
        @drop="handleDrop(date.date, $event)"
      >
        <!-- Date Number -->
        <div class="flex justify-between items-start mb-2">
          <span
            :class="[
              'text-sm font-medium',
              {
                'text-blue-600 font-bold': date.isToday,
                'text-gray-900': date.isCurrentMonth && !date.isToday,
                'text-gray-400': !date.isCurrentMonth
              }
            ]"
          >
            {{ date.day }}
          </span>
          
          <!-- Event count indicator -->
          <span
            v-if="date.events.length > 3"
            class="text-xs text-gray-500 bg-gray-100 px-1 rounded"
          >
            +{{ date.events.length - 3 }}
          </span>
        </div>

        <!-- Task Events -->
        <div class="space-y-1">
          <TaskEventCard
            v-for="(event, index) in date.events.slice(0, 3)"
            :key="event.id"
            :task="event.task"
            @edit-task="handleTaskEdit"
            @drag-start="handleTaskDragStart"
            @drag-end="handleTaskDragEnd"
            class="text-xs"
          />
        </div>

        <!-- Empty state hint -->
        <div 
          v-if="date.events.length === 0 && date.isCurrentMonth" 
          class="text-xs text-gray-400 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Clic para crear tarea
        </div>

        <!-- Drop zone indicator -->
        <div
          v-if="isDragOver && dragOverDate === date.dateString"
          class="absolute inset-0 border-2 border-dashed border-green-400 bg-green-50 bg-opacity-50 rounded flex items-center justify-center"
        >
          <span class="text-green-600 font-medium text-sm">
            Soltar aquí
          </span>
        </div>
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
const dragOverDate = ref(null)

// Days of week labels
const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Computed properties
const calendarDates = computed(() => {
  const dates = []
  const currentDate = new Date(props.selectedDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Get first day of month and adjust for Monday start
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  const dayOfWeek = firstDay.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(firstDay.getDate() - daysToSubtract)
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateString = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === month
    const isToday = dateString === new Date().toISOString().split('T')[0]
    
    // Get events for this date
    const dayEvents = props.events.filter(event => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      
      // Check if event spans this date
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date)
      dateEnd.setHours(23, 59, 59, 999)
      
      return eventStart <= dateEnd && eventEnd >= dateStart
    })
    
    dates.push({
      date,
      day: date.getDate(),
      dateString,
      isCurrentMonth,
      isToday,
      events: dayEvents
    })
  }
  
  return dates
})

// Event handlers
const handleDateClick = (date, isEmpty = false) => {
  emit('date-click', date, isEmpty)
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

const handleDragOver = (dateString) => {
  isDragOver.value = true
  dragOverDate.value = dateString
}

const handleDragLeave = () => {
  isDragOver.value = false
  dragOverDate.value = null
}

const handleDrop = (date, event) => {
  event.preventDefault()
  isDragOver.value = false
  dragOverDate.value = null
  
  try {
    const dragData = JSON.parse(event.dataTransfer.getData('application/json'))
    if (dragData.type === 'task-event') {
      const draggedTask = store.getters['calendar/draggedTask']
      if (draggedTask) {
        emit('date-drop', { date, draggedTask })
      }
    }
  } catch (error) {
    console.error('Error handling drop:', error)
  }
}
</script>

<style scoped>
.calendar-month {
  user-select: none;
}

.min-h-32 {
  min-height: 8rem;
}
</style>