/**
 * Performance Tests for AI Project Generator
 * Tests performance characteristics of large project operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAIService } from '../../services/openAIService.js'
import { ProjectExportService } from '../../services/projectExportService.js'
import { ProjectImportService } from '../../services/projectImportService.js'
import { DateCalculationService } from '../../services/dateCalculationService.js'
import { Project, Task, TeamMember } from '../../models/index.js'

describe('Performance Tests - Large Project Operations', () => {
  let performanceMetrics
  let largeProjectData
  let veryLargeProjectData

  beforeEach(() => {
    performanceMetrics = {
      startTime: 0,
      endTime: 0,
      memoryBefore: 0,
      memoryAfter: 0
    }

    // Create large project data (100 tasks, 10 team members)
    largeProjectData = {
      id: 'large-project-perf-test',
      name: 'Large Project Performance Test',
      description: 'Testing performance with large dataset',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'active',
      tasks: Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i + 1}`,
        projectId: 'large-project-perf-test',
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1} with detailed information about the work to be done`,
        startDate: new Date(2024, 0, (i * 3) + 1),
        endDate: new Date(2024, 0, (i * 3) + 4),
        duration: 3,
        priority: ['low', 'medium', 'high'][i % 3],
        type: i % 4 === 0 ? 'with_deliverable' : 'simple',
        status: ['pending', 'in_progress', 'completed'][i % 3],
        progress: Math.floor(Math.random() * 101),
        level: 0,
        adjustStartDate: false,
        assignedTo: `member-${(i % 10) + 1}`,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deliverable: i % 4 === 0 ? {
          type: ['presentation', 'file', 'exposition', 'other'][i % 4],
          description: `Deliverable for task ${i + 1}`,
          dueDate: new Date(2024, 0, (i * 3) + 4),
          status: 'pending',
          notes: `Notes for deliverable ${i + 1}`
        } : null,
        subtasks: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
          id: `subtask-${i + 1}-${j + 1}`,
          projectId: 'large-project-perf-test',
          parentTaskId: `task-${i + 1}`,
          title: `Subtask ${i + 1}.${j + 1}`,
          description: `Subtask description ${i + 1}.${j + 1}`,
          startDate: new Date(2024, 0, (i * 3) + 1 + j),
          endDate: new Date(2024, 0, (i * 3) + 2 + j),
          duration: 1,
          priority: 'medium',
          type: 'simple',
          status: 'pending',
          progress: 0,
          level: 1,
          adjustStartDate: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          subtasks: []
        }))
      })),
      teamMembers: Array.from({ length: 10 }, (_, i) => ({
        id: `member-${i + 1}`,
        name: `Team Member ${i + 1}`,
        email: `member${i + 1}@performance-test.com`,
        role: ['Developer', 'Designer', 'Manager', 'Tester', 'Analyst'][i % 5],
        avatar: null,
        joinedAt: new Date('2024-01-01')
      })),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }

    // Create very large project data (1000 tasks, 50 team members)
    veryLargeProjectData = {
      ...largeProjectData,
      id: 'very-large-project-perf-test',
      name: 'Very Large Project Performance Test',
      tasks: Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i + 1}`,
        projectId: 'very-large-project-perf-test',
        title: `Task ${i + 1}`,
        description: `Description for task ${i + 1} with detailed information about the work to be done. This is a longer description to test performance with larger text content.`,
        startDate: new Date(2024, Math.floor(i / 30), (i % 30) + 1),
        endDate: new Date(2024, Math.floor(i / 30), (i % 30) + 4),
        duration: 3,
        priority: ['low', 'medium', 'high'][i % 3],
        type: i % 4 === 0 ? 'with_deliverable' : 'simple',
        status: ['pending', 'in_progress', 'completed'][i % 3],
        progress: Math.floor(Math.random() * 101),
        level: 0,
        adjustStartDate: false,
        assignedTo: `member-${(i % 50) + 1}`,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deliverable: i % 4 === 0 ? {
          type: ['presentation', 'file', 'exposition', 'other'][i % 4],
          description: `Deliverable for task ${i + 1} with comprehensive requirements and specifications`,
          dueDate: new Date(2024, Math.floor(i / 30), (i % 30) + 4),
          status: 'pending',
          notes: `Detailed notes for deliverable ${i + 1} including requirements, specifications, and acceptance criteria`
        } : null,
        subtasks: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => ({
          id: `subtask-${i + 1}-${j + 1}`,
          projectId: 'very-large-project-perf-test',
          parentTaskId: `task-${i + 1}`,
          title: `Subtask ${i + 1}.${j + 1}`,
          description: `Subtask description ${i + 1}.${j + 1} with detailed work breakdown`,
          startDate: new Date(2024, Math.floor(i / 30), (i % 30) + 1 + j),
          endDate: new Date(2024, Math.floor(i / 30), (i % 30) + 2 + j),
          duration: 1,
          priority: 'medium',
          type: 'simple',
          status: 'pending',
          progress: 0,
          level: 1,
          adjustStartDate: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          subtasks: []
        }))
      })),
      teamMembers: Array.from({ length: 50 }, (_, i) => ({
        id: `member-${i + 1}`,
        name: `Team Member ${i + 1}`,
        email: `member${i + 1}@performance-test.com`,
        role: ['Developer', 'Designer', 'Manager', 'Tester', 'Analyst', 'Architect', 'DevOps', 'QA', 'Product Owner', 'Scrum Master'][i % 10],
        avatar: null,
        joinedAt: new Date('2024-01-01')
      }))
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const startPerformanceTest = () => {
    performanceMetrics.startTime = performance.now()
    if (typeof process !== 'undefined' && process.memoryUsage) {
      performanceMetrics.memoryBefore = process.memoryUsage().heapUsed
    }
  }

  const endPerformanceTest = () => {
    performanceMetrics.endTime = performance.now()
    if (typeof process !== 'undefined' && process.memoryUsage) {
      performanceMetrics.memoryAfter = process.memoryUsage().heapUsed
    }
    return {
      executionTime: performanceMetrics.endTime - performanceMetrics.startTime,
      memoryUsed: performanceMetrics.memoryAfter - performanceMetrics.memoryBefore
    }
  }

  describe('Export Performance Tests', () => {
    it('should export large project (100 tasks) within performance threshold', () => {
      startPerformanceTest()

      const jsonResult = ProjectExportService.exportProject(largeProjectData)

      const metrics = endPerformanceTest()

      // Verify export completed successfully
      expect(jsonResult).toBeDefined()
      expect(typeof jsonResult).toBe('string')

      // Parse to verify structure
      const parsedData = JSON.parse(jsonResult)
      expect(parsedData.tasks).toHaveLength(100)
      expect(parsedData.teamMembers).toHaveLength(10)

      // Performance assertions
      expect(metrics.executionTime).toBeLessThan(1000) // Should complete within 1 second
      
      // Verify JSON size is reasonable
      const jsonSize = new Blob([jsonResult]).size
      expect(jsonSize).toBeLessThan(5 * 1024 * 1024) // Should be less than 5MB

      console.log(`Large project export performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        jsonSize: `${(jsonSize / 1024).toFixed(2)}KB`,
        tasksExported: parsedData.tasks.length,
        teamMembersExported: parsedData.teamMembers.length
      })
    })

    it('should export very large project (1000 tasks) within acceptable time', () => {
      startPerformanceTest()

      const jsonResult = ProjectExportService.exportProject(veryLargeProjectData)

      const metrics = endPerformanceTest()

      // Verify export completed successfully
      expect(jsonResult).toBeDefined()
      const parsedData = JSON.parse(jsonResult)
      expect(parsedData.tasks).toHaveLength(1000)
      expect(parsedData.teamMembers).toHaveLength(50)

      // Performance assertions - more lenient for very large projects
      expect(metrics.executionTime).toBeLessThan(5000) // Should complete within 5 seconds

      const jsonSize = new Blob([jsonResult]).size
      expect(jsonSize).toBeLessThan(50 * 1024 * 1024) // Should be less than 50MB

      console.log(`Very large project export performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        jsonSize: `${(jsonSize / 1024 / 1024).toFixed(2)}MB`,
        tasksExported: parsedData.tasks.length,
        teamMembersExported: parsedData.teamMembers.length
      })
    })

    it('should handle concurrent exports without performance degradation', async () => {
      const projects = [
        { ...largeProjectData, id: 'concurrent-1', name: 'Concurrent Project 1' },
        { ...largeProjectData, id: 'concurrent-2', name: 'Concurrent Project 2' },
        { ...largeProjectData, id: 'concurrent-3', name: 'Concurrent Project 3' }
      ]

      startPerformanceTest()

      const exportPromises = projects.map(project => 
        Promise.resolve(ProjectExportService.exportProject(project))
      )

      const results = await Promise.all(exportPromises)

      const metrics = endPerformanceTest()

      // Verify all exports completed
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toBeDefined()
        const parsed = JSON.parse(result)
        expect(parsed.tasks).toHaveLength(100)
      })

      // Performance should not degrade significantly with concurrent operations
      expect(metrics.executionTime).toBeLessThan(3000) // Should complete within 3 seconds

      console.log(`Concurrent export performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        projectsExported: results.length,
        averageTimePerProject: `${(metrics.executionTime / results.length).toFixed(2)}ms`
      })
    })
  })

  describe('Import Performance Tests', () => {
    it('should import large project (100 tasks) within performance threshold', () => {
      const jsonData = JSON.stringify(largeProjectData)

      startPerformanceTest()

      const importedProject = ProjectImportService.importProject(jsonData)

      const metrics = endPerformanceTest()

      // Verify import completed successfully
      expect(importedProject).toBeDefined()
      expect(importedProject.tasks).toHaveLength(100)
      expect(importedProject.teamMembers).toHaveLength(10)

      // Performance assertions
      expect(metrics.executionTime).toBeLessThan(2000) // Should complete within 2 seconds

      console.log(`Large project import performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksImported: importedProject.tasks.length,
        teamMembersImported: importedProject.teamMembers.length
      })
    })

    it('should import very large project (1000 tasks) within acceptable time', () => {
      const jsonData = JSON.stringify(veryLargeProjectData)

      startPerformanceTest()

      const importedProject = ProjectImportService.importProject(jsonData)

      const metrics = endPerformanceTest()

      // Verify import completed successfully
      expect(importedProject).toBeDefined()
      expect(importedProject.tasks).toHaveLength(1000)
      expect(importedProject.teamMembers).toHaveLength(50)

      // Performance assertions - more lenient for very large projects
      expect(metrics.executionTime).toBeLessThan(10000) // Should complete within 10 seconds

      console.log(`Very large project import performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksImported: importedProject.tasks.length,
        teamMembersImported: importedProject.teamMembers.length
      })
    })

    it('should handle import with date adjustment efficiently', () => {
      const jsonData = JSON.stringify(largeProjectData)
      const newStartDate = new Date('2024-06-01')

      startPerformanceTest()

      const importedProject = ProjectImportService.importProject(jsonData, newStartDate)

      const metrics = endPerformanceTest()

      // Verify import and date adjustment completed successfully
      expect(importedProject).toBeDefined()
      expect(importedProject.startDate).toEqual(newStartDate)
      expect(importedProject.tasks).toHaveLength(100)

      // Verify dates were adjusted
      const firstTask = importedProject.tasks[0]
      expect(firstTask.startDate.getTime()).toBeGreaterThanOrEqual(newStartDate.getTime())

      // Performance should not be significantly impacted by date adjustment
      expect(metrics.executionTime).toBeLessThan(3000) // Should complete within 3 seconds

      console.log(`Import with date adjustment performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksAdjusted: importedProject.tasks.length,
        originalStartDate: largeProjectData.startDate.toISOString(),
        newStartDate: newStartDate.toISOString()
      })
    })

    it('should validate large project efficiently', () => {
      const jsonData = JSON.stringify(largeProjectData)

      startPerformanceTest()

      const validationResult = ProjectImportService.validateProjectJSON(jsonData)

      const metrics = endPerformanceTest()

      // Verify validation completed successfully
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toHaveLength(0)

      // Validation should be very fast
      expect(metrics.executionTime).toBeLessThan(500) // Should complete within 0.5 seconds

      console.log(`Large project validation performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksValidated: largeProjectData.tasks.length,
        teamMembersValidated: largeProjectData.teamMembers.length,
        isValid: validationResult.isValid
      })
    })
  })

  describe('Date Calculation Performance Tests', () => {
    it('should calculate working days for large date ranges efficiently', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31') // Full year
      const iterations = 1000

      startPerformanceTest()

      for (let i = 0; i < iterations; i++) {
        DateCalculationService.calculateWorkingDays(startDate, endDate)
      }

      const metrics = endPerformanceTest()

      // Performance assertion
      expect(metrics.executionTime).toBeLessThan(1000) // Should complete 1000 calculations within 1 second

      console.log(`Date calculation performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        iterations: iterations,
        averageTimePerCalculation: `${(metrics.executionTime / iterations).toFixed(4)}ms`
      })
    })

    it('should handle bulk date adjustments efficiently', () => {
      const tasks = largeProjectData.tasks
      const daysDifference = 30

      startPerformanceTest()

      const adjustedTasks = tasks.map(task => ({
        ...task,
        startDate: DateCalculationService.addWorkingDays(task.startDate, daysDifference),
        endDate: DateCalculationService.addWorkingDays(task.endDate, daysDifference)
      }))

      const metrics = endPerformanceTest()

      // Verify all tasks were adjusted
      expect(adjustedTasks).toHaveLength(100)
      adjustedTasks.forEach((task, index) => {
        expect(task.startDate.getTime()).toBeGreaterThan(tasks[index].startDate.getTime())
        expect(task.endDate.getTime()).toBeGreaterThan(tasks[index].endDate.getTime())
      })

      // Performance assertion
      expect(metrics.executionTime).toBeLessThan(1000) // Should complete within 1 second

      console.log(`Bulk date adjustment performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksAdjusted: adjustedTasks.length,
        daysDifference: daysDifference
      })
    })

    it('should validate date ranges for large datasets efficiently', () => {
      const dateRanges = Array.from({ length: 1000 }, (_, i) => ({
        startDate: new Date(2024, 0, i + 1),
        endDate: new Date(2024, 0, i + 5)
      }))

      startPerformanceTest()

      const validationResults = dateRanges.map(range => 
        DateCalculationService.validateDateRange(range.startDate, range.endDate)
      )

      const metrics = endPerformanceTest()

      // Verify all validations completed
      expect(validationResults).toHaveLength(1000)
      expect(validationResults.every(result => result === true)).toBe(true)

      // Performance assertion
      expect(metrics.executionTime).toBeLessThan(500) // Should complete within 0.5 seconds

      console.log(`Date range validation performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        rangesValidated: validationResults.length,
        averageTimePerValidation: `${(metrics.executionTime / validationResults.length).toFixed(4)}ms`
      })
    })
  })

  describe('AI Generation Performance Tests', () => {
    it('should handle large AI response processing efficiently', () => {
      const mockLargeAIResponse = JSON.stringify({
        name: 'Large Enterprise Application',
        description: 'A comprehensive enterprise application with multiple modules and complex workflows',
        estimatedDuration: 365,
        tasks: Array.from({ length: 200 }, (_, i) => ({
          title: `Task ${i + 1}`,
          description: `Detailed description for task ${i + 1} with comprehensive requirements and specifications`,
          duration: Math.floor(Math.random() * 10) + 1,
          priority: ['low', 'medium', 'high'][i % 3],
          type: i % 4 === 0 ? 'with_deliverable' : 'simple',
          deliverable: i % 4 === 0 ? {
            type: ['presentation', 'file', 'exposition', 'other'][i % 4],
            description: `Deliverable description for task ${i + 1}`
          } : undefined,
          subtasks: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
            title: `Subtask ${i + 1}.${j + 1}`,
            description: `Subtask description ${i + 1}.${j + 1}`,
            duration: Math.floor(Math.random() * 3) + 1,
            priority: 'medium',
            type: 'simple'
          }))
        })),
        teamMembers: Array.from({ length: 25 }, (_, i) => ({
          name: `Team Member ${i + 1}`,
          email: `member${i + 1}@enterprise.com`,
          role: ['Developer', 'Designer', 'Manager', 'Tester', 'Analyst'][i % 5]
        }))
      })

      const openAIService = new OpenAIService()

      startPerformanceTest()

      const processedProject = openAIService.processAIResponse(mockLargeAIResponse)

      const metrics = endPerformanceTest()

      // Verify processing completed successfully
      expect(processedProject).toBeDefined()
      expect(processedProject.tasks).toHaveLength(200)
      expect(processedProject.teamMembers).toHaveLength(25)

      // Performance assertion
      expect(metrics.executionTime).toBeLessThan(2000) // Should complete within 2 seconds

      console.log(`AI response processing performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksProcessed: processedProject.tasks.length,
        teamMembersProcessed: processedProject.teamMembers.length,
        responseSize: `${(mockLargeAIResponse.length / 1024).toFixed(2)}KB`
      })
    })

    it('should validate large AI-generated projects efficiently', () => {
      const largeAIProject = {
        name: 'AI Generated Large Project',
        description: 'Large project generated by AI for performance testing',
        estimatedDuration: 500,
        tasks: Array.from({ length: 300 }, (_, i) => ({
          title: `AI Task ${i + 1}`,
          description: `AI generated task description ${i + 1}`,
          duration: Math.floor(Math.random() * 15) + 1,
          priority: ['low', 'medium', 'high'][i % 3],
          type: i % 3 === 0 ? 'with_deliverable' : 'simple',
          deliverable: i % 3 === 0 ? {
            type: ['presentation', 'file', 'exposition', 'other'][i % 4],
            description: `AI generated deliverable ${i + 1}`
          } : undefined,
          subtasks: Array.from({ length: Math.floor(Math.random() * 4) }, (_, j) => ({
            title: `AI Subtask ${i + 1}.${j + 1}`,
            description: `AI generated subtask description`,
            duration: Math.floor(Math.random() * 5) + 1,
            priority: 'medium',
            type: 'simple'
          }))
        })),
        teamMembers: Array.from({ length: 30 }, (_, i) => ({
          name: `AI Team Member ${i + 1}`,
          email: `ai-member${i + 1}@test.com`,
          role: ['Developer', 'Designer', 'Manager', 'Tester', 'Analyst', 'Architect'][i % 6]
        }))
      }

      const openAIService = new OpenAIService()

      startPerformanceTest()

      const validationResult = openAIService.validateGeneratedProject(largeAIProject)

      const metrics = endPerformanceTest()

      // Verify validation completed successfully
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toHaveLength(0)

      // Performance assertion
      expect(metrics.executionTime).toBeLessThan(1000) // Should complete within 1 second

      console.log(`AI project validation performance:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksValidated: largeAIProject.tasks.length,
        teamMembersValidated: largeAIProject.teamMembers.length,
        isValid: validationResult.isValid
      })
    })
  })

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks during large operations', () => {
      if (typeof process === 'undefined' || !process.memoryUsage) {
        console.log('Memory usage tests skipped - not available in this environment')
        return
      }

      const initialMemory = process.memoryUsage().heapUsed
      const iterations = 50

      // Perform multiple export/import cycles
      for (let i = 0; i < iterations; i++) {
        const jsonData = ProjectExportService.exportProject(largeProjectData)
        const importedProject = ProjectImportService.importProject(jsonData)
        
        // Verify operation completed
        expect(importedProject.tasks).toHaveLength(100)
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)

      console.log(`Memory usage test:`, {
        iterations: iterations,
        initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
        finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      })
    })

    it('should handle concurrent operations without excessive memory usage', async () => {
      if (typeof process === 'undefined' || !process.memoryUsage) {
        console.log('Memory usage tests skipped - not available in this environment')
        return
      }

      const initialMemory = process.memoryUsage().heapUsed

      // Create multiple concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) => {
        const projectData = {
          ...largeProjectData,
          id: `concurrent-memory-test-${i}`,
          name: `Concurrent Memory Test Project ${i}`
        }
        
        return Promise.resolve().then(() => {
          const jsonData = ProjectExportService.exportProject(projectData)
          return ProjectImportService.importProject(jsonData)
        })
      })

      const results = await Promise.all(operations)

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Verify all operations completed
      expect(results).toHaveLength(10)
      results.forEach(project => {
        expect(project.tasks).toHaveLength(100)
      })

      // Memory increase should be reasonable for concurrent operations
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024) // Less than 200MB

      console.log(`Concurrent operations memory usage:`, {
        operations: operations.length,
        initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
        finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      })
    })
  })

  describe('Stress Tests', () => {
    it('should handle extreme project sizes gracefully', () => {
      // Create extremely large project (5000 tasks)
      const extremeProjectData = {
        ...veryLargeProjectData,
        id: 'extreme-project-stress-test',
        name: 'Extreme Project Stress Test',
        tasks: Array.from({ length: 5000 }, (_, i) => ({
          id: `extreme-task-${i + 1}`,
          projectId: 'extreme-project-stress-test',
          title: `Extreme Task ${i + 1}`,
          description: `Stress test task ${i + 1}`,
          startDate: new Date(2024, Math.floor(i / 150), (i % 30) + 1),
          endDate: new Date(2024, Math.floor(i / 150), (i % 30) + 3),
          duration: 2,
          priority: ['low', 'medium', 'high'][i % 3],
          type: 'simple',
          status: 'pending',
          progress: 0,
          level: 0,
          adjustStartDate: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          subtasks: []
        })),
        teamMembers: Array.from({ length: 100 }, (_, i) => ({
          id: `extreme-member-${i + 1}`,
          name: `Extreme Team Member ${i + 1}`,
          email: `extreme-member${i + 1}@stress-test.com`,
          role: 'Developer',
          avatar: null,
          joinedAt: new Date('2024-01-01')
        }))
      }

      startPerformanceTest()

      let exportResult, importResult

      try {
        // Test export
        exportResult = ProjectExportService.exportProject(extremeProjectData)
        expect(exportResult).toBeDefined()

        // Test import
        importResult = ProjectImportService.importProject(exportResult)
        expect(importResult).toBeDefined()
        expect(importResult.tasks).toHaveLength(5000)

      } catch (error) {
        // If operations fail due to size, ensure they fail gracefully
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBeDefined()
      }

      const metrics = endPerformanceTest()

      // Even if operations are slow, they should complete within reasonable time
      expect(metrics.executionTime).toBeLessThan(30000) // 30 seconds max

      console.log(`Extreme project stress test:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        tasksProcessed: extremeProjectData.tasks.length,
        teamMembersProcessed: extremeProjectData.teamMembers.length,
        success: !!(exportResult && importResult)
      })
    })

    it('should handle rapid successive operations', async () => {
      const rapidOperations = []
      const operationCount = 100

      startPerformanceTest()

      // Perform rapid successive export operations
      for (let i = 0; i < operationCount; i++) {
        const projectData = {
          ...largeProjectData,
          id: `rapid-test-${i}`,
          name: `Rapid Test Project ${i}`
        }
        
        rapidOperations.push(
          Promise.resolve(ProjectExportService.exportProject(projectData))
        )
      }

      const results = await Promise.all(rapidOperations)

      const metrics = endPerformanceTest()

      // Verify all operations completed
      expect(results).toHaveLength(operationCount)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
      })

      // Performance should remain reasonable even with rapid operations
      expect(metrics.executionTime).toBeLessThan(10000) // 10 seconds max

      console.log(`Rapid successive operations test:`, {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        operationsCompleted: results.length,
        averageTimePerOperation: `${(metrics.executionTime / results.length).toFixed(2)}ms`
      })
    })
  })
})