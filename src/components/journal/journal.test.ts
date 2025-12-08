import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import { useDailyStore } from '@/stores/daily'
import type { MoodType } from '@/types'

// Arbitraries (生成器)
const journalContentArb = fc.string({ minLength: 0, maxLength: 1000 })

const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

describe('Journal Component Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /**
   * **Feature: action-log, Property 8: Journal Content Persistence**
   * *对于任意*日记内容字符串，更新每日记录的日记后，
   * 检索时记录应包含该确切内容。
   * **Validates: Requirements 4.1**
   */
  it('Property 8: Journal Content Persistence', () => {
    fc.assert(
      fc.property(
        journalContentArb,
        (content) => {
          const store = useDailyStore()
          store.$reset()
          
          // 更新日记内容
          const result = store.updateJournal(content)
          
          // 应该更新成功
          expect(result).toBe(true)
          
          // 检索时应包含确切内容
          expect(store.currentRecord?.journal).toBe(content)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: action-log, Property 9: Mood Selection Persistence**
   * *对于任意*有效的心情类型选择，更新每日记录的心情后，
   * 检索时记录应包含该确切心情值。
   * **Validates: Requirements 4.2**
   */
  it('Property 9: Mood Selection Persistence', () => {
    fc.assert(
      fc.property(
        moodArb,
        (mood) => {
          const store = useDailyStore()
          store.$reset()
          
          // 更新心情
          const result = store.updateMood(mood)
          
          // 应该更新成功
          expect(result).toBe(true)
          
          // 检索时应包含确切心情值
          expect(store.currentRecord?.mood).toBe(mood)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional test: Multiple journal updates should preserve the latest content
   */
  it('Property 8 Extended: Multiple journal updates preserve latest content', () => {
    fc.assert(
      fc.property(
        fc.array(journalContentArb, { minLength: 1, maxLength: 10 }),
        (contents) => {
          const store = useDailyStore()
          store.$reset()
          
          // 多次更新日记
          for (const content of contents) {
            store.updateJournal(content)
          }
          
          // 最终内容应该是最后一次更新的内容
          const lastContent = contents[contents.length - 1]
          expect(store.currentRecord?.journal).toBe(lastContent)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional test: Multiple mood updates should preserve the latest mood
   */
  it('Property 9 Extended: Multiple mood updates preserve latest mood', () => {
    fc.assert(
      fc.property(
        fc.array(moodArb, { minLength: 1, maxLength: 10 }),
        (moods) => {
          const store = useDailyStore()
          store.$reset()
          
          // 多次更新心情
          for (const mood of moods) {
            store.updateMood(mood)
          }
          
          // 最终心情应该是最后一次更新的心情
          const lastMood = moods[moods.length - 1]
          expect(store.currentRecord?.mood).toBe(lastMood)
        }
      ),
      { numRuns: 100 }
    )
  })
})
