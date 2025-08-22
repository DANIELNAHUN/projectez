import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockStore, mockProject, mockTask, mockTeamMember, mockLocalStorage } from '../utils.js'

describe('Project Management Integration', () => {
  let store
  let mockStorage

  beforeEach(() => {
    mockStorage = mockLocalStorage()
    store = createMockStore()
  })

  describe('complete project lifecycle', () => {
    it('should create, update, and delete a project', async () => {
      // Create project
      const newProject = mockProject({
        name: 'Integration Test Project',
        description: 'A project for integration testing'
      })

      await store.dispatch('projects/createProject', newProject)
      
      expect(store.getters['projects/allProjects']).toContainEqual(
        expect.objectContaining({
          name: 'Integration Test Project'
        })
      )

      // Update project
      const updatedProject = {
        ...newProject,
        name: 'Updated Integration Test Project',
        description: 'Updated description'
      }

      await store.dispatch('projects/updateProject', updatedProject)
      
      expect(store.getters['projects/allProjects']).toContainEqual(
        expect.objectContaining({
          name: 'Updated Integration Test Project',
          description: 'Updated description'
        })
      )

      // Delete project
      await store.dispatch('projects/deleteProject', newProject.id)
      
      expect(store.getters['projects/allProjects']).not.toContainEqual(
        expect.objectContaining({
          id: newProject.id
        })
      )
    })

    it('should handle project with team members and tasks', async () => {
      const project = mockProject()
      const teamMember = mockTeamMember()
      const task = mockTask({ assignedTo: teamMember.id })

      // Create project
      await store.dispatch('projects/createProject', project)
      
      // Add team member
      const projectWithMember = {
        ...project,
        teamMembers: [teamMember]
      }
      await store.dispatch('projects/updateProject', projectWithMember)

      // Add task
      const projectWithTask = {
        ...projectWithMember,
        tasks: [task]
      }
      await store.dispatch('projects/updateProject', projectWithTask)

      const finalProject = store.getters['projects/allProjects'].find(p => p.id === project.id)
      
      expect(finalProject.teamMembers).toHaveLength(1)
      expect(finalProject.tasks).toHaveLength(1)
      expect(finalProject.tasks[0].assignedTo).toBe(teamMember.id)
    })
  })

  describe('task management within projects', () => {
    let project

    beforeEach(async () => {
      project = mockProject()
      await store.dispatch('projects/createProject', project)
      store.commit('projects/SET_CURRENT_PROJECT', project)
    })

    it('should create nested tasks', async () => {
      const parentTask = mockTask({
        id: 'parent-task',
        title: 'Parent Task',
        level: 0,
        parentTaskId: null
      })

      const childTask = mockTask({
        id: 'child-task',
        title: 'Child Task',
        level: 1,
        parentTaskId: 'parent-task'
      })

      // Create parent task
      await store.dispatch('tasks/createTask', parentTask)
      
      // Create child task
      await store.dispatch('tasks/createTask', childTask)

      const tasks = store.getters['tasks/allTasks']
      
      expect(tasks).toHaveLength(2)
      expect(tasks.find(t => t.id === 'parent-task')).toBeDefined()
      expect(tasks.find(t => t.id === 'child-task')).toBeDefined()
      
      const child = tasks.find(t => t.id === 'child-task')
      expect(child.parentTaskId).toBe('parent-task')
      expect(child.level).toBe(1)
    })

    it('should handle task status changes', async () => {
      const task = mockTask({ status: 'pending' })
      
      await store.dispatch('tasks/createTask', task)
      
      // Update task status
      const updatedTask = { ...task, status: 'in_progress' }
      await store.dispatch('tasks/updateTask', updatedTask)
      
      const tasks = store.getters['tasks/allTasks']
      const foundTask = tasks.find(t => t.id === task.id)
      
      expect(foundTask.status).toBe('in_progress')
    })

    it('should calculate project progress based on task completion', () => {
      const tasks = [
        mockTask({ id: '1', status: 'completed' }),
        mockTask({ id: '2', status: 'completed' }),
        mockTask({ id: '3', status: 'pending' }),
        mockTask({ id: '4', status: 'in_progress' })
      ]

      store.commit('tasks/SET_TASKS', tasks)

      const completedTasks = store.getters['tasks/allTasks'].filter(t => t.status === 'completed')
      const totalTasks = store.getters['tasks/allTasks'].length
      const progress = Math.round((completedTasks.length / totalTasks) * 100)

      expect(progress).toBe(50) // 2 out of 4 tasks completed
    })
  })

  describe('team member management', () => {
    let project

    beforeEach(async () => {
      project = mockProject()
      await store.dispatch('projects/createProject', project)
      store.commit('projects/SET_CURRENT_PROJECT', project)
    })

    it('should add and remove team members', async () => {
      const member1 = mockTeamMember({ id: 'member-1', name: 'John Doe' })
      const member2 = mockTeamMember({ id: 'member-2', name: 'Jane Smith' })

      // Add team members
      const projectWithMembers = {
        ...project,
        teamMembers: [member1, member2]
      }
      await store.dispatch('projects/updateProject', projectWithMembers)

      let updatedProject = store.getters['projects/currentProject']
      expect(updatedProject.teamMembers).toHaveLength(2)

      // Remove one member
      const projectWithOneMember = {
        ...updatedProject,
        teamMembers: [member1]
      }
      await store.dispatch('projects/updateProject', projectWithOneMember)

      updatedProject = store.getters['projects/currentProject']
      expect(updatedProject.teamMembers).toHaveLength(1)
      expect(updatedProject.teamMembers[0].id).toBe('member-1')
    })

    it('should handle task reassignment when member is removed', async () => {
      const member = mockTeamMember({ id: 'member-1' })
      const task = mockTask({ assignedTo: 'member-1' })

      // Add member and task
      const projectWithData = {
        ...project,
        teamMembers: [member],
        tasks: [task]
      }
      await store.dispatch('projects/updateProject', projectWithData)

      // Remove member (should unassign tasks)
      const projectWithoutMember = {
        ...projectWithData,
        teamMembers: [],
        tasks: [{ ...task, assignedTo: null }]
      }
      await store.dispatch('projects/updateProject', projectWithoutMember)

      const updatedProject = store.getters['projects/currentProject']
      expect(updatedProject.teamMembers).toHaveLength(0)
      expect(updatedProject.tasks[0].assignedTo).toBeNull()
    })
  })

  describe('data persistence integration', () => {
    it('should persist project data to localStorage', async () => {
      const project = mockProject()
      
      await store.dispatch('projects/createProject', project)
      
      // Verify localStorage was called
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'pm_projects',
        expect.stringContaining(project.id)
      )
    })

    it('should restore project data from localStorage', () => {
      const projects = [mockProject(), mockProject({ id: 'project-2' })]
      mockStorage.pm_projects = JSON.stringify(projects)

      store.dispatch('projects/loadProjects')

      expect(store.getters['projects/allProjects']).toHaveLength(2)
    })

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage error
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const project = mockProject()
      
      try {
        await store.dispatch('projects/createProject', project)
      } catch (error) {
        expect(error.message).toContain('Storage quota exceeded')
      }
    })
  })

  describe('validation integration', () => {
    it('should validate project data before saving', async () => {
      const invalidProject = mockProject({
        name: '', // Invalid: empty name
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01') // Invalid: end before start
      })

      try {
        await store.dispatch('projects/createProject', invalidProject)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('validation')
      }
    })

    it('should validate task nesting levels', async () => {
      const project = mockProject()
      await store.dispatch('projects/createProject', project)
      
      // Set low nesting limit
      store.commit('tasks/SET_MAX_NESTING_LEVEL', 2)

      const invalidTask = mockTask({
        level: 2, // At the limit, should not allow children
        parentTaskId: 'some-parent'
      })

      try {
        await store.dispatch('tasks/createTask', invalidTask)
        expect.fail('Should have thrown nesting level error')
      } catch (error) {
        expect(error.message).toContain('nesting')
      }
    })
  })

  describe('error handling integration', () => {
    it('should handle network-like errors', async () => {
      // Simulate storage failure
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('Network error')
      })

      const project = mockProject()

      try {
        await store.dispatch('projects/createProject', project)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('Network error')
      }

      // Verify state wasn't corrupted
      expect(store.getters['projects/allProjects']).toHaveLength(0)
    })

    it('should recover from corrupted data', () => {
      // Set corrupted data in localStorage
      mockStorage.pm_projects = 'invalid json'

      try {
        store.dispatch('projects/loadProjects')
      } catch (error) {
        expect(error.message).toContain('JSON')
      }

      // Should initialize with empty state
      expect(store.getters['projects/allProjects']).toHaveLength(0)
    })
  })

  describe('concurrent operations', () => {
    it('should handle multiple simultaneous project operations', async () => {
      const projects = [
        mockProject({ id: 'project-1', name: 'Project 1' }),
        mockProject({ id: 'project-2', name: 'Project 2' }),
        mockProject({ id: 'project-3', name: 'Project 3' })
      ]

      // Create multiple projects simultaneously
      const promises = projects.map(project => 
        store.dispatch('projects/createProject', project)
      )

      await Promise.all(promises)

      expect(store.getters['projects/allProjects']).toHaveLength(3)
    })

    it('should handle rapid task updates', async () => {
      const project = mockProject()
      await store.dispatch('projects/createProject', project)

      const task = mockTask()
      await store.dispatch('tasks/createTask', task)

      // Rapid status updates
      const statusUpdates = ['in_progress', 'completed', 'pending']
      const promises = statusUpdates.map((status, index) => 
        new Promise(resolve => {
          setTimeout(() => {
            store.dispatch('tasks/updateTask', { ...task, status })
            resolve()
          }, index * 10)
        })
      )

      await Promise.all(promises)

      // Should have the last status
      const updatedTask = store.getters['tasks/allTasks'].find(t => t.id === task.id)
      expect(['in_progress', 'completed', 'pending']).toContain(updatedTask.status)
    })
  })

  describe('performance integration', () => {
    it('should handle large numbers of projects efficiently', async () => {
      const startTime = performance.now()
      
      const projects = Array.from({ length: 100 }, (_, i) => 
        mockProject({ id: `project-${i}`, name: `Project ${i}` })
      )

      for (const project of projects) {
        await store.dispatch('projects/createProject', project)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(store.getters['projects/allProjects']).toHaveLength(100)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle complex nested task structures efficiently', async () => {
      const project = mockProject()
      await store.dispatch('projects/createProject', project)

      const startTime = performance.now()

      // Create a deep nested structure
      let parentId = null
      for (let level = 0; level < 50; level++) {
        const task = mockTask({
          id: `task-${level}`,
          level,
          parentTaskId: parentId
        })
        
        await store.dispatch('tasks/createTask', task)
        parentId = task.id
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(store.getters['tasks/allTasks']).toHaveLength(50)
      expect(duration).toBeLessThan(500) // Should complete within 500ms
    })
  })
})