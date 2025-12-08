/**
 * 封存/解封服务属性测试
 * 
 * 使用 fast-check 进行属性测试，验证解封功能的正确性
 * 
 * @module services/seal.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { DailyRecord, Task, JournalEntry, MoodType, Priority } from '@/types'
import {
  unsealRecord,
  sealRecord,
  canAddTask,
  canRemoveTask,
  canModifyTask,
  canEditJournal,
  addTaskToRecord,
  removeTaskFromRecord,
  modifyTaskInRecord,
  addJournalEntryToRecord,
  editJournalEntryInRecord,
  deleteJournalEntryFromRecord
} from './seal'

// ==================== 生成器 ====================

// 生成 UUID
const uuidArb = fc.uuid()

// 优先级生成器
const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low')

// 心情生成器
const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

// 可选心情生成器
const optionalMoodArb: fc.Arbitrary<MoodType | null> = fc.oneof(
  fc.constant(null),
  moodArb
)

// 有效任务描述生成器（非空白）
const validTaskDescriptionArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)

// 有效日记内容生成器（非空白）
const validJournalContentArb = fc.string({ minLength: 1, maxLength: 500 })
  .filter(s => s.trim().length > 0)

// ISO 日期字符串生成器
const isoDateStringArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(d => d.toISOString())

// 日期字符串生成器 (YYYY-MM-DD)
const dateStringArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(d => d.toISOString().split('T')[0])

// 任务生成器
const taskArb: fc.Arbitrary<Task> = fc.record({
  id: uuidArb,
  description: validTaskDescriptionArb,
  completed: fc.boolean(),
  priority: priorityArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  order: fc.nat({ max: 100 }),
  createdAt: isoDateStringArb,
  completedAt: fc.oneof(fc.constant(null), isoDateStringArb)
})

// 日记条目生成器
const journalEntryArb: fc.Arbitrary<JournalEntry> = fc.record({
  id: uuidArb,
  content: validJournalContentArb,
  mood: optionalMoodArb,
  createdAt: isoDateStringArb
})

// 已封存记录生成器
const sealedRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
  id: dateStringArb,
  date: dateStringArb,
  tasks: fc.array(taskArb, { maxLength: 10 }),
  journal: fc.string({ maxLength: 500 }),
  mood: optionalMoodArb,
  journalEntries: fc.array(journalEntryArb, { maxLength: 10 }),
  isSealed: fc.constant(true),
  completionRate: fc.nat({ max: 100 }),
  createdAt: isoDateStringArb,
  sealedAt: isoDateStringArb
}).map(record => ({
  ...record,
  id: record.date // 确保 id 和 date 一致
}))

// 未封存记录生成器
const unsealedRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
  id: dateStringArb,
  date: dateStringArb,
  tasks: fc.array(taskArb, { maxLength: 10 }),
  journal: fc.string({ maxLength: 500 }),
  mood: optionalMoodArb,
  journalEntries: fc.array(journalEntryArb, { maxLength: 10 }),
  isSealed: fc.constant(false),
  completionRate: fc.nat({ max: 100 }),
  createdAt: isoDateStringArb,
  sealedAt: fc.oneof(fc.constant(null), isoDateStringArb)
}).map(record => ({
  ...record,
  id: record.date // 确保 id 和 date 一致
}))

// 带日记条目的未封存记录生成器
const unsealedRecordWithEntriesArb: fc.Arbitrary<DailyRecord> = fc.record({
  id: dateStringArb,
  date: dateStringArb,
  tasks: fc.array(taskArb, { maxLength: 10 }),
  journal: fc.string({ maxLength: 500 }),
  mood: optionalMoodArb,
  journalEntries: fc.array(journalEntryArb, { minLength: 1, maxLength: 10 }),
  isSealed: fc.constant(false),
  completionRate: fc.nat({ max: 100 }),
  createdAt: isoDateStringArb,
  sealedAt: fc.oneof(fc.constant(null), isoDateStringArb)
}).map(record => ({
  ...record,
  id: record.date
}))

// 带日记条目的已封存记录生成器
const sealedRecordWithEntriesArb: fc.Arbitrary<DailyRecord> = fc.record({
  id: dateStringArb,
  date: dateStringArb,
  tasks: fc.array(taskArb, { maxLength: 10 }),
  journal: fc.string({ maxLength: 500 }),
  mood: optionalMoodArb,
  journalEntries: fc.array(journalEntryArb, { minLength: 1, maxLength: 10 }),
  isSealed: fc.constant(true),
  completionRate: fc.nat({ max: 100 }),
  createdAt: isoDateStringArb,
  sealedAt: isoDateStringArb
}).map(record => ({
  ...record,
  id: record.date
}))

describe('Seal Service Property Tests', () => {
  /**
   * **Feature: seal-enhancement, Property 1: 解封状态切换**
   * *对于任意* 已封存的记录，执行解封操作后，isSealed 应变为 false，且原有数据（任务、日记条目）保持不变
   * **Validates: Requirements 1.2, 1.5**
   */
  describe('Property 1: 解封状态切换', () => {
    it('解封后 isSealed 应变为 false', () => {
      fc.assert(
        fc.property(sealedRecordArb, (record) => {
          const result = unsealRecord(record)
          
          expect(result).not.toBeNull()
          expect(result!.isSealed).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('解封后任务列表保持不变', () => {
      fc.assert(
        fc.property(sealedRecordArb, (record) => {
          const result = unsealRecord(record)
          
          expect(result).not.toBeNull()
          expect(result!.tasks).toEqual(record.tasks)
          expect(result!.tasks.length).toBe(record.tasks.length)
        }),
        { numRuns: 100 }
      )
    })

    it('解封后日记条目保持不变', () => {
      fc.assert(
        fc.property(sealedRecordArb, (record) => {
          const result = unsealRecord(record)
          
          expect(result).not.toBeNull()
          expect(result!.journalEntries).toEqual(record.journalEntries)
        }),
        { numRuns: 100 }
      )
    })

    it('解封后保留原有 sealedAt 作为历史参考', () => {
      fc.assert(
        fc.property(sealedRecordArb, (record) => {
          const result = unsealRecord(record)
          
          expect(result).not.toBeNull()
          expect(result!.sealedAt).toBe(record.sealedAt)
        }),
        { numRuns: 100 }
      )
    })

    it('未封存的记录解封应返回 null', () => {
      fc.assert(
        fc.property(unsealedRecordArb, (record) => {
          const result = unsealRecord(record)
          
          expect(result).toBeNull()
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: seal-enhancement, Property 2: 解封后可编辑**
   * *对于任意* 解封后的记录，添加任务、删除任务、修改任务、添加日记条目操作应全部成功
   * **Validates: Requirements 1.3, 1.4**
   */
  describe('Property 2: 解封后可编辑', () => {
    it('解封后可以添加任务', () => {
      fc.assert(
        fc.property(sealedRecordArb, taskArb, (record, newTask) => {
          // 先解封
          const unsealedRecord = unsealRecord(record)
          expect(unsealedRecord).not.toBeNull()
          
          // 添加任务
          const result = addTaskToRecord(unsealedRecord!, newTask)
          
          expect(result).not.toBeNull()
          expect(result!.tasks.length).toBe(unsealedRecord!.tasks.length + 1)
          expect(result!.tasks).toContainEqual(newTask)
        }),
        { numRuns: 100 }
      )
    })

    it('解封后可以删除任务', () => {
      fc.assert(
        fc.property(
          sealedRecordArb.filter(r => r.tasks.length > 0),
          (record) => {
            // 先解封
            const unsealedRecord = unsealRecord(record)
            expect(unsealedRecord).not.toBeNull()
            
            // 选择一个任务删除
            const taskToDelete = unsealedRecord!.tasks[0]
            const result = removeTaskFromRecord(unsealedRecord!, taskToDelete.id)
            
            expect(result).not.toBeNull()
            expect(result!.tasks.length).toBe(unsealedRecord!.tasks.length - 1)
            expect(result!.tasks.find(t => t.id === taskToDelete.id)).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('解封后可以修改任务', () => {
      fc.assert(
        fc.property(
          sealedRecordArb.filter(r => r.tasks.length > 0),
          validTaskDescriptionArb,
          (record, newDescription) => {
            // 先解封
            const unsealedRecord = unsealRecord(record)
            expect(unsealedRecord).not.toBeNull()
            
            // 修改第一个任务
            const taskToModify = unsealedRecord!.tasks[0]
            const result = modifyTaskInRecord(unsealedRecord!, taskToModify.id, {
              description: newDescription
            })
            
            expect(result).not.toBeNull()
            expect(result!.tasks.find(t => t.id === taskToModify.id)?.description).toBe(newDescription)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('解封后可以添加日记条目', () => {
      fc.assert(
        fc.property(sealedRecordArb, validJournalContentArb, optionalMoodArb, (record, content, mood) => {
          // 先解封
          const unsealedRecord = unsealRecord(record)
          expect(unsealedRecord).not.toBeNull()
          
          // 添加日记条目
          const result = addJournalEntryToRecord(unsealedRecord!, content, mood)
          
          expect(result).not.toBeNull()
          expect(result!.journalEntries.length).toBe(unsealedRecord!.journalEntries.length + 1)
        }),
        { numRuns: 100 }
      )
    })

    it('解封后可以编辑日记条目', () => {
      fc.assert(
        fc.property(
          sealedRecordWithEntriesArb,
          validJournalContentArb,
          (record, newContent) => {
            // 先解封
            const unsealedRecord = unsealRecord(record)
            expect(unsealedRecord).not.toBeNull()
            
            // 编辑第一个日记条目
            const entryToEdit = unsealedRecord!.journalEntries[0]
            const result = editJournalEntryInRecord(unsealedRecord!, entryToEdit.id, newContent)
            
            expect(result).not.toBeNull()
            expect(result!.journalEntries.find(e => e.id === entryToEdit.id)?.content).toBe(newContent.trim())
          }
        ),
        { numRuns: 100 }
      )
    })

    it('解封后可以删除日记条目', () => {
      fc.assert(
        fc.property(
          sealedRecordWithEntriesArb,
          (record) => {
            // 先解封
            const unsealedRecord = unsealRecord(record)
            expect(unsealedRecord).not.toBeNull()
            
            // 删除第一个日记条目
            const entryToDelete = unsealedRecord!.journalEntries[0]
            const result = deleteJournalEntryFromRecord(unsealedRecord!, entryToDelete.id)
            
            expect(result).not.toBeNull()
            expect(result!.journalEntries.length).toBe(unsealedRecord!.journalEntries.length - 1)
            expect(result!.journalEntries.find(e => e.id === entryToDelete.id)).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  /**
   * **Feature: seal-enhancement, Property 3: 再次封存时间更新**
   * *对于任意* 解封后再次封存的记录，sealedAt 应更新为新的封存时间，且新时间晚于原封存时间
   * **Validates: Requirements 5.2**
   */
  describe('Property 3: 再次封存时间更新', () => {
    it('再次封存后 sealedAt 应更新为新时间', () => {
      fc.assert(
        fc.property(sealedRecordArb, (record) => {
          // 记录原封存时间
          const originalSealedAt = record.sealedAt
          
          // 解封
          const unsealedRecord = unsealRecord(record)
          expect(unsealedRecord).not.toBeNull()
          expect(unsealedRecord!.isSealed).toBe(false)
          
          // 再次封存
          const resealedRecord = sealRecord(unsealedRecord!)
          expect(resealedRecord).not.toBeNull()
          expect(resealedRecord!.isSealed).toBe(true)
          
          // 新封存时间应该存在
          expect(resealedRecord!.sealedAt).not.toBeNull()
          
          // 新封存时间应该是有效的 ISO 日期字符串
          const newSealedAt = new Date(resealedRecord!.sealedAt!)
          expect(newSealedAt.toString()).not.toBe('Invalid Date')
        }),
        { numRuns: 100 }
      )
    })

    it('新封存时间应晚于或等于原封存时间（当原时间在过去时）', () => {
      // 使用过去的时间生成器，确保原封存时间在当前时间之前
      const pastDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date(Date.now() - 1000) })
        .map(d => d.toISOString())
      
      const sealedRecordWithPastTimeArb = fc.record({
        id: dateStringArb,
        date: dateStringArb,
        tasks: fc.array(taskArb, { maxLength: 10 }),
        journal: fc.string({ maxLength: 500 }),
        mood: optionalMoodArb,
        journalEntries: fc.array(journalEntryArb, { maxLength: 10 }),
        isSealed: fc.constant(true),
        completionRate: fc.nat({ max: 100 }),
        createdAt: pastDateArb,
        sealedAt: pastDateArb
      }).map(record => ({
        ...record,
        id: record.date
      }))
      
      fc.assert(
        fc.property(sealedRecordWithPastTimeArb, (record) => {
          // 记录原封存时间
          const originalSealedAt = record.sealedAt
          
          // 解封
          const unsealedRecord = unsealRecord(record)
          expect(unsealedRecord).not.toBeNull()
          
          // 再次封存
          const resealedRecord = sealRecord(unsealedRecord!)
          expect(resealedRecord).not.toBeNull()
          
          // 比较时间
          if (originalSealedAt) {
            const originalTime = new Date(originalSealedAt).getTime()
            const newTime = new Date(resealedRecord!.sealedAt!).getTime()
            
            // 新时间应该晚于原时间（原时间在过去）
            expect(newTime).toBeGreaterThan(originalTime)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('已封存的记录不能再次封存', () => {
      fc.assert(
        fc.property(sealedRecordArb, (record) => {
          // 尝试对已封存的记录再次封存
          const result = sealRecord(record)
          
          expect(result).toBeNull()
        }),
        { numRuns: 100 }
      )
    })

    it('未封存的记录可以封存', () => {
      fc.assert(
        fc.property(unsealedRecordArb, (record) => {
          const result = sealRecord(record)
          
          expect(result).not.toBeNull()
          expect(result!.isSealed).toBe(true)
          expect(result!.sealedAt).not.toBeNull()
        }),
        { numRuns: 100 }
      )
    })
  })


  /**
   * **Feature: seal-enhancement, Property 8: 封存后不可编辑日记**
   * *对于任意* 已封存的记录，添加、编辑、删除日记条目操作应全部失败
   * **Validates: Requirements 7.4**
   */
  describe('Property 8: 封存后不可编辑日记', () => {
    it('封存后不能添加日记条目', () => {
      fc.assert(
        fc.property(sealedRecordArb, validJournalContentArb, optionalMoodArb, (record, content, mood) => {
          // 记录原日记条目数量
          const originalCount = record.journalEntries.length
          
          // 尝试添加日记条目
          const result = addJournalEntryToRecord(record, content, mood)
          
          // 应该失败
          expect(result).toBeNull()
          // 原记录不应被修改
          expect(record.journalEntries.length).toBe(originalCount)
        }),
        { numRuns: 100 }
      )
    })

    it('封存后不能编辑日记条目', () => {
      fc.assert(
        fc.property(sealedRecordWithEntriesArb, validJournalContentArb, (record, newContent) => {
          // 选择一个条目尝试编辑
          const entryToEdit = record.journalEntries[0]
          const originalContent = entryToEdit.content
          
          // 尝试编辑日记条目
          const result = editJournalEntryInRecord(record, entryToEdit.id, newContent)
          
          // 应该失败
          expect(result).toBeNull()
          // 原记录不应被修改
          expect(record.journalEntries[0].content).toBe(originalContent)
        }),
        { numRuns: 100 }
      )
    })

    it('封存后不能删除日记条目', () => {
      fc.assert(
        fc.property(sealedRecordWithEntriesArb, (record) => {
          // 记录原日记条目数量
          const originalCount = record.journalEntries.length
          
          // 选择一个条目尝试删除
          const entryToDelete = record.journalEntries[0]
          
          // 尝试删除日记条目
          const result = deleteJournalEntryFromRecord(record, entryToDelete.id)
          
          // 应该失败
          expect(result).toBeNull()
          // 原记录不应被修改
          expect(record.journalEntries.length).toBe(originalCount)
        }),
        { numRuns: 100 }
      )
    })

    it('canEditJournal 对已封存记录返回 false', () => {
      fc.assert(
        fc.property(sealedRecordArb, (record) => {
          expect(canEditJournal(record)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('canEditJournal 对未封存记录返回 true', () => {
      fc.assert(
        fc.property(unsealedRecordArb, (record) => {
          expect(canEditJournal(record)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })
})
