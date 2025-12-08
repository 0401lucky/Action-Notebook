import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateMoodDistribution,
  calculateCumulativeTaskCount
} from './stats'
import type { DailyRecord, Task, MoodType, Priority } from '@/types'

// Generators
const priorityArb = fc.constantFrom<Priority>('high', 'medium', 'low')
const moodArb = fc.constantFrom<MoodType>('happy', 'neutral', 'sad', 'excited', 'tired')

const taskArb: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  completed: fc.boolean(),
  priority: priorityArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  order: fc.nat({ max: 100 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
  completedAt: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
    { nil: null }
  )
})

const dailyRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
  id: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
  tasks: fc.array(taskArb, { maxLength: 20 }),
  journal: fc.string({ maxLength: 500 }),
  mood: fc.option(moodArb, { nil: null }),
  isSealed: fc.boolean(),
  completionRate: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
  sealedAt: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
    { nil: null }
  )
})

describe('Stats Service Property Tests', () => {
  /**
   * **Feature: action-log, Property 15: Mood Distribution Sum**
   * **Validates: Requirements 6.2**
   * 
   * For any collection of daily records with moods, the sum of all mood 
   * distribution counts should equal the total number of records with assigned moods.
   */
  it('Property 15: Mood Distribution Sum - sum of mood counts equals records with moods', () => {
    fc.assert(
      fc.property(
        fc.array(dailyRecordArb, { minLength: 0, maxLength: 50 }),
        (records) => {
          const distribution = calculateMoodDistribution(records)
          
          // Sum of all mood counts
          const distributionSum = distribution.reduce((sum, item) => sum + item.count, 0)
          
          // Count of records that have a mood assigned
          const recordsWithMood = records.filter(r => r.mood !== null).length
          
          return distributionSum === recordsWithMood
        }
      ),
      { numRuns: 100 }
    )
  })


  /**
   * **Feature: action-log, Property 16: Cumulative Task Count**
   * **Validates: Requirements 6.3**
   * 
   * For any collection of daily records, the cumulative completed task count 
   * should equal the sum of completed tasks across all records.
   */
  it('Property 16: Cumulative Task Count - completed tasks sum matches across all records', () => {
    fc.assert(
      fc.property(
        fc.array(dailyRecordArb, { minLength: 0, maxLength: 50 }),
        (records) => {
          const { total, completed } = calculateCumulativeTaskCount(records)
          
          // Manually calculate expected values
          let expectedTotal = 0
          let expectedCompleted = 0
          
          for (const record of records) {
            expectedTotal += record.tasks.length
            expectedCompleted += record.tasks.filter(t => t.completed).length
          }
          
          return total === expectedTotal && completed === expectedCompleted
        }
      ),
      { numRuns: 100 }
    )
  })

  // Additional unit tests for edge cases
  describe('Edge Cases', () => {
    it('should return empty mood distribution for empty records', () => {
      const distribution = calculateMoodDistribution([])
      expect(distribution).toEqual([])
    })

    it('should return zero counts for empty records', () => {
      const { total, completed } = calculateCumulativeTaskCount([])
      expect(total).toBe(0)
      expect(completed).toBe(0)
    })

    it('should handle records with no mood', () => {
      const records: DailyRecord[] = [{
        id: '2024-01-01',
        date: '2024-01-01',
        tasks: [],
        journal: '',
        mood: null,
        isSealed: true,
        completionRate: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        sealedAt: '2024-01-01T23:59:59.000Z'
      }]
      
      const distribution = calculateMoodDistribution(records)
      expect(distribution).toEqual([])
    })

    it('should correctly count tasks across multiple records', () => {
      const records: DailyRecord[] = [
        {
          id: '2024-01-01',
          date: '2024-01-01',
          tasks: [
            { id: '1', description: 'Task 1', completed: true, priority: 'high', tags: [], order: 0, createdAt: '', completedAt: '' },
            { id: '2', description: 'Task 2', completed: false, priority: 'medium', tags: [], order: 1, createdAt: '', completedAt: null }
          ],
          journal: '',
          mood: 'happy',
          isSealed: true,
          completionRate: 50,
          createdAt: '',
          sealedAt: ''
        },
        {
          id: '2024-01-02',
          date: '2024-01-02',
          tasks: [
            { id: '3', description: 'Task 3', completed: true, priority: 'low', tags: [], order: 0, createdAt: '', completedAt: '' }
          ],
          journal: '',
          mood: 'neutral',
          isSealed: true,
          completionRate: 100,
          createdAt: '',
          sealedAt: ''
        }
      ]
      
      const { total, completed } = calculateCumulativeTaskCount(records)
      expect(total).toBe(3)
      expect(completed).toBe(2)
    })
  })
})
