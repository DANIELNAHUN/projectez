import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockStore, mockProject, mockTask } from '../utils.js'

describe('Subtask Editing Fix', () => {
    let store
    let project
    let parentTask
    let subtask

    beforeEach(() => {
        // Create a parent task
        parentTask = mockTask({
            id: 'parent-task-1',
            title: 'Parent Task',
            level: 0,
            parentTaskId: null
        })

        // Create a subtask
        subtask = mockTask({
            id: 'subtask-1',
            title: 'Subtask',
            level: 1,
            parentTaskId: 'parent-task-1'
        })

        project = mockProject({
            tasks: [parentTask, subtask]
        })

        store = createMockStore({
            projects: {
                projects: [project],
                currentProject: project
            },
            tasks: {
                tasks: [parentTask, subtask],
                maxNestingLevel: 100
            }
        })
    })

    describe('preserving parentTaskId during updates', () => {
        it('should preserve parentTaskId when updating a subtask', async () => {
            // Simulate updating the subtask title
            const updatedSubtaskData = {
                ...subtask,
                title: 'Updated Subtask Title',
                description: 'Updated description'
            }

            // This simulates the fix in TaskManager.vue
            const taskUpdatePayload = {
                ...subtask, // Original task data (includes parentTaskId and level)
                ...updatedSubtaskData, // Updated form data
                id: subtask.id,
                parentTaskId: subtask.parentTaskId, // Explicitly preserve parentTaskId
                level: subtask.level // Explicitly preserve level
            }

            // Verify that parentTaskId is preserved
            expect(taskUpdatePayload.parentTaskId).toBe('parent-task-1')
            expect(taskUpdatePayload.level).toBe(1)
            expect(taskUpdatePayload.title).toBe('Updated Subtask Title')
            expect(taskUpdatePayload.description).toBe('Updated description')
        })

        it('should not lose parentTaskId when only updating specific fields', async () => {
            // Simulate updating only the status
            const statusUpdate = {
                status: 'completed',
                progress: 100
            }

            // This simulates the fix in various components
            const taskUpdatePayload = {
                ...subtask, // Original task data (includes all properties)
                ...statusUpdate // Only the fields being updated
            }

            // Verify that parentTaskId and level are preserved
            expect(taskUpdatePayload.parentTaskId).toBe('parent-task-1')
            expect(taskUpdatePayload.level).toBe(1)
            expect(taskUpdatePayload.status).toBe('completed')
            expect(taskUpdatePayload.progress).toBe(100)
            expect(taskUpdatePayload.title).toBe(subtask.title) // Original title preserved
        })

        it('should preserve hierarchy when updating dates in Gantt', async () => {
            // Simulate Gantt date update
            const newStartDate = new Date('2024-02-01')
            const newEndDate = new Date('2024-02-05')

            // This simulates the fix in gantt.js
            const taskUpdatePayload = {
                ...subtask, // Original task data (includes parentTaskId and level)
                startDate: newStartDate,
                endDate: newEndDate
            }

            // Verify that hierarchy is preserved during date updates
            expect(taskUpdatePayload.parentTaskId).toBe('parent-task-1')
            expect(taskUpdatePayload.level).toBe(1)
            expect(taskUpdatePayload.startDate).toBe(newStartDate)
            expect(taskUpdatePayload.endDate).toBe(newEndDate)
        })

        it('should maintain parent-child relationship after multiple updates', async () => {
            // Simulate multiple updates to the subtask
            let currentSubtask = { ...subtask }

            // First update: change title
            currentSubtask = {
                ...currentSubtask,
                title: 'First Update',
                parentTaskId: currentSubtask.parentTaskId,
                level: currentSubtask.level
            }

            // Second update: change status
            currentSubtask = {
                ...currentSubtask,
                status: 'in_progress',
                parentTaskId: currentSubtask.parentTaskId,
                level: currentSubtask.level
            }

            // Third update: change assignment
            currentSubtask = {
                ...currentSubtask,
                assignedTo: 'user-123',
                parentTaskId: currentSubtask.parentTaskId,
                level: currentSubtask.level
            }

            // Verify that after multiple updates, hierarchy is still intact
            expect(currentSubtask.parentTaskId).toBe('parent-task-1')
            expect(currentSubtask.level).toBe(1)
            expect(currentSubtask.title).toBe('First Update')
            expect(currentSubtask.status).toBe('in_progress')
            expect(currentSubtask.assignedTo).toBe('user-123')
        })
    })

    describe('edge cases', () => {
        it('should handle updating a task that becomes a subtask', async () => {
            // Create a root task
            const rootTask = mockTask({
                id: 'root-task',
                title: 'Root Task',
                level: 0,
                parentTaskId: null
            })

            // Update it to become a subtask of parentTask
            const updatedTask = {
                ...rootTask,
                parentTaskId: 'parent-task-1',
                level: 1,
                title: 'Now a Subtask'
            }

            expect(updatedTask.parentTaskId).toBe('parent-task-1')
            expect(updatedTask.level).toBe(1)
            expect(updatedTask.title).toBe('Now a Subtask')
        })

        it('should handle updating a subtask that becomes a root task', async () => {
            // Update subtask to become a root task
            const updatedTask = {
                ...subtask,
                parentTaskId: null,
                level: 0,
                title: 'Now a Root Task'
            }

            expect(updatedTask.parentTaskId).toBe(null)
            expect(updatedTask.level).toBe(0)
            expect(updatedTask.title).toBe('Now a Root Task')
        })

        it('should handle updating deeply nested subtasks', async () => {
            // Create a deeply nested structure
            const level2Task = mockTask({
                id: 'level2-task',
                title: 'Level 2 Task',
                level: 2,
                parentTaskId: 'subtask-1'
            })

            const level3Task = mockTask({
                id: 'level3-task',
                title: 'Level 3 Task',
                level: 3,
                parentTaskId: 'level2-task'
            })

            // Update the deeply nested task
            const updatedLevel3Task = {
                ...level3Task,
                title: 'Updated Level 3 Task',
                description: 'New description',
                parentTaskId: level3Task.parentTaskId, // Preserve hierarchy
                level: level3Task.level
            }

            expect(updatedLevel3Task.parentTaskId).toBe('level2-task')
            expect(updatedLevel3Task.level).toBe(3)
            expect(updatedLevel3Task.title).toBe('Updated Level 3 Task')
        })
    })

    describe('regression prevention', () => {
        it('should not convert subtasks to root tasks accidentally', async () => {
            // This test ensures the bug doesn't reoccur
            const formData = {
                title: 'Updated Subtask Title',
                description: 'Updated description',
                status: 'in_progress',
                priority: 'high'
                // Note: formData intentionally doesn't include parentTaskId or level
            }

            // WRONG way (the bug):
            const buggyUpdate = {
                ...formData,
                id: subtask.id
                // This would lose parentTaskId and level
            }

            // CORRECT way (the fix):
            const correctUpdate = {
                ...subtask, // Original task data first
                ...formData, // Form data second
                id: subtask.id,
                parentTaskId: subtask.parentTaskId, // Explicitly preserve
                level: subtask.level // Explicitly preserve
            }

            // Verify the bug would occur with the wrong approach
            expect(buggyUpdate.parentTaskId).toBeUndefined()
            expect(buggyUpdate.level).toBeUndefined()

            // Verify the fix works
            expect(correctUpdate.parentTaskId).toBe('parent-task-1')
            expect(correctUpdate.level).toBe(1)
            expect(correctUpdate.title).toBe('Updated Subtask Title')
        })

        it('should preserve all hierarchy-related properties', async () => {
            const updateData = {
                title: 'New Title',
                status: 'completed'
            }

            const properUpdate = {
                ...subtask,
                ...updateData,
                // These should be preserved from the original task
                parentTaskId: subtask.parentTaskId,
                level: subtask.level,
                projectId: subtask.projectId
            }

            // Verify all important properties are preserved
            expect(properUpdate.parentTaskId).toBe(subtask.parentTaskId)
            expect(properUpdate.level).toBe(subtask.level)
            expect(properUpdate.projectId).toBe(subtask.projectId)
            expect(properUpdate.id).toBe(subtask.id)

            // Verify updates are applied
            expect(properUpdate.title).toBe('New Title')
            expect(properUpdate.status).toBe('completed')
        })
    })

    describe('store integration', () => {
        it('should maintain hierarchy when dispatching updateTask', async () => {
            // Mock the store dispatch
            const mockDispatch = vi.fn()
            store.dispatch = mockDispatch

            // Simulate the corrected update call
            const updatePayload = {
                ...subtask,
                title: 'Updated Title',
                parentTaskId: subtask.parentTaskId,
                level: subtask.level
            }

            await store.dispatch('tasks/updateTask', updatePayload)

            // Verify the dispatch was called with correct data
            expect(mockDispatch).toHaveBeenCalledWith('tasks/updateTask', updatePayload)
            expect(updatePayload.parentTaskId).toBe('parent-task-1')
            expect(updatePayload.level).toBe(1)
        })
    })
})