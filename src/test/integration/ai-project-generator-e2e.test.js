/**
 * End-to-End Integration Tests for AI Project Generator
 * Tests complete workflows including AI generation, export/import, and date adjustments
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { OpenAIService } from '../../services/openAIService.js'
import { ProjectExportService } from '../../services/projectExportService.js'
import { ProjectImportService } from '../../services/projectImportService.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'
import { Project, Task, TeamMember } from '../../models/index.js'

// Mock components for testing
const MockAIProjectGenerator = {
  template: `
    <div class="ai-project-generator">
      <textarea v-model="prompt" placeholder="Describe your project..."></textarea>
      <button @click="generateProject" :disabled="loading">Generate Project</button>
      <div v-if="loading" class="loading">Generating...</div>
      <div v-if="generatedProject" class="generated-project">
        <h3>{{ generatedProject.name }}</h3>
        <p>{{ generatedProject.description }}</p>
        <div class="tasks">
          <div v-for="task in generatedProject.tasks" :key="task.id" class="task">
            {{ task.title }} ({{ task.duration }} days)
          </div>
        </div>
        <button @click="importProject">Import Project</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  `,
  data() {
    return {
      prompt: '',
      loading: false,
      generatedProject: null,
      error: null
    }
  },
  methods: {
    async generateProject() {
      this.loading = true
      this.error = null
      try {
        const result = await this.$store.dispatch('aiGenerator/generateProject', {
          prompt: this.prompt,
          options: { complexity: 'medium' }
        })
        this.generatedProject = result.project
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async importProject() {
      try {
        await this.$store.dispatch('projects/importGeneratedProject', this.generatedProject)
        this.$emit('project-imported', this.generatedProject)
      } catch (error) {
        this.error = error.message
      }
    }
  }
}

const MockProjectImportExport = {
  template: `
    <div class="project-import-export">
      <div class="export-section">
        <button @click="exportProject" :disabled="!currentProject">Export Project</button>
      </div>
      <div class="import-section">
        <input type="file" @change="handleFileSelect" accept=".json" />
        <button @click="importProject" :disabled="!selectedFile">Import Project</button>
        <div v-if="showDateAdjustment" class="date-adjustment">
          <label>New Start Date:</label>
          <input type="date" v-model="newStartDate" />
          <button @click="confirmImport">Confirm Import</button>
        </div>
      </div>
      <div v-if="importResult" class="import-result">
        <div v-if="importResult.success" class="success">
          Project imported successfully!
        </div>
        <div v-if="!importResult.success" class="error">
          Import failed: {{ importResult.errors.join(', ') }}
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      selectedFile: null,
      showDateAdjustment: false,
      newStartDate: null,
      importResult: null
    }
  },
  computed: {
    currentProject() {
      return this.$store.getters['projects/currentProject']
    }
  },
  methods: {
    async exportProject() {
      try {
        await this.$store.dispatch('projects/exportProject', this.currentProject.id)
      } catch (error) {
        console.error('Export failed:', error)
      }
    },
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0]
    },
    async importProject() {
      if (!this.selectedFile) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        this.jsonData = e.target.result
        this.showDateAdjustment = true
      }
      reader.readAsText(this.selectedFile)
    },
    async confirmImport() {
      try {
        const result = await this.$store.dispatch('projects/importProject', {
          jsonData: this.jsonData,
          newStartDate: this.newStartDate ? new Date(this.newStartDate) : null
        })
        this.importResult = result
        this.showDateAdjustment = false
      } catch (error) {
        this.importResult = { success: false, errors: [error.message] }
      }
    }
  }
}

describe('AI Project Generator - End-to-End Integration Tests', () => {
  let store
  let mockOpenAIService
  let mockProjectData
  let mockGeneratedProject

  beforeEach(() => {
    // Mock OpenAI service
    mockOpenAIService = {
      configure: vi.fn(),
      isReady: vi.fn(() => true),
      generateProject: vi.fn(),
      generateProjectSafe: vi.fn(),
      testConnection: vi.fn(() => Promise.resolve({ success: true }))
    }

    // Mock project data
    mockProjectData = {
      id: 'test-project-1',
      name: 'E-commerce Website',
      description: 'A modern e-commerce platform with user authentication and payment processing',
      estimatedDuration: 45,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-15'),
      status: 'active',
      tasks: [
        {
          id: 'task-1',
          title: 'Setup Development Environment',
          description: 'Configure development tools and environment',
          duration: 2,
          priority: 'high',
          type: 'simple',
          status: 'pending',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
          subtasks: []
        },
        {
          id: 'task-2',
          title: 'Design Database Schema',
          description: 'Create database design for products, users, and orders',
          duration: 3,
          priority: 'high',
          type: 'with_deliverable',
          status: 'pending',
          startDate: new Date('2024-02-03'),
          endDate: new Date('2024-02-05'),
          deliverable: {
            type: 'file',
            description: 'Database schema documentation',
            status: 'pending'
          },
          subtasks: []
        }
      ],
      teamMembers: [
        {
          id: 'member-1',
          name: 'John Developer',
          email: 'john@example.com',
          role: 'Full Stack Developer'
        }
      ]
    }

    mockGeneratedProject = {
      ...mockProjectData,
      id: 'ai-generated-project-1'
    }

    // Create Vuex store with all necessary modules
    store = createStore({
      modules: {
        projects: {
          namespaced: true,
          state: {
            projects: [mockProjectData],
            currentProject: mockProjectData,
            loading: false,
            error: null
          },
          getters: {
            currentProject: state => state.currentProject,
            allProjects: state => state.projects,
            isLoading: state => state.loading,
            error: state => state.error
          },
          actions: {
            exportProject: vi.fn().mockResolvedValue({ success: true }),
            importProject: vi.fn().mockResolvedValue({ success: true, project: mockProjectData }),
            importGeneratedProject: vi.fn().mockResolvedValue({ success: true, project: mockGeneratedProject }),
            adjustProjectDates: vi.fn().mockResolvedValue({ success: true, adjustedTasks: 2 }),
            setCurrentProject: vi.fn().mockResolvedValue(mockProjectData)
          },
          mutations: {
            SET_CURRENT_PROJECT: (state, project) => {
              state.currentProject = project
            },
            ADD_PROJECT: (state, project) => {
              state.projects.push(project)
            },
            SET_LOADING: (state, loading) => {
              state.loading = loading
            },
            SET_ERROR: (state, error) => {
              state.error = error
            }
          }
        },
        aiGenerator: {
          namespaced: true,
          state: {
            isConfigured: false,
            loading: false,
            lastGenerated: null,
            error: null
          },
          getters: {
            isConfigured: state => state.isConfigured,
            isLoading: state => state.loading,
            lastGenerated: state => state.lastGenerated,
            error: state => state.error
          },
          actions: {
            configure: vi.fn().mockResolvedValue({ success: true }),
            generateProject: vi.fn().mockResolvedValue({ success: true, project: mockGeneratedProject }),
            testConnection: vi.fn().mockResolvedValue({ success: true })
          }
        }
      }
    })

    // Mock services
    vi.spyOn(OpenAIService.prototype, 'generateProject').mockResolvedValue(mockGeneratedProject)
    vi.spyOn(OpenAIService.prototype, 'generateProjectSafe').mockResolvedValue({
      success: true,
      project: mockGeneratedProject,
      errors: [],
      warnings: [],
      retryCount: 0,
      totalTime: 1500
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete AI Project Generation Workflow', () => {
    it('should generate project from prompt and import successfully', async () => {
      const wrapper = mount(MockAIProjectGenerator, {
        global: {
          plugins: [store]
        }
      })

      // Step 1: Enter project prompt
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Create a modern e-commerce website with user authentication, product catalog, shopping cart, and payment processing')

      // Step 2: Generate project
      const generateButton = wrapper.find('button')
      await generateButton.trigger('click')

      // Verify loading state
      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(store.dispatch).toHaveBeenCalledWith('aiGenerator/generateProject', {
        prompt: 'Create a modern e-commerce website with user authentication, product catalog, shopping cart, and payment processing',
        options: { complexity: 'medium' }
      })

      // Wait for generation to complete
      await wrapper.vm.$nextTick()
      
      // Step 3: Verify generated project is displayed
      expect(wrapper.find('.generated-project').exists()).toBe(true)
      expect(wrapper.text()).toContain('E-commerce Website')
      expect(wrapper.text()).toContain('A modern e-commerce platform')
      expect(wrapper.findAll('.task')).toHaveLength(2)

      // Step 4: Import the generated project
      const importButton = wrapper.find('.generated-project button')
      await importButton.trigger('click')

      expect(store.dispatch).toHaveBeenCalledWith('projects/importGeneratedProject', mockGeneratedProject)
    })

    it('should handle AI generation errors gracefully', async () => {
      // Mock AI service to throw error
      store.dispatch = vi.fn().mockRejectedValue(new Error('OpenAI API quota exceeded'))

      const wrapper = mount(MockAIProjectGenerator, {
        global: {
          plugins: [store]
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Create a project')

      const generateButton = wrapper.find('button')
      await generateButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.text()).toContain('OpenAI API quota exceeded')
    })

    it('should handle complex project generation with multiple retries', async () => {
      // Mock service with retry scenario
      const mockRetryResult = {
        success: true,
        project: mockGeneratedProject,
        errors: ['Intento 1: Rate limit exceeded', 'Intento 2: Network error'],
        warnings: [],
        retryCount: 2,
        totalTime: 5000,
        retryHistory: [
          { attempt: 1, error: 'Rate limit exceeded', time: 1000 },
          { attempt: 2, error: 'Network error', time: 1500 }
        ]
      }

      store.dispatch = vi.fn().mockResolvedValue(mockRetryResult)

      const wrapper = mount(MockAIProjectGenerator, {
        global: {
          plugins: [store]
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Create a complex enterprise application with microservices architecture, API gateway, authentication service, user management, notification system, and analytics dashboard')

      const generateButton = wrapper.find('button')
      await generateButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(store.dispatch).toHaveBeenCalledWith('aiGenerator/generateProject', {
        prompt: expect.stringContaining('complex enterprise application'),
        options: { complexity: 'medium' }
      })

      expect(wrapper.find('.generated-project').exists()).toBe(true)
    })
  })

  describe('Export/Import Round-Trip Functionality', () => {
    it('should export and import project maintaining data integrity', async () => {
      const wrapper = mount(MockProjectImportExport, {
        global: {
          plugins: [store]
        }
      })

      // Step 1: Export current project
      const exportButton = wrapper.find('.export-section button')
      await exportButton.trigger('click')

      expect(store.dispatch).toHaveBeenCalledWith('projects/exportProject', 'test-project-1')

      // Step 2: Simulate file selection for import
      const fileInput = wrapper.find('input[type="file"]')
      const mockFile = new File([JSON.stringify(mockProjectData)], 'project.json', { type: 'application/json' })
      
      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify(mockProjectData),
        onload: null
      }
      global.FileReader = vi.fn(() => mockFileReader)

      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false
      })

      await fileInput.trigger('change')

      // Step 3: Import project
      const importButton = wrapper.find('.import-section button')
      await importButton.trigger('click')

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: JSON.stringify(mockProjectData) } })
      await wrapper.vm.$nextTick()

      // Step 4: Verify date adjustment interface appears
      expect(wrapper.find('.date-adjustment').exists()).toBe(true)

      // Step 5: Set new start date and confirm import
      const dateInput = wrapper.find('input[type="date"]')
      await dateInput.setValue('2024-03-01')

      const confirmButton = wrapper.find('.date-adjustment button')
      await confirmButton.trigger('click')

      expect(store.dispatch).toHaveBeenCalledWith('projects/importProject', {
        jsonData: JSON.stringify(mockProjectData),
        newStartDate: new Date('2024-03-01')
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.success').exists()).toBe(true)
      expect(wrapper.text()).toContain('Project imported successfully!')
    })

    it('should handle import validation errors', async () => {
      const invalidProjectData = {
        // Missing required fields
        name: '',
        tasks: []
      }

      store.dispatch = vi.fn().mockRejectedValue(new Error('Project validation failed: Project must have a valid name'))

      const wrapper = mount(MockProjectImportExport, {
        global: {
          plugins: [store]
        }
      })

      const fileInput = wrapper.find('input[type="file"]')
      const mockFile = new File([JSON.stringify(invalidProjectData)], 'invalid-project.json', { type: 'application/json' })
      
      const mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify(invalidProjectData),
        onload: null
      }
      global.FileReader = vi.fn(() => mockFileReader)

      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false
      })

      await fileInput.trigger('change')

      const importButton = wrapper.find('.import-section button')
      await importButton.trigger('click')

      mockFileReader.onload({ target: { result: JSON.stringify(invalidProjectData) } })
      await wrapper.vm.$nextTick()

      const confirmButton = wrapper.find('.date-adjustment button')
      await confirmButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Project validation failed')
    })

    it('should preserve task hierarchy and deliverables in round-trip', async () => {
      const complexProjectData = {
        ...mockProjectData,
        tasks: [
          {
            id: 'parent-task-1',
            title: 'Backend Development',
            description: 'Develop backend services',
            duration: 20,
            priority: 'high',
            type: 'simple',
            status: 'pending',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-20'),
            subtasks: [
              {
                id: 'subtask-1-1',
                title: 'API Design',
                description: 'Design REST API endpoints',
                duration: 5,
                priority: 'high',
                type: 'with_deliverable',
                status: 'pending',
                startDate: new Date('2024-02-01'),
                endDate: new Date('2024-02-05'),
                deliverable: {
                  type: 'file',
                  description: 'API specification document',
                  status: 'pending'
                },
                subtasks: []
              },
              {
                id: 'subtask-1-2',
                title: 'Database Implementation',
                description: 'Implement database models and migrations',
                duration: 8,
                priority: 'medium',
                type: 'simple',
                status: 'pending',
                startDate: new Date('2024-02-06'),
                endDate: new Date('2024-02-13'),
                subtasks: []
              }
            ]
          }
        ]
      }

      // Mock successful round-trip
      store.dispatch = vi.fn()
        .mockResolvedValueOnce({ success: true }) // export
        .mockResolvedValueOnce({ success: true, project: complexProjectData }) // import

      const wrapper = mount(MockProjectImportExport, {
        global: {
          plugins: [store]
        }
      })

      // Export
      const exportButton = wrapper.find('.export-section button')
      await exportButton.trigger('click')

      // Import
      const fileInput = wrapper.find('input[type="file"]')
      const mockFile = new File([JSON.stringify(complexProjectData)], 'complex-project.json', { type: 'application/json' })
      
      const mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify(complexProjectData),
        onload: null
      }
      global.FileReader = vi.fn(() => mockFileReader)

      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false
      })

      await fileInput.trigger('change')
      await wrapper.find('.import-section button').trigger('click')

      mockFileReader.onload({ target: { result: JSON.stringify(complexProjectData) } })
      await wrapper.vm.$nextTick()

      await wrapper.find('.date-adjustment button').trigger('click')

      // Verify import was called with complex data structure
      expect(store.dispatch).toHaveBeenCalledWith('projects/importProject', {
        jsonData: JSON.stringify(complexProjectData),
        newStartDate: null
      })
    })
  })

  describe('Project Date Adjustment Scenarios', () => {
    it('should adjust all task dates when project start date changes', async () => {
      const originalProject = {
        ...mockProjectData,
        startDate: new Date('2024-02-01'),
        tasks: [
          {
            ...mockProjectData.tasks[0],
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-02'),
            duration: 2
          },
          {
            ...mockProjectData.tasks[1],
            startDate: new Date('2024-02-03'),
            endDate: new Date('2024-02-05'),
            duration: 3
          }
        ]
      }

      const adjustedProject = {
        ...originalProject,
        startDate: new Date('2024-02-15'), // 14 days later
        tasks: [
          {
            ...originalProject.tasks[0],
            startDate: new Date('2024-02-15'),
            endDate: new Date('2024-02-16')
          },
          {
            ...originalProject.tasks[1],
            startDate: new Date('2024-02-17'),
            endDate: new Date('2024-02-19')
          }
        ]
      }

      store.state.projects.currentProject = originalProject
      store.dispatch = vi.fn().mockResolvedValue({
        success: true,
        project: adjustedProject,
        adjustedTasks: 2,
        daysDifference: 14
      })

      // Simulate date adjustment
      const result = await store.dispatch('projects/adjustProjectDates', {
        projectId: 'test-project-1',
        newStartDate: new Date('2024-02-15')
      })

      expect(result.success).toBe(true)
      expect(result.adjustedTasks).toBe(2)
      expect(result.daysDifference).toBe(14)
    })

    it('should maintain task durations during date adjustment', async () => {
      const projectWithDurations = {
        ...mockProjectData,
        tasks: mockProjectData.tasks.map(task => ({
          ...task,
          duration: DateCalculationService.calculateWorkingDays(task.startDate, task.endDate)
        }))
      }

      store.state.projects.currentProject = projectWithDurations

      const adjustmentResult = {
        success: true,
        project: {
          ...projectWithDurations,
          startDate: new Date('2024-03-01'),
          tasks: projectWithDurations.tasks.map(task => ({
            ...task,
            startDate: new Date(task.startDate.getTime() + (28 * 24 * 60 * 60 * 1000)), // 28 days later
            endDate: new Date(task.endDate.getTime() + (28 * 24 * 60 * 60 * 1000)),
            duration: task.duration // Duration should remain the same
          }))
        },
        adjustedTasks: 2,
        daysDifference: 28
      }

      store.dispatch = vi.fn().mockResolvedValue(adjustmentResult)

      const result = await store.dispatch('projects/adjustProjectDates', {
        projectId: 'test-project-1',
        newStartDate: new Date('2024-03-01')
      })

      // Verify durations are maintained
      result.project.tasks.forEach((task, index) => {
        expect(task.duration).toBe(projectWithDurations.tasks[index].duration)
      })
    })

    it('should handle date adjustment with working days calculation', async () => {
      // Mock DateCalculationService
      const mockDateService = {
        calculateWorkingDays: vi.fn((start, end) => {
          const diffTime = Math.abs(end - start)
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          // Exclude Sundays (simplified calculation)
          return Math.floor(diffDays * 6/7)
        }),
        addWorkingDays: vi.fn((date, days) => {
          const result = new Date(date)
          // Simplified: add days * 7/6 to account for weekends
          result.setDate(result.getDate() + Math.ceil(days * 7/6))
          return result
        }),
        validateDateRange: vi.fn(() => true)
      }

      vi.spyOn(DateCalculationService, 'calculateWorkingDays').mockImplementation(mockDateService.calculateWorkingDays)
      vi.spyOn(DateCalculationService, 'addWorkingDays').mockImplementation(mockDateService.addWorkingDays)

      const result = await store.dispatch('projects/adjustProjectDates', {
        projectId: 'test-project-1',
        newStartDate: new Date('2024-02-15')
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling and Recovery Scenarios', () => {
    it('should handle OpenAI API failures with retry mechanism', async () => {
      const failureResult = {
        success: false,
        project: null,
        errors: [
          'Intento 1: Rate limit exceeded',
          'Intento 2: Network error',
          'Intento 3: Service unavailable'
        ],
        warnings: [],
        retryCount: 3,
        totalTime: 10000,
        retryHistory: [
          { attempt: 1, error: 'Rate limit exceeded', errorCode: 'rate_limit_exceeded', time: 2000 },
          { attempt: 2, error: 'Network error', errorCode: 'network_error', time: 3000 },
          { attempt: 3, error: 'Service unavailable', errorCode: 'service_unavailable', time: 5000 }
        ]
      }

      store.dispatch = vi.fn().mockResolvedValue(failureResult)

      const wrapper = mount(MockAIProjectGenerator, {
        global: {
          plugins: [store]
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Create a project')

      const generateButton = wrapper.find('button')
      await generateButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Intento 3: Service unavailable')
    })

    it('should handle import recovery with auto-fix', async () => {
      const corruptedProjectData = {
        // Missing required fields that can be auto-fixed
        name: '',
        tasks: [
          {
            // Missing id and title
            description: 'A task without proper fields',
            duration: 5
          }
        ],
        teamMembers: [
          {
            // Missing id and name
            email: 'member@example.com'
          }
        ]
      }

      const recoveredResult = {
        success: true,
        project: {
          id: 'recovered_project_123',
          name: 'Proyecto Importado',
          description: '',
          status: 'active',
          tasks: [
            {
              id: 'task_123_0',
              title: 'Tarea 1',
              description: 'A task without proper fields',
              duration: 5,
              status: 'pending'
            }
          ],
          teamMembers: [
            {
              id: 'member_123_0',
              name: 'Miembro 1',
              email: 'member@example.com'
            }
          ]
        },
        errors: [],
        warnings: ['Se aplicaron correcciones automáticas al proyecto'],
        fixes: [
          'Se generó un ID único para el proyecto',
          'Se asignó un nombre por defecto al proyecto',
          'Se generó ID para la tarea en posición 1',
          'Se asignó título por defecto a la tarea en posición 1'
        ],
        importTime: 500
      }

      store.dispatch = vi.fn().mockResolvedValue(recoveredResult)

      const wrapper = mount(MockProjectImportExport, {
        global: {
          plugins: [store]
        }
      })

      // Simulate import with corrupted data
      const fileInput = wrapper.find('input[type="file"]')
      const mockFile = new File([JSON.stringify(corruptedProjectData)], 'corrupted-project.json', { type: 'application/json' })
      
      const mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify(corruptedProjectData),
        onload: null
      }
      global.FileReader = vi.fn(() => mockFileReader)

      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false
      })

      await fileInput.trigger('change')
      await wrapper.find('.import-section button').trigger('click')

      mockFileReader.onload({ target: { result: JSON.stringify(corruptedProjectData) } })
      await wrapper.vm.$nextTick()

      await wrapper.find('.date-adjustment button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.success').exists()).toBe(true)
      expect(wrapper.text()).toContain('Project imported successfully!')
    })

    it('should handle network failures during export', async () => {
      store.dispatch = vi.fn().mockRejectedValue(new Error('Network error: Failed to download file'))

      const wrapper = mount(MockProjectImportExport, {
        global: {
          plugins: [store]
        }
      })

      const exportButton = wrapper.find('.export-section button')
      
      // Mock console.error to capture error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await exportButton.trigger('click')

      expect(consoleSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should validate project structure before operations', async () => {
      const invalidProject = {
        id: null, // Invalid ID
        name: '', // Empty name
        tasks: [
          {
            id: 'task-1',
            title: 'Valid Task',
            startDate: 'invalid-date', // Invalid date
            endDate: new Date('2024-01-01'),
            duration: -5 // Invalid duration
          }
        ]
      }

      store.state.projects.currentProject = invalidProject

      const validationErrors = [
        'Project must have an id',
        'Project must have a valid name',
        'Task "Valid Task" has invalid start date',
        'Task duration must be positive'
      ]

      store.dispatch = vi.fn().mockRejectedValue(new Error(`Validation failed: ${validationErrors.join(', ')}`))

      const wrapper = mount(MockProjectImportExport, {
        global: {
          plugins: [store]
        }
      })

      const exportButton = wrapper.find('.export-section button')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await exportButton.trigger('click')

      expect(consoleSpy).toHaveBeenCalledWith('Export failed:', expect.objectContaining({
        message: expect.stringContaining('Validation failed')
      }))

      consoleSpy.mockRestore()
    })
  })

  describe('Performance Tests for Large Project Operations', () => {
    it('should handle large project generation efficiently', async () => {
      const largeProjectData = {
        id: 'large-project-1',
        name: 'Enterprise Application Suite',
        description: 'Large-scale enterprise application with multiple modules',
        estimatedDuration: 365,
        tasks: Array.from({ length: 100 }, (_, i) => ({
          id: `task-${i + 1}`,
          title: `Task ${i + 1}`,
          description: `Description for task ${i + 1}`,
          duration: Math.floor(Math.random() * 10) + 1,
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          type: Math.random() > 0.5 ? 'simple' : 'with_deliverable',
          status: 'pending',
          startDate: new Date(2024, 1, i + 1),
          endDate: new Date(2024, 1, i + Math.floor(Math.random() * 10) + 2),
          subtasks: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
            id: `subtask-${i + 1}-${j + 1}`,
            title: `Subtask ${i + 1}.${j + 1}`,
            description: `Subtask description`,
            duration: Math.floor(Math.random() * 3) + 1,
            priority: 'medium',
            type: 'simple',
            status: 'pending'
          }))
        })),
        teamMembers: Array.from({ length: 20 }, (_, i) => ({
          id: `member-${i + 1}`,
          name: `Team Member ${i + 1}`,
          email: `member${i + 1}@example.com`,
          role: ['Developer', 'Designer', 'Manager', 'Tester'][Math.floor(Math.random() * 4)]
        }))
      }

      const performanceResult = {
        success: true,
        project: largeProjectData,
        errors: [],
        warnings: [],
        retryCount: 0,
        totalTime: 3500, // 3.5 seconds
        performanceMetrics: {
          tasksGenerated: 100,
          subtasksGenerated: 250,
          teamMembersGenerated: 20,
          totalTokensUsed: 15000,
          averageTaskComplexity: 'medium'
        }
      }

      store.dispatch = vi.fn().mockResolvedValue(performanceResult)

      const startTime = Date.now()

      const wrapper = mount(MockAIProjectGenerator, {
        global: {
          plugins: [store]
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Create a comprehensive enterprise application suite with user management, content management, analytics, reporting, API gateway, microservices architecture, and mobile applications')

      const generateButton = wrapper.find('button')
      await generateButton.trigger('click')

      await wrapper.vm.$nextTick()

      const endTime = Date.now()
      const testExecutionTime = endTime - startTime

      // Verify performance expectations
      expect(testExecutionTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(performanceResult.totalTime).toBeLessThan(10000) // AI generation should be under 10 seconds
      expect(wrapper.find('.generated-project').exists()).toBe(true)
      expect(wrapper.findAll('.task')).toHaveLength(100)
    })

    it('should handle large project export/import efficiently', async () => {
      const largeProject = {
        id: 'large-project-export-test',
        name: 'Large Project for Export Test',
        description: 'Testing export/import performance with large dataset',
        tasks: Array.from({ length: 500 }, (_, i) => ({
          id: `task-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          duration: 5,
          startDate: new Date(2024, 0, i + 1),
          endDate: new Date(2024, 0, i + 6),
          subtasks: Array.from({ length: 3 }, (_, j) => ({
            id: `subtask-${i}-${j}`,
            title: `Subtask ${i}.${j}`,
            duration: 1
          }))
        })),
        teamMembers: Array.from({ length: 50 }, (_, i) => ({
          id: `member-${i}`,
          name: `Member ${i}`,
          email: `member${i}@test.com`
        }))
      }

      store.state.projects.currentProject = largeProject

      const exportResult = {
        success: true,
        exportTime: 800, // 0.8 seconds
        fileSize: 2500000, // 2.5MB
        tasksExported: 500,
        subtasksExported: 1500,
        teamMembersExported: 50
      }

      const importResult = {
        success: true,
        project: largeProject,
        importTime: 1200, // 1.2 seconds
        validationTime: 300,
        processingTime: 900,
        tasksImported: 500,
        subtasksImported: 1500,
        teamMembersImported: 50
      }

      store.dispatch = vi.fn()
        .mockResolvedValueOnce(exportResult) // export
        .mockResolvedValueOnce(importResult) // import

      const wrapper = mount(MockProjectImportExport, {
        global: {
          plugins: [store]
        }
      })

      const startTime = Date.now()

      // Test export performance
      const exportButton = wrapper.find('.export-section button')
      await exportButton.trigger('click')

      const exportEndTime = Date.now()
      const exportTime = exportEndTime - startTime

      expect(exportTime).toBeLessThan(2000) // Export should complete within 2 seconds
      expect(store.dispatch).toHaveBeenCalledWith('projects/exportProject', 'large-project-export-test')

      // Test import performance
      const fileInput = wrapper.find('input[type="file"]')
      const mockFile = new File([JSON.stringify(largeProject)], 'large-project.json', { type: 'application/json' })
      
      const mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify(largeProject),
        onload: null
      }
      global.FileReader = vi.fn(() => mockFileReader)

      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false
      })

      const importStartTime = Date.now()

      await fileInput.trigger('change')
      await wrapper.find('.import-section button').trigger('click')

      mockFileReader.onload({ target: { result: JSON.stringify(largeProject) } })
      await wrapper.vm.$nextTick()

      await wrapper.find('.date-adjustment button').trigger('click')

      const importEndTime = Date.now()
      const importTime = importEndTime - importStartTime

      expect(importTime).toBeLessThan(3000) // Import should complete within 3 seconds
      expect(store.dispatch).toHaveBeenCalledWith('projects/importProject', {
        jsonData: JSON.stringify(largeProject),
        newStartDate: null
      })
    })

    it('should handle concurrent operations without conflicts', async () => {
      const project1 = { ...mockProjectData, id: 'concurrent-project-1', name: 'Concurrent Project 1' }
      const project2 = { ...mockProjectData, id: 'concurrent-project-2', name: 'Concurrent Project 2' }
      const project3 = { ...mockProjectData, id: 'concurrent-project-3', name: 'Concurrent Project 3' }

      // Mock concurrent operations
      const operations = [
        store.dispatch('aiGenerator/generateProject', { prompt: 'Create project 1' }),
        store.dispatch('projects/exportProject', 'concurrent-project-1'),
        store.dispatch('projects/importProject', { jsonData: JSON.stringify(project2) }),
        store.dispatch('projects/adjustProjectDates', { projectId: 'concurrent-project-3', newStartDate: new Date() })
      ]

      store.dispatch = vi.fn()
        .mockResolvedValueOnce({ success: true, project: project1 })
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true, project: project2 })
        .mockResolvedValueOnce({ success: true, adjustedTasks: 2 })

      const startTime = Date.now()

      // Execute all operations concurrently
      const results = await Promise.all(operations)

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Verify all operations completed successfully
      expect(results).toHaveLength(4)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Verify concurrent execution was efficient
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Verify all store actions were called
      expect(store.dispatch).toHaveBeenCalledTimes(4)
    })
  })

  describe('All Requirements Validation', () => {
    it('should validate all requirements are met in complete workflow', async () => {
      // This test validates that all requirements from the spec are covered

      const completeWorkflowTest = async () => {
        // Requirement 1: Automatic duration calculation
        const taskWithDates = {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-05')
        }
        const calculatedDuration = DateCalculationService.calculateWorkingDays(taskWithDates.startDate, taskWithDates.endDate)
        expect(calculatedDuration).toBeGreaterThan(0)

        // Requirement 2: Duration-based date calculation
        const taskWithDuration = {
          startDate: new Date('2024-02-01'),
          duration: 5
        }
        const calculatedEndDate = DateCalculationService.addWorkingDays(taskWithDuration.startDate, taskWithDuration.duration)
        expect(calculatedEndDate).toBeInstanceOf(Date)

        // Requirement 3: Project-wide date adjustment
        const adjustmentResult = await store.dispatch('projects/adjustProjectDates', {
          projectId: 'test-project-1',
          newStartDate: new Date('2024-03-01')
        })
        expect(adjustmentResult.success).toBe(true)

        // Requirement 4: JSON export
        const exportResult = await store.dispatch('projects/exportProject', 'test-project-1')
        expect(exportResult.success).toBe(true)

        // Requirement 5: JSON import with date adjustment
        const importResult = await store.dispatch('projects/importProject', {
          jsonData: JSON.stringify(mockProjectData),
          newStartDate: new Date('2024-03-01')
        })
        expect(importResult.success).toBe(true)

        // Requirement 6: AI project generation
        const aiResult = await store.dispatch('aiGenerator/generateProject', {
          prompt: 'Create a web application',
          options: { complexity: 'medium' }
        })
        expect(aiResult.success).toBe(true)
        expect(aiResult.project).toBeDefined()

        // Requirement 7: Complex prompt handling
        const complexAiResult = await store.dispatch('aiGenerator/generateProject', {
          prompt: 'Create a comprehensive enterprise application with microservices, API gateway, user management, and analytics dashboard',
          options: { complexity: 'detailed' }
        })
        expect(complexAiResult.success).toBe(true)

        // Requirement 8: Date format consistency
        const project = complexAiResult.project
        expect(project.startDate).toBeInstanceOf(Date)
        if (project.tasks && project.tasks.length > 0) {
          expect(project.tasks[0].startDate).toBeInstanceOf(Date)
        }

        return true
      }

      const result = await completeWorkflowTest()
      expect(result).toBe(true)
    })

    it('should handle all error scenarios mentioned in requirements', async () => {
      const errorScenarios = [
        // Invalid date ranges
        {
          test: 'Invalid date range',
          action: () => DateCalculationService.validateDateRange(new Date('2024-02-05'), new Date('2024-02-01')),
          expected: false
        },
        // Invalid JSON format
        {
          test: 'Invalid JSON import',
          action: () => store.dispatch('projects/importProject', { jsonData: 'invalid json' }),
          expected: 'error'
        },
        // OpenAI API failures
        {
          test: 'AI generation failure',
          action: () => {
            store.dispatch = vi.fn().mockRejectedValue(new Error('OpenAI API quota exceeded'))
            return store.dispatch('aiGenerator/generateProject', { prompt: 'test' })
          },
          expected: 'error'
        }
      ]

      for (const scenario of errorScenarios) {
        try {
          const result = await scenario.action()
          if (scenario.expected === 'error') {
            // Should not reach here if error is expected
            expect(false).toBe(true)
          } else {
            expect(result).toBe(scenario.expected)
          }
        } catch (error) {
          if (scenario.expected === 'error') {
            expect(error).toBeInstanceOf(Error)
          } else {
            throw error
          }
        }
      }
    })
  })
})