/**
 * 日记条目服务属性测试
 * 
 * 使用 fast-check 进行属性测试，验证日记服务的正确性
 * 
 * @module services/journal.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  addJournalEntry,
  editJournalEntry,
  deleteJournalEntry,
  sortEntriesByTime,
  getOverallMood,
  validateEntryContent
} from './journal'
import type { JournalEntry, MoodType } from '@/types'

// ==================== 生成器 ====================

// 心情生成器
const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

// 可选心情生成器
const optionalMoodArb: fc.Arbitrary<MoodType | null> = fc.oneof(
  fc.constant(null),
  moodArb
)

// 有效日记内容生成器（非空白）
const validContentArb = fc.string({ minLength: 1, maxLength: 500 })
  .filter(s => s.trim().length > 0)

// 空白内容生成器（仅包含空白字符）
const whitespaceOnlyArb = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))

// 日记条目生成器
const journalEntryArb: fc.Arbitrary<JournalEntry> = fc.record({
  id: fc.uuid(),
  content: validContentArb,
  mood: optionalMoodArb,
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map(d => d.toISOString())
})

// 日记条目列表生成器
const journalEntriesArb = fc.array(journalEntryArb, { minLength: 0, maxLength: 20 })

// 非空日记条目列表生成器
const nonEmptyJournalEntriesArb = fc.array(journalEntryArb, { minLength: 1, maxLength: 20 })

describe('Journal Service Property Tests', () => {
  /**
   * **Feature: seal-enhancement, Property 4: 日记条目添加**
   * *对于任意* 非空内容字符串，添加日记条目后，条目列表长度应增加 1，
   * 且新条目包含正确的内容和创建时间
   * **Validates: Requirements 6.1, 6.2**
   */
  describe('Property 4: 日记条目添加', () => {
    it('添加有效内容后列表长度增加 1', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          validContentArb,
          optionalMoodArb,
          (entries, content, mood) => {
            const originalLength = entries.length
            const result = addJournalEntry(entries, content, mood)
            
            // 应该成功
            expect(result).not.toBeNull()
            expect(result!.entries.length).toBe(originalLength + 1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('新条目包含正确的内容', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          validContentArb,
          optionalMoodArb,
          (entries, content, mood) => {
            const result = addJournalEntry(entries, content, mood)
            
            expect(result).not.toBeNull()
            expect(result!.newEntry.content).toBe(content.trim())
            expect(result!.newEntry.mood).toBe(mood)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('新条目包含有效的创建时间', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          validContentArb,
          optionalMoodArb,
          (entries, content, mood) => {
            const beforeAdd = new Date()
            const result = addJournalEntry(entries, content, mood)
            const afterAdd = new Date()
            
            expect(result).not.toBeNull()
            
            const createdAt = new Date(result!.newEntry.createdAt)
            expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime() - 1000)
            expect(createdAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime() + 1000)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('新条目有唯一的 ID', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          validContentArb,
          optionalMoodArb,
          (entries, content, mood) => {
            const result = addJournalEntry(entries, content, mood)
            
            expect(result).not.toBeNull()
            expect(result!.newEntry.id).toBeTruthy()
            
            // ID 不应与现有条目重复
            const existingIds = entries.map(e => e.id)
            expect(existingIds).not.toContain(result!.newEntry.id)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  /**
   * **Feature: seal-enhancement, Property 5: 日记条目排序**
   * *对于任意* 包含多条日记条目的记录，条目应按创建时间倒序排列（最新的在前）
   * **Validates: Requirements 6.3**
   */
  describe('Property 5: 日记条目排序', () => {
    it('排序后条目按时间倒序排列', () => {
      fc.assert(
        fc.property(
          nonEmptyJournalEntriesArb,
          (entries) => {
            const sorted = sortEntriesByTime(entries)
            
            // 验证倒序：每个条目的时间应 >= 下一个条目的时间
            for (let i = 0; i < sorted.length - 1; i++) {
              const currentTime = new Date(sorted[i].createdAt).getTime()
              const nextTime = new Date(sorted[i + 1].createdAt).getTime()
              expect(currentTime).toBeGreaterThanOrEqual(nextTime)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('排序不改变条目数量', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          (entries) => {
            const sorted = sortEntriesByTime(entries)
            expect(sorted.length).toBe(entries.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('排序不改变条目内容', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          (entries) => {
            const sorted = sortEntriesByTime(entries)
            
            // 所有原始条目都应该在排序后的列表中
            const sortedIds = new Set(sorted.map(e => e.id))
            for (const entry of entries) {
              expect(sortedIds.has(entry.id)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: seal-enhancement, Property 6: 空白日记拒绝**
   * *对于任意* 仅包含空白字符的内容字符串，添加日记条目操作应被拒绝，条目列表保持不变
   * **Validates: Requirements 8.3**
   */
  describe('Property 6: 空白日记拒绝', () => {
    it('空字符串被拒绝', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          optionalMoodArb,
          (entries, mood) => {
            const originalLength = entries.length
            const result = addJournalEntry(entries, '', mood)
            
            expect(result).toBeNull()
            expect(entries.length).toBe(originalLength)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('仅空白字符的内容被拒绝', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          whitespaceOnlyArb,
          optionalMoodArb,
          (entries, whitespaceContent, mood) => {
            const originalLength = entries.length
            const result = addJournalEntry(entries, whitespaceContent, mood)
            
            expect(result).toBeNull()
            expect(entries.length).toBe(originalLength)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateEntryContent 正确拒绝空白内容', () => {
      fc.assert(
        fc.property(
          whitespaceOnlyArb,
          (whitespaceContent) => {
            expect(validateEntryContent(whitespaceContent)).toBe(false)
            expect(validateEntryContent('')).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('validateEntryContent 正确接受有效内容', () => {
      fc.assert(
        fc.property(
          validContentArb,
          (content) => {
            expect(validateEntryContent(content)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: seal-enhancement, Property 7: 日记条目删除**
   * *对于任意* 未封存记录中的日记条目，删除操作后，该条目应从列表中移除，其他条目保持不变
   * **Validates: Requirements 7.3**
   */
  describe('Property 7: 日记条目删除', () => {
    it('删除后列表长度减少 1', () => {
      fc.assert(
        fc.property(
          nonEmptyJournalEntriesArb,
          fc.nat(),
          (entries, indexSeed) => {
            const targetIndex = indexSeed % entries.length
            const targetId = entries[targetIndex].id
            const originalLength = entries.length
            
            const result = deleteJournalEntry(entries, targetId)
            
            expect(result).not.toBeNull()
            expect(result!.length).toBe(originalLength - 1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('删除后目标条目不存在', () => {
      fc.assert(
        fc.property(
          nonEmptyJournalEntriesArb,
          fc.nat(),
          (entries, indexSeed) => {
            const targetIndex = indexSeed % entries.length
            const targetId = entries[targetIndex].id
            
            const result = deleteJournalEntry(entries, targetId)
            
            expect(result).not.toBeNull()
            expect(result!.find(e => e.id === targetId)).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('删除后其他条目保持不变', () => {
      fc.assert(
        fc.property(
          nonEmptyJournalEntriesArb,
          fc.nat(),
          (entries, indexSeed) => {
            const targetIndex = indexSeed % entries.length
            const targetId = entries[targetIndex].id
            const otherEntries = entries.filter(e => e.id !== targetId)
            
            const result = deleteJournalEntry(entries, targetId)
            
            expect(result).not.toBeNull()
            
            // 验证其他条目都存在且内容不变
            for (const other of otherEntries) {
              const found = result!.find(e => e.id === other.id)
              expect(found).toBeDefined()
              expect(found!.content).toBe(other.content)
              expect(found!.mood).toBe(other.mood)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('删除不存在的条目返回 null', () => {
      fc.assert(
        fc.property(
          journalEntriesArb,
          fc.uuid(),
          (entries, nonExistentId) => {
            // 确保 ID 不存在
            const existingIds = new Set(entries.map(e => e.id))
            if (existingIds.has(nonExistentId)) return
            
            const result = deleteJournalEntry(entries, nonExistentId)
            expect(result).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: seal-enhancement, Property 9: 整体心情取值**
   * *对于任意* 包含带心情日记条目的记录，整体心情应等于最后一条带心情条目的心情值
   * **Validates: Requirements 9.4**
   */
  describe('Property 9: 整体心情取值', () => {
    it('返回最后一条带心情条目的心情', () => {
      // 生成至少有一条带心情的条目列表
      const entriesWithMoodArb = fc.array(
        fc.record({
          id: fc.uuid(),
          content: validContentArb,
          mood: moodArb, // 强制有心情
          createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .map(d => d.toISOString())
        }),
        { minLength: 1, maxLength: 10 }
      )

      fc.assert(
        fc.property(
          entriesWithMoodArb,
          (entries) => {
            const overallMood = getOverallMood(entries)
            
            // 按时间正序排列，找最后一条
            const sortedAsc = [...entries].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            const lastEntry = sortedAsc[sortedAsc.length - 1]
            
            expect(overallMood).toBe(lastEntry.mood)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('空列表返回 null', () => {
      const result = getOverallMood([])
      expect(result).toBeNull()
    })

    it('全部无心情的条目返回 null', () => {
      const entriesWithoutMoodArb = fc.array(
        fc.record({
          id: fc.uuid(),
          content: validContentArb,
          mood: fc.constant(null),
          createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .map(d => d.toISOString())
        }),
        { minLength: 1, maxLength: 10 }
      )

      fc.assert(
        fc.property(
          entriesWithoutMoodArb,
          (entries) => {
            const overallMood = getOverallMood(entries)
            expect(overallMood).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('混合心情条目返回最后一条带心情的', () => {
      // 生成混合列表：一些有心情，一些没有
      fc.assert(
        fc.property(
          fc.array(journalEntryArb, { minLength: 2, maxLength: 10 }),
          (entries) => {
            // 确保至少有一条带心情
            const hasAnyMood = entries.some(e => e.mood !== null)
            if (!hasAnyMood) return
            
            const overallMood = getOverallMood(entries)
            
            // 按时间正序排列
            const sortedAsc = [...entries].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            
            // 从后往前找第一条带心情的
            let expectedMood: MoodType | null = null
            for (let i = sortedAsc.length - 1; i >= 0; i--) {
              if (sortedAsc[i].mood !== null) {
                expectedMood = sortedAsc[i].mood
                break
              }
            }
            
            expect(overallMood).toBe(expectedMood)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
