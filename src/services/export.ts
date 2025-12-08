import type { DailyRecord, AppError, MoodType } from '@/types'

/**
 * Export error codes
 */
export const ExportErrorCodes = {
  EXPORT_FAILED: 'EXPORT_FAILED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  NO_DATA: 'NO_DATA'
} as const

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'markdown'

/**
 * Mood display names (Chinese)
 */
const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心 😊',
  neutral: '平淡 😐',
  sad: '沮丧 😢',
  excited: '兴奋 🎉',
  tired: '疲惫 😴'
}

/**
 * Priority display names (Chinese)
 */
const PRIORITY_LABELS = {
  high: '高',
  medium: '中',
  low: '低'
} as const

/**
 * Create an AppError object
 */
function createError(code: string, message: string, details?: Record<string, unknown>): AppError {
  return { code, message, details }
}

/**
 * Format a date string for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

/**
 * ExportService - Handles data export to JSON and Markdown formats
 */
export const ExportService = {
  /**
   * Export records to JSON format
   * @param records - Array of daily records to export
   * @returns JSON string or error
   */
  exportToJSON(records: DailyRecord[]): { success: true; data: string } | { success: false; error: AppError } {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: createError(ExportErrorCodes.NO_DATA, '没有可导出的数据')
      }
    }

    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        recordCount: records.length,
        records: records
      }
      const jsonString = JSON.stringify(exportData, null, 2)
      return { success: true, data: jsonString }
    } catch {
      return {
        success: false,
        error: createError(ExportErrorCodes.EXPORT_FAILED, '导出失败，请重试')
      }
    }
  },

  /**
   * Parse JSON export back to records (for round-trip testing)
   * @param jsonString - JSON string to parse
   * @returns Array of daily records or error
   */
  parseJSON(jsonString: string): { success: true; data: DailyRecord[] } | { success: false; error: AppError } {
    try {
      const parsed = JSON.parse(jsonString)
      if (!parsed.records || !Array.isArray(parsed.records)) {
        return {
          success: false,
          error: createError(ExportErrorCodes.INVALID_FORMAT, '无效的导出格式')
        }
      }
      return { success: true, data: parsed.records }
    } catch {
      return {
        success: false,
        error: createError(ExportErrorCodes.INVALID_FORMAT, '无效的JSON格式')
      }
    }
  },

  /**
   * Export records to Markdown format
   * @param records - Array of daily records to export
   * @returns Markdown string or error
   */
  exportToMarkdown(records: DailyRecord[]): { success: true; data: string } | { success: false; error: AppError } {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: createError(ExportErrorCodes.NO_DATA, '没有可导出的数据')
      }
    }

    try {
      const lines: string[] = []
      
      // Header
      lines.push('# 行动手账导出')
      lines.push('')
      lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`)
      lines.push(`记录数量：${records.length}`)
      lines.push('')
      lines.push('---')
      lines.push('')

      // Sort records by date (newest first)
      const sortedRecords = [...records].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      // Each record
      for (const record of sortedRecords) {
        lines.push(`## ${formatDate(record.date)}`)
        lines.push('')
        
        // Mood
        if (record.mood) {
          lines.push(`**心情：** ${MOOD_LABELS[record.mood]}`)
          lines.push('')
        }

        // Completion rate
        lines.push(`**完成率：** ${record.completionRate}%`)
        lines.push('')

        // Tasks
        if (record.tasks.length > 0) {
          lines.push('### 任务列表')
          lines.push('')
          
          for (const task of record.tasks) {
            const checkbox = task.completed ? '[x]' : '[ ]'
            const priorityLabel = `[${PRIORITY_LABELS[task.priority]}]`
            const tagsStr = task.tags.length > 0 ? ` #${task.tags.join(' #')}` : ''
            lines.push(`- ${checkbox} ${priorityLabel} ${task.description}${tagsStr}`)
          }
          lines.push('')
        }

        // Journal - 优先使用 journalEntries，回退到旧的 journal 字段
        if (record.journalEntries && record.journalEntries.length > 0) {
          lines.push('### 日记')
          lines.push('')
          for (const entry of record.journalEntries) {
            const entryTime = new Date(entry.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })
            const moodStr = entry.mood ? ` ${MOOD_LABELS[entry.mood]}` : ''
            lines.push(`**${entryTime}**${moodStr}`)
            lines.push('')
            lines.push(entry.content)
            lines.push('')
          }
        } else if (record.journal && record.journal.trim().length > 0) {
          lines.push('### 日记')
          lines.push('')
          lines.push(record.journal)
          lines.push('')
        }

        // Sealed status
        if (record.isSealed && record.sealedAt) {
          lines.push(`*已封存于 ${new Date(record.sealedAt).toLocaleString('zh-CN')}*`)
          lines.push('')
        }

        lines.push('---')
        lines.push('')
      }

      return { success: true, data: lines.join('\n') }
    } catch {
      return {
        success: false,
        error: createError(ExportErrorCodes.EXPORT_FAILED, '导出失败，请重试')
      }
    }
  },

  /**
   * Trigger file download in browser
   * @param content - File content
   * @param filename - File name
   * @param mimeType - MIME type
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  /**
   * Export and download records
   * @param records - Array of daily records to export
   * @param format - Export format ('json' or 'markdown')
   * @returns Success or error
   */
  exportAndDownload(
    records: DailyRecord[],
    format: ExportFormat
  ): { success: true } | { success: false; error: AppError } {
    const timestamp = new Date().toISOString().split('T')[0]
    
    if (format === 'json') {
      const result = this.exportToJSON(records)
      if (!result.success) return result
      
      this.downloadFile(result.data, `action-log-${timestamp}.json`, 'application/json')
      return { success: true }
    } else if (format === 'markdown') {
      const result = this.exportToMarkdown(records)
      if (!result.success) return result
      
      this.downloadFile(result.data, `action-log-${timestamp}.md`, 'text/markdown')
      return { success: true }
    }

    return {
      success: false,
      error: createError(ExportErrorCodes.INVALID_FORMAT, '不支持的导出格式')
    }
  },

  /**
   * Check if export contains all required data (for completeness verification)
   * @param records - Original records
   * @param exportedJson - Exported JSON string
   * @returns Whether export is complete
   */
  verifyExportCompleteness(records: DailyRecord[], exportedJson: string): boolean {
    const parseResult = this.parseJSON(exportedJson)
    if (!parseResult.success) return false

    const exportedRecords = parseResult.data

    // Check record count
    if (exportedRecords.length !== records.length) return false

    // Check each record has all required fields
    for (const original of records) {
      const exported = exportedRecords.find(r => r.id === original.id)
      if (!exported) return false

      // Verify tasks array
      if (exported.tasks.length !== original.tasks.length) return false
      
      // Verify journal content
      if (exported.journal !== original.journal) return false
      
      // Verify mood
      if (exported.mood !== original.mood) return false
    }

    return true
  }
}

export default ExportService
