<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- User name -->
    <div>
      <label for="userName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Nombre *
      </label>
      <input
        id="userName"
        v-model="form.name"
        type="text"
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
        :class="{ 'border-red-500': errors.name }"
        placeholder="Nombre completo del usuario"
      />
      <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.name }}</p>
    </div>

    <!-- User email -->
    <div>
      <label for="userEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Email *
      </label>
      <input
        id="userEmail"
        v-model="form.email"
        type="email"
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
        :class="{ 'border-red-500': errors.email }"
        placeholder="email@ejemplo.com"
      />
      <p v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.email }}</p>
    </div>

    <!-- User role -->
    <div>
      <label for="userRole" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Rol *
      </label>
      <select
        id="userRole"
        v-model="form.role"
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
        :class="{ 'border-red-500': errors.role }"
      >
        <option value="">Seleccionar rol</option>
        <option value="Administrador">Administrador</option>
        <option value="Desarrollador">Desarrollador</option>
        <option value="Diseñador">Diseñador</option>
        <option value="Analista">Analista</option>
        <option value="Tester">Tester</option>
        <option value="Colaborador">Colaborador</option>
      </select>
      <p v-if="errors.role" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.role }}</p>
    </div>

    <!-- Form actions -->
    <div class="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
      >
        Cancelar
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <span v-if="isSubmitting" class="flex items-center">
          <i class="pi pi-spinner pi-spin mr-2"></i>
          {{ user ? 'Actualizando...' : 'Creando...' }}
        </span>
        <span v-else>
          {{ user ? 'Actualizar Usuario' : 'Crear Usuario' }}
        </span>
      </button>
    </div>
  </form>
</template>

<script>
import { userService } from '../../services/userService.js'

export default {
  name: 'UserForm',
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel'],
  data() {
    return {
      form: {
        name: '',
        email: '',
        role: ''
      },
      errors: {},
      isSubmitting: false
    }
  },
  created() {
    // Initialize form when component is created
    this.initializeForm(this.user)
  },
  methods: {
    initializeForm(user) {
      if (user) {
        this.form = {
          name: user.name || '',
          email: user.email || '',
          role: user.role || ''
        }
      } else {
        this.form = {
          name: '',
          email: '',
          role: ''
        }
      }
      this.errors = {}
    },
    
    validateForm() {
      this.errors = {}
      
      if (!this.form.name.trim()) {
        this.errors.name = 'El nombre es requerido'
      }
      
      if (!this.form.email.trim()) {
        this.errors.email = 'El email es requerido'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
        this.errors.email = 'El email no es válido'
      }
      
      if (!this.form.role) {
        this.errors.role = 'El rol es requerido'
      }
      
      // Check for duplicate email (only when creating or changing email)
      const existingUser = userService.getUserByEmail(this.form.email)
      if (existingUser && (!this.user || existingUser.id !== this.user.id)) {
        this.errors.email = 'Ya existe un usuario con este email'
      }
      
      return Object.keys(this.errors).length === 0
    },
    
    async handleSubmit() {
      if (!this.validateForm()) {
        return
      }
      
      this.isSubmitting = true
      
      try {
        const userData = {
          ...this.form,
          ...(this.user && { id: this.user.id })
        }
        
        this.$emit('submit', userData)
      } catch (error) {
        console.error('Error in form submission:', error)
      } finally {
        this.isSubmitting = false
      }
    },
    
    resetForm() {
      this.initializeForm(this.user)
    }
  },
  
  watch: {
    user: {
      handler(newUser) {
        this.initializeForm(newUser)
      }
    }
  }
}
</script>