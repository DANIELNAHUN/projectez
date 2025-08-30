<template>
  <div class="task-form-example p-6">
    <h1 class="text-2xl font-bold mb-6">TaskForm with Enhanced Date Management</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Task Form -->
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-semibold mb-4">{{ isEditing ? 'Edit Task' : 'Create New Task' }}</h2>
        
        <TaskForm
          :task="selectedTask"
          :project-id="'example-project'"
          :team-members="teamMembers"
          @submit="handleTaskSubmit"
          @cancel="handleTaskCancel"
        />
      </div>
      
      <!-- Task Preview -->
      <div class="bg-gray-50 p-6 rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Task Preview</h2>
        
        <div v-if="lastSubmittedTask" class="space-y-3">
          <div>
            <strong>Title:</strong> {{ lastSubmittedTask.title }}
          </div>
          <div>
            <strong>Description:</strong> {{ lastSubmittedTask.description || 'No description' }}
          </div>
          <div>
            <strong>Start Date:</strong> {{ formatDate(lastSubmittedTask.startDate) }}
          </div>
          <div>
            <strong>End Date:</strong> {{ formatDate(lastSubmittedTask.endDate) }}
          </div>
          <div>
            <strong>Duration:</strong> {{ lastSubmittedTask.duration }} working days
          </div>
          <div>
            <strong>Adjust Start Date:</strong> {{ lastSubmittedTask.adjustStartDate ? 'Yes' : 'No' }}
          </div>
          <div>
            <strong>Status:</strong> {{ lastSubmittedTask.status }}
          </div>
          <div>
            <strong>Priority:</strong> {{ lastSubmittedTask.priority }}
          </div>
          <div>
            <strong>Type:</strong> {{ lastSubmittedTask.type }}
          </div>
        </div>
        
        <div v-else class="text-gray-500 italic">
          Submit a task to see the preview
        </div>
        
        <!-- Test Buttons -->
        <div class="mt-6 space-y-2">
          <button 
            @click="loadSampleTask"
            class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Load Sample Task for Editing
          </button>
          <button 
            @click="clearTask"
            class="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Form (New Task)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import TaskForm from '../components/task/TaskForm.vue'
import { Task } from '../models/index.js'

export default {
  name: 'TaskFormExample',
  components: {
    TaskForm
  },
  setup() {
    const selectedTask = ref(null)
    const lastSubmittedTask = ref(null)
    
    const teamMembers = ref([
      { id: 'member1', name: 'John Doe', role: 'Developer' },
      { id: 'member2', name: 'Jane Smith', role: 'Designer' },
      { id: 'member3', name: 'Bob Johnson', role: 'Project Manager' }
    ])
    
    const isEditing = computed(() => !!selectedTask.value)
    
    const handleTaskSubmit = (taskData) => {
      console.log('Task submitted:', taskData)
      lastSubmittedTask.value = taskData
      
      // Create a Task instance to verify the model works correctly
      const task = new Task(taskData)
      console.log('Task instance created:', task)
      console.log('Task JSON:', task.toJSON())
    }
    
    const handleTaskCancel = () => {
      console.log('Task form cancelled')
    }
    
    const loadSampleTask = () => {
      const sampleTask = new Task({
        id: 'sample-task-1',
        title: 'Sample Task with Duration',
        description: 'This is a sample task to test the enhanced date management features.',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
        duration: 3,
        adjustStartDate: true,
        status: 'in_progress',
        type: 'with_deliverable',
        priority: 'high',
        assignedTo: 'member1',
        progress: 25,
        deliverable: {
          type: 'presentation',
          description: 'Project presentation slides',
          dueDate: new Date('2024-02-05'),
          status: 'pending',
          notes: 'Include charts and graphs'
        }
      })
      
      selectedTask.value = sampleTask
      console.log('Sample task loaded:', sampleTask)
    }
    
    const clearTask = () => {
      selectedTask.value = null
      console.log('Form cleared for new task')
    }
    
    const formatDate = (date) => {
      if (!date) return 'Not set'
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }
    
    return {
      selectedTask,
      lastSubmittedTask,
      teamMembers,
      isEditing,
      handleTaskSubmit,
      handleTaskCancel,
      loadSampleTask,
      clearTask,
      formatDate
    }
  }
}
</script>

<style scoped>
.task-form-example {
  min-height: 100vh;
  background-color: #f3f4f6;
}
</style>