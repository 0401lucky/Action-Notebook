<template>
  <div class="pomodoro-view">
    <div class="pomodoro-view__layout">
      <div class="pomodoro-view__main">
        <!-- 页面标题 -->
        <header class="pomodoro-view__header">
          <h1 class="pomodoro-view__title">🍅 番茄钟</h1>
          <p class="pomodoro-view__subtitle">专注工作，高效休息</p>
        </header>

        <!-- 计时器显示 -->
        <TimerDisplay
          :remaining-seconds="pomodoroStore.remainingSeconds"
          :total-seconds="pomodoroStore.totalSeconds"
          :current-mode="pomodoroStore.currentMode"
        />

        <!-- 计时器控制按钮 -->
        <TimerControls
          :timer-state="pomodoroStore.timerState"
          @start="handleStart"
          @pause="handlePause"
          @resume="handleResume"
          @reset="handleReset"
        />

        <!-- 快速设置概览 -->
        <BaseCard class="pomodoro-view__quick-card" :padded="true">
          <div class="quick-grid">
            <div class="quick-item">
              <span class="quick-item__label">专注时长</span>
              <div class="quick-item__control">
                <select
                  :value="pomodoroStore.settings.focusDuration"
                  :disabled="pomodoroStore.isRunning"
                  @change="onQuickSettingChange('focusDuration', $event)"
                >
                  <option v-for="opt in focusOptions" :key="opt" :value="opt">
                    {{ opt }} 分钟
                  </option>
                </select>
              </div>
            </div>
            <div class="quick-item">
              <span class="quick-item__label">短休息</span>
              <div class="quick-item__control">
                <select
                  :value="pomodoroStore.settings.shortBreakDuration"
                  :disabled="pomodoroStore.isRunning"
                  @change="onQuickSettingChange('shortBreakDuration', $event)"
                >
                  <option v-for="opt in shortBreakOptions" :key="opt" :value="opt">
                    {{ opt }} 分钟
                  </option>
                </select>
              </div>
            </div>
            <div class="quick-item">
              <span class="quick-item__label">长休息</span>
              <div class="quick-item__control">
                <select
                  :value="pomodoroStore.settings.longBreakDuration"
                  :disabled="pomodoroStore.isRunning"
                  @change="onQuickSettingChange('longBreakDuration', $event)"
                >
                  <option v-for="opt in longBreakOptions" :key="opt" :value="opt">
                    {{ opt }} 分钟
                  </option>
                </select>
              </div>
            </div>
            <div class="quick-item">
              <span class="quick-item__label">长休息前</span>
              <div class="quick-item__control">
                <select
                  :value="pomodoroStore.settings.pomodorosUntilLongBreak"
                  :disabled="pomodoroStore.isRunning"
                  @change="onQuickSettingChange('pomodorosUntilLongBreak', $event)"
                >
                  <option v-for="opt in cycleOptions" :key="opt" :value="opt">
                    {{ opt }} 轮
                  </option>
                </select>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- 任务选择器（仅在空闲状态显示） -->
        <div v-if="pomodoroStore.timerState === 'idle'" class="pomodoro-view__task-section">
          <TaskSelector />
        </div>

        <!-- 当前关联任务显示（运行时显示） -->
        <div 
          v-else-if="pomodoroStore.selectedTaskDescription" 
          class="pomodoro-view__current-task"
        >
          <span class="pomodoro-view__current-task-label">当前任务：</span>
          <span class="pomodoro-view__current-task-name">
            {{ pomodoroStore.selectedTaskDescription }}
          </span>
        </div>
      </div>

      <div class="pomodoro-view__sidebar">
        <!-- 统计数据 -->
        <PomodoroStats />

        <!-- 今日记录 -->
        <BaseCard class="pomodoro-view__history" :padded="true">
          <div class="pomodoro-view__history-header">
            <span class="pomodoro-view__history-title">今日记录</span>
            <span class="pomodoro-view__history-count">{{ recentRecords.length }} 条</span>
          </div>
          <div v-if="recentRecords.length === 0" class="pomodoro-view__history-empty">
            暂无专注记录，开始第一轮吧 🚀
          </div>
          <ul v-else class="pomodoro-view__history-list">
            <li v-for="record in recentRecords" :key="record.id" class="pomodoro-view__history-item">
              <div class="history-time">{{ formatTime(record.completedAt) }}</div>
              <div class="history-main">
                <div class="history-title">{{ record.taskDescription || '自由专注' }}</div>
                <div class="history-meta">{{ record.duration }} 分钟 · 完成</div>
              </div>
            </li>
          </ul>
        </BaseCard>

        <!-- 设置面板 -->
        <div class="pomodoro-view__settings-section">
          <PomodoroSettings />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PomodoroView - 番茄钟主页面
 * 
 * 整合所有番茄钟子组件，实现计时器逻辑。
 * 
 * Requirements: 3.1, 8.3
 * - 3.1: 专注时段倒计时结束时播放提示音并显示通知
 * - 8.3: 自适应调整布局保持可用性
 */
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import { useDailyStore } from '@/stores/daily'
import {
  TimerDisplay,
  TimerControls,
  TaskSelector,
  PomodoroSettings,
  PomodoroStats
} from '@/components/pomodoro'
import BaseCard from '@/components/common/BaseCard.vue'

const pomodoroStore = usePomodoroStore()
const dailyStore = useDailyStore()

// 计时器 interval ID
const timerInterval = ref<number | null>(null)

/**
 * 初始化提示音
 * 使用 Web Audio API 生成简单的提示音
 */
function initNotificationSound(): void {
  try {
    // 创建一个简单的提示音（使用 data URI）
    // 这是一个简单的 beep 音效
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // 创建一个简单的音频缓冲区
    const sampleRate = audioContext.sampleRate
    const duration = 0.3
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)
    
    // 生成简单的正弦波
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      // 880Hz 的正弦波，带有淡出效果
      data[i] = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-3 * t)
    }
    
    // 保存 audioContext 和 buffer 供后续使用
    ;(window as any).__pomodoroAudioContext = audioContext
    ;(window as any).__pomodoroAudioBuffer = buffer
  } catch (error) {
    console.warn('无法初始化提示音:', error)
  }
}

/**
 * 播放提示音
 * Requirements: 3.1
 */
function playNotificationSound(): void {
  try {
    const audioContext = (window as any).__pomodoroAudioContext
    const buffer = (window as any).__pomodoroAudioBuffer
    
    if (audioContext && buffer) {
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start()
    }
  } catch (error) {
    console.warn('播放提示音失败:', error)
  }
}

/**
 * 显示浏览器通知
 * Requirements: 3.1
 */
async function showNotification(title: string, body: string): Promise<void> {
  // 检查通知权限
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '🍅',
      tag: 'pomodoro-notification'
    })
  }
}

/**
 * 开始计时器
 */
function startTimer(): void {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }

  timerInterval.value = window.setInterval(() => {
    const completed = pomodoroStore.tick()
    
    if (completed) {
      handleSessionComplete()
    }
  }, 1000)
}

/**
 * 停止计时器
 */
function stopTimer(): void {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

/**
 * 处理时段完成
 * Requirements: 3.1, 3.2, 3.5
 */
async function handleSessionComplete(): Promise<void> {
  // 播放提示音
  playNotificationSound()
  
  const currentMode = pomodoroStore.currentMode
  
  if (currentMode === 'focus') {
    // 专注时段完成
    await showNotification('专注完成！', '休息一下吧 ☕')
    await pomodoroStore.completeFocusSession()
  } else {
    // 休息时段完成
    await showNotification('休息结束！', '开始新的专注吧 💪')
    pomodoroStore.completeBreakSession()
  }
}

/**
 * 处理开始按钮点击
 */
function handleStart(): void {
  if (pomodoroStore.start()) {
    startTimer()
  }
}

/**
 * 处理暂停按钮点击
 */
function handlePause(): void {
  if (pomodoroStore.pause()) {
    stopTimer()
  }
}

/**
 * 处理继续按钮点击
 */
function handleResume(): void {
  if (pomodoroStore.resume()) {
    startTimer()
  }
}

/**
 * 处理重置按钮点击
 */
function handleReset(): void {
  stopTimer()
  pomodoroStore.reset()
}

const recentRecords = computed(() => {
  return [...pomodoroStore.todayRecords].slice(-6).reverse()
})

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const focusOptions = [15, 20, 25, 30, 35, 45, 50, 60]
const shortBreakOptions = [3, 5, 8, 10, 12, 15, 20, 30]
const longBreakOptions = [10, 12, 15, 20, 25, 30]
const cycleOptions = [2, 3, 4, 5, 6, 8, 10, 12]

function onQuickSettingChange(
  field: 'focusDuration' | 'shortBreakDuration' | 'longBreakDuration' | 'pomodorosUntilLongBreak',
  event: Event
) {
  if (pomodoroStore.isRunning) {
    return
  }
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  const ok = pomodoroStore.updateSettings({ [field]: value })
  if (!ok) {
    // 恢复到有效值
    target.value = String((pomodoroStore.settings as any)[field])
  }
}

// 监听计时器状态变化，自动管理 interval
watch(
  () => pomodoroStore.timerState,
  (newState, oldState) => {
    // 从运行状态变为非运行状态时，确保停止计时器
    if ((oldState === 'focusing' || oldState === 'break') && 
        newState !== 'focusing' && newState !== 'break') {
      stopTimer()
    }
    // 从非运行状态变为运行状态时，确保启动计时器
    if ((newState === 'focusing' || newState === 'break') && 
        oldState !== 'focusing' && oldState !== 'break') {
      startTimer()
    }
  }
)

// 组件挂载时初始化
onMounted(async () => {
  // 初始化提示音
  initNotificationSound()
  
  // 加载今日数据
  dailyStore.loadToday()
  await pomodoroStore.loadTodayData()
  
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopTimer()
})

</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.pomodoro-view {
  min-height: 100vh;
  padding: var(--spacing-page);
  padding-bottom: calc(var(--nav-height) + var(--spacing-xl));
  // background handled by App.vue

  @include until-sm {
    padding: var(--spacing-md);
    padding-bottom: calc(var(--nav-height) + var(--spacing-lg));
  }

  &__layout {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.3fr 0.9fr;
    gap: var(--spacing-xl);

    @include until-lg {
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    @include until-md {
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
  }

  &__main {
    @include flex-column;
    gap: var(--spacing-md);
  }

  &__sidebar {
    @include flex-column;
    gap: var(--spacing-md);
  }

  &__header {
    text-align: center;
    padding: var(--spacing-sm) 0 var(--spacing-md);
    animation: fadeInDown 0.6s ease-out;
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    @include text-gradient;
    margin: 0;

    @include until-sm {
      font-size: var(--font-size-xl);
    }
  }

  &__subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    margin: var(--spacing-xs) 0 0;
  }

  &__task-section {
    animation: fadeIn var(--transition-normal) ease;
  }

  &__current-task {
    @include flex-center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-primary-fade);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-lg);
    animation: fadeIn var(--transition-normal) ease;
  }

  &__current-task-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  &__current-task-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @include until-sm {
      max-width: 150px;
    }
  }

  &__settings-section {
    margin-top: var(--spacing-md);
  }

  &__quick-card {
    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--spacing-md);
    }

    .quick-item {
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      padding: var(--spacing-sm) var(--spacing-md);
      box-shadow: var(--shadow-inner);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .quick-item__label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      letter-spacing: 0.5px;
    }

    .quick-item__control {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);

      select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-primary);
        color: var(--text-primary);
        font-weight: var(--font-weight-medium);
        transition: border-color var(--transition-fast);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-fade);
        }
      }
    }
  }

  &__history {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &__history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__history-title {
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  &__history-count {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  &__history-empty {
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
  }

  &__history-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__history-item {
    display: grid;
    grid-template-columns: 70px 1fr;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border: 1px solid var(--border-color-light);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
  }

  .history-time {
    font-variant-numeric: tabular-nums;
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
  }

  .history-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .history-title {
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
    line-height: 1.4;
  }

  .history-meta {
    color: var(--text-tertiary);
    font-size: var(--font-size-xs);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
