<template>
  <div class="bg-white rounded-lg shadow">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">Equipo del Proyecto</h3>
        <button
          @click="showAddMemberForm = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center"
        >
          <i class="pi pi-plus mr-2"></i>
          Agregar Miembro
        </button>
      </div>
    </div>

    <div class="p-6">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <i class="pi pi-spinner pi-spin text-2xl text-blue-600"></i>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <i class="pi pi-exclamation-triangle text-red-600 mr-2"></i>
          <span class="text-red-800">{{ error }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="teamMembers.length === 0" class="text-center py-8">
        <i class="pi pi-users text-gray-400 text-4xl mb-4"></i>
        <p class="text-gray-500 mb-2">No hay miembros en el equipo</p>
        <p class="text-sm text-gray-400 mb-4">Agrega miembros para colaborar en este proyecto</p>
        <button
          @click="showAddMemberForm = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Agregar Primer Miembro
        </button>
      </div>

      <!-- Team members list -->
      <div v-else class="space-y-4">
        <div
          v-for="member in teamMembers"
          :key="member.id"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div class="flex items-center space-x-4">
            <!-- Avatar placeholder -->
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 font-semibold text-sm">
                {{ getInitials(member.name) }}
              </span>
            </div>
            
            <!-- Member info -->
            <div>
              <h4 class="font-medium text-gray-900">{{ member.name }}</h4>
              <p class="text-sm text-gray-600">{{ member.email }}</p>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {{ member.role }}
              </span>
            </div>
          </div>

          <!-- Member actions -->
          <div class="flex items-center space-x-2">
            <button
              @click="handleEditMember(member)"
              class="text-gray-400 hover:text-blue-600 transition-colors p-2"
              title="Editar miembro"
            >
              <i class="pi pi-pencil"></i>
            </button>
            <button
              @click="handleDeleteMember(member)"
              class="text-gray-400 hover:text-red-600 transition-colors p-2"
              title="Eliminar miembro"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Member Modal -->
    <div 
      v-if="showAddMemberForm || showEditMemberForm" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeMemberForm"
    >
      <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingMember ? 'Editar Miembro' : 'Agregar Miembro' }}
          </h3>
        </div>

        <div class="p-6">
          <!-- Mode selection (only for adding new members) -->
          <div v-if="!editingMember" class="mb-6">
            <div class="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                @click="addMemberMode = 'existing'"
                :class="[
                  'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  addMemberMode === 'existing' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <i class="pi pi-users mr-2"></i>
                Seleccionar Usuario Existente
              </button>
              <button
                @click="addMemberMode = 'new'"
                :class="[
                  'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  addMemberMode === 'new' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <i class="pi pi-plus mr-2"></i>
                Crear Nuevo Usuario
              </button>
            </div>
          </div>

          <!-- Existing user selector -->
          <div v-if="!editingMember && addMemberMode === 'existing'" class="mb-6">
            <UserSelector
              :available-users="availableUsers"
              v-model="selectedExistingUser"
              @user-selected="handleExistingUserSelected"
            />
          </div>

          <!-- New member form -->
          <form 
            v-if="editingMember || addMemberMode === 'new'" 
            @submit.prevent="handleMemberSubmit"
          >
            <!-- Member name -->
            <div class="mb-4">
              <label for="memberName" class="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                id="memberName"
                v-model="memberForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                :class="{ 'border-red-500': memberErrors.name }"
                placeholder="Nombre del miembro"
              />
              <p v-if="memberErrors.name" class="mt-1 text-sm text-red-600">{{ memberErrors.name }}</p>
            </div>

            <!-- Member email -->
            <div class="mb-4">
              <label for="memberEmail" class="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="memberEmail"
                v-model="memberForm.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                :class="{ 'border-red-500': memberErrors.email }"
                placeholder="email@ejemplo.com"
              />
              <p v-if="memberErrors.email" class="mt-1 text-sm text-red-600">{{ memberErrors.email }}</p>
            </div>

            <!-- Member role -->
            <div class="mb-6">
              <label for="memberRole" class="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                id="memberRole"
                v-model="memberForm.role"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                :class="{ 'border-red-500': memberErrors.role }"
              >
                <option value="">Seleccionar rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Desarrollador">Desarrollador</option>
                <option value="Diseñador">Diseñador</option>
                <option value="Analista">Analista</option>
                <option value="Tester">Tester</option>
                <option value="Colaborador">Colaborador</option>
              </select>
              <p v-if="memberErrors.role" class="mt-1 text-sm text-red-600">{{ memberErrors.role }}</p>
            </div>

            <!-- Form actions for new member form -->
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeMemberForm"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="isSubmittingMember"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isSubmittingMember" class="flex items-center">
                  <i class="pi pi-spinner pi-spin mr-2"></i>
                  {{ editingMember ? 'Actualizando...' : 'Agregando...' }}
                </span>
                <span v-else>
                  {{ editingMember ? 'Actualizar' : 'Agregar' }}
                </span>
              </button>
            </div>
          </form>

          <!-- Actions for existing user selection -->
          <div v-if="!editingMember && addMemberMode === 'existing'" class="flex justify-end space-x-3 mt-6">
            <button
              @click="closeMemberForm"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              @click="handleExistingUserSubmit"
              :disabled="!selectedExistingUser || isSubmittingMember"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmittingMember" class="flex items-center">
                <i class="pi pi-spinner pi-spin mr-2"></i>
                Agregando...
              </span>
              <span v-else>
                Agregar al Proyecto
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Member Confirmation Modal -->
    <div 
      v-if="showDeleteMemberConfirm" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteMemberConfirm = false"
    >
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div class="p-6">
          <div class="flex items-center mb-4">
            <i class="pi pi-exclamation-triangle text-red-600 text-2xl mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
          </div>
          <p class="text-gray-600 mb-6">
            ¿Estás seguro de que deseas eliminar a "{{ deletingMember?.name }}" del equipo? 
            Sus tareas asignadas quedarán sin asignar.
          </p>
          <div class="flex justify-end space-x-3">
            <button
              @click="showDeleteMemberConfirm = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              @click="confirmDeleteMember"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import UserSelector from './UserSelector.vue'
import { userService } from '../../services/userService.js'

export default {
  name: 'TeamManager',
  components: {
    UserSelector
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showAddMemberForm: false,
      showEditMemberForm: false,
      showDeleteMemberConfirm: false,
      editingMember: null,
      deletingMember: null,
      memberForm: {
        name: '',
        email: '',
        role: ''
      },
      memberErrors: {},
      isSubmittingMember: false,
      addMemberMode: 'existing', // 'existing' or 'new'
      selectedExistingUser: null,
      availableUsers: []
    }
  },
  computed: {
    ...mapGetters('projects', {
      isLoading: 'isLoading',
      error: 'error',
      currentProject: 'currentProject'
    }),
    teamMembers() {
      return this.currentProject?.teamMembers || []
    }
  },
  methods: {
    ...mapActions('projects', ['addTeamMember', 'updateTeamMember', 'removeTeamMember', 'setCurrentProject']),
    
    getInitials(name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    },
    
    closeMemberForm() {
      this.showAddMemberForm = false
      this.showEditMemberForm = false
      this.editingMember = null
      this.resetMemberForm()
      this.selectedExistingUser = null
      this.addMemberMode = 'existing'
    },
    
    resetMemberForm() {
      this.memberForm = {
        name: '',
        email: '',
        role: ''
      }
      this.memberErrors = {}
    },

    loadAvailableUsers() {
      this.availableUsers = userService.getAvailableUsersForProject(this.projectId)
    },

    handleExistingUserSelected(user) {
      this.selectedExistingUser = user
    },

    async handleExistingUserSubmit() {
      if (!this.selectedExistingUser) return

      this.isSubmittingMember = true

      try {
        await this.addTeamMember({
          projectId: this.projectId,
          memberData: {
            name: this.selectedExistingUser.name,
            email: this.selectedExistingUser.email,
            role: this.selectedExistingUser.role
          }
        })

        this.closeMemberForm()
      } catch (error) {
        console.error('Error adding existing user to team:', error)
        // TODO: Show error notification
      } finally {
        this.isSubmittingMember = false
      }
    },
    
    handleEditMember(member) {
      this.editingMember = member
      this.memberForm = {
        name: member.name,
        email: member.email,
        role: member.role
      }
      this.showEditMemberForm = true
    },
    
    handleDeleteMember(member) {
      this.deletingMember = member
      this.showDeleteMemberConfirm = true
    },
    
    validateMemberForm() {
      this.memberErrors = {}
      
      if (!this.memberForm.name.trim()) {
        this.memberErrors.name = 'El nombre es requerido'
      }
      
      if (!this.memberForm.email.trim()) {
        this.memberErrors.email = 'El email es requerido'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.memberForm.email)) {
        this.memberErrors.email = 'El email no es válido'
      }
      
      if (!this.memberForm.role) {
        this.memberErrors.role = 'El rol es requerido'
      }
      
      // Check for duplicate email (only when adding or changing email)
      const existingMember = this.teamMembers.find(member => 
        member.email === this.memberForm.email && 
        (!this.editingMember || member.id !== this.editingMember.id)
      )
      if (existingMember) {
        this.memberErrors.email = 'Ya existe un miembro con este email'
      }
      
      return Object.keys(this.memberErrors).length === 0
    },
    
    async handleMemberSubmit() {
      if (!this.validateMemberForm()) {
        return
      }
      
      this.isSubmittingMember = true
      
      try {
        if (this.editingMember) {
          await this.updateTeamMember({
            projectId: this.projectId,
            member: {
              ...this.editingMember,
              ...this.memberForm
            }
          })
        } else {
          await this.addTeamMember({
            projectId: this.projectId,
            memberData: this.memberForm
          })

          // Sync new user to global users list
          userService.syncUserFromTeamMember(this.memberForm)
        }
        
        this.closeMemberForm()
        this.loadAvailableUsers() // Refresh available users list
      } catch (error) {
        console.error('Error saving team member:', error)
        // TODO: Show error notification
      } finally {
        this.isSubmittingMember = false
      }
    },
    
    async confirmDeleteMember() {
      try {
        await this.removeTeamMember({
          projectId: this.projectId,
          memberId: this.deletingMember.id
        })
        
        this.showDeleteMemberConfirm = false
        this.deletingMember = null
      } catch (error) {
        console.error('Error deleting team member:', error)
        // TODO: Show error notification
      }
    }
  },
  
  async mounted() {
    // Ensure current project is loaded
    if (!this.currentProject || this.currentProject.id !== this.projectId) {
      await this.setCurrentProject(this.projectId)
    }
    
    // Load available users for selection
    this.loadAvailableUsers()
  },

  watch: {
    // Reload available users when team members change
    teamMembers: {
      handler() {
        this.loadAvailableUsers()
      },
      deep: true
    }
  }
}
</script>