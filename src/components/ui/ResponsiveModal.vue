<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :class="[
        'fixed inset-0 z-50 overflow-y-auto',
        'animate-fade-in'
      ]"
      @click="handleBackdropClick"
    >
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        :class="{ 'opacity-100': visible, 'opacity-0': !visible }"
      ></div>
      
      <!-- Modal container -->
      <div class="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          :class="[
            'relative w-full transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all',
            'animate-slide-up',
            sizeClasses,
            'max-h-[90vh] flex flex-col'
          ]"
          @click.stop
        >
          <!-- Header -->
          <div 
            v-if="$slots.header || title || showCloseButton"
            class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
          >
            <div class="flex-1 min-w-0">
              <slot name="header">
                <h3 
                  v-if="title"
                  :class="[
                    'text-lg font-semibold text-gray-900 dark:text-gray-100 truncate',
                    titleClasses
                  ]"
                >
                  {{ title }}
                </h3>
                <p 
                  v-if="subtitle"
                  class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate"
                >
                  {{ subtitle }}
                </p>
              </slot>
            </div>
            
            <button
              v-if="showCloseButton"
              @click="close"
              class="ml-4 flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <span class="sr-only">Cerrar</span>
              <i class="pi pi-times text-lg"></i>
            </button>
          </div>
          
          <!-- Content -->
          <div 
            :class="[
              'flex-1 overflow-y-auto custom-scrollbar',
              contentPadding ? 'p-4 sm:p-6' : ''
            ]"
          >
            <slot></slot>
          </div>
          
          <!-- Footer -->
          <div 
            v-if="$slots.footer"
            class="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
          >
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].includes(value)
  },
  showCloseButton: {
    type: Boolean,
    default: true
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  closeOnEscape: {
    type: Boolean,
    default: true
  },
  contentPadding: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close', 'open'])

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4'
  }
  
  return sizes[props.size]
})

const titleClasses = computed(() => {
  const sizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    full: 'text-2xl'
  }
  
  return sizes[props.size]
})

const close = () => {
  if (props.persistent) return
  
  emit('update:visible', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && props.closeOnEscape && props.visible) {
    close()
  }
}

// Prevent body scroll when modal is open
const toggleBodyScroll = (disable) => {
  if (disable) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

watch(() => props.visible, (newValue) => {
  toggleBodyScroll(newValue)
  
  if (newValue) {
    emit('open')
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  
  if (props.visible) {
    toggleBodyScroll(true)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  toggleBodyScroll(false)
})
</script>