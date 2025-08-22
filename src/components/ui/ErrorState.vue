<template>
  <div :class="['rounded-lg p-4 sm:p-6', containerClasses]">
    <div class="flex items-start">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <i 
          :class="[
            icon,
            'text-xl sm:text-2xl',
            iconClasses
          ]"
        ></i>
      </div>
      
      <!-- Content -->
      <div class="ml-3 flex-1">
        <h3 :class="['text-sm sm:text-base font-medium', titleClasses]">
          {{ title }}
        </h3>
        <div :class="['mt-2 text-xs sm:text-sm', messageClasses]">
          <p>{{ message }}</p>
        </div>
        
        <!-- Actions -->
        <div v-if="$slots.actions || retryHandler" class="mt-4">
          <div class="flex flex-col sm:flex-row gap-2">
            <slot name="actions">
              <button
                v-if="retryHandler"
                @click="retryHandler"
                :class="[
                  'inline-flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200',
                  retryButtonClasses
                ]"
              >
                <i class="pi pi-refresh mr-1.5"></i>
                Reintentar
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Error'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['error', 'warning', 'info'].includes(value)
  },
  icon: {
    type: String,
    default: ''
  },
  retryHandler: {
    type: Function,
    default: null
  }
})

const computedIcon = computed(() => {
  if (props.icon) return props.icon
  
  const icons = {
    error: 'pi pi-exclamation-triangle',
    warning: 'pi pi-exclamation-circle',
    info: 'pi pi-info-circle'
  }
  
  return icons[props.type]
})

const containerClasses = computed(() => {
  const classes = {
    error: 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800',
    warning: 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    info: 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
  }
  
  return classes[props.type]
})

const iconClasses = computed(() => {
  const classes = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
  
  return classes[props.type]
})

const titleClasses = computed(() => {
  const classes = {
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    info: 'text-blue-800 dark:text-blue-200'
  }
  
  return classes[props.type]
})

const messageClasses = computed(() => {
  const classes = {
    error: 'text-red-700 dark:text-red-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    info: 'text-blue-700 dark:text-blue-300'
  }
  
  return classes[props.type]
})

const retryButtonClasses = computed(() => {
  const classes = {
    error: 'text-red-800 bg-red-100 hover:bg-red-200 focus:ring-red-500 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 dark:focus:ring-offset-gray-900',
    warning: 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700 dark:focus:ring-offset-gray-900',
    info: 'text-blue-800 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900'
  }
  
  return classes[props.type]
})
</script>