/**
 * 日记本书架服务属性测试
 * 
 * 使用 fast-check 进行属性测试，验证书架服务的正确性
 * 
 * @module services/bookshelf.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  groupRecordsByMonth,
  getJournalEntryCount,
  extractMonth,
  formatMonthLabel,
  getPrimaryMood
} from './bookshelf'
import type { DailyRecord, JournalEntry, MoodType } from '@/types'

// ==================== 生成器 ====================

// 心情生成器
const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

// 可选心情生成器
const optionalMoodArb: fc.Arbitrary<MoodType | null> = fc.oneof(
  fc.constant(null),
  moodArb
)

// 有效日期生成器（YYYY-MM-DD 格式）
const dateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(d => d.toISOString().split('T')[0])

// 日记条目生成器
const journalEntryArb: fc.Arbitrary<JournalEntry> = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  mood: optionalMoodArb,
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map(d => d.toISOString())
})

// 日记条目列表生成器（限制数量以提高测试速度）
const journalEntriesArb = fc.array(journalEntryArb, { minLength: 0, maxLength: 3 })

// DailyRecord 生成器
const dailyRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
  id: dateArb,
  date: dateArb,
  tasks: fc.constant([]),
  journal: fc.string({ maxLength: 100 }),
  mood: optionalMoodArb,
  journalEntries: journalEntriesArb,
  isSealed: fc.boolean(),
  completionRate: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map(d => d.toISOString()),
  sealedAt: fc.oneof(
    fc.constant(null),
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map(d => d.toISOString())
  )
}).map(record => ({
  ...record,
  id: record.date // 确保 id 和 date 一致
}))

// 非空 DailyRecord 列表生成器（限制数量以提高测试速度）
const nonEmptyRecordsArb = fc.array(dailyRecordArb, { minLength: 1, maxLength: 10 })

describe('Bookshelf Service Property Tests', () => {
  /**
   * **Feature: seal-enhancement, Property 10: 日记本按月分组**
   * *对于任意* 日记记录集合，按月分组后，同一月份的记录应在同一组内，且组按时间倒序排列
   * **Validates: Requirements 10.2**
   */
  describe('Property 10: 日记本按月分组', () => {
    it('同一月份的记录在同一组内', () => {
      fc.assert(
        fc.property(
          nonEmptyRecordsArb,
          (records) => {
            const groups = groupRecordsByMonth(records)
            
            // 验证每个组内的记录都属于同一月份
            for (const group of groups) {
              for (const record of group.records) {
                const recordMonth = extractMonth(record.date)
                expect(recordMonth).toBe(group.month)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('组按月份倒序排列（最新的在前）', () => {
      fc.assert(
        fc.property(
          nonEmptyRecordsArb,
          (records) => {
            const groups = groupRecordsByMonth(records)
            
            // 验证组按月份倒序排列
            for (let i = 0; i < groups.length - 1; i++) {
              expect(groups[i].month.localeCompare(groups[i + 1].month)).toBeGreaterThanOrEqual(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('组内记录按日期倒序排列', () => {
      fc.assert(
        fc.property(
          nonEmptyRecordsArb,
          (records) => {
            const groups = groupRecordsByMonth(records)
            
            // 验证每个组内的记录按日期倒序排列
            for (const group of groups) {
              for (let i = 0; i < group.records.length - 1; i++) {
                const currentDate = new Date(group.records[i].date).getTime()
                const nextDate = new Date(group.records[i + 1].date).getTime()
                expect(currentDate).toBeGreaterThanOrEqual(nextDate)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('分组不丢失任何记录', () => {
      fc.assert(
        fc.property(
          nonEmptyRecordsArb,
          (records) => {
            const groups = groupRecordsByMonth(records)
            
            // 计算分组后的总记录数
            const totalInGroups = groups.reduce((sum, g) => sum + g.records.length, 0)
            
            // 应该等于原始记录数
            expect(totalInGroups).toBe(records.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('分组不重复任何记录', () => {
      fc.assert(
        fc.property(
          nonEmptyRecordsArb,
          (records) => {
            // 先确保输入记录具有唯一 ID（模拟真实场景）
            const uniqueRecords = records.filter((record, index, self) => 
              self.findIndex(r => r.id === record.id) === index
            )
            
            if (uniqueRecords.length === 0) return // 跳过空输入
            
            const groups = groupRecordsByMonth(uniqueRecords)
            
            // 收集所有分组中的记录 ID
            const allIds: string[] = []
            for (const group of groups) {
              for (const record of group.records) {
                allIds.push(record.id)
              }
            }
            
            // 检查是否有重复
            const uniqueIds = new Set(allIds)
            expect(uniqueIds.size).toBe(allIds.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('空记录列表返回空分组', () => {
      const groups = groupRecordsByMonth([])
      expect(groups).toEqual([])
    })

    it('月份标签格式正确', () => {
      fc.assert(
        fc.property(
          nonEmptyRecordsArb,
          (records) => {
            const groups = groupRecordsByMonth(records)
            
            for (const group of groups) {
              // 标签应该是 "YYYY年M月" 格式
              expect(group.label).toMatch(/^\d{4}年\d{1,2}月$/)
              
              // 验证标签与月份一致
              const expectedLabel = formatMonthLabel(group.month)
              expect(group.label).toBe(expectedLabel)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('辅助函数测试', () => {
    it('extractMonth 正确提取月份', () => {
      fc.assert(
        fc.property(
          dateArb,
          (date) => {
            const month = extractMonth(date)
            // 应该是 YYYY-MM 格式
            expect(month).toMatch(/^\d{4}-\d{2}$/)
            // 应该是日期的前7个字符
            expect(month).toBe(date.substring(0, 7))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('formatMonthLabel 生成正确的中文标签', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          (year, month) => {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`
            const label = formatMonthLabel(monthStr)
            
            expect(label).toBe(`${year}年${month}月`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getJournalEntryCount 返回正确的条目数量', () => {
      fc.assert(
        fc.property(
          dailyRecordArb,
          (record) => {
            const count = getJournalEntryCount(record)
            expect(count).toBe(record.journalEntries?.length ?? 0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getPrimaryMood 返回最后一条带心情条目的心情', () => {
      // 生成至少有一条带心情的日记条目
      const entriesWithMoodArb = fc.array(
        fc.record({
          id: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          mood: moodArb, // 强制有心情
          createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .map(d => d.toISOString())
        }),
        { minLength: 1, maxLength: 5 }
      )

      fc.assert(
        fc.property(
          entriesWithMoodArb,
          dateArb,
          (entries, date) => {
            const record: DailyRecord = {
              id: date,
              date,
              tasks: [],
              journal: '',
              mood: null,
              journalEntries: entries,
              isSealed: true,
              completionRate: 0,
              createdAt: new Date().toISOString(),
              sealedAt: null
            }

            const primaryMood = getPrimaryMood(record)
            
            // 按时间正序排列，找最后一条带心情的
            const sortedAsc = [...entries].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            
            let expectedMood: MoodType | null = null
            for (let i = sortedAsc.length - 1; i >= 0; i--) {
              if (sortedAsc[i].mood !== null) {
                expectedMood = sortedAsc[i].mood
                break
              }
            }
            
            expect(primaryMood).toBe(expectedMood)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('getPrimaryMood 在无日记条目时回退到旧 mood 字段', () => {
      fc.assert(
        fc.property(
          optionalMoodArb,
          dateArb,
          (mood, date) => {
            const record: DailyRecord = {
              id: date,
              date,
              tasks: [],
              journal: '',
              mood,
              journalEntries: [],
              isSealed: true,
              completionRate: 0,
              createdAt: new Date().toISOString(),
              sealedAt: null
            }

            const primaryMood = getPrimaryMood(record)
            expect(primaryMood).toBe(mood)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
