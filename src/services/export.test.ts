import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { ExportService, ExportErrorCodes } from './export'
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

describe('ExportService Property Tests', () => {
  /**
   * **Feature: action-log, Property 13: JSON Export Round-Trip**
   * *对于任意*每日记录集合，导出为 JSON 并解析回来后应产生与原集合深度相等的集合。
   * **Validates: Requirements 5.3**
   */
  it('Property 13: JSON Export Round-Trip', () => {
    fc.assert(
      fc.property(
        fc.array(dailyRecordArb, { minLength: 1, maxLength: 10 }),
        (records) => {
          // Export to JSON
          const exportResult = ExportService.exportToJSON(records)
          expect(exportResult.success).toBe(true)

          if (exportResult.success) {
            // Parse back
            const parseResult = ExportService.parseJSON(exportResult.data)
            expect(parseResult.success).toBe(true)

            if (parseResult.success) {
              // Deep equality check
              expect(parseResult.data).toEqual(records)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: action-log, Property 14: Export Completeness**
   * *对于任意*导出操作，导出的数据应包含归档中存在的所有每日记录，
   * 每条记录包括其完整的任务数组、日记内容和心情值。
   * **Validates: Requirements 5.4**
   */
  it('Property 14: Export Completeness', () => {
    fc.assert(
      fc.property(
        // Generate records with unique IDs by using index-based dates
        fc.array(dailyRecordArb, { minLength: 1, maxLength: 10 })
          .map(records => {
            // Ensure unique IDs by modifying dates based on index
            return records.map((record, index) => ({
              ...record,
              id: `2020-01-${String(index + 1).padStart(2, '0')}`,
              date: `2020-01-${String(index + 1).padStart(2, '0')}`
            }))
          }),
        (records) => {
          // Export to JSON
          const exportResult = ExportService.exportToJSON(records)
          expect(exportResult.success).toBe(true)

          if (exportResult.success) {
            // Verify completeness
            const isComplete = ExportService.verifyExportCompleteness(records, exportResult.data)
            expect(isComplete).toBe(true)

            // Additional detailed checks
            const parseResult = ExportService.parseJSON(exportResult.data)
            expect(parseResult.success).toBe(true)

            if (parseResult.success) {
              const exportedRecords = parseResult.data

              // Check all records are present
              expect(exportedRecords.length).toBe(records.length)

              // Check each record has complete data
              for (const original of records) {
                const exported = exportedRecords.find(r => r.id === original.id)
                expect(exported).toBeDefined()

                if (exported) {
                  // Tasks array is complete
                  expect(exported.tasks.length).toBe(original.tasks.length)
                  for (let i = 0; i < original.tasks.length; i++) {
                    expect(exported.tasks[i]).toEqual(original.tasks[i])
                  }

                  // Journal content is preserved
                  expect(exported.journal).toBe(original.journal)

                  // Mood is preserved
                  expect(exported.mood).toBe(original.mood)

                  // Other fields are preserved
                  expect(exported.isSealed).toBe(original.isSealed)
                  expect(exported.completionRate).toBe(original.completionRate)
                  expect(exported.date).toBe(original.date)
                }
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test that exporting empty array returns error
   */
  it('Exporting empty array returns NO_DATA error', () => {
    const jsonResult = ExportService.exportToJSON([])
    expect(jsonResult.success).toBe(false)
    if (!jsonResult.success) {
      expect(jsonResult.error.code).toBe(ExportErrorCodes.NO_DATA)
    }

    const mdResult = ExportService.exportToMarkdown([])
    expect(mdResult.success).toBe(false)
    if (!mdResult.success) {
      expect(mdResult.error.code).toBe(ExportErrorCodes.NO_DATA)
    }
  })

  /**
   * Test that Markdown export contains all record information
   */
  it('Markdown export contains all record information', () => {
    fc.assert(
      fc.property(
        fc.array(dailyRecordArb, { minLength: 1, maxLength: 5 }),
        (records) => {
          const result = ExportService.exportToMarkdown(records)
          expect(result.success).toBe(true)

          if (result.success) {
            const markdown = result.data

            // Check header
            expect(markdown).toContain('# 行动手账导出')
            expect(markdown).toContain(`记录数量：${records.length}`)

            // Check each record's date is present
            for (const record of records) {
              // Tasks should be present if any
              for (const task of record.tasks) {
                expect(markdown).toContain(task.description)
              }

              // Journal should be present if not empty
              if (record.journal && record.journal.trim().length > 0) {
                expect(markdown).toContain(record.journal)
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Test parsing invalid JSON returns error
   */
  it('Parsing invalid JSON returns error', () => {
    const invalidJsons = [
      'not json',
      '{}',
      '{"records": "not an array"}',
      '{"data": []}'
    ]

    for (const invalid of invalidJsons) {
      const result = ExportService.parseJSON(invalid)
      expect(result.success).toBe(false)
    }
  })
})
