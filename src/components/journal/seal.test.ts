import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import { useDailyStore } from '@/stores/daily'
import type { MoodType, Priority } from '@/types'

// Constants
const MIN_JOURNAL_LENGTH = 50

// Arbitraries (生成器)
const validTaskDescription = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)

const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low')

const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

// Journal content that meets minimum length
const longJournalArb = fc.string({ minLength: MIN_JOURNAL_LENGTH, maxLength: 500 })

// Journal content that does NOT meet minimum length
const shortJournalArb = fc.string({ minLength: 0, maxLength: MIN_JOURNAL_LENGTH - 1 })

describe('Seal Functionality Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /**
   * **Feature: action-log, Property 10: Seal Validation Rule**
   * *对于任意*每日记录，封存操作应当且仅当满足以下条件之一时成功：
   * (a) 所有任务已完成，或 (b) 日记内容长度达到最低要求（50字符）。
   * **Validates: Requirements 4.3**
   */
  it('Property 10: Seal Validation Rule - succeeds when all tasks completed', () => {
    fc.assert(
      fc.property(
        fc.array(validTaskDescription, { minLength: 1, maxLength: 10 }),
        shortJournalArb,
        (descriptions, shortJournal) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加任务并全部完成
          for (const desc of descriptions) {
            const taskId = store.addTask(desc, 'medium', [])
            if (taskId) {
              store.toggleTask(taskId)
            }
          }
          
          // 设置短日记（不满足最低字数）
          store.updateJournal(shortJournal)
          
          // 验证所有任务已完成
          const allCompleted = store.currentRecord?.tasks.every(t => t.completed)
          expect(allCompleted).toBe(true)
          
          // 封存应该成功
          const result = store.sealDay()
          expect(result).toBe(true)
          expect(store.currentRecord?.isSealed).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10: Seal Validation Rule - succeeds when journal meets minimum length', () => {
    fc.assert(
      fc.property(
        fc.array(validTaskDescription, { minLength: 0, maxLength: 5 }),
        longJournalArb,
        (descriptions, longJournal) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加任务但不完成（或没有任务）
          for (const desc of descriptions) {
            store.addTask(desc, 'medium', [])
          }
          
          // 设置长日记（满足最低字数）
          store.updateJournal(longJournal)
          
          // 验证日记满足最低字数
          expect(store.currentRecord?.journal.length).toBeGreaterThanOrEqual(MIN_JOURNAL_LENGTH)
          
          // 封存应该成功
          const result = store.sealDay()
          expect(result).toBe(true)
          expect(store.currentRecord?.isSealed).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10: Seal Validation Rule - fails when neither condition met', () => {
    fc.assert(
      fc.property(
        fc.array(validTaskDescription, { minLength: 1, maxLength: 5 }),
        shortJournalArb,
        fc.nat({ max: 10 }),
        (descriptions, shortJournal, incompleteSeed) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加任务
          const taskIds: string[] = []
          for (const desc of descriptions) {
            const taskId = store.addTask(desc, 'medium', [])
            if (taskId) taskIds.push(taskId)
          }
          
          if (taskIds.length === 0) return
          
          // 完成部分任务（但不是全部）
          const completeCount = incompleteSeed % taskIds.length
          for (let i = 0; i < completeCount; i++) {
            store.toggleTask(taskIds[i])
          }
          
          // 设置短日记
          store.updateJournal(shortJournal)
          
          // 验证条件都不满足
          const allCompleted = store.currentRecord?.tasks.every(t => t.completed)
          const journalMeetsMin = (store.currentRecord?.journal.length ?? 0) >= MIN_JOURNAL_LENGTH
          
          // 只有当两个条件都不满足时才测试
          if (!allCompleted && !journalMeetsMin) {
            // 封存应该失败
            const result = store.sealDay()
            expect(result).toBe(false)
            expect(store.currentRecord?.isSealed).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: action-log, Property 11: Sealed Record Immutability**
   * *对于任意*已封存的每日记录，所有修改操作（添加任务、删除任务、更新日记、更新心情）
   * 应被拒绝，且记录应保持不变。
   * **Validates: Requirements 4.5**
   */
  it('Property 11: Sealed Record Immutability - addTask rejected', () => {
    fc.assert(
      fc.property(
        longJournalArb,
        validTaskDescription,
        priorityArb,
        (journal, newTaskDesc, priority) => {
          const store = useDailyStore()
          store.$reset()
          
          // 设置长日记并封存
          store.updateJournal(journal)
          const sealResult = store.sealDay()
          expect(sealResult).toBe(true)
          
          // 记录封存后的状态
          const tasksBeforeAdd = store.currentRecord?.tasks.length ?? 0
          
          // 尝试添加任务
          const addResult = store.addTask(newTaskDesc, priority, [])
          
          // 应该被拒绝
          expect(addResult).toBeNull()
          expect(store.currentRecord?.tasks.length).toBe(tasksBeforeAdd)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: Sealed Record Immutability - removeTask rejected', () => {
    fc.assert(
      fc.property(
        validTaskDescription,
        longJournalArb,
        (taskDesc, journal) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加任务
          const taskId = store.addTask(taskDesc, 'medium', [])
          expect(taskId).not.toBeNull()
          
          // 设置长日记并封存
          store.updateJournal(journal)
          const sealResult = store.sealDay()
          expect(sealResult).toBe(true)
          
          // 记录封存后的状态
          const tasksBeforeRemove = store.currentRecord?.tasks.length ?? 0
          
          // 尝试删除任务
          const removeResult = store.removeTask(taskId!)
          
          // 应该被拒绝
          expect(removeResult).toBe(false)
          expect(store.currentRecord?.tasks.length).toBe(tasksBeforeRemove)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: Sealed Record Immutability - toggleTask rejected', () => {
    fc.assert(
      fc.property(
        validTaskDescription,
        longJournalArb,
        (taskDesc, journal) => {
          const store = useDailyStore()
          store.$reset()
          
          // 添加任务
          const taskId = store.addTask(taskDesc, 'medium', [])
          expect(taskId).not.toBeNull()
          
          // 设置长日记并封存
          store.updateJournal(journal)
          const sealResult = store.sealDay()
          expect(sealResult).toBe(true)
          
          // 记录封存后的任务状态
          const completedBefore = store.currentRecord?.tasks.find(t => t.id === taskId)?.completed
          
          // 尝试切换任务状态
          const toggleResult = store.toggleTask(taskId!)
          
          // 应该被拒绝
          expect(toggleResult).toBe(false)
          expect(store.currentRecord?.tasks.find(t => t.id === taskId)?.completed).toBe(completedBefore)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: Sealed Record Immutability - updateJournal rejected', () => {
    fc.assert(
      fc.property(
        longJournalArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        (originalJournal, newJournal) => {
          const store = useDailyStore()
          store.$reset()
          
          // 设置日记并封存
          store.updateJournal(originalJournal)
          const sealResult = store.sealDay()
          expect(sealResult).toBe(true)
          
          // 尝试更新日记
          const updateResult = store.updateJournal(newJournal)
          
          // 应该被拒绝
          expect(updateResult).toBe(false)
          expect(store.currentRecord?.journal).toBe(originalJournal)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: Sealed Record Immutability - updateMood rejected', () => {
    fc.assert(
      fc.property(
        longJournalArb,
        moodArb,
        moodArb,
        (journal, originalMood, newMood) => {
          const store = useDailyStore()
          store.$reset()
          
          // 设置心情和日记
          store.updateMood(originalMood)
          store.updateJournal(journal)
          
          // 封存
          const sealResult = store.sealDay()
          expect(sealResult).toBe(true)
          
          // 尝试更新心情
          const updateResult = store.updateMood(newMood)
          
          // 应该被拒绝
          expect(updateResult).toBe(false)
          expect(store.currentRecord?.mood).toBe(originalMood)
        }
      ),
      { numRuns: 100 }
    )
  })
})
