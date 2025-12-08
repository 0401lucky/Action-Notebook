/**
 * 日记条目服务
 * 
 * 提供日记条目的增删改查和验证功能
 * 支持富文本（HTML）内容
 * 
 * @module services/journal
 */

import type { JournalEntry, MoodType } from '@/types'
import { validateRichContent } from './richText'

/**
 * 生成 UUID v4 格式的唯一标识符
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 验证日记内容是否有效（非空白）
 * 支持纯文本和 HTML 格式的内容
 * 
 * @param content - 日记内容（可以是纯文本或 HTML）
 * @returns 是否有效
 * 
 * Requirements: 6.1, 8.3
 */
export function validateEntryContent(content: string): boolean {
  if (typeof content !== 'string') {
    return false
  }
  
  // 检查是否包含 HTML 标签
  const hasHtmlTags = /<[^>]+>/.test(content)
  
  if (hasHtmlTags) {
    // HTML 内容：使用富文本验证函数
    return validateRichContent(content)
  } else {
    // 纯文本：直接检查是否非空白
    return content.trim().length > 0
  }
}

/**
 * 添加日记条目
 * 
 * @param entries - 现有日记条目列表
 * @param content - 日记内容
 * @param mood - 心情（可选）
 * @returns 添加结果，成功返回新列表和新条目，失败返回 null
 * 
 * Requirements: 6.1, 6.2
 */
export function addJournalEntry(
  entries: JournalEntry[],
  content: string,
  mood: MoodType | null = null
): { entries: JournalEntry[]; newEntry: JournalEntry } | null {
  // 验证内容非空白
  if (!validateEntryContent(content)) {
    return null
  }

  const newEntry: JournalEntry = {
    id: generateUUID(),
    content: content.trim(),
    mood,
    createdAt: new Date().toISOString()
  }

  return {
    entries: [...entries, newEntry],
    newEntry
  }
}

/**
 * 编辑日记条目
 * 
 * @param entries - 现有日记条目列表
 * @param id - 要编辑的条目 ID
 * @param content - 新内容
 * @returns 编辑后的列表，失败返回 null
 * 
 * Requirements: 7.1, 7.2
 */
export function editJournalEntry(
  entries: JournalEntry[],
  id: string,
  content: string
): JournalEntry[] | null {
  // 验证内容非空白
  if (!validateEntryContent(content)) {
    return null
  }

  const index = entries.findIndex(e => e.id === id)
  if (index === -1) {
    return null
  }

  const updatedEntries = [...entries]
  updatedEntries[index] = {
    ...updatedEntries[index],
    content: content.trim()
  }

  return updatedEntries
}

/**
 * 删除日记条目
 * 
 * @param entries - 现有日记条目列表
 * @param id - 要删除的条目 ID
 * @returns 删除后的列表，失败返回 null
 * 
 * Requirements: 7.3
 */
export function deleteJournalEntry(
  entries: JournalEntry[],
  id: string
): JournalEntry[] | null {
  const index = entries.findIndex(e => e.id === id)
  if (index === -1) {
    return null
  }

  return entries.filter(e => e.id !== id)
}

/**
 * 按时间倒序排序日记条目（最新的在前）
 * 
 * @param entries - 日记条目列表
 * @returns 排序后的列表
 * 
 * Requirements: 6.3
 */
export function sortEntriesByTime(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return timeB - timeA // 倒序：最新的在前
  })
}

/**
 * 获取整体心情
 * 返回最后一条带心情的日记条目的心情值
 * 
 * @param entries - 日记条目列表
 * @returns 整体心情，如果没有带心情的条目则返回 null
 * 
 * Requirements: 9.4
 */
export function getOverallMood(entries: JournalEntry[]): MoodType | null {
  if (entries.length === 0) {
    return null
  }

  // 按时间正序排列，找到最后一条带心情的条目
  const sortedByTimeAsc = [...entries].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return timeA - timeB // 正序：最早的在前
  })

  // 从后往前找第一条带心情的条目
  for (let i = sortedByTimeAsc.length - 1; i >= 0; i--) {
    if (sortedByTimeAsc[i].mood !== null) {
      return sortedByTimeAsc[i].mood
    }
  }

  return null
}

/**
 * 日记服务对象
 * 提供所有日记相关操作的统一接口
 */
export const JournalService = {
  validateEntryContent,
  addJournalEntry,
  editJournalEntry,
  deleteJournalEntry,
  sortEntriesByTime,
  getOverallMood
}
