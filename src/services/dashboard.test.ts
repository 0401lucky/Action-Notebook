/**
 * 仪表盘服务属性测试
 * 使用 fast-check 进行属性测试
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  getGreeting,
  formatDate,
  formatGreetingWithNickname,
  formatJournalPreview,
  getWeekDateRange,
  calculateWeeklyStats,
  calculateConsecutiveDays,
  sliceTaskList,
  calculateTaskProgress,
  sliceJournalList
} from './dashboard'
import type { DailyRecord, Task, MoodType } from '@/types'

/**
 * **Feature: dashboard, Property 1: 时间段到问候语映射**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * 对于任意 0-23 范围内的小时值，getGreeting 函数应返回正确的问候语：
 * - 0-11 返回"早上好"
 * - 12-17 返回"下午好"
 * - 18-23 返回"晚上好"
 */
describe('Property 1: 时间段到问候语映射', () => {
  it('对于任意有效小时值，应返回正确的问候语', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        (hour) => {
          const greeting = getGreeting(hour)
          
          if (hour >= 0 && hour < 12) {
            expect(greeting).toBe('早上好')
          } else if (hour >= 12 && hour < 18) {
            expect(greeting).toBe('下午好')
          } else {
            expect(greeting).toBe('晚上好')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: dashboard, Property 2: 问候语与昵称组合**
 * **Validates: Requirements 1.4**
 * 
 * 对于任意非空昵称字符串，formatGreetingWithNickname 函数应返回包含问候语和昵称的组合字符串
 */
describe('Property 2: 问候语与昵称组合', () => {
  it('对于任意非空昵称，应返回"问候语，昵称"格式', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('早上好', '下午好', '晚上好'),
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (greeting, nickname) => {
          const result = formatGreetingWithNickname(greeting, nickname)
          
          // 结果应包含问候语
          expect(result).toContain(greeting)
          // 结果应包含昵称（去除首尾空格后）
          expect(result).toContain(nickname.trim())
          // 格式应为"问候语，昵称"
          expect(result).toBe(`${greeting}，${nickname.trim()}`)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于 null 或空白昵称，应仅返回问候语', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('早上好', '下午好', '晚上好'),
        fc.constantFrom(null, '', '   ', '\t', '\n'),
        (greeting, nickname) => {
          const result = formatGreetingWithNickname(greeting, nickname)
          expect(result).toBe(greeting)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: dashboard, Property 3: 日期格式化**
 * **Validates: Requirements 1.6**
 * 
 * 对于任意有效的 Date 对象，formatDate 函数应返回格式为"YYYY年M月D日 星期X"的字符串
 */
describe('Property 3: 日期格式化', () => {
  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六']
  
  it('对于任意有效日期，应返回正确格式的字符串', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') }),
        (date) => {
          const result = formatDate(date)
          
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const day = date.getDate()
          const weekday = weekdayNames[date.getDay()]
          
          // 验证格式正确
          expect(result).toBe(`${year}年${month}月${day}日 星期${weekday}`)
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: dashboard, Property 4: 任务列表截取**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * 对于任意长度的任务数组，显示的任务数量应不超过 5，
 * 且当原始数组长度大于 5 时应显示"查看全部"链接
 */
describe('Property 4: 任务列表截取', () => {
  // 生成任务的 arbitrary
  const taskArb: fc.Arbitrary<Task> = fc.record({
    id: fc.uuid(),
    description: fc.string({ minLength: 1 }),
    completed: fc.boolean(),
    priority: fc.constantFrom('high', 'medium', 'low') as fc.Arbitrary<'high' | 'medium' | 'low'>,
    tags: fc.array(fc.string()),
    order: fc.integer({ min: 0 }),
    createdAt: fc.date().map(d => d.toISOString()),
    completedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
  })

  it('对于任意任务数组，显示数量应不超过最大限制', () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (tasks, maxDisplay) => {
          const result = sliceTaskList(tasks, maxDisplay)
          
          // 显示的任务数量应不超过 maxDisplay
          expect(result.displayedTasks.length).toBeLessThanOrEqual(maxDisplay)
          
          // 显示的任务数量应等于 min(tasks.length, maxDisplay)
          expect(result.displayedTasks.length).toBe(Math.min(tasks.length, maxDisplay))
          
          // 总数应等于原始数组长度
          expect(result.totalCount).toBe(tasks.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('当任务数超过最大限制时，应显示"查看全部"', () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (tasks, maxDisplay) => {
          const result = sliceTaskList(tasks, maxDisplay)
          
          // showViewAll 应该在任务数超过 maxDisplay 时为 true
          expect(result.showViewAll).toBe(tasks.length > maxDisplay)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('显示的任务应保持原始顺序', () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (tasks, maxDisplay) => {
          const result = sliceTaskList(tasks, maxDisplay)
          
          // 验证显示的任务与原始数组前 N 个任务相同
          for (let i = 0; i < result.displayedTasks.length; i++) {
            expect(result.displayedTasks[i].id).toBe(tasks[i].id)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: dashboard, Property 5: 任务完成进度格式**
 * **Validates: Requirements 2.4**
 * 
 * 对于任意非空任务数组，进度显示应为"X/Y 已完成"格式，
 * 其中 X 为已完成任务数，Y 为总任务数
 */
describe('Property 5: 任务完成进度格式', () => {
  // 生成任务的 arbitrary
  const taskArb: fc.Arbitrary<Task> = fc.record({
    id: fc.uuid(),
    description: fc.string({ minLength: 1 }),
    completed: fc.boolean(),
    priority: fc.constantFrom('high', 'medium', 'low') as fc.Arbitrary<'high' | 'medium' | 'low'>,
    tags: fc.array(fc.string()),
    order: fc.integer({ min: 0 }),
    createdAt: fc.date().map(d => d.toISOString()),
    completedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
  })

  it('对于任意任务数组，进度格式应为"X/Y 已完成"', () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        (tasks) => {
          const result = calculateTaskProgress(tasks)
          
          // 验证格式正确
          expect(result.formatted).toBe(`${result.completed}/${result.total} 已完成`)
          
          // 验证总数正确
          expect(result.total).toBe(tasks.length)
          
          // 验证已完成数正确
          const expectedCompleted = tasks.filter(t => t.completed).length
          expect(result.completed).toBe(expectedCompleted)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('已完成数应不超过总数', () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        (tasks) => {
          const result = calculateTaskProgress(tasks)
          
          expect(result.completed).toBeLessThanOrEqual(result.total)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('已完成数应为非负数', () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        (tasks) => {
          const result = calculateTaskProgress(tasks)
          
          expect(result.completed).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: dashboard, Property 6: 日记列表截取和排序**
 * **Validates: Requirements 3.1, 3.3**
 * 
 * 对于任意已封存日记记录数组，显示的日记数量应不超过 3，
 * 且按日期降序排列（最新的在前），当原始数组长度大于 3 时应显示"查看全部"链接
 */
describe('Property 6: 日记列表截取和排序', () => {
  // 生成任务的 arbitrary
  const taskArb: fc.Arbitrary<Task> = fc.record({
    id: fc.uuid(),
    description: fc.string({ minLength: 1 }),
    completed: fc.boolean(),
    priority: fc.constantFrom('high', 'medium', 'low') as fc.Arbitrary<'high' | 'medium' | 'low'>,
    tags: fc.array(fc.string()),
    order: fc.integer({ min: 0 }),
    createdAt: fc.date().map(d => d.toISOString()),
    completedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
  })

  // 生成日记记录的 arbitrary
	  const recordArb: fc.Arbitrary<DailyRecord> = fc.record({
	    id: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => {
	      const year = d.getFullYear()
	      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }),
    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }),
	    tasks: fc.array(taskArb, { minLength: 0, maxLength: 5 }),
	    journal: fc.string(),
	    mood: fc.option(fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired') as fc.Arbitrary<MoodType>, { nil: null }),
	    journalEntries: fc.constant([]),
	    isSealed: fc.boolean(),
	    completionRate: fc.integer({ min: 0, max: 100 }),
	    createdAt: fc.date().map(d => d.toISOString()),
	    sealedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
  })

  it('对于任意日记数组，显示数量应不超过最大限制', () => {
    fc.assert(
      fc.property(
        fc.array(recordArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (records, maxDisplay) => {
          const result = sliceJournalList(records, maxDisplay)
          
          // 显示的日记数量应不超过 maxDisplay
          expect(result.displayedJournals.length).toBeLessThanOrEqual(maxDisplay)
          
          // 总数应等于已封存记录的数量
          const sealedCount = records.filter(r => r.isSealed).length
          expect(result.totalCount).toBe(sealedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('当已封存日记数超过最大限制时，应显示"查看全部"', () => {
    fc.assert(
      fc.property(
        fc.array(recordArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (records, maxDisplay) => {
          const result = sliceJournalList(records, maxDisplay)
          
          // showViewAll 应该在已封存日记数超过 maxDisplay 时为 true
          const sealedCount = records.filter(r => r.isSealed).length
          expect(result.showViewAll).toBe(sealedCount > maxDisplay)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('显示的日记应按日期降序排列（最新的在前）', () => {
    fc.assert(
      fc.property(
        fc.array(recordArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (records, maxDisplay) => {
          const result = sliceJournalList(records, maxDisplay)
          
          // 验证日期降序排列
          for (let i = 1; i < result.displayedJournals.length; i++) {
            const prevDate = new Date(result.displayedJournals[i - 1].date).getTime()
            const currDate = new Date(result.displayedJournals[i].date).getTime()
            expect(prevDate).toBeGreaterThanOrEqual(currDate)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('只应包含已封存的日记', () => {
    fc.assert(
      fc.property(
        fc.array(recordArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (records, maxDisplay) => {
          const result = sliceJournalList(records, maxDisplay)
          
          // 所有显示的日记都应该是已封存的
          for (const journal of result.displayedJournals) {
            expect(journal.isSealed).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: dashboard, Property 7: 日记摘要格式化**
 * **Validates: Requirements 3.2**
 * 
 * 对于任意日记内容字符串，formatJournalPreview 函数应返回不超过指定长度的预览文本
 */
describe('Property 7: 日记摘要格式化', () => {
  it('对于任意字符串，预览长度应不超过指定最大长度', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 1, max: 200 }),
        (journal, maxLength) => {
          const result = formatJournalPreview(journal, maxLength)
          
          const trimmedJournal = journal.trim()
          
          if (trimmedJournal.length <= maxLength) {
            // 短于或等于最大长度时，应返回完整内容
            expect(result).toBe(trimmedJournal)
          } else {
            // 超过最大长度时，应截取并添加省略号
            expect(result.length).toBe(maxLength + 3) // maxLength + '...'
            expect(result.endsWith('...')).toBe(true)
            expect(result.slice(0, maxLength)).toBe(trimmedJournal.slice(0, maxLength))
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于空字符串，应返回空字符串', () => {
    expect(formatJournalPreview('')).toBe('')
    expect(formatJournalPreview('   ')).toBe('')
  })
})

/**
 * **Feature: dashboard, Property 8: 本周统计计算**
 * **Validates: Requirements 4.1, 4.2**
 * 
 * 对于任意日记记录数组和参考日期，calculateWeeklyStats 函数应正确计算本周统计
 */
describe('Property 8: 本周统计计算', () => {
  // 生成任务的 arbitrary
  const taskArb: fc.Arbitrary<Task> = fc.record({
    id: fc.uuid(),
    description: fc.string({ minLength: 1 }),
    completed: fc.boolean(),
    priority: fc.constantFrom('high', 'medium', 'low') as fc.Arbitrary<'high' | 'medium' | 'low'>,
    tags: fc.array(fc.string()),
    order: fc.integer({ min: 0 }),
    createdAt: fc.date().map(d => d.toISOString()),
    completedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
  })

  // 生成日记记录的 arbitrary
  const recordArb = (dateRange: { start: Date; end: Date }): fc.Arbitrary<DailyRecord> => {
    return fc.record({
      id: fc.date({ min: dateRange.start, max: dateRange.end }).map(d => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }),
      date: fc.date({ min: dateRange.start, max: dateRange.end }).map(d => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }),
	      tasks: fc.array(taskArb, { minLength: 0, maxLength: 10 }),
	      journal: fc.string(),
	      mood: fc.option(fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired') as fc.Arbitrary<MoodType>, { nil: null }),
	      journalEntries: fc.constant([]),
	      isSealed: fc.boolean(),
	      completionRate: fc.integer({ min: 0, max: 100 }),
	      createdAt: fc.date().map(d => d.toISOString()),
	      sealedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
    })
  }

  it('本周完成任务数应等于本周内所有已完成任务的总和', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (referenceDate) => {
          const { start, end } = getWeekDateRange(referenceDate)
          
          // 生成本周内的记录
          return fc.assert(
            fc.property(
              fc.array(recordArb({ start, end }), { minLength: 0, maxLength: 7 }),
              (records) => {
                const stats = calculateWeeklyStats(records, referenceDate)
                
                // 手动计算预期的完成任务数
                let expectedCompletedTasks = 0
                for (const record of records) {
                  const recordDate = new Date(record.date)
                  recordDate.setHours(12, 0, 0, 0)
                  if (recordDate >= start && recordDate <= end) {
                    expectedCompletedTasks += record.tasks.filter(t => t.completed).length
                  }
                }
                
                expect(stats.completedTasks).toBe(expectedCompletedTasks)
              }
            ),
            { numRuns: 20 }
          )
        }
      ),
      { numRuns: 5 }
    )
  })

  it('本周日记天数应等于本周内有日记内容的天数', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (referenceDate) => {
          const { start, end } = getWeekDateRange(referenceDate)
          
          return fc.assert(
            fc.property(
              fc.array(recordArb({ start, end }), { minLength: 0, maxLength: 7 }),
              (records) => {
                const stats = calculateWeeklyStats(records, referenceDate)
                
                // 手动计算预期的日记天数
                let expectedJournalDays = 0
                for (const record of records) {
                  const recordDate = new Date(record.date)
                  recordDate.setHours(12, 0, 0, 0)
                  if (recordDate >= start && recordDate <= end) {
                    if (record.journal && record.journal.trim().length > 0) {
                      expectedJournalDays++
                    }
                  }
                }
                
                expect(stats.journalDays).toBe(expectedJournalDays)
              }
            ),
            { numRuns: 20 }
          )
        }
      ),
      { numRuns: 5 }
    )
  })
})


/**
 * **Feature: dashboard, Property 9: 连续打卡天数计算**
 * **Validates: Requirements 4.3**
 * 
 * 对于任意按日期排序的日记记录数组，calculateConsecutiveDays 函数应返回从参考日期向前连续有记录的天数
 */
describe('Property 9: 连续打卡天数计算', () => {
  // 辅助函数：格式化日期为 YYYY-MM-DD
  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 生成连续天数的记录
  const generateConsecutiveRecords = (
    startDate: Date,
    consecutiveDays: number
  ): DailyRecord[] => {
    const records: DailyRecord[] = []
    const date = new Date(startDate)
    
    for (let i = 0; i < consecutiveDays; i++) {
      const dateKey = formatDateKey(date)
	      records.push({
	        id: dateKey,
	        date: dateKey,
	        tasks: [],
	        journal: '测试日记',
	        mood: 'happy',
	        journalEntries: [],
	        isSealed: true,
	        completionRate: 100,
	        createdAt: date.toISOString(),
	        sealedAt: date.toISOString()
      })
      date.setDate(date.getDate() - 1)
    }
    
    return records
  }

  it('对于连续的已封存记录，应返回正确的连续天数', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.integer({ min: 0, max: 30 }),
        (referenceDate, consecutiveDays) => {
          const records = generateConsecutiveRecords(referenceDate, consecutiveDays)
          const result = calculateConsecutiveDays(records, referenceDate)
          
          expect(result).toBe(consecutiveDays)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('对于空记录数组，应返回 0', () => {
    const result = calculateConsecutiveDays([], new Date())
    expect(result).toBe(0)
  })

  it('对于中断的记录，应只计算连续部分', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (referenceDate, firstStreak, gapDays) => {
          // 创建从参考日期开始的连续记录
          const records = generateConsecutiveRecords(referenceDate, firstStreak)
          
          // 在中间添加间隔（跳过 gapDays 天后再添加记录）
          const gapDate = new Date(referenceDate)
          gapDate.setDate(gapDate.getDate() - firstStreak - gapDays)
          const additionalRecords = generateConsecutiveRecords(gapDate, 5)
          
          const allRecords = [...records, ...additionalRecords]
          const result = calculateConsecutiveDays(allRecords, referenceDate)
          
          // 应该只计算第一段连续的天数
          expect(result).toBe(firstStreak)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('未封存的记录不应计入连续天数', () => {
    const referenceDate = new Date('2025-01-15')
    const records: DailyRecord[] = [
	      {
	        id: '2025-01-15',
	        date: '2025-01-15',
	        tasks: [],
	        journal: '测试',
	        mood: 'happy',
	        journalEntries: [],
	        isSealed: false, // 未封存
	        completionRate: 100,
	        createdAt: referenceDate.toISOString(),
	        sealedAt: null
      }
    ]
    
    const result = calculateConsecutiveDays(records, referenceDate)
    expect(result).toBe(0)
  })
})
