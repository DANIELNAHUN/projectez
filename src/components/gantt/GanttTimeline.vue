<template>
  <div class="gantt-timeline" :style="{ width: totalWidth + 'px' }">
    <!-- Timeline header -->
    <div class="timeline-header bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
      <!-- Primary scale (months/weeks/days based on zoom) -->
      <div class="primary-scale flex border-b border-gray-100">
        <div 
          v-for="(period, index) in primaryScale" 
          :key="`primary-${index}`"
          :style="{ width: period.width + 'px' }"
          class="scale-cell border-r border-gray-200 px-2 py-2 text-xs font-medium text-gray-700 text-center"
        >
          {{ period.label }}
        </div>
      </div>
      
      <!-- Secondary scale (days/weeks based on zoom) -->
      <div class="secondary-scale flex" v-if="secondaryScale.length > 0">
        <div 
          v-for="(period, index) in secondaryScale" 
          :key="`secondary-${index}`"
          :style="{ width: period.width + 'px' }"
          class="scale-cell border-r border-gray-100 px-1 py-1 text-xs text-gray-600 text-center"
        >
          {{ period.label }}
        </div>
      </div>
    </div>

    <!-- Timeline body with task bars -->
    <div class="timeline-body relative">
      <!-- Grid lines -->
      <div class="timeline-grid absolute inset-0">
        <div 
          v-for="(line, index) in gridLines" 
          :key="`grid-${index}`"
          :style="{ left: line.position + 'px' }"
          class="grid-line absolute top-0 bottom-0 border-l border-gray-100"
        ></div>
      </div>

      <!-- Task bars -->
      <div class="task-bars" :style="{ height: (tasks.length * taskRowHeight) + 'px' }">
        <div 
          v-for="(task, index) in tasks" 
          :key="task.id"
          :style="{ 
            height: taskRowHeight + 'px',
            top: (index * taskRowHeight) + 'px'
          }"
          class="task-row relative border-b border-gray-50"
        >
          <!-- Task bar using GanttTaskBar component -->
          <GanttTaskBar
            :task="task"
            :position="getTaskPosition(task)"
            :width="getTaskWidth(task)"
            :day-width="dayWidth"
            :timeline-start="timelineStart"
            @task-select="selectTask"
            @task-drag="handleTaskDrag"
            @task-resize="handleTaskResize"
            @context-menu="handleContextMenu"
          />
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <GanttContextMenu
      :visible="contextMenu.visible"
      :position="contextMenu.position"
      :task="contextMenu.task"
      @edit-task="handleEditTask"
      @duplicate-task="handleDuplicateTask"
      @add-subtask="handleAddSubtask"
      @mark-completed="handleMarkCompleted"
      @mark-in-progress="handleMarkInProgress"
      @delete-task="handleDeleteTask"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import GanttTaskBar from './GanttTaskBar.vue'
import GanttContextMenu from './GanttContextMenu.vue'

const props = defineProps({
  timelineStart: {
    type: Date,
    required: true
  },
  timelineEnd: {
    type: Date,
    required: true
  },
  zoomLevel: {
    type: String,
    default: 'days'
  },
  tasks: {
    type: Array,
    default: () => []
  },
  totalWidth: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['task-date-change', 'task-select', 'task-edit', 'task-duplicate', 'task-add-subtask', 'task-status-change', 'task-delete'])

// Constants
const taskRowHeight = 20
const dayWidth = computed(() => {
  switch (props.zoomLevel) {
    case 'days': return 30
    case 'weeks': return 100 / 7 // 100px per week / 7 days
    case 'months': return 150 / 30 // 150px per month / 30 days
    default: return 30
  }
})

// Drag state
const dragState = reactive({
  isDragging: false,
  dragTask: null,
  startX: 0,
  startLeft: 0,
  dragType: 'move' // 'move', 'resize-left', 'resize-right'
})

// Context menu state
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  task: null
})

// Computed scales
const primaryScale = computed(() => {
  const scale = []
  
  if (props.zoomLevel === 'days') {
    // Show months as primary scale
    const current = new Date(props.timelineStart.getFullYear(), props.timelineStart.getMonth(), 1)
    const end = new Date(props.timelineEnd)
    
    while (current <= end) {
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      const monthEnd = nextMonth > end ? end : new Date(nextMonth.getTime() - 1)
      
      const daysInPeriod = Math.ceil((monthEnd - current) / (1000 * 60 * 60 * 24)) + 1
      const width = daysInPeriod * dayWidth.value
      
      scale.push({
        label: current.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        width: width,
        start: new Date(current),
        end: monthEnd
      })
      
      current.setMonth(current.getMonth() + 1)
    }
  } else if (props.zoomLevel === 'weeks') {
    // Show months as primary scale for weeks view
    const current = new Date(props.timelineStart.getFullYear(), props.timelineStart.getMonth(), 1)
    const end = new Date(props.timelineEnd)
    
    while (current <= end) {
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      const monthEnd = nextMonth > end ? end : new Date(nextMonth.getTime() - 1)
      
      const daysInPeriod = Math.ceil((monthEnd - current) / (1000 * 60 * 60 * 24)) + 1
      const width = (daysInPeriod / 7) * 100 // 100px per week
      
      scale.push({
        label: current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        width: width,
        start: new Date(current),
        end: monthEnd
      })
      
      current.setMonth(current.getMonth() + 1)
    }
  } else {
    // Show years as primary scale for months view
    const currentYear = props.timelineStart.getFullYear()
    const endYear = props.timelineEnd.getFullYear()
    
    for (let year = currentYear; year <= endYear; year++) {
      const yearStart = new Date(Math.max(new Date(year, 0, 1), props.timelineStart))
      const yearEnd = new Date(Math.min(new Date(year, 11, 31), props.timelineEnd))
      
      const monthsInPeriod = (yearEnd.getMonth() - yearStart.getMonth()) + 1
      const width = monthsInPeriod * 150 // 150px per month
      
      scale.push({
        label: year.toString(),
        width: width,
        start: yearStart,
        end: yearEnd
      })
    }
  }
  
  return scale
})

const secondaryScale = computed(() => {
  const scale = []
  
  if (props.zoomLevel === 'days') {
    // Show days as secondary scale
    const current = new Date(props.timelineStart)
    const end = new Date(props.timelineEnd)
    
    while (current <= end) {
      scale.push({
        label: current.getDate().toString(),
        width: dayWidth.value,
        start: new Date(current),
        end: new Date(current)
      })
      
      current.setDate(current.getDate() + 1)
    }
  } else if (props.zoomLevel === 'weeks') {
    // Show weeks as secondary scale
    const current = new Date(props.timelineStart)
    const end = new Date(props.timelineEnd)
    
    // Start from beginning of week
    current.setDate(current.getDate() - current.getDay())
    
    while (current <= end) {
      const weekEnd = new Date(current)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      scale.push({
        label: `S${getWeekNumber(current)}`,
        width: 100,
        start: new Date(current),
        end: weekEnd
      })
      
      current.setDate(current.getDate() + 7)
    }
  }
  // No secondary scale for months view
  
  return scale
})

const gridLines = computed(() => {
  const lines = []
  
  if (props.zoomLevel === 'days') {
    // Grid line every day
    const current = new Date(props.timelineStart)
    const end = new Date(props.timelineEnd)
    let position = 0
    
    while (current <= end) {
      lines.push({ position })
      position += dayWidth.value
      current.setDate(current.getDate() + 1)
    }
  } else if (props.zoomLevel === 'weeks') {
    // Grid line every week
    let position = 0
    const totalWeeks = Math.ceil((props.timelineEnd - props.timelineStart) / (1000 * 60 * 60 * 24 * 7))
    
    for (let i = 0; i <= totalWeeks; i++) {
      lines.push({ position })
      position += 100
    }
  } else {
    // Grid line every month
    let position = 0
    const totalMonths = Math.ceil((props.timelineEnd - props.timelineStart) / (1000 * 60 * 60 * 24 * 30))
    
    for (let i = 0; i <= totalMonths; i++) {
      lines.push({ position })
      position += 150
    }
  }
  
  return lines
})

// Methods
const getTaskPosition = (task) => {
  const daysSinceStart = Math.ceil((task.start - props.timelineStart) / (1000 * 60 * 60 * 24))
  return Math.max(0, daysSinceStart * dayWidth.value)
}

const getTaskWidth = (task) => {
  const taskDuration = Math.ceil((task.end - task.start) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(20, taskDuration * dayWidth.value) // Minimum 20px width
}

// Removed getTaskBarClasses - now handled by GanttTaskBar component

const selectTask = (task) => {
  emit('task-select', task)
}

const handleTaskDrag = (dragData) => {
  dragState.isDragging = true
  dragState.dragTask = dragData.task
  dragState.startX = dragData.startX
  dragState.startLeft = dragData.startPosition
  dragState.dragType = dragData.type
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)
}

const handleTaskResize = (resizeData) => {
  dragState.isDragging = true
  dragState.dragTask = resizeData.task
  dragState.startX = resizeData.startX
  dragState.startLeft = resizeData.startPosition
  dragState.startWidth = resizeData.startWidth
  dragState.dragType = `resize-${resizeData.direction}`
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', endDrag)
}

const startDrag = (task, event) => {
  // Legacy method - keeping for compatibility
  handleTaskDrag({
    task,
    startX: event.clientX,
    startPosition: getTaskPosition(task),
    type: 'move'
  })
  event.preventDefault()
}

const handleDrag = (event) => {
  if (!dragState.isDragging || dragState.dragType !== 'move') return
  
  const deltaX = event.clientX - dragState.startX
  const daysDelta = Math.round(deltaX / dayWidth.value)
  
  if (Math.abs(daysDelta) >= 1) {
    const newStart = new Date(dragState.dragTask.start)
    const newEnd = new Date(dragState.dragTask.end)
    
    newStart.setDate(newStart.getDate() + daysDelta)
    newEnd.setDate(newEnd.getDate() + daysDelta)
    
    // Update the drag state to prevent multiple rapid updates
    dragState.startX = event.clientX
    
    // Emit the change (will be handled by parent component)
    emit('task-date-change', {
      taskId: dragState.dragTask.id,
      newStart,
      newEnd,
      type: 'move'
    })
  }
}

const handleResize = (event) => {
  if (!dragState.isDragging || !dragState.dragType.startsWith('resize')) return
  
  const deltaX = event.clientX - dragState.startX
  const daysDelta = Math.round(deltaX / dayWidth.value)
  
  if (Math.abs(daysDelta) >= 1) {
    const newStart = new Date(dragState.dragTask.start)
    const newEnd = new Date(dragState.dragTask.end)
    
    if (dragState.dragType === 'resize-left') {
      // Resize from the start date
      newStart.setDate(newStart.getDate() + daysDelta)
      
      // Ensure start doesn't go past end (minimum 1 day duration)
      if (newStart >= newEnd) {
        newStart.setTime(newEnd.getTime() - (24 * 60 * 60 * 1000))
      }
    } else if (dragState.dragType === 'resize-right') {
      // Resize from the end date
      newEnd.setDate(newEnd.getDate() + daysDelta)
      
      // Ensure end doesn't go before start (minimum 1 day duration)
      if (newEnd <= newStart) {
        newEnd.setTime(newStart.getTime() + (24 * 60 * 60 * 1000))
      }
    }
    
    // Update the drag state to prevent multiple rapid updates
    dragState.startX = event.clientX
    
    emit('task-date-change', {
      taskId: dragState.dragTask.id,
      newStart,
      newEnd,
      type: 'resize',
      direction: dragState.dragType.split('-')[1]
    })
  }
}

const endDrag = () => {
  dragState.isDragging = false
  dragState.dragTask = null
  dragState.dragType = 'move'
  
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', endDrag)
}

// Context menu handlers
const handleContextMenu = (data) => {
  contextMenu.visible = true
  contextMenu.position = data.position
  contextMenu.task = data.task
  
  // Close context menu when clicking elsewhere
  const handleClickOutside = (event) => {
    if (!event.target.closest('.gantt-context-menu')) {
      closeContextMenu()
      document.removeEventListener('click', handleClickOutside)
    }
  }
  
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 0)
}

const closeContextMenu = () => {
  contextMenu.visible = false
  contextMenu.task = null
}

const handleEditTask = (task) => {
  emit('task-edit', task)
}

const handleDuplicateTask = (task) => {
  emit('task-duplicate', task)
}

const handleAddSubtask = (task) => {
  emit('task-add-subtask', task)
}

const handleMarkCompleted = (task) => {
  emit('task-status-change', { task, status: 'completed' })
}

const handleMarkInProgress = (task) => {
  emit('task-status-change', { task, status: 'in_progress' })
}

const handleDeleteTask = (task) => {
  emit('task-delete', task)
}

// Helper functions
const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}
</script>

<style scoped>
.gantt-timeline {
  position: relative;
  background-color: #ffffff;
  min-height: fit-content;
  height: auto;
}

.timeline-header {
  height: 60px;
}

.primary-scale {
  height: 30px;
}

.secondary-scale {
  height: 30px;
}

.scale-cell {
  @apply flex items-center justify-center;
  min-width: 30px;
}

.timeline-body {
  position: relative;
  min-height: fit-content;
  height: auto;
}

/* Task bar styles moved to GanttTaskBar component */

.grid-line {
  pointer-events: none;
}

.task-bars {
  position: relative;
  min-height: 200px;
}

.task-row {
  position: relative;
}

/* Drag cursor styles moved to GanttTaskBar component */
</style>