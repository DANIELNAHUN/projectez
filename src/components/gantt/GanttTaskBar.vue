<template>
  <div :style="{
    left: position + 'px',
    width: width + 'px',
    backgroundColor: task.color,
    top: '4px',
    bottom: '4px'
  }" class="gantt-task-bar absolute rounded cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
    :class="[getTaskBarClasses(), { 'gantt-task-bar--dragging': isDragging }]" @mousedown="startDrag"
    @click="selectTask" @contextmenu.prevent="showContextMenu" :title="getTaskTooltip()">
    <!-- Progress indicator -->
    <div v-if="task.progress > 0" :style="{ width: task.progress + '%' }"
      class="progress-indicator absolute inset-y-0 left-0 bg-black bg-opacity-20 rounded-l"></div>

    <!-- Task title inside the bar -->
    <div
      class="task-title absolute inset-y-0 left-0 flex items-center px-2 text-xs text-gray-800 font-medium whitespace-nowrap z-10">
      {{ truncatedTitle }}
    </div>

    <!-- Resize handles -->
    <div
      class="resize-handle resize-left absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 hover:opacity-100 bg-white bg-opacity-50"
      @mousedown.stop="startResize('left', $event)"></div>
    <div
      class="resize-handle resize-right absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 hover:opacity-100 bg-white bg-opacity-50"
      @mousedown.stop="startResize('right', $event)"></div>

    <!-- Hierarchy connector lines -->
    <div v-if="task.level > 0" class="hierarchy-line absolute -left-4 top-1/2 w-4 h-px bg-gray-300"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  dayWidth: {
    type: Number,
    default: 30
  },
  timelineStart: {
    type: Date,
    required: true
  }
})

const emit = defineEmits(['task-select', 'task-drag', 'task-resize', 'context-menu'])

// Local state for drag feedback
const isDragging = ref(false)

// Computed property for truncated title
const truncatedTitle = computed(() => {
  const maxLength = 30
  if (props.task.title.length <= maxLength) {
    return props.task.title
  }
  return props.task.title.substring(0, maxLength - 3) + '...'
})

// Computed properties
const getTaskBarClasses = () => {
  return {
    'opacity-75': props.task.status === 'cancelled',
    'ring-2 ring-blue-300': props.task.status === 'in_progress',
    'bg-opacity-80': props.task.status === 'completed',
    'gantt-task-bar--parent': hasSubtasks(),
    'gantt-task-bar--milestone': props.task.type === 'milestone',
    'gantt-task-bar--deliverable': props.task.type === 'with_deliverable'
  }
}

const hasSubtasks = () => {
  // This would need to be passed as a prop or computed from store
  return false // Placeholder
}

const getTaskTooltip = () => {
  const startDate = new Date(props.task.start).toLocaleDateString('es-ES')
  const endDate = new Date(props.task.end).toLocaleDateString('es-ES')
  const duration = props.task.duration
  const progress = props.task.progress

  return `${props.task.title}\n${startDate} - ${endDate}\nDuración: ${duration} día${duration !== 1 ? 's' : ''}\nProgreso: ${progress}%`
}

// Methods
const selectTask = () => {
  emit('task-select', props.task)
}

const startDrag = (event) => {
  isDragging.value = true
  emit('task-drag', {
    task: props.task,
    startX: event.clientX,
    startPosition: props.position,
    type: 'move'
  })

  // Listen for drag end
  const handleDragEnd = () => {
    isDragging.value = false
    document.removeEventListener('mouseup', handleDragEnd)
  }
  document.addEventListener('mouseup', handleDragEnd)

  event.preventDefault()
}

const startResize = (direction, event) => {
  isDragging.value = true
  emit('task-resize', {
    task: props.task,
    startX: event.clientX,
    startPosition: props.position,
    startWidth: props.width,
    direction: direction
  })

  // Listen for resize end
  const handleResizeEnd = () => {
    isDragging.value = false
    document.removeEventListener('mouseup', handleResizeEnd)
  }
  document.addEventListener('mouseup', handleResizeEnd)

  event.preventDefault()
}

const showContextMenu = (event) => {
  emit('context-menu', {
    task: props.task,
    position: { x: event.clientX, y: event.clientY }
  })
}
</script>

<style scoped>
.gantt-task-bar {
  min-height: 24px;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  overflow: visible;
}

.gantt-task-bar:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.gantt-task-bar:hover .resize-handle {
  opacity: 1;
}

.gantt-task-bar--parent {
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.gantt-task-bar--milestone {
  border-radius: 50%;
  min-width: 24px;
  width: 24px !important;
}

.gantt-task-bar--deliverable::after {
  content: '📋';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

.progress-indicator {
  border-radius: 4px 0 0 4px;
}

.task-title {
  user-select: none;
  pointer-events: none;
  overflow: visible;
  white-space: nowrap;
  min-width: max-content;
}

.resize-handle {
  transition: opacity 0.2s ease;
}

.hierarchy-line {
  border-top: 1px solid #d1d5db;
}

/* Drag cursor */
.gantt-task-bar {
  cursor: grab;
}

.gantt-task-bar:active {
  cursor: grabbing;
}

.gantt-task-bar--dragging {
  opacity: 0.8;
  transform: scale(1.02);
  z-index: 10;
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>