import type { DailyRecord, Statistics, TrendPoint, MoodCount, TagStat, MoodType } from '@/types'

/**
 * 计算心情分布
 * 优先统计 journalEntries 中的心情，回退到旧的 record.mood 字段
 */
export function calculateMoodDistribution(records: DailyRecord[]): MoodCount[] {
  const moodCounts: Record<MoodType, number> = {
    happy: 0,
    neutral: 0,
    sad: 0,
    excited: 0,
    tired: 0
  }

  for (const record of records) {
    // 优先统计 journalEntries 中的心情
    if (record.journalEntries && record.journalEntries.length > 0) {
      for (const entry of record.journalEntries) {
        if (entry.mood) {
          moodCounts[entry.mood]++
        }
      }
    } else if (record.mood) {
      // 回退到旧的 mood 字段（兼容旧数据）
      moodCounts[record.mood]++
    }
  }

  return Object.entries(moodCounts)
    .filter(([, count]) => count > 0)
    .map(([mood, count]) => ({
      mood: mood as MoodType,
      count
    }))
}

/**
 * 计算完成率趋势
 */
export function calculateCompletionTrend(records: DailyRecord[], days: number = 7): TrendPoint[] {
  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const recentRecords = sortedRecords.slice(-days)

  return recentRecords.map(record => ({
    date: record.date,
    rate: record.completionRate
  }))
}

/**
 * 计算累计任务统计
 */
export function calculateCumulativeTaskCount(records: DailyRecord[]): { total: number; completed: number } {
  let total = 0
  let completed = 0

  for (const record of records) {
    total += record.tasks.length
    completed += record.tasks.filter(t => t.completed).length
  }

  return { total, completed }
}


/**
 * 计算标签统计
 */
export function calculateTagStats(records: DailyRecord[]): TagStat[] {
  const tagMap = new Map<string, { total: number; completed: number }>()

  for (const record of records) {
    for (const task of record.tasks) {
      for (const tag of task.tags) {
        const existing = tagMap.get(tag) || { total: 0, completed: 0 }
        existing.total++
        if (task.completed) {
          existing.completed++
        }
        tagMap.set(tag, existing)
      }
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, stats]) => ({
      tag,
      total: stats.total,
      completed: stats.completed
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * 计算连续活跃天数
 */
export function calculateConsecutiveDays(records: DailyRecord[]): number {
  if (records.length === 0) return 0

  const sortedDates = [...records]
    .map(r => r.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let consecutive = 1
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const latestDate = new Date(sortedDates[0])
  latestDate.setHours(0, 0, 0, 0)

  // 如果最新记录不是今天或昨天，连续天数为0
  const daysDiff = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff > 1) return 0

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i - 1])
    const prevDate = new Date(sortedDates[i])
    
    const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff === 1) {
      consecutive++
    } else {
      break
    }
  }

  return consecutive
}

/**
 * 计算完整统计数据
 */
export function calculateStatistics(records: DailyRecord[]): Statistics {
  const { total, completed } = calculateCumulativeTaskCount(records)
  
  return {
    totalTasks: total,
    completedTasks: completed,
    consecutiveDays: calculateConsecutiveDays(records),
    completionTrend: calculateCompletionTrend(records, 30),
    moodDistribution: calculateMoodDistribution(records),
    tagStats: calculateTagStats(records)
  }
}
