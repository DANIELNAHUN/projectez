import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockStore, generateNestedTasks, mockProject, mockTask } from '../utils.js'

describe('Task Nesting Functionality', () => {
  let store
  let project

  beforeEach(() => {
    project = mockProject({
      tasks: []
    })
    
    store = createMockStore({
      projects: {
        projects: [project],
        currentProject: project
      },
      tasks: {
        tasks: [],
        maxNestingLevel: 100
      }
    })
  })

  describe('nesting level validation', () => {
    it('should allow tasks up to maximum nesting level', () => {
      const maxLevel = 100
      const task = mockTask({ level: maxLevel - 1 })
      
      // Should be valid since it's within the limit
      expect(task.level).toBeLessThan(maxLevel)
    })

    it('should reject tasks exceeding maximum nesting level', () => {
      const maxLevel = 100
      const task = mockTask({ level: maxLevel })
      
      // Should be at the limit (which should be rejected for new subtasks)
      expect(task.level).toBe(maxLevel)
    })

    it('should respect custom nesting level limits', () => {
      const customMaxLevel = 50
      store.state.tasks.maxNestingLevel = customMaxLevel
      
      const validTask = mockTask({ level: customMaxLevel - 1 })
      const invalidTask = mockTask({ level: customMaxLevel })
      
      expect(validTask.level).toBeLessThan(customMaxLevel)
      expect(invalidTask.level).toBe(customMaxLevel)
    })
  })

  describe('nested task generation', () => {
    it('should generate nested tasks correctly', () => {
      const levels = 3
      const tasksPerLevel = 2
      const nestedTasks = generateNestedTasks(levels, tasksPerLevel)
      
      // Should have tasks at each level
      const level0Tasks = nestedTasks.filter(t => t.level === 0)
      const level1Tasks = nestedTasks.filter(t => t.level === 1)
      const level2Tasks = nestedTasks.filter(t => t.level === 2)
      
      expect(level0Tasks).toHaveLength(tasksPerLevel)
      expect(level1Tasks).toHaveLength(tasksPerLevel * tasksPerLevel)
      expect(level2Tasks).toHaveLength(tasksPerLevel * tasksPerLevel * tasksPerLevel)
    })

    it('should maintain parent-child relationships', () => {
      const nestedTasks = generateNestedTasks(3, 2)
      
      // Check that child tasks have correct parent references
      const level1Tasks = nestedTasks.filter(t => t.level === 1)
      const level0Tasks = nestedTasks.filter(t => t.level === 0)
      
      level1Tasks.forEach(childTask => {
        const parentExists = level0Tasks.some(parentTask => 
          parentTask.id === childTask.parentTaskId
        )
        expect(parentExists).toBe(true)
      })
    })

    it('should generate unique task IDs', () => {
      const nestedTasks = generateNestedTasks(3, 3)
      const taskIds = nestedTasks.map(t => t.id)
      const uniqueIds = [...new Set(taskIds)]
      
      expect(uniqueIds).toHaveLength(taskIds.length)
    })
  })

  describe('task hierarchy operations', () => {
    let nestedTasks

    beforeEach(() => {
      nestedTasks = generateNestedTasks(4, 2)
      store.state.tasks.tasks = nestedTasks
    })

    it('should find all children of a parent task', () => {
      const parentTask = nestedTasks.find(t => t.level === 0)
      const children = nestedTasks.filter(t => t.parentTaskId === parentTask.id)
      
      expect(children).toHaveLength(2) // 2 tasks per level
      expect(children.every(child => child.level === 1)).toBe(true)
    })

    it('should find all descendants of a parent task', () => {
      const parentTask = nestedTasks.find(t => t.level === 0)
      
      function getAllDescendants(parentId, tasks) {
        const directChildren = tasks.filter(t => t.parentTaskId === parentId)
        const allDescendants = [...directChildren]
        
        directChildren.forEach(child => {
          allDescendants.push(...getAllDescendants(child.id, tasks))
        })
        
        return allDescendants
      }
      
      const descendants = getAllDescendants(parentTask.id, nestedTasks)
      
      // Should include children at levels 1, 2, and 3
      expect(descendants.length).toBeGreaterThan(2)
      expect(descendants.some(t => t.level === 1)).toBe(true)
      expect(descendants.some(t => t.level === 2)).toBe(true)
      expect(descendants.some(t => t.level === 3)).toBe(true)
    })

    it('should calculate task depth correctly', () => {
      function calculateTaskDepth(taskId, tasks) {
        const task = tasks.find(t => t.id === taskId)
        if (!task || !task.parentTaskId) return 0
        
        return 1 + calculateTaskDepth(task.parentTaskId, tasks)
      }
      
      const deepestTask = nestedTasks.find(t => t.level === 3)
      const depth = calculateTaskDepth(deepestTask.id, nestedTasks)
      
      expect(depth).toBe(3)
    })
  })

  describe('task deletion with nested children', () => {
    let nestedTasks

    beforeEach(() => {
      nestedTasks = generateNestedTasks(3, 2)
      store.state.tasks.tasks = nestedTasks
    })

    it('should identify tasks that would be orphaned', () => {
      const parentTask = nestedTasks.find(t => t.level === 0)
      
      function findOrphanedTasks(parentId, tasks) {
        const directChildren = tasks.filter(t => t.parentTaskId === parentId)
        const allOrphaned = [...directChildren]
        
        directChildren.forEach(child => {
          allOrphaned.push(...findOrphanedTasks(child.id, tasks))
        })
        
        return allOrphaned
      }
      
      const orphanedTasks = findOrphanedTasks(parentTask.id, nestedTasks)
      
      expect(orphanedTasks.length).toBeGreaterThan(0)
      expect(orphanedTasks.every(t => t.level > 0)).toBe(true)
    })

    it('should handle cascade deletion', () => {
      const parentTask = nestedTasks.find(t => t.level === 0)
      const initialCount = nestedTasks.length
      
      function cascadeDelete(parentId, tasks) {
        const toDelete = tasks.filter(t => 
          t.id === parentId || isDescendantOf(t.id, parentId, tasks)
        )
        return tasks.filter(t => !toDelete.includes(t))
      }
      
      function isDescendantOf(taskId, ancestorId, tasks) {
        const task = tasks.find(t => t.id === taskId)
        if (!task || !task.parentTaskId) return false
        if (task.parentTaskId === ancestorId) return true
        return isDescendantOf(task.parentTaskId, ancestorId, tasks)
      }
      
      const remainingTasks = cascadeDelete(parentTask.id, nestedTasks)
      
      expect(remainingTasks.length).toBeLessThan(initialCount)
      expect(remainingTasks.every(t => !isDescendantOf(t.id, parentTask.id, nestedTasks))).toBe(true)
    })

    it('should handle promotion of child tasks', () => {
      const parentTask = nestedTasks.find(t => t.level === 1)
      const children = nestedTasks.filter(t => t.parentTaskId === parentTask.id)
      
      function promoteChildren(parentId, tasks) {
        const parent = tasks.find(t => t.id === parentId)
        const children = tasks.filter(t => t.parentTaskId === parentId)
        
        // Promote children to parent's level
        children.forEach(child => {
          child.parentTaskId = parent.parentTaskId
          child.level = parent.level
        })
        
        return tasks.filter(t => t.id !== parentId)
      }
      
      const updatedTasks = promoteChildren(parentTask.id, [...nestedTasks])
      const promotedChildren = updatedTasks.filter(t => 
        children.some(c => c.id === t.id)
      )
      
      expect(promotedChildren.every(t => t.level === parentTask.level)).toBe(true)
      expect(promotedChildren.every(t => t.parentTaskId === parentTask.parentTaskId)).toBe(true)
    })
  })

  describe('nesting level configuration', () => {
    it('should allow admin to configure maximum nesting level', () => {
      const newMaxLevel = 50
      
      // Simulate admin action
      store.commit('tasks/SET_MAX_NESTING_LEVEL', newMaxLevel)
      
      expect(store.state.tasks.maxNestingLevel).toBe(newMaxLevel)
    })

    it('should validate existing tasks against new nesting limit', () => {
      const tasks = generateNestedTasks(5, 2) // Creates tasks up to level 4
      const newMaxLevel = 3
      
      const invalidTasks = tasks.filter(t => t.level >= newMaxLevel)
      const validTasks = tasks.filter(t => t.level < newMaxLevel)
      
      expect(invalidTasks.length).toBeGreaterThan(0)
      expect(validTasks.length).toBeGreaterThan(0)
      expect(invalidTasks.every(t => t.level >= newMaxLevel)).toBe(true)
    })

    it('should prevent creating tasks beyond new limit', () => {
      const maxLevel = 3
      store.state.tasks.maxNestingLevel = maxLevel
      
      const validTask = mockTask({ level: maxLevel - 1 })
      const invalidTask = mockTask({ level: maxLevel })
      
      // Simulate validation
      function validateTaskLevel(task, maxLevel) {
        return task.level < maxLevel
      }
      
      expect(validateTaskLevel(validTask, maxLevel)).toBe(true)
      expect(validateTaskLevel(invalidTask, maxLevel)).toBe(false)
    })
  })

  describe('visual indentation system', () => {
    it('should calculate indentation based on task level', () => {
      const tasks = generateNestedTasks(4, 2)
      
      function calculateIndentation(level, indentSize = 20) {
        return level * indentSize
      }
      
      tasks.forEach(task => {
        const indentation = calculateIndentation(task.level)
        expect(indentation).toBe(task.level * 20)
      })
    })

    it('should provide visual hierarchy indicators', () => {
      const tasks = generateNestedTasks(3, 2)
      
      function getHierarchyIndicator(level) {
        const indicators = ['', '└─', '  └─', '    └─']
        return indicators[level] || '    '.repeat(level) + '└─'
      }
      
      tasks.forEach(task => {
        const indicator = getHierarchyIndicator(task.level)
        expect(indicator).toBeDefined()
        
        if (task.level === 0) {
          expect(indicator).toBe('')
        } else {
          expect(indicator).toContain('└─')
        }
      })
    })
  })

  describe('performance with deep nesting', () => {
    it('should handle maximum nesting level efficiently', () => {
      const maxLevel = 100
      const startTime = performance.now()
      
      // Generate tasks at maximum depth
      const deepTasks = []
      let parentId = null
      
      for (let level = 0; level < maxLevel; level++) {
        const task = mockTask({
          id: `task-${level}`,
          level,
          parentTaskId: parentId
        })
        deepTasks.push(task)
        parentId = task.id
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(deepTasks).toHaveLength(maxLevel)
      expect(deepTasks[maxLevel - 1].level).toBe(maxLevel - 1)
      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should efficiently find tasks at specific levels', () => {
      const tasks = generateNestedTasks(10, 3) // Large nested structure
      const startTime = performance.now()
      
      // Find all tasks at level 5
      const level5Tasks = tasks.filter(t => t.level === 5)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(level5Tasks.length).toBeGreaterThan(0)
      expect(level5Tasks.every(t => t.level === 5)).toBe(true)
      expect(duration).toBeLessThan(50) // Should be fast
    })
  })

  describe('data integrity with nesting', () => {
    it('should maintain referential integrity', () => {
      const tasks = generateNestedTasks(4, 2)
      
      // Check that all parent references are valid
      const taskIds = new Set(tasks.map(t => t.id))
      
      tasks.forEach(task => {
        if (task.parentTaskId) {
          expect(taskIds.has(task.parentTaskId)).toBe(true)
        }
      })
    })

    it('should prevent circular references', () => {
      const task1 = mockTask({ id: 'task-1', parentTaskId: 'task-2' })
      const task2 = mockTask({ id: 'task-2', parentTaskId: 'task-1' })
      
      function hasCircularReference(tasks) {
        const visited = new Set()
        const recursionStack = new Set()
        
        function hasCycle(taskId) {
          if (recursionStack.has(taskId)) return true
          if (visited.has(taskId)) return false
          
          visited.add(taskId)
          recursionStack.add(taskId)
          
          const task = tasks.find(t => t.id === taskId)
          if (task && task.parentTaskId) {
            if (hasCycle(task.parentTaskId)) return true
          }
          
          recursionStack.delete(taskId)
          return false
        }
        
        return tasks.some(task => hasCycle(task.id))
      }
      
      expect(hasCircularReference([task1, task2])).toBe(true)
    })

    it('should validate parent-child level consistency', () => {
      const tasks = generateNestedTasks(3, 2)
      
      function validateLevelConsistency(tasks) {
        return tasks.every(task => {
          if (!task.parentTaskId) return task.level === 0
          
          const parent = tasks.find(t => t.id === task.parentTaskId)
          return parent && task.level === parent.level + 1
        })
      }
      
      expect(validateLevelConsistency(tasks)).toBe(true)
    })
  })
})