import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { StorageService, StorageErrorCodes } from './storage'
import type { DailyRecord, Task, Priority, MoodType } from '@/types'

// Arbitraries (生成器)
const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low')
const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

const taskArb: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  completed: fc.boolean(),
  priority: priorityArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { maxLength: 5 }),
  order: fc.nat({ max: 1000 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  completedAt: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    { nil: null }
  )
})

	const dailyRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
	  id: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0]),
	  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0]),
	  tasks: fc.array(taskArb, { maxLength: 20 }),
	  journal: fc.string({ maxLength: 1000 }),
	  mood: fc.option(moodArb, { nil: null }),
	  journalEntries: fc.constant([]),
	  isSealed: fc.boolean(),
	  completionRate: fc.integer({ min: 0, max: 100 }),
	  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
	  sealedAt: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    { nil: null }
  )
})

describe('StorageService Property Tests', () => {
  // Clean up localStorage before and after each test
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * **Feature: action-log, Property 12: Storage Round-Trip Consistency**
   * *对于任意*保存到本地存储的每日记录，重新加载后应产生与原记录深度相等的记录。
   * **Validates: Requirements 5.2**
   */
  it('Property 12: Storage Round-Trip Consistency', () => {
    fc.assert(
      fc.property(
        dailyRecordArb,
        (record) => {
          // Save the record
          const saveResult = StorageService.saveDailyRecord(record)
          expect(saveResult.success).toBe(true)

          // Load the record back
          const loadResult = StorageService.loadDailyRecord(record.id)
          expect(loadResult.success).toBe(true)

          if (loadResult.success) {
            // Deep equality check
            expect(loadResult.data).toEqual(record)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Generic save/load round-trip test for any serializable data
   * 注意：JSON 序列化不区分 -0 和 +0，因此使用自定义比较函数
   */
  it('Generic save/load round-trip consistency', () => {
    // 自定义比较函数，处理 JSON 序列化的特殊情况（-0 变成 +0）
    const jsonEqual = (a: unknown, b: unknown): boolean => {
      return JSON.stringify(a) === JSON.stringify(b)
    }

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.jsonValue(),
        (key, value) => {
          // Save the data
          const saveResult = StorageService.save(key, value)
          expect(saveResult.success).toBe(true)

          // Load the data back
          const loadResult = StorageService.load(key)
          expect(loadResult.success).toBe(true)

          if (loadResult.success) {
            // 使用 JSON 字符串比较，因为 JSON 序列化会将 -0 转换为 0
            // 这是 JSON 规范的标准行为，不是 bug
            expect(jsonEqual(loadResult.data, value)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test that loading non-existent key returns NOT_FOUND error
   */
  it('Loading non-existent key returns NOT_FOUND error', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (key) => {
          const result = StorageService.load(key)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.code).toBe(StorageErrorCodes.NOT_FOUND)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Test that remove actually removes the data
   */
  it('Remove actually removes the data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string(),
        (key, value) => {
          // Save data
          StorageService.save(key, value)
          
          // Verify it exists
          const loadBefore = StorageService.load(key)
          expect(loadBefore.success).toBe(true)

          // Remove it
          const removeResult = StorageService.remove(key)
          expect(removeResult.success).toBe(true)

          // Verify it's gone
          const loadAfter = StorageService.load(key)
          expect(loadAfter.success).toBe(false)
          if (!loadAfter.success) {
            expect(loadAfter.error.code).toBe(StorageErrorCodes.NOT_FOUND)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Test archive records save/load round-trip
   */
  it('Archive records save/load round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(dailyRecordArb, { maxLength: 10 }),
        (records) => {
          // Save archive records
          const saveResult = StorageService.saveArchiveRecords(records)
          expect(saveResult.success).toBe(true)

          // Load archive records
          const loadResult = StorageService.loadArchiveRecords()
          expect(loadResult.success).toBe(true)

          if (loadResult.success) {
            expect(loadResult.data).toEqual(records)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Test that loadArchiveRecords returns empty array when no data exists
   */
  it('loadArchiveRecords returns empty array when no data exists', () => {
    const result = StorageService.loadArchiveRecords()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })
})
