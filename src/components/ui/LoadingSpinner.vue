<template>
  <div 
    :class="[
      'flex items-center justify-center',
      sizeClasses,
      containerClasses
    ]"
  >
    <div 
      :class="[
        'animate-spin rounded-full border-solid border-t-transparent',
        spinnerClasses
      ]"
    ></div>
    <span v-if="text" :class="['ml-3', textClasses]">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'gray', 'green', 'red', 'yellow', 'purple'].includes(value)
  },
  fullScreen: {
    type: Boolean,
    default: false
  },
  overlay: {
    type: Boolean,
    default: false
  }
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizes[props.size]
})

const spinnerClasses = computed(() => {
  const borderSizes = {
    xs: 'border-2',
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4',
    xl: 'border-4'
  }
  
  const colors = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600'
  }
  
  return `${sizeClasses.value} ${borderSizes[props.size]} ${colors[props.color]}`
})

const textClasses = computed(() => {
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  
  return `${textSizes[props.size]} text-gray-600 dark:text-gray-300`
})

const containerClasses = computed(() => {
  let classes = []
  
  if (props.fullScreen) {
    classes.push('fixed inset-0 z-50')
  }
  
  if (props.overlay) {
    classes.push('bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm')
  }
  
  return classes.join(' ')
})
</script>