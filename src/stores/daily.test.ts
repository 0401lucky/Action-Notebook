import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import { useDailyStore } from './daily'
import type { Priority } from '@/types'

// Arbitraries (生成器)
const validTaskDescription = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)

const whitespaceString = fc.stringOf(
  fc.constantFrom(' ', '\t', '\n', '\r', '')
).filter(s => s.trim().length === 0)

const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low')

const tagsArb = fc.array(
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  { maxLength: 5 }
)

describe('dailyStore Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /**
   * **Feature: action-log, Property 1: Task Addition Invariant**
   * *对于任意*有效的（非空、非纯空白）任务描述，将其添加到任务列表后，
   * 列表长度应恰好增加1，且新任务应存在于列表中并具有正确的描述。
   * **Validates: Requirements 1.1**
   */
  it('Property 1: Task Addition Invariant', () => {
    fc.assert(
      fc.property(
        validTaskDescription,
        priorityArb,
        tagsArb,
        (description, priority, tags) => {
          const store = useDailyStore()
          store.$reset()
          
          const initialLength = store.currentRecord?.tasks.length ?? 0
          const taskId = store.addTask(description, priority, tags)
          
          // 任务应该被成功添加
          expect(taskId).not.toBeNull()
          
          // 列表长度应增加1
          expect(store.currentRecord?.tasks.length).toBe(initialLength + 1)
          
          // 新任务应存在于列表中
          const addedTask = store.currentRecord?.tasks.find(t => t.id === taskId)
          expect(addedTask).toBeDefined()
          expect(addedTask?.description).toBe(description.trim())
          expect(addedTask?.priority).toBe(priority)
          expect(addedTask?.tags).toEqual(tags)
          expect(addedTask?.completed).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })


  /**
   * **Feature: action-log, Property 2: Empty Task Rejection**
   * *对于任意*完全由空白字符组成的字符串（包括空字符串），
   * 尝试将其作为任务添加应被拒绝，且任务列表应保持不变。
   * **Validates: Requirements 1.2**
   */
  it('Property 2: Empty Task Rejection', () => {
    fc.assert(
      fc.property(
        whitespaceString,
        (emptyDescription) => {
          const store = useDailyStore()
          store.$reset()
          
          // 先添加一些有效任务
          store.addTask('Valid task 1', 'high', [])
          store.addTask('Valid task 2', 'medium', [])
          
          const initialLength = store.currentRecord?.tasks.length ?? 0
          const initialTasks = store.currentRecord?.tasks.map(t => t.id) ?? []
          
          // 尝试添加空白任务
          const taskId = store.addTask(emptyDescription, 'medium', [])
          
          // 应该被拒绝
          expect(taskId).toBeNull()
          
          // 列表长度应保持不变
          expect(store.currentRecord?.tasks.length).toBe(initialLength)
          
          // 任务ID集合应保持不变
          const currentTasks = store.currentRecord?.tasks.map(t => t.id) ?? []
          expect(currentTasks).toEqual(initialTasks)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: action-log, Property 3: Task Deletion Invariant**
   * *对于任意*存在于任务列表中的任务，删除它后列表长度应恰好减少1，
   * 且被删除的任务应不再存在于列表中。
   * **Validates: Requirements 1.3**
   */
  it('Property 3: Task Deletion Invariant', () => {
    fc.assert(
      fc.property(
        fc.array(validTaskDescription, { minLength: 1, maxLength: 10 }),
        fc.nat(),
        (descriptions, indexSeed) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加多个任务
          const taskIds: string[] = []
          for (const desc of descriptions) {
            const id = store.addTask(desc, 'medium', [])
            if (id) taskIds.push(id)
          }
          
          if (taskIds.length === 0) return
          
          // 选择一个要删除的任务
          const deleteIndex = indexSeed % taskIds.length
          const taskIdToDelete = taskIds[deleteIndex]
          
          const initialLength = store.currentRecord?.tasks.length ?? 0
          
          // 删除任务
          const result = store.removeTask(taskIdToDelete)
          
          // 应该删除成功
          expect(result).toBe(true)
          
          // 列表长度应减少1
          expect(store.currentRecord?.tasks.length).toBe(initialLength - 1)
          
          // 被删除的任务应不再存在
          const deletedTask = store.currentRecord?.tasks.find(t => t.id === taskIdToDelete)
          expect(deletedTask).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })


  /**
   * **Feature: action-log, Property 4: Task Toggle Idempotence**
   * *对于任意*任务，切换其完成状态两次后应返回到原始完成状态。
   * **Validates: Requirements 1.4**
   */
  it('Property 4: Task Toggle Idempotence', () => {
    fc.assert(
      fc.property(
        validTaskDescription,
        priorityArb,
        (description, priority) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加任务
          const taskId = store.addTask(description, priority, [])
          expect(taskId).not.toBeNull()
          
          // 获取初始完成状态
          const initialCompleted = store.currentRecord?.tasks.find(t => t.id === taskId)?.completed
          expect(initialCompleted).toBe(false)
          
          // 第一次切换
          store.toggleTask(taskId!)
          const afterFirstToggle = store.currentRecord?.tasks.find(t => t.id === taskId)?.completed
          expect(afterFirstToggle).toBe(true)
          
          // 第二次切换
          store.toggleTask(taskId!)
          const afterSecondToggle = store.currentRecord?.tasks.find(t => t.id === taskId)?.completed
          
          // 应该返回到原始状态
          expect(afterSecondToggle).toBe(initialCompleted)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: action-log, Property 7: Completion Rate Calculation**
   * *对于任意*至少包含一个任务的任务列表，完成率应等于
   * （已完成任务数 / 总任务数）× 100，四舍五入到最近的整数。
   * **Validates: Requirements 3.1**
   */
  it('Property 7: Completion Rate Calculation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            description: validTaskDescription,
            completed: fc.boolean()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (taskSpecs) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加任务并设置完成状态
          for (const spec of taskSpecs) {
            const taskId = store.addTask(spec.description, 'medium', [])
            if (taskId && spec.completed) {
              store.toggleTask(taskId)
            }
          }
          
          // 计算预期完成率
          const total = store.currentRecord?.tasks.length ?? 0
          const completed = store.currentRecord?.tasks.filter(t => t.completed).length ?? 0
          const expectedRate = total > 0 ? Math.round((completed / total) * 100) : 0
          
          // 验证完成率
          expect(store.completionRate).toBe(expectedRate)
        }
      ),
      { numRuns: 100 }
    )
  })
})
