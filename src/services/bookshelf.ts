/**
 * 日记本书架服务
 * 
 * 提供日记本书架相关的功能：
 * - 按月份分组日记记录
 * - 获取日记条目数量
 * 
 * @module services/bookshelf
 */

import type { DailyRecord } from '@/types'

/**
 * 月份分组接口
 * 表示按月份分组的日记记录
 */
export interface MonthGroup {
  /** 月份标识，格式：YYYY-MM */
  month: string
  /** 月份显示标签，如"2025年12月" */
  label: string
  /** 该月份的日记记录列表 */
  records: DailyRecord[]
}

/**
 * 从日期字符串提取月份标识
 * @param dateStr - 日期字符串，格式：YYYY-MM-DD
 * @returns 月份标识，格式：YYYY-MM
 */
export function extractMonth(dateStr: string): string {
  // 取前7个字符：YYYY-MM
  return dateStr.substring(0, 7)
}

/**
 * 生成月份显示标签
 * @param month - 月份标识，格式：YYYY-MM
 * @returns 月份显示标签，如"2025年12月"
 */
export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-')
  return `${year}年${parseInt(monthNum, 10)}月`
}

/**
 * 按月份分组日记记录
 * 
 * 将日记记录按月份分组，同一月份的记录在同一组内，
 * 组按时间倒序排列（最新的月份在前）
 * 
 * **Feature: seal-enhancement, Property 10: 日记本按月分组**
 * **Validates: Requirements 10.2**
 * 
 * @param records - 日记记录数组
 * @returns 按月份分组的结果，按时间倒序排列
 */
export function groupRecordsByMonth(records: DailyRecord[]): MonthGroup[] {
  // 如果没有记录，返回空数组
  if (records.length === 0) {
    return []
  }

  // 使用 Map 按月份分组
  const monthMap = new Map<string, DailyRecord[]>()

  for (const record of records) {
    const month = extractMonth(record.date)
    const existing = monthMap.get(month)
    if (existing) {
      existing.push(record)
    } else {
      monthMap.set(month, [record])
    }
  }

  // 转换为 MonthGroup 数组
  const groups: MonthGroup[] = []
  for (const [month, monthRecords] of monthMap) {
    // 组内记录按日期倒序排列
    monthRecords.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    groups.push({
      month,
      label: formatMonthLabel(month),
      records: monthRecords
    })
  }

  // 组按月份倒序排列（最新的月份在前）
  groups.sort((a, b) => b.month.localeCompare(a.month))

  return groups
}

/**
 * 获取日记条目数量
 * 
 * 计算单个日记记录中的日记条目数量
 * 
 * @param record - 日记记录
 * @returns 日记条目数量
 */
export function getJournalEntryCount(record: DailyRecord): number {
  return record.journalEntries?.length ?? 0
}

/**
 * 获取记录的主要心情
 * 
 * 返回最后一条带心情的日记条目的心情值
 * 如果没有带心情的条目，返回旧的 mood 字段值
 * 
 * @param record - 日记记录
 * @returns 主要心情或 null
 */
export function getPrimaryMood(record: DailyRecord): DailyRecord['mood'] {
  // 优先从日记条目中获取最后一条带心情的
  if (record.journalEntries && record.journalEntries.length > 0) {
    // 按时间正序排列，取最后一条带心情的
    const sortedEntries = [...record.journalEntries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    for (let i = sortedEntries.length - 1; i >= 0; i--) {
      if (sortedEntries[i].mood) {
        return sortedEntries[i].mood
      }
    }
  }
  
  // 回退到旧的 mood 字段
  return record.mood
}
