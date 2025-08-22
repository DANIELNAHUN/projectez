<template>
  <div :class="['text-center py-12', containerClasses]">
    <!-- Icon -->
    <div class="mb-4">
      <i 
        :class="[
          icon,
          'text-4xl sm:text-5xl md:text-6xl',
          iconColorClasses
        ]"
      ></i>
    </div>
    
    <!-- Title -->
    <h3 :class="['font-medium mb-2', titleClasses]">
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p :class="['mb-6 max-w-sm mx-auto', descriptionClasses]">
      {{ description }}
    </p>
    
    <!-- Action button -->
    <slot name="action">
      <button
        v-if="actionText && actionHandler"
        @click="actionHandler"
        :class="[
          'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm',
          'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'transition-colors duration-200',
          'dark:focus:ring-offset-gray-900'
        ]"
      >
        <i v-if="actionIcon" :class="[actionIcon, 'mr-2']"></i>
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: 'pi pi-inbox'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  actionText: {
    type: String,
    default: ''
  },
  actionIcon: {
    type: String,
    default: ''
  },
  actionHandler: {
    type: Function,
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact'].includes(value)
  }
})

const containerClasses = computed(() => {
  return props.variant === 'compact' ? 'py-8' : 'py-12'
})

const iconColorClasses = computed(() => {
  return 'text-gray-400 dark:text-gray-500'
})

const titleClasses = computed(() => {
  const sizes = {
    default: 'text-lg sm:text-xl',
    compact: 'text-base sm:text-lg'
  }
  return `${sizes[props.variant]} text-gray-900 dark:text-gray-100`
})

const descriptionClasses = computed(() => {
  const sizes = {
    default: 'text-sm sm:text-base',
    compact: 'text-sm'
  }
  return `${sizes[props.variant]} text-gray-500 dark:text-gray-400`
})
</script>