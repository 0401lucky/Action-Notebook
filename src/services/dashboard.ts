/**
 * 仪表盘服务
 * 提供仪表盘页面所需的工具函数和统计计算
 */

import type { DailyRecord, MoodType, Task } from '@/types'

/**
 * 本周统计数据接口
 */
export interface WeeklyStats {
  completedTasks: number    // 本周完成任务数
  journalDays: number       // 本周写日记天数
}

/**
 * 心情 Emoji 映射
 */
const MOOD_EMOJI_MAP: Record<MoodType, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  excited: '🤩',
  tired: '😴'
}

/**
 * 中文星期名称
 */
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 根据小时获取问候语
 * @param hour 小时 (0-23)
 * @returns 问候语字符串
 */
export function getGreeting(hour: number): string {
  if (hour >= 0 && hour < 12) {
    return '早上好'
  } else if (hour >= 12 && hour < 18) {
    return '下午好'
  } else {
    return '晚上好'
  }
}

/**
 * 格式化日期为中文格式
 * @param date 日期对象
 * @returns 格式化的日期字符串 "YYYY年M月D日 星期X"
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAY_NAMES[date.getDay()]
  
  return `${year}年${month}月${day}日 星期${weekday}`
}


/**
 * 格式化问候语与昵称组合
 * @param greeting 问候语
 * @param nickname 昵称（可为 null）
 * @returns 组合后的问候语
 */
export function formatGreetingWithNickname(greeting: string, nickname: string | null): string {
  if (nickname && nickname.trim()) {
    return `${greeting}，${nickname.trim()}`
  }
  return greeting
}

/**
 * 格式化日记预览
 * @param journal 日记内容
 * @param maxLength 最大长度，默认 50
 * @returns 截取后的预览文本
 */
export function formatJournalPreview(journal: string, maxLength: number = 50): string {
  if (!journal) {
    return ''
  }
  
  // 移除多余空白并截取
  const trimmed = journal.trim()
  
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  
  return trimmed.slice(0, maxLength) + '...'
}

/**
 * 获取心情对应的 Emoji
 * @param mood 心情类型
 * @returns Emoji 字符串，无心情时返回空字符串
 */
export function getMoodEmoji(mood: MoodType | null): string {
  if (!mood) {
    return ''
  }
  return MOOD_EMOJI_MAP[mood] || ''
}

/**
 * 任务列表截取结果接口
 */
export interface TaskListSliceResult {
  displayedTasks: Task[]      // 显示的任务列表
  showViewAll: boolean        // 是否显示"查看全部"链接
  totalCount: number          // 总任务数
}

/**
 * 日记列表截取结果接口
 */
export interface JournalListSliceResult {
  displayedJournals: DailyRecord[]  // 显示的日记列表（已按日期降序排列）
  showViewAll: boolean              // 是否显示"查看全部"链接
  totalCount: number                // 总日记数
}

/**
 * 截取并排序日记列表用于显示
 * 只包含已封存的日记，按日期降序排列（最新的在前）
 * @param records 日记记录数组
 * @param maxDisplay 最大显示数量，默认 3
 * @returns 截取结果，包含显示的日记、是否显示查看全部、总数
 */
export function sliceJournalList(records: DailyRecord[], maxDisplay: number = 3): JournalListSliceResult {
  // 只保留已封存的记录
  const sealedRecords = records.filter(r => r.isSealed)
  
  // 按日期降序排列（最新的在前）
  const sortedRecords = [...sealedRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  const totalCount = sortedRecords.length
  const displayedJournals = sortedRecords.slice(0, maxDisplay)
  const showViewAll = totalCount > maxDisplay
  
  return {
    displayedJournals,
    showViewAll,
    totalCount
  }
}

/**
 * 截取任务列表用于显示
 * @param tasks 任务数组
 * @param maxDisplay 最大显示数量，默认 5
 * @returns 截取结果，包含显示的任务、是否显示查看全部、总数
 */
export function sliceTaskList(tasks: Task[], maxDisplay: number = 5): TaskListSliceResult {
  const totalCount = tasks.length
  const displayedTasks = tasks.slice(0, maxDisplay)
  const showViewAll = totalCount > maxDisplay
  
  return {
    displayedTasks,
    showViewAll,
    totalCount
  }
}

/**
 * 任务完成进度接口
 */
export interface TaskProgressResult {
  completed: number           // 已完成数
  total: number               // 总数
  formatted: string           // 格式化字符串 "X/Y 已完成"
}

/**
 * 计算任务完成进度
 * @param tasks 任务数组
 * @returns 进度结果，包含已完成数、总数和格式化字符串
 */
export function calculateTaskProgress(tasks: Task[]): TaskProgressResult {
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const formatted = `${completed}/${total} 已完成`
  
  return {
    completed,
    total,
    formatted
  }
}

/**
 * 获取本周的日期范围（周一到周日）
 * @param referenceDate 参考日期，默认为当前日期
 * @returns 包含 start 和 end 的日期范围对象
 */
export function getWeekDateRange(referenceDate?: Date): { start: Date; end: Date } {
  const date = referenceDate ? new Date(referenceDate) : new Date()
  
  // 获取当前是星期几（0=周日, 1=周一, ..., 6=周六）
  const dayOfWeek = date.getDay()
  
  // 计算到周一的偏移量（周日需要往前推6天）
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  // 计算周一日期
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  
  // 计算周日日期
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { start: monday, end: sunday }
}


/**
 * 计算本周统计数据
 * @param records 日记记录数组
 * @param referenceDate 参考日期，默认为当前日期
 * @returns 本周统计数据
 */
export function calculateWeeklyStats(records: DailyRecord[], referenceDate?: Date): WeeklyStats {
  const { start, end } = getWeekDateRange(referenceDate)
  
  let completedTasks = 0
  let journalDays = 0
  
  for (const record of records) {
    const recordDate = new Date(record.date)
    recordDate.setHours(12, 0, 0, 0) // 设置为中午，避免时区问题
    
    // 检查记录是否在本周范围内
    if (recordDate >= start && recordDate <= end) {
      // 统计完成的任务数
      if (record.tasks && Array.isArray(record.tasks)) {
        completedTasks += record.tasks.filter(task => task.completed).length
      }
      
      // 统计有日记的天数
      // 优先检查 journalEntries，回退到旧的 journal 字段
      const hasJournalEntries = record.journalEntries && record.journalEntries.length > 0
      const hasOldJournal = record.journal && record.journal.trim().length > 0
      if (hasJournalEntries || hasOldJournal) {
        journalDays++
      }
    }
  }
  
  return {
    completedTasks,
    journalDays
  }
}

/**
 * 计算连续打卡天数
 * 从参考日期向前计算连续有记录的天数
 * @param records 日记记录数组
 * @param referenceDate 参考日期，默认为当前日期
 * @returns 连续打卡天数
 */
export function calculateConsecutiveDays(records: DailyRecord[], referenceDate?: Date): number {
  if (!records || records.length === 0) {
    return 0
  }
  
  const refDate = referenceDate ? new Date(referenceDate) : new Date()
  refDate.setHours(0, 0, 0, 0)
  
  // 创建日期集合，用于快速查找
  const recordDates = new Set<string>()
  for (const record of records) {
    // 只计算已封存的记录
    if (record.isSealed) {
      recordDates.add(record.date)
    }
  }
  
  // 从参考日期开始向前检查
  let consecutiveDays = 0
  const checkDate = new Date(refDate)
  
  // 格式化日期为 YYYY-MM-DD
  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  while (true) {
    const dateKey = formatDateKey(checkDate)
    
    if (recordDates.has(dateKey)) {
      consecutiveDays++
      // 向前推一天
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return consecutiveDays
}
