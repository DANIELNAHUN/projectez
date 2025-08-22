<template>
  <div class="basic-calendar">
    <!-- Calendar Header with Days of Week -->
    <div class="grid grid-cols-7 gap-1 mb-4">
      <div
        v-for="day in daysOfWeek"
        :key="day"
        class="text-center text-sm font-medium text-gray-700 py-2"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="date in calendarDates"
        :key="date.dateString"
        :class="[
          'min-h-24 p-2 border border-gray-200 cursor-pointer transition-colors',
          {
            'bg-gray-100 text-gray-400': !date.isCurrentMonth,
            'bg-blue-100 border-blue-300': date.isToday,
            'bg-white hover:bg-gray-50': date.isCurrentMonth && !date.isToday
          }
        ]"
        @click="$emit('date-click', date.date, true)"
      >
        <!-- Date Number -->
        <div
          :class="[
            'text-sm font-medium mb-1',
            {
              'text-blue-600 font-bold': date.isToday,
              'text-gray-900': date.isCurrentMonth && !date.isToday,
              'text-gray-400': !date.isCurrentMonth
            }
          ]"
        >
          {{ date.day }}
        </div>

        <!-- Sample events for testing -->
        <div v-if="date.isToday" class="space-y-1">
          <div class="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
            Tarea de ejemplo
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedDate: {
    type: Date,
    default: () => new Date()
  }
})

defineEmits(['date-click'])

// Days of week labels
const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Computed properties
const calendarDates = computed(() => {
  const dates = []
  const currentDate = new Date(props.selectedDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Get first day of month
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  const dayOfWeek = firstDay.getDay()
  startDate.setDate(firstDay.getDate() - dayOfWeek)
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateString = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === month
    const isToday = dateString === new Date().toISOString().split('T')[0]
    
    dates.push({
      date,
      day: date.getDate(),
      dateString,
      isCurrentMonth,
      isToday
    })
  }
  
  return dates
})
</script>

<style scoped>
.min-h-24 {
  min-height: 6rem;
}
</style>