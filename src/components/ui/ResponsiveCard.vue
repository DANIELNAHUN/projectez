<template>
  <div 
    :class="[
      'rounded-lg shadow transition-shadow duration-200',
      backgroundClasses,
      hoverClasses,
      paddingClasses,
      borderClasses
    ]"
  >
    <!-- Header -->
    <div v-if="$slots.header || title" :class="['flex items-center justify-between', headerClasses]">
      <div class="flex-1 min-w-0">
        <slot name="header">
          <h3 :class="['font-semibold truncate', titleClasses]">
            {{ title }}
          </h3>
          <p v-if="subtitle" :class="['text-sm mt-1 truncate', subtitleClasses]">
            {{ subtitle }}
          </p>
        </slot>
      </div>
      
      <div v-if="$slots.actions" class="flex items-center space-x-2 ml-4 flex-shrink-0">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <!-- Content -->
    <div v-if="$slots.default" :class="contentClasses">
      <slot></slot>
    </div>
    
    <!-- Footer -->
    <div v-if="$slots.footer" :class="footerClasses">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'elevated', 'outlined', 'flat'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const backgroundClasses = computed(() => {
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
    outlined: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    flat: 'bg-gray-50 dark:bg-gray-900'
  }
  
  return variants[props.variant]
})

const hoverClasses = computed(() => {
  if (!props.hoverable) return ''
  
  return 'hover:shadow-md cursor-pointer transform hover:-translate-y-0.5 transition-transform duration-200'
})

const paddingClasses = computed(() => {
  const sizes = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }
  
  return sizes[props.size]
})

const borderClasses = computed(() => {
  if (props.variant === 'outlined') {
    return 'border border-gray-200 dark:border-gray-700'
  }
  return ''
})

const headerClasses = computed(() => {
  const hasContent = !!props.$slots?.default
  const hasFooter = !!props.$slots?.footer
  
  if (hasContent || hasFooter) {
    return 'mb-4 pb-4 border-b border-gray-200 dark:border-gray-700'
  }
  
  return 'mb-0'
})

const titleClasses = computed(() => {
  const sizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl'
  }
  
  return `${sizes[props.size]} text-gray-900 dark:text-gray-100`
})

const subtitleClasses = computed(() => {
  return 'text-gray-600 dark:text-gray-400'
})

const contentClasses = computed(() => {
  const hasFooter = !!props.$slots?.footer
  
  return hasFooter ? 'mb-4 pb-4 border-b border-gray-200 dark:border-gray-700' : ''
})

const footerClasses = computed(() => {
  return 'pt-4 border-t border-gray-200 dark:border-gray-700'
})
</script>