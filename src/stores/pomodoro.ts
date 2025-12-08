import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimerState, TimerMode, PomodoroSettings, FocusRecord, Task } from '@/types'
import { DEFAULT_POMODORO_SETTINGS } from '@/types'
import { PomodoroService } from '@/services/pomodoro'

/**
 * Pomodoro Store - 番茄钟状态管理
 * 
 * 负责管理番茄钟的计时器状态、任务关联、设置和统计数据。
 * 实现了以下核心功能：
 * - 计时器状态管理 (Requirements 2.1-2.5)
 * - 专注/休息模式切换 (Requirements 3.2-3.5)
 * - 任务关联 (Requirements 4.2-4.4)
 * - 设置管理和验证 (Requirements 5.2-5.5)
 * - 统计数据计算 (Requirements 6.1-6.3)
 * 
 * @module stores/pomodoro
 */

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
 * 获取今日日期字符串
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 验证设置值是否在有效范围内
 */
export function validateSettings(settings: Partial<PomodoroSettings>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (settings.focusDuration !== undefined) {
    if (!Number.isInteger(settings.focusDuration) || 
        settings.focusDuration < 1 || 
        settings.focusDuration > 60) {
      errors.push('专注时长需在 1-60 分钟之间的整数')
    }
  }

  if (settings.shortBreakDuration !== undefined) {
    if (!Number.isInteger(settings.shortBreakDuration) || 
        settings.shortBreakDuration < 1 || 
        settings.shortBreakDuration > 30) {
      errors.push('短休息时长需在 1-30 分钟之间的整数')
    }
  }

  if (settings.longBreakDuration !== undefined) {
    if (!Number.isInteger(settings.longBreakDuration) || 
        settings.longBreakDuration < 1 || 
        settings.longBreakDuration > 30) {
      errors.push('长休息时长需在 1-30 分钟之间的整数')
    }
  }

  if (settings.pomodorosUntilLongBreak !== undefined) {
    if (!Number.isInteger(settings.pomodorosUntilLongBreak) || 
        settings.pomodorosUntilLongBreak < 1) {
      errors.push('长休息前专注次数需为正整数')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export const usePomodoroStore = defineStore('pomodoro', () => {
  // ==================== State ====================
  
  // 计时器状态
  const timerState = ref<TimerState>('idle')
  const currentMode = ref<TimerMode>('focus')
  const remainingSeconds = ref(0)
  const totalSeconds = ref(0)
  
  // 暂停前的状态（用于恢复）
  const pausedFromState = ref<'focusing' | 'break' | null>(null)
  
  // 专注统计
  const completedPomodoros = ref(0)  // 当前周期内完成的专注次数（用于判断长休息）
  const todayCompletedPomodoros = ref(0)  // 今日完成的专注时段数
  const totalFocusMinutes = ref(0)  // 今日累计专注分钟数
  
  // 任务关联
  const selectedTaskId = ref<string | null>(null)
  const selectedTaskDescription = ref<string | null>(null)
  
  // 设置
  const settings = ref<PomodoroSettings>({ ...DEFAULT_POMODORO_SETTINGS })
  
  // 今日专注记录
  const todayRecords = ref<FocusRecord[]>([])

  // ==================== Getters ====================
  
  /**
   * 格式化的剩余时间 (MM:SS)
   */
  const formattedTime = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  /**
   * 进度百分比 (0-100)
   */
  const progress = computed(() => {
    if (totalSeconds.value === 0) return 0
    return Math.round(((totalSeconds.value - remainingSeconds.value) / totalSeconds.value) * 100)
  })

  /**
   * 是否正在运行（专注中或休息中）
   */
  const isRunning = computed(() => 
    timerState.value === 'focusing' || timerState.value === 'break'
  )

  // ==================== Actions ====================

  /**
   * 初始化计时器时间
   */
  function initializeTimer(mode: TimerMode): void {
    currentMode.value = mode
    let duration: number
    
    switch (mode) {
      case 'focus':
        duration = settings.value.focusDuration
        break
      case 'shortBreak':
        duration = settings.value.shortBreakDuration
        break
      case 'longBreak':
        duration = settings.value.longBreakDuration
        break
    }
    
    totalSeconds.value = duration * 60
    remainingSeconds.value = totalSeconds.value
  }

  /**
   * 开始计时器
   * Requirements: 2.1
   */
  function start(): boolean {
    if (timerState.value !== 'idle') {
      return false
    }
    
    initializeTimer('focus')
    timerState.value = 'focusing'
    pausedFromState.value = null
    return true
  }

  /**
   * 暂停计时器
   * Requirements: 2.2
   */
  function pause(): boolean {
    if (timerState.value !== 'focusing' && timerState.value !== 'break') {
      return false
    }
    
    // 记录暂停前的状态
    pausedFromState.value = timerState.value
    timerState.value = 'paused'
    return true
  }

  /**
   * 继续计时器
   * Requirements: 2.3
   */
  function resume(): boolean {
    if (timerState.value !== 'paused' || !pausedFromState.value) {
      return false
    }
    
    // 恢复到暂停前的状态
    timerState.value = pausedFromState.value
    pausedFromState.value = null
    return true
  }

  /**
   * 重置计时器
   * Requirements: 2.4
   */
  function reset(): void {
    timerState.value = 'idle'
    currentMode.value = 'focus'
    remainingSeconds.value = 0
    totalSeconds.value = 0
    pausedFromState.value = null
    // 不重置 completedPomodoros，保持周期计数
  }

  /**
   * 计时器 tick（每秒调用）
   * Requirements: 2.5
   * @returns 是否时段完成
   */
  function tick(): boolean {
    if (timerState.value !== 'focusing' && timerState.value !== 'break') {
      return false
    }
    
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
      return false
    }
    
    // 时段完成
    return true
  }

  /**
   * 完成专注时段
   * Requirements: 3.2, 3.3, 3.4, 6.3
   */
  async function completeFocusSession(): Promise<void> {
    if (currentMode.value !== 'focus') return
    
    // 更新统计
    completedPomodoros.value++
    todayCompletedPomodoros.value++
    totalFocusMinutes.value += settings.value.focusDuration
    
    // 创建专注记录
    const record: FocusRecord = {
      id: generateUUID(),
      taskId: selectedTaskId.value,
      taskDescription: selectedTaskDescription.value,
      duration: settings.value.focusDuration,
      completedAt: new Date().toISOString(),
      date: getTodayDateString()
    }
    
    todayRecords.value.push(record)
    
    // 保存记录
    await PomodoroService.saveFocusRecordAsync(record)
    
    // 切换到休息模式
    // Requirements: 3.3, 3.4
    if (completedPomodoros.value >= settings.value.pomodorosUntilLongBreak) {
      // 进入长休息并重置计数
      initializeTimer('longBreak')
      completedPomodoros.value = 0
    } else {
      // 进入短休息
      initializeTimer('shortBreak')
    }
    
    timerState.value = 'break'
  }

  /**
   * 完成休息时段
   * Requirements: 3.5
   */
  function completeBreakSession(): void {
    if (currentMode.value !== 'shortBreak' && currentMode.value !== 'longBreak') return
    
    // 自动切换回专注模式
    initializeTimer('focus')
    timerState.value = 'focusing'
  }

  /**
   * 选择关联任务
   * Requirements: 4.2, 4.3
   */
  function selectTask(task: Task | null): void {
    if (task) {
      selectedTaskId.value = task.id
      selectedTaskDescription.value = task.description
    } else {
      selectedTaskId.value = null
      selectedTaskDescription.value = null
    }
  }

  /**
   * 更新设置
   * Requirements: 5.2, 5.3, 5.4, 5.5
   * @returns 是否更新成功
   */
  function updateSettings(newSettings: Partial<PomodoroSettings>): boolean {
    const validation = validateSettings(newSettings)
    if (!validation.valid) {
      return false
    }
    
    // 合并设置
    settings.value = {
      ...settings.value,
      ...newSettings
    }
    
    // 持久化设置
    PomodoroService.saveSettings(settings.value)
    
    return true
  }

  /**
   * 加载今日数据
   */
  async function loadTodayData(): Promise<void> {
    // 加载设置
    const settingsResult = PomodoroService.loadSettings()
    if (settingsResult.success) {
      settings.value = settingsResult.data
    }
    
    // 加载今日专注记录
    const recordsResult = await PomodoroService.loadTodayRecords()
    if (recordsResult.success) {
      todayRecords.value = recordsResult.data
      
      // 计算今日统计
      todayCompletedPomodoros.value = todayRecords.value.length
      totalFocusMinutes.value = todayRecords.value.reduce(
        (sum, record) => sum + record.duration, 
        0
      )
    }
    
    // 清理过期记录
    PomodoroService.cleanupOldRecords()
  }

  /**
   * 重置 store（用于测试）
   */
  function $reset(): void {
    timerState.value = 'idle'
    currentMode.value = 'focus'
    remainingSeconds.value = 0
    totalSeconds.value = 0
    pausedFromState.value = null
    completedPomodoros.value = 0
    todayCompletedPomodoros.value = 0
    totalFocusMinutes.value = 0
    selectedTaskId.value = null
    selectedTaskDescription.value = null
    settings.value = { ...DEFAULT_POMODORO_SETTINGS }
    todayRecords.value = []
  }

  return {
    // State
    timerState,
    currentMode,
    remainingSeconds,
    totalSeconds,
    completedPomodoros,
    todayCompletedPomodoros,
    totalFocusMinutes,
    selectedTaskId,
    selectedTaskDescription,
    settings,
    todayRecords,
    
    // Getters
    formattedTime,
    progress,
    isRunning,
    
    // Actions
    start,
    pause,
    resume,
    reset,
    tick,
    completeFocusSession,
    completeBreakSession,
    selectTask,
    updateSettings,
    loadTodayData,
    $reset
  }
})
