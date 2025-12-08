import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import type { Task, Priority } from '@/types'

// Utility functions for testing (extracted from TaskList component logic)

/**
 * Sort tasks by priority (high > medium > low), then by order
 */
function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.order - b.order
  })
}

/**
 * Validate that a reorder operation is a valid permutation
 * (same tasks, no additions or deletions)
 */
function isValidPermutation(original: Task[], reordered: Task[]): boolean {
  if (original.length !== reordered.length) return false
  
  const originalIds = new Set(original.map(t => t.id))
  const reorderedIds = new Set(reordered.map(t => t.id))
  
  if (originalIds.size !== reorderedIds.size) return false
  
  for (const id of originalIds) {
    if (!reorderedIds.has(id)) return false
  }
  
  return true
}

// Arbitraries (生成器)
const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low')

const taskArb: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  completed: fc.boolean(),
  priority: priorityArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
  order: fc.nat({ max: 1000 }),
  createdAt: fc.date().map(d => d.toISOString()),
  completedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
})

const taskListArb = fc.array(taskArb, { minLength: 1, maxLength: 20 })

describe('TaskList Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /**
   * **Feature: action-log, Property 5: Priority Sorting Invariant**
   * *对于任意*按优先级排序后的任务列表，所有高优先级任务应出现在所有中优先级任务之前，
   * 所有中优先级任务应出现在所有低优先级任务之前。
   * **Validates: Requirements 2.2**
   */
  it('Property 5: Priority Sorting Invariant', () => {
    fc.assert(
      fc.property(
        taskListArb,
        (tasks) => {
          const sorted = sortTasksByPriority(tasks)
          
          // Find indices of first occurrence of each priority
          let lastHighIndex = -1
          let firstMediumIndex = sorted.length
          let lastMediumIndex = -1
          let firstLowIndex = sorted.length
          
          sorted.forEach((task, index) => {
            if (task.priority === 'high') {
              lastHighIndex = index
            } else if (task.priority === 'medium') {
              if (firstMediumIndex === sorted.length) {
                firstMediumIndex = index
              }
              lastMediumIndex = index
            } else if (task.priority === 'low') {
              if (firstLowIndex === sorted.length) {
                firstLowIndex = index
              }
            }
          })
          
          // All high priority tasks should come before all medium priority tasks
          if (lastHighIndex !== -1 && firstMediumIndex !== sorted.length) {
            expect(lastHighIndex).toBeLessThan(firstMediumIndex)
          }
          
          // All medium priority tasks should come before all low priority tasks
          if (lastMediumIndex !== -1 && firstLowIndex !== sorted.length) {
            expect(lastMediumIndex).toBeLessThan(firstLowIndex)
          }
          
          // All high priority tasks should come before all low priority tasks
          if (lastHighIndex !== -1 && firstLowIndex !== sorted.length) {
            expect(lastHighIndex).toBeLessThan(firstLowIndex)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: action-log, Property 6: Reorder Permutation Invariant**
   * *对于任意*任务列表重排序操作，结果列表应包含与原列表完全相同的任务（按ID），
   * 无添加或删除。
   * **Validates: Requirements 2.4**
   */
  it('Property 6: Reorder Permutation Invariant', () => {
    fc.assert(
      fc.property(
        taskListArb,
        fc.array(fc.nat({ max: 100 }), { minLength: 20, maxLength: 20 }),
        (tasks, shuffleSeeds) => {
          // Create a shuffled version of the tasks (simulating drag-and-drop reorder)
          const shuffled = [...tasks]
          
          // Fisher-Yates shuffle using the generated seeds
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = shuffleSeeds[i % shuffleSeeds.length] % (i + 1)
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }
          
          // Update order values after reorder
          const reordered = shuffled.map((task, index) => ({
            ...task,
            order: index
          }))
          
          // Verify it's a valid permutation
          expect(isValidPermutation(tasks, reordered)).toBe(true)
          
          // Verify all original task IDs are present
          const originalIds = new Set(tasks.map(t => t.id))
          const reorderedIds = new Set(reordered.map(t => t.id))
          
          expect(reorderedIds.size).toBe(originalIds.size)
          
          for (const id of originalIds) {
            expect(reorderedIds.has(id)).toBe(true)
          }
          
          // Verify no new tasks were added
          for (const id of reorderedIds) {
            expect(originalIds.has(id)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional test: Sorting preserves all tasks
   * Verifies that sorting doesn't lose or duplicate any tasks
   */
  it('Sorting preserves all tasks (no loss or duplication)', () => {
    fc.assert(
      fc.property(
        taskListArb,
        (tasks) => {
          const sorted = sortTasksByPriority(tasks)
          
          // Same length
          expect(sorted.length).toBe(tasks.length)
          
          // Same set of IDs
          const originalIds = new Set(tasks.map(t => t.id))
          const sortedIds = new Set(sorted.map(t => t.id))
          
          expect(sortedIds.size).toBe(originalIds.size)
          
          for (const id of originalIds) {
            expect(sortedIds.has(id)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional test: Tasks within same priority maintain relative order by 'order' field
   */
  it('Tasks within same priority are sorted by order field', () => {
    fc.assert(
      fc.property(
        taskListArb,
        (tasks) => {
          const sorted = sortTasksByPriority(tasks)
          
          // Group by priority
          const highTasks = sorted.filter(t => t.priority === 'high')
          const mediumTasks = sorted.filter(t => t.priority === 'medium')
          const lowTasks = sorted.filter(t => t.priority === 'low')
          
          // Within each priority group, tasks should be sorted by order
          const isSortedByOrder = (taskGroup: Task[]) => {
            for (let i = 1; i < taskGroup.length; i++) {
              if (taskGroup[i].order < taskGroup[i - 1].order) {
                return false
              }
            }
            return true
          }
          
          expect(isSortedByOrder(highTasks)).toBe(true)
          expect(isSortedByOrder(mediumTasks)).toBe(true)
          expect(isSortedByOrder(lowTasks)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
