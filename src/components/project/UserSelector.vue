<template>
  <div class="space-y-4">
    <!-- Search input -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar usuarios por nombre o email..."
        class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
      />
      <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
    </div>

    <!-- Users list -->
    <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
      <div v-if="filteredUsers.length === 0" class="p-4 text-center text-gray-500">
        <i class="pi pi-users text-2xl mb-2"></i>
        <p>{{ searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios disponibles' }}</p>
        <p class="text-sm text-gray-400 mt-1">
          {{ searchQuery ? 'Intenta con otro término de búsqueda' : 'Crea un nuevo usuario para agregarlo al proyecto' }}
        </p>
      </div>
      
      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          @click="selectUser(user)"
        >
          <div class="flex items-center space-x-3">
            <!-- Avatar -->
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-blue-600 font-semibold text-sm">
                {{ getInitials(user.name) }}
              </span>
            </div>
            
            <!-- User info -->
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900 truncate">{{ user.name }}</h4>
              <p class="text-sm text-gray-600 truncate">{{ user.email }}</p>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                {{ user.role }}
              </span>
            </div>
            
            <!-- Select button -->
            <button
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              @click.stop="selectUser(user)"
            >
              Seleccionar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected user preview -->
    <div v-if="selectedUser" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-blue-600 font-semibold text-xs">
              {{ getInitials(selectedUser.name) }}
            </span>
          </div>
          <div>
            <h5 class="font-medium text-blue-900">{{ selectedUser.name }}</h5>
            <p class="text-sm text-blue-700">{{ selectedUser.email }}</p>
          </div>
        </div>
        <button
          @click="clearSelection"
          class="text-blue-600 hover:text-blue-800 p-1"
          title="Deseleccionar"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
      
      <!-- Role selection for selected user -->
      <div class="mt-3">
        <label class="block text-sm font-medium text-blue-900 mb-1">
          Rol en este proyecto
        </label>
        <select
          v-model="selectedUserRole"
          class="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
        >
          <option value="">Mantener rol actual ({{ selectedUser.role }})</option>
          <option value="Administrador">Administrador</option>
          <option value="Desarrollador">Desarrollador</option>
          <option value="Diseñador">Diseñador</option>
          <option value="Analista">Analista</option>
          <option value="Tester">Tester</option>
          <option value="Colaborador">Colaborador</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserSelector',
  props: {
    availableUsers: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'user-selected'],
  data() {
    return {
      searchQuery: '',
      selectedUser: null,
      selectedUserRole: ''
    }
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery) {
        return this.availableUsers
      }
      
      const query = this.searchQuery.toLowerCase()
      return this.availableUsers.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      )
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
    
    selectUser(user) {
      this.selectedUser = user
      this.selectedUserRole = user.role // Default to current role
      
      const userWithRole = {
        ...user,
        role: this.selectedUserRole || user.role
      }
      
      this.$emit('update:modelValue', userWithRole)
      this.$emit('user-selected', userWithRole)
    },
    
    clearSelection() {
      this.selectedUser = null
      this.selectedUserRole = ''
      this.$emit('update:modelValue', null)
    }
  },
  
  watch: {
    selectedUserRole(newRole) {
      if (this.selectedUser) {
        const userWithRole = {
          ...this.selectedUser,
          role: newRole || this.selectedUser.role
        }
        this.$emit('update:modelValue', userWithRole)
      }
    },
    
    modelValue: {
      immediate: true,
      handler(newValue) {
        if (!newValue) {
          this.selectedUser = null
          this.selectedUserRole = ''
        }
      }
    }
  }
}
</script>