/**
 * 封存/解封服务
 * 
 * 提供记录的封存和解封功能
 * 
 * @module services/seal
 */

import type { DailyRecord, Task, MoodType } from '@/types'
import { addJournalEntry, editJournalEntry, deleteJournalEntry } from './journal'

/**
 * 解封记录
 * 将已封存的记录恢复为可编辑状态，保留原有 sealedAt 作为历史参考
 * 
 * @param record - 要解封的记录
 * @returns 解封后的记录，如果记录未封存则返回 null
 * 
 * Requirements: 1.2, 1.5
 */
export function unsealRecord(record: DailyRecord): DailyRecord | null {
  // 只有已封存的记录才能解封
  if (!record.isSealed) {
    return null
  }

  return {
    ...record,
    isSealed: false
    // 保留原有 sealedAt 作为历史参考
  }
}

/**
 * 封存记录
 * 将记录标记为已封存，更新封存时间
 * 
 * @param record - 要封存的记录
 * @returns 封存后的记录，如果记录已封存则返回 null
 * 
 * Requirements: 5.2
 */
export function sealRecord(record: DailyRecord): DailyRecord | null {
  // 已封存的记录不能再次封存
  if (record.isSealed) {
    return null
  }

  return {
    ...record,
    isSealed: true,
    sealedAt: new Date().toISOString()
  }
}

/**
 * 检查记录是否可以添加任务
 * 
 * @param record - 记录
 * @returns 是否可以添加任务
 * 
 * Requirements: 1.3
 */
export function canAddTask(record: DailyRecord): boolean {
  return !record.isSealed
}

/**
 * 检查记录是否可以删除任务
 * 
 * @param record - 记录
 * @returns 是否可以删除任务
 * 
 * Requirements: 1.3
 */
export function canRemoveTask(record: DailyRecord): boolean {
  return !record.isSealed
}

/**
 * 检查记录是否可以修改任务
 * 
 * @param record - 记录
 * @returns 是否可以修改任务
 * 
 * Requirements: 1.3
 */
export function canModifyTask(record: DailyRecord): boolean {
  return !record.isSealed
}

/**
 * 检查记录是否可以编辑日记
 * 
 * @param record - 记录
 * @returns 是否可以编辑日记
 * 
 * Requirements: 1.4, 7.4
 */
export function canEditJournal(record: DailyRecord): boolean {
  return !record.isSealed
}

/**
 * 在记录中添加任务（如果未封存）
 * 
 * @param record - 记录
 * @param task - 要添加的任务
 * @returns 更新后的记录，如果已封存则返回 null
 * 
 * Requirements: 1.3
 */
export function addTaskToRecord(record: DailyRecord, task: Task): DailyRecord | null {
  if (!canAddTask(record)) {
    return null
  }

  return {
    ...record,
    tasks: [...record.tasks, task]
  }
}

/**
 * 从记录中删除任务（如果未封存）
 * 
 * @param record - 记录
 * @param taskId - 要删除的任务 ID
 * @returns 更新后的记录，如果已封存或任务不存在则返回 null
 * 
 * Requirements: 1.3
 */
export function removeTaskFromRecord(record: DailyRecord, taskId: string): DailyRecord | null {
  if (!canRemoveTask(record)) {
    return null
  }

  const taskIndex = record.tasks.findIndex(t => t.id === taskId)
  if (taskIndex === -1) {
    return null
  }

  return {
    ...record,
    tasks: record.tasks.filter(t => t.id !== taskId)
  }
}

/**
 * 修改记录中的任务（如果未封存）
 * 
 * @param record - 记录
 * @param taskId - 要修改的任务 ID
 * @param updates - 要更新的属性
 * @returns 更新后的记录，如果已封存或任务不存在则返回 null
 * 
 * Requirements: 1.3
 */
export function modifyTaskInRecord(
  record: DailyRecord,
  taskId: string,
  updates: Partial<Pick<Task, 'description' | 'completed' | 'priority' | 'tags'>>
): DailyRecord | null {
  if (!canModifyTask(record)) {
    return null
  }

  const taskIndex = record.tasks.findIndex(t => t.id === taskId)
  if (taskIndex === -1) {
    return null
  }

  const updatedTasks = [...record.tasks]
  updatedTasks[taskIndex] = {
    ...updatedTasks[taskIndex],
    ...updates
  }

  return {
    ...record,
    tasks: updatedTasks
  }
}

/**
 * 在记录中添加日记条目（如果未封存）
 * 
 * @param record - 记录
 * @param content - 日记内容
 * @param mood - 心情（可选）
 * @returns 更新后的记录，如果已封存或内容无效则返回 null
 * 
 * Requirements: 1.4, 7.4
 */
export function addJournalEntryToRecord(
  record: DailyRecord,
  content: string,
  mood: MoodType | null = null
): DailyRecord | null {
  if (!canEditJournal(record)) {
    return null
  }

  const entries = record.journalEntries || []
  const result = addJournalEntry(entries, content, mood)
  
  if (!result) {
    return null
  }

  return {
    ...record,
    journalEntries: result.entries
  }
}

/**
 * 编辑记录中的日记条目（如果未封存）
 * 
 * @param record - 记录
 * @param entryId - 要编辑的条目 ID
 * @param content - 新内容
 * @returns 更新后的记录，如果已封存或条目不存在则返回 null
 * 
 * Requirements: 1.4, 7.4
 */
export function editJournalEntryInRecord(
  record: DailyRecord,
  entryId: string,
  content: string
): DailyRecord | null {
  if (!canEditJournal(record)) {
    return null
  }

  const entries = record.journalEntries || []
  const result = editJournalEntry(entries, entryId, content)
  
  if (!result) {
    return null
  }

  return {
    ...record,
    journalEntries: result
  }
}

/**
 * 删除记录中的日记条目（如果未封存）
 * 
 * @param record - 记录
 * @param entryId - 要删除的条目 ID
 * @returns 更新后的记录，如果已封存或条目不存在则返回 null
 * 
 * Requirements: 1.4, 7.4
 */
export function deleteJournalEntryFromRecord(
  record: DailyRecord,
  entryId: string
): DailyRecord | null {
  if (!canEditJournal(record)) {
    return null
  }

  const entries = record.journalEntries || []
  const result = deleteJournalEntry(entries, entryId)
  
  if (!result) {
    return null
  }

  return {
    ...record,
    journalEntries: result
  }
}

/**
 * 封存服务对象
 * 提供所有封存/解封相关操作的统一接口
 */
export const SealService = {
  unsealRecord,
  sealRecord,
  canAddTask,
  canRemoveTask,
  canModifyTask,
  canEditJournal,
  addTaskToRecord,
  removeTaskFromRecord,
  modifyTaskInRecord,
  addJournalEntryToRecord,
  editJournalEntryInRecord,
  deleteJournalEntryFromRecord
}
