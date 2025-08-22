import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockLocalStorage, mockProject, mockTask, mockTeamMember, generateNestedTasks } from './utils.js'

describe('Basic Test Suite', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = mockLocalStorage()
  })

  describe('localStorage operations', () => {
    it('should mock localStorage correctly', () => {
      expect(window.localStorage.setItem).toBeDefined()
      expect(window.localStorage.getItem).toBeDefined()
      expect(window.localStorage.removeItem).toBeDefined()
      expect(window.localStorage.clear).toBeDefined()
    })

    it('should handle localStorage operations', () => {
      const testData = { test: 'value' }
      
      window.localStorage.setItem('testKey', JSON.stringify(testData))
      expect(window.localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData))
      
      mockStorage.testKey = JSON.stringify(testData)
      window.localStorage.getItem.mockReturnValue(JSON.stringify(testData))
      
      const result = JSON.parse(window.localStorage.getItem('testKey'))
      expect(result).toEqual(testData)
    })

    it('should handle localStorage errors', () => {
      window.localStorage.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded')
        error.name = 'QuotaExceededError'
        throw error
      })

      expect(() => {
        window.localStorage.setItem('test', 'data')
      }).toThrow('Quota exceeded')
    })
  })

  describe('mock data factories', () => {
    it('should create mock project', () => {
      const project = mockProject()
      
      expect(project).toHaveProperty('id')
      expect(project).toHaveProperty('name')
      expect(project).toHaveProperty('description')
      expect(project).toHaveProperty('startDate')
      expect(project).toHaveProperty('status')
      expect(project).toHaveProperty('tasks')
      expect(project).toHaveProperty('teamMembers')
    })

    it('should create mock task', () => {
      const task = mockTask()
      
      expect(task).toHaveProperty('id')
      expect(task).toHaveProperty('title')
      expect(task).toHaveProperty('description')
      expect(task).toHaveProperty('startDate')
      expect(task).toHaveProperty('endDate')
      expect(task).toHaveProperty('status')
      expect(task).toHaveProperty('type')
      expect(task).toHaveProperty('level')
    })

    it('should create mock team member', () => {
      const member = mockTeamMember()
      
      expect(member).toHaveProperty('id')
      expect(member).toHaveProperty('name')
      expect(member).toHaveProperty('email')
      expect(member).toHaveProperty('role')
      expect(member).toHaveProperty('joinedAt')
    })

    it('should allow overrides in mock data', () => {
      const customProject = mockProject({
        name: 'Custom Project',
        status: 'completed'
      })
      
      expect(customProject.name).toBe('Custom Project')
      expect(customProject.status).toBe('completed')
    })
  })

  describe('nested task generation', () => {
    it('should generate nested tasks correctly', () => {
      const nestedTasks = generateNestedTasks(3, 2)
      
      expect(nestedTasks.length).toBeGreaterThan(0)
      
      // Check level distribution
      const level0Tasks = nestedTasks.filter(t => t.level === 0)
      const level1Tasks = nestedTasks.filter(t => t.level === 1)
      const level2Tasks = nestedTasks.filter(t => t.level === 2)
      
      expect(level0Tasks.length).toBe(2)
      expect(level1Tasks.length).toBe(4) // 2 * 2
      expect(level2Tasks.length).toBe(8) // 2 * 2 * 2
    })

    it('should maintain parent-child relationships', () => {
      const nestedTasks = generateNestedTasks(2, 2)
      
      // Check that all child tasks have valid parent references
      const childTasks = nestedTasks.filter(t => t.level > 0)
      const parentIds = new Set(nestedTasks.map(t => t.id))
      
      childTasks.forEach(child => {
        expect(child.parentTaskId).toBeTruthy()
        expect(parentIds.has(child.parentTaskId)).toBe(true)
      })
    })

    it('should generate unique task IDs', () => {
      const nestedTasks = generateNestedTasks(3, 3)
      const taskIds = nestedTasks.map(t => t.id)
      const uniqueIds = [...new Set(taskIds)]
      
      expect(uniqueIds.length).toBe(taskIds.length)
    })
  })

  describe('task nesting validation', () => {
    it('should validate nesting levels', () => {
      const maxLevel = 5
      const tasks = generateNestedTasks(6, 2)
      
      const validTasks = tasks.filter(t => t.level < maxLevel)
      const invalidTasks = tasks.filter(t => t.level >= maxLevel)
      
      expect(validTasks.length).toBeGreaterThan(0)
      expect(invalidTasks.length).toBeGreaterThan(0)
    })

    it('should calculate task hierarchy depth', () => {
      const tasks = generateNestedTasks(4, 2)
      
      function calculateDepth(taskId, allTasks) {
        const task = allTasks.find(t => t.id === taskId)
        if (!task || !task.parentTaskId) return 0
        return 1 + calculateDepth(task.parentTaskId, allTasks)
      }
      
      const deepestTask = tasks.find(t => t.level === 3)
      const depth = calculateDepth(deepestTask.id, tasks)
      
      expect(depth).toBe(3)
    })

    it('should find all descendants of a task', () => {
      const tasks = generateNestedTasks(3, 2)
      const rootTask = tasks.find(t => t.level === 0)
      
      function getAllDescendants(parentId, allTasks) {
        const directChildren = allTasks.filter(t => t.parentTaskId === parentId)
        let descendants = [...directChildren]
        
        directChildren.forEach(child => {
          descendants = descendants.concat(getAllDescendants(child.id, allTasks))
        })
        
        return descendants
      }
      
      const descendants = getAllDescendants(rootTask.id, tasks)
      
      expect(descendants.length).toBeGreaterThan(0)
      expect(descendants.every(d => d.level > rootTask.level)).toBe(true)
    })
  })

  describe('data validation', () => {
    it('should validate required fields', () => {
      const project = mockProject({ name: '' })
      
      function validateProject(proj) {
        const errors = []
        if (!proj.name || proj.name.trim() === '') {
          errors.push({ field: 'name', message: 'Name is required' })
        }
        return { isValid: errors.length === 0, errors }
      }
      
      const result = validateProject(project)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
    })

    it('should validate date ranges', () => {
      const project = mockProject({
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01')
      })
      
      function validateDateRange(proj) {
        const errors = []
        if (proj.startDate && proj.endDate && proj.startDate > proj.endDate) {
          errors.push({ field: 'endDate', message: 'End date must be after start date' })
        }
        return { isValid: errors.length === 0, errors }
      }
      
      const result = validateDateRange(project)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('endDate')
    })

    it('should validate email format', () => {
      const member = mockTeamMember({ email: 'invalid-email' })
      
      function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }
      
      expect(validateEmail(member.email)).toBe(false)
      expect(validateEmail('valid@example.com')).toBe(true)
    })
  })

  describe('data persistence simulation', () => {
    it('should simulate data export', () => {
      const projects = [mockProject(), mockProject({ id: 'project-2' })]
      
      function exportData(data) {
        return JSON.stringify({
          projects: data,
          exportDate: new Date().toISOString(),
          version: '1.0'
        })
      }
      
      const exported = exportData(projects)
      const parsed = JSON.parse(exported)
      
      expect(parsed.projects).toHaveLength(2)
      expect(parsed.version).toBe('1.0')
      expect(parsed.exportDate).toBeDefined()
    })

    it('should simulate data import', () => {
      const testData = {
        projects: [mockProject()],
        version: '1.0'
      }
      
      function importData(jsonString) {
        try {
          const data = JSON.parse(jsonString)
          return { success: true, data }
        } catch (error) {
          return { success: false, error: error.message }
        }
      }
      
      const result = importData(JSON.stringify(testData))
      
      expect(result.success).toBe(true)
      expect(result.data.projects).toHaveLength(1)
    })

    it('should handle corrupted data gracefully', () => {
      function safeParseData(jsonString) {
        try {
          return { success: true, data: JSON.parse(jsonString) }
        } catch (error) {
          return { success: false, error: 'Invalid data format' }
        }
      }
      
      const result = safeParseData('invalid json')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid data format')
    })
  })

  describe('performance considerations', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now()
      
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        mockProject({ id: `project-${i}`, name: `Project ${i}` })
      )
      
      // Simulate filtering operation
      const activeProjects = largeDataset.filter(p => p.status === 'active')
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(largeDataset.length).toBe(1000)
      expect(activeProjects.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle deep nesting efficiently', () => {
      const startTime = performance.now()
      
      // Create a deep nested structure
      const deepTasks = generateNestedTasks(8, 2) // 8 levels deep
      
      // Simulate finding tasks at specific level
      const level5Tasks = deepTasks.filter(t => t.level === 5)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(deepTasks.length).toBeGreaterThan(100)
      expect(level5Tasks.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(50) // Should be fast
    })
  })

  describe('error handling', () => {
    it('should handle missing data gracefully', () => {
      function safeGetProperty(obj, path, defaultValue = null) {
        try {
          return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue
        } catch {
          return defaultValue
        }
      }
      
      const project = mockProject()
      delete project.tasks
      
      expect(safeGetProperty(project, 'tasks.length', 0)).toBe(0)
      expect(safeGetProperty(project, 'name')).toBe(project.name)
      expect(safeGetProperty(project, 'nonexistent.property', 'default')).toBe('default')
    })

    it('should validate data integrity', () => {
      function validateDataIntegrity(projects) {
        const errors = []
        const projectIds = new Set()
        
        projects.forEach((project, index) => {
          if (!project.id) {
            errors.push(`Project at index ${index} missing ID`)
          } else if (projectIds.has(project.id)) {
            errors.push(`Duplicate project ID: ${project.id}`)
          } else {
            projectIds.add(project.id)
          }
        })
        
        return { isValid: errors.length === 0, errors }
      }
      
      const validProjects = [
        mockProject({ id: 'project-1' }),
        mockProject({ id: 'project-2' })
      ]
      
      const invalidProjects = [
        mockProject({ id: 'project-1' }),
        mockProject({ id: 'project-1' }) // Duplicate ID
      ]
      
      expect(validateDataIntegrity(validProjects).isValid).toBe(true)
      expect(validateDataIntegrity(invalidProjects).isValid).toBe(false)
    })
  })
})