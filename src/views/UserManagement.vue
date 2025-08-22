<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h2 class="text-2xl sm:text-3xl font-bold mb-2" :style="{ color: isDarkMode ? '#f9fafb' : '#111827' }">
          Gestión de Usuarios
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Administra todos los usuarios del sistema
        </p>
      </div>
      
      <div class="flex-shrink-0 flex space-x-3">
        <button 
          @click="createSampleUsers"
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <i class="pi pi-plus mr-2"></i>
          <span class="hidden sm:inline">Crear Usuarios de Ejemplo</span>
          <span class="sm:hidden">Ejemplos</span>
        </button>
        
        <button 
          @click="showCreateUserForm = true"
          class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <i class="pi pi-user-plus mr-2"></i>
          <span class="hidden sm:inline">Nuevo Usuario</span>
          <span class="sm:hidden">Nuevo</span>
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="pi pi-users text-blue-600 dark:text-blue-400 text-2xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ globalUsers.length }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="pi pi-briefcase text-green-600 dark:text-green-400 text-2xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Roles Únicos</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ uniqueRoles.length }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="pi pi-clock text-orange-600 dark:text-orange-400 text-2xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Creados Hoy</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ usersCreatedToday }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar usuarios por nombre, email o rol..."
              class="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        
        <div class="sm:w-48">
          <select
            v-model="selectedRoleFilter"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Todos los roles</option>
            <option v-for="role in uniqueRoles" :key="role" :value="role">{{ role }}</option>
          </select>
        </div>
        
        <button
          @click="refreshUsers"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <i class="pi pi-refresh mr-2"></i>
          Actualizar
        </button>
      </div>
    </div>

    <!-- Users List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lista de Usuarios ({{ filteredUsers.length }})
          </h3>
          <button
            v-if="globalUsers.length > 0"
            @click="confirmClearAllUsers"
            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
          >
            <i class="pi pi-trash mr-1"></i>
            Limpiar Todos
          </button>
        </div>
      </div>

      <div class="p-6">
        <!-- Empty state -->
        <div v-if="filteredUsers.length === 0" class="text-center py-12">
          <i class="pi pi-users text-gray-400 dark:text-gray-500 text-4xl mb-4"></i>
          <p class="text-gray-500 dark:text-gray-400 mb-2">
            {{ searchQuery || selectedRoleFilter ? 'No se encontraron usuarios' : 'No hay usuarios creados' }}
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {{ searchQuery || selectedRoleFilter ? 'Intenta con otros filtros de búsqueda' : 'Crea tu primer usuario o agrega usuarios de ejemplo' }}
          </p>
          <div class="flex justify-center space-x-3">
            <button
              v-if="!searchQuery && !selectedRoleFilter"
              @click="createSampleUsers"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Crear Usuarios de Ejemplo
            </button>
            <button
              @click="showCreateUserForm = true"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Crear Nuevo Usuario
            </button>
          </div>
        </div>

        <!-- Users grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3 flex-1">
                <!-- Avatar -->
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-blue-600 dark:text-blue-400 font-semibold">
                    {{ getInitials(user.name) }}
                  </span>
                </div>
                
                <!-- User info -->
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ user.name }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 truncate">{{ user.email }}</p>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 mt-1">
                    {{ user.role }}
                  </span>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Creado: {{ formatDate(user.joinedAt) }}
                  </p>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex items-center space-x-1 ml-2">
                <button
                  @click="editUser(user)"
                  class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                  title="Editar usuario"
                >
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button
                  @click="deleteUser(user)"
                  class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                  title="Eliminar usuario"
                >
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <ResponsiveModal
      v-model:visible="showCreateUserForm"
      :title="editingUser ? 'Editar Usuario' : 'Nuevo Usuario'"
      size="md"
      @close="closeUserForm"
    >
      <UserForm
        :user="editingUser"
        @submit="handleUserSubmit"
        @cancel="closeUserForm"
      />
    </ResponsiveModal>

    <!-- Delete Confirmation Modal -->
    <ResponsiveModal
      v-model:visible="showDeleteConfirm"
      title="Confirmar Eliminación"
      size="sm"
      :close-on-backdrop="false"
      @close="showDeleteConfirm = false"
    >
      <div class="space-y-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-gray-900 dark:text-gray-100 font-medium mb-2">
              ¿Eliminar usuario?
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              ¿Estás seguro de que deseas eliminar a "{{ deletingUser?.name }}"? 
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            @click="confirmDeleteUser"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 border border-transparent rounded-lg hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
          >
            Eliminar
          </button>
        </div>
      </template>
    </ResponsiveModal>

    <!-- Clear All Confirmation Modal -->
    <ResponsiveModal
      v-model:visible="showClearAllConfirm"
      title="Confirmar Limpieza"
      size="sm"
      :close-on-backdrop="false"
      @close="showClearAllConfirm = false"
    >
      <div class="space-y-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-gray-900 dark:text-gray-100 font-medium mb-2">
              ¿Eliminar todos los usuarios?
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Esta acción eliminará todos los {{ globalUsers.length }} usuarios del sistema. 
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-3">
          <button
            @click="showClearAllConfirm = false"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            @click="confirmClearAllUsers"
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 border border-transparent rounded-lg hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
          >
            Eliminar Todos
          </button>
        </div>
      </template>
    </ResponsiveModal>
  </div>
</template>

<script>
import { userService } from '../services/userService.js'
import ResponsiveModal from '../components/ui/ResponsiveModal.vue'
import UserForm from '../components/project/UserForm.vue'
import { useToast } from '../composables/useToast.js'
import { useTheme } from '../composables/useTheme'

export default {
  name: 'UserManagement',
  components: {
    ResponsiveModal,
    UserForm
  },
  setup() {
    const toast = useToast()
    const { isDarkMode } = useTheme()
    return { toast, isDarkMode }
  },
  data() {
    return {
      globalUsers: [],
      searchQuery: '',
      selectedRoleFilter: '',
      showCreateUserForm: false,
      showDeleteConfirm: false,
      showClearAllConfirm: false,
      editingUser: null,
      deletingUser: null
    }
  },
  computed: {
    filteredUsers() {
      let users = [...this.globalUsers]
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        users = users.filter(user => 
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
        )
      }
      
      // Filter by role
      if (this.selectedRoleFilter) {
        users = users.filter(user => user.role === this.selectedRoleFilter)
      }
      
      return users
    },
    
    uniqueRoles() {
      const roles = [...new Set(this.globalUsers.map(user => user.role))]
      return roles.sort()
    },
    
    usersCreatedToday() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      return this.globalUsers.filter(user => {
        const userDate = new Date(user.joinedAt)
        userDate.setHours(0, 0, 0, 0)
        return userDate.getTime() === today.getTime()
      }).length
    }
  },
  methods: {
    getInitials(name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },

    refreshUsers() {
      this.globalUsers = userService.getAllUsers()
    },

    createSampleUsers() {
      const sampleUsers = [
        {
          name: 'Ana García',
          email: 'ana.garcia@ejemplo.com',
          role: 'Desarrollador'
        },
        {
          name: 'Carlos López',
          email: 'carlos.lopez@ejemplo.com',
          role: 'Diseñador'
        },
        {
          name: 'María Rodríguez',
          email: 'maria.rodriguez@ejemplo.com',
          role: 'Analista'
        },
        {
          name: 'Juan Martínez',
          email: 'juan.martinez@ejemplo.com',
          role: 'Tester'
        },
        {
          name: 'Laura Sánchez',
          email: 'laura.sanchez@ejemplo.com',
          role: 'Administrador'
        }
      ]

      let createdCount = 0
      sampleUsers.forEach(userData => {
        try {
          const existingUser = userService.getUserByEmail(userData.email)
          if (!existingUser) {
            userService.saveUser(userData)
            createdCount++
          }
        } catch (error) {
          console.error('Error creating sample user:', error)
        }
      })

      this.refreshUsers()
      
      if (createdCount > 0) {
        this.toast.success(
          'Usuarios creados',
          `Se crearon ${createdCount} usuarios de ejemplo.`
        )
      } else {
        this.toast.info(
          'Usuarios existentes',
          'Los usuarios de ejemplo ya existen en el sistema.'
        )
      }
    },

    confirmClearAllUsers() {
      this.showClearAllConfirm = true
    },

    clearAllUsers() {
      localStorage.removeItem('global_users')
      this.refreshUsers()
      this.showClearAllConfirm = false
      
      this.toast.success(
        'Usuarios eliminados',
        'Todos los usuarios han sido eliminados del sistema.'
      )
    },

    closeUserForm() {
      this.showCreateUserForm = false
      this.editingUser = null
    },

    editUser(user) {
      this.editingUser = user
      this.showCreateUserForm = true
    },

    deleteUser(user) {
      this.deletingUser = user
      this.showDeleteConfirm = true
    },

    confirmDeleteUser() {
      if (this.deletingUser) {
        try {
          userService.deleteUser(this.deletingUser.id)
          this.refreshUsers()
          this.showDeleteConfirm = false
          this.deletingUser = null
          
          this.toast.success(
            'Usuario eliminado',
            `El usuario "${this.deletingUser.name}" ha sido eliminado.`
          )
        } catch (error) {
          console.error('Error deleting user:', error)
          this.toast.error(
            'Error al eliminar',
            'No se pudo eliminar el usuario. Por favor, intenta de nuevo.'
          )
        }
      }
    },

    handleUserSubmit(userData) {
      try {
        userService.saveUser(userData)
        this.refreshUsers()
        this.closeUserForm()
        
        this.toast.success(
          this.editingUser ? 'Usuario actualizado' : 'Usuario creado',
          `El usuario "${userData.name}" ha sido ${this.editingUser ? 'actualizado' : 'creado'} correctamente.`
        )
      } catch (error) {
        console.error('Error saving user:', error)
        this.toast.error(
          'Error al guardar',
          'No se pudo guardar el usuario. Por favor, intenta de nuevo.'
        )
      }
    }
  },

  mounted() {
    this.refreshUsers()
  }
}
</script>