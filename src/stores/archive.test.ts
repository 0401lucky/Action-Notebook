import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import { useArchiveStore } from './archive'
import type { DailyRecord, MoodType, Task, SearchQuery } from '@/types'

// Arbitraries (生成器)
const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

const taskArb: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  completed: fc.boolean(),
  priority: fc.constantFrom('high', 'medium', 'low'),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { maxLength: 5 }),
  order: fc.nat({ max: 100 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
  completedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()), { nil: null })
})

	const dailyRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
	  id: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
	  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
	  tasks: fc.array(taskArb, { maxLength: 10 }),
	  journal: fc.string({ maxLength: 500 }),
	  mood: fc.option(moodArb, { nil: null }),
	  journalEntries: fc.constant([]),
	  isSealed: fc.constant(true), // 归档记录必须是已封存的
	  completionRate: fc.integer({ min: 0, max: 100 }),
	  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
	  sealedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()), { nil: null })
}).map(record => ({
  ...record,
  date: record.id // 确保 id 和 date 一致
}))

describe('archiveStore Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })


  /**
   * **Feature: action-log, Property 17: Search Filter Correctness**
   * *对于任意*带有日期范围、心情或关键词条件的搜索查询，
   * 所有返回的每日记录应匹配所有指定的条件。
   * **Validates: Requirements 7.3**
   */
  it('Property 17: Search Filter Correctness', () => {
    fc.assert(
      fc.property(
        fc.array(dailyRecordArb, { minLength: 1, maxLength: 20 }),
        fc.record({
          startDate: fc.option(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            { nil: null }
          ),
          endDate: fc.option(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            { nil: null }
          ),
          mood: fc.option(moodArb, { nil: null }),
          keyword: fc.string({ maxLength: 50 }),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })
        }) as fc.Arbitrary<SearchQuery>,
        (records, query) => {
          const store = useArchiveStore()
          store.$reset()
          
          // 添加记录到归档
          for (const record of records) {
            store.addRecord(record)
          }
          
          // 执行搜索
          const results = store.searchRecords(query)
          
          // 验证所有返回的记录都匹配搜索条件
          for (const result of results) {
            // 验证日期范围
            if (query.startDate) {
              const recordDate = new Date(result.date)
              const startDate = new Date(query.startDate)
              expect(recordDate >= startDate).toBe(true)
            }
            
            if (query.endDate) {
              const recordDate = new Date(result.date)
              const endDate = new Date(query.endDate)
              expect(recordDate <= endDate).toBe(true)
            }
            
            // 验证心情筛选
            if (query.mood) {
              expect(result.mood).toBe(query.mood)
            }
            
            // 验证关键词筛选
            if (query.keyword && query.keyword.trim().length > 0) {
              const keyword = query.keyword.toLowerCase()
              const journalMatch = result.journal.toLowerCase().includes(keyword)
              const taskMatch = result.tasks.some(t => 
                t.description.toLowerCase().includes(keyword)
              )
              expect(journalMatch || taskMatch).toBe(true)
            }
            
            // 验证标签筛选
            if (query.tags && query.tags.length > 0) {
              const recordTags = new Set(result.tasks.flatMap(t => t.tags))
              const hasMatchingTag = query.tags.some(tag => recordTags.has(tag))
              expect(hasMatchingTag).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
