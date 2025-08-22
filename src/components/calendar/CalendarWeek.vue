<template>
  <div class="calendar-week">
    <!-- Week Header -->
    <div class="grid grid-cols-8 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
      <!-- Time column header -->
      <div class="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-700">
        Hora
      </div>
      
      <!-- Day headers -->
      <div
        v-for="day in weekDays"
        :key="day.dateString"
        :class="[
          'bg-gray-50 px-3 py-2 text-center text-sm font-medium',
          {
            'text-blue-600 bg-blue-50': day.isToday,
            'text-gray-700': !day.isToday
          }
        ]"
      >
        <div>{{ day.dayName }}</div>
        <div class="text-lg font-bold">{{ day.day }}</div>
      </div>
    </div>

    <!-- Week Grid -->
    <div class="bg-white rounded-b-lg overflow-hidden">
      <div class="grid grid-cols-8 gap-px bg-gray-200">
        <!-- Time slots -->
        <div v-for="hour in hours" :key="hour" class="contents">
          <!-- Time label -->
          <div class="bg-gray-50 px-3 py-4 text-xs text-gray-500 text-center border-r">
            {{ formatHour(hour) }}
          </div>
          
          <!-- Day columns for this hour -->
          <div
            v-for="day in weekDays"
            :key="`${day.dateString}-${hour}`"
            :class="[
              'bg-white min-h-16 p-1 cursor-pointer transition-colors relative border-b border-gray-100 group',
              {
                'bg-blue-50': day.isToday,
                'hover:bg-gray-50': true,
                'bg-green-50': isDragOver && dragOverSlot === `${day.dateString}-${hour}`
              }
            ]"
            @click="handleTimeSlotClick(day.date, hour, getEventsForTimeSlot(day.date, hour).length === 0)"
            @dragover.prevent="handleDragOver(`${day.dateString}-${hour}`)"
            @dragleave="handleDragLeave"
            @drop="handleDrop(day.date, hour, $event)"
          >
            <!-- Task Events for this time slot -->
            <div class="space-y-1">
              <TaskEventCard
                v-for="event in getEventsForTimeSlot(day.date, hour)"
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
              v-if="getEventsForTimeSlot(day.date, hour).length === 0" 
              class="text-xs text-gray-400 text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Clic para crear
            </div>

            <!-- Drop zone indicator -->
            <div
              v-if="isDragOver && dragOverSlot === `${day.dateString}-${hour}`"
              class="absolute inset-0 border-2 border-dashed border-green-400 bg-green-50 bg-opacity-50 rounded flex items-center justify-center"
            >
              <span class="text-green-600 font-medium text-xs">
                Soltar aquí
              </span>
            </div>
          </div>
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
const dragOverSlot = ref(null)

// Hours for the day (6 AM to 10 PM)
const hours = Array.from({ length: 17 }, (_, i) => i + 6)

// Computed properties
const weekDays = computed(() => {
  const days = []
  const currentDate = new Date(props.selectedDate)
  
  // Get start of week (Monday)
  const startOfWeek = new Date(currentDate)
  const dayOfWeek = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  // Generate 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    
    const dateString = date.toISOString().split('T')[0]
    const isToday = dateString === new Date().toISOString().split('T')[0]
    
    days.push({
      date,
      day: date.getDate(),
      dateString,
      dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      isToday
    })
  }
  
  return days
})

// Helper methods
const formatHour = (hour) => {
  return `${hour.toString().padStart(2, '0')}:00`
}

const getEventsForTimeSlot = (date, hour) => {
  return props.events.filter(event => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    
    // Check if event overlaps with this hour slot
    const slotStart = new Date(date)
    slotStart.setHours(hour, 0, 0, 0)
    const slotEnd = new Date(date)
    slotEnd.setHours(hour + 1, 0, 0, 0)
    
    return eventStart < slotEnd && eventEnd > slotStart
  })
}

// Event handlers
const handleTimeSlotClick = (date, hour, isEmpty = false) => {
  const clickDate = new Date(date)
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

const handleDragOver = (slotId) => {
  isDragOver.value = true
  dragOverSlot.value = slotId
}

const handleDragLeave = () => {
  isDragOver.value = false
  dragOverSlot.value = null
}

const handleDrop = (date, hour, event) => {
  event.preventDefault()
  isDragOver.value = false
  dragOverSlot.value = null
  
  try {
    const dragData = JSON.parse(event.dataTransfer.getData('application/json'))
    if (dragData.type === 'task-event') {
      const draggedTask = store.getters['calendar/draggedTask']
      if (draggedTask) {
        const dropDate = new Date(date)
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
.calendar-week {
  user-select: none;
}

.min-h-16 {
  min-height: 4rem;
}
</style>