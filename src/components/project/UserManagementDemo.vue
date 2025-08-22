<template>
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Demostración de Gestión de Usuarios
        </h3>

        <div class="space-y-6">
            <!-- Global Users List -->
            <div>
                <h4 class="font-medium text-gray-900 mb-3">Usuarios Globales ({{ globalUsers.length }})</h4>
                <div v-if="globalUsers.length === 0" class="text-gray-500 text-sm">
                    No hay usuarios creados aún. Ve a "Gestión de Usuarios" para crear algunos o agrégalos desde
                    proyectos.
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div v-for="user in globalUsers" :key="user.id"
                        class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-blue-600 font-semibold text-xs">
                                {{ getInitials(user.name) }}
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-900 truncate">{{ user.name }}</p>
                            <p class="text-sm text-gray-600 truncate">{{ user.email }}</p>
                            <span
                                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {{ user.role }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex space-x-3">
                <button @click="refreshUsers"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    <i class="pi pi-refresh mr-2"></i>
                    Actualizar Lista
                </button>
                <router-link to="/users"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 inline-flex items-center">
                    <i class="pi pi-users mr-2"></i>
                    Ir a Gestión de Usuarios
                </router-link>
            </div>

            <!-- Instructions -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 class="font-medium text-blue-900 mb-2">Cómo usar la nueva funcionalidad:</h5>
                <ul class="text-sm text-blue-800 space-y-1">
                    <li>1. Ve a cualquier proyecto y haz clic en "Agregar Miembro"</li>
                    <li>2. Verás dos opciones: "Seleccionar Usuario Existente" y "Crear Nuevo Usuario"</li>
                    <li>3. Si seleccionas un usuario existente, podrás cambiar su rol para este proyecto específico</li>
                    <li>4. Los usuarios creados se guardan globalmente y están disponibles para otros proyectos</li>
                    <li>5. Puedes buscar usuarios por nombre, email o rol</li>
                    <li>6. Ve a "Gestión de Usuarios" en el menú para administrar todos los usuarios del sistema</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import { userService } from '../../services/userService.js'

export default {
    name: 'UserManagementDemo',
    data() {
        return {
            globalUsers: []
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

        refreshUsers() {
            this.globalUsers = userService.getAllUsers()
        },


    },

    mounted() {
        this.refreshUsers()
    }
}
</script>