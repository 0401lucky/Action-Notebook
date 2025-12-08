<template>
  <div class="seal-button-container">
    <button
      type="button"
      class="seal-button"
      :class="{ 
        'seal-button--sealed': isSealed,
        'seal-button--can-unseal': isSealed
      }"
      @click="handleButtonClick"
    >
      <div class="seal-content">
        <span class="seal-icon">{{ isSealed ? '🔒' : '✨' }}</span>
        <span class="seal-text">{{ buttonText }}</span>
      </div>
      <div class="seal-shine" v-if="!isSealed"></div>
    </button>
    
    <Transition name="slide-up">
      <div v-if="errorMessage" class="feedback-message feedback-message--error">
        <span class="feedback-icon">⚠️</span>
        <span class="feedback-text">{{ errorMessage }}</span>
      </div>
    </Transition>
    
    <Transition name="slide-up">
      <div v-if="showSuccess" class="feedback-message feedback-message--success">
        <span class="feedback-icon">🎉</span>
        <span class="feedback-text">{{ successMessage }}</span>
      </div>
    </Transition>

    <!-- 解封确认对话框 -->
    <ConfirmDialog
      v-model:visible="showUnsealDialog"
      title="确认解封"
      message="解封后可以继续编辑任务和日记内容。确定要解封吗？"
      confirm-text="确认解封"
      cancel-text="取消"
      @confirm="handleUnsealConfirm"
      @cancel="handleUnsealCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDailyStore } from '@/stores/daily'
import { ConfirmDialog } from '@/components/common'

const MIN_JOURNAL_LENGTH = 50

const store = useDailyStore()

const errorMessage = ref<string | null>(null)
const showSuccess = ref(false)
const successMessage = ref('')
const showUnsealDialog = ref(false)

const isSealed = computed(() => store.isSealed)

/**
 * 按钮文本
 * 已封存时显示"已封存 · 点击解封"
 * 未封存时显示"封存今日手帐"
 * Requirements: 1.1, 3.1
 */
const buttonText = computed(() => {
  if (isSealed.value) {
    return '已封存 · 点击解封'
  }
  return '封存今日手帐'
})

const canSeal = computed(() => {
  if (!store.currentRecord || store.currentRecord.isSealed) {
    return { valid: false, reason: '没有可封存的记录' }
  }
  
  const tasks = store.currentRecord.tasks
  const journal = store.currentRecord.journal
  const hasMood = store.currentRecord.mood !== null
  const journalEntries = store.currentRecord.journalEntries ?? []
  
  // 条件1: 所有任务已完成（如果有任务的话）
  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed)
  
  // 条件2: 日记字数达到最低要求
  const journalMeetsMinLength = journal.length >= MIN_JOURNAL_LENGTH
  const hasJournalContent = journal.trim().length > 0
  
  // 条件3: 有日记条目
  const hasJournalEntries = journalEntries.length > 0
  
  if (tasks.length > 0) {
    if (allTasksCompleted || journalMeetsMinLength || hasJournalEntries) {
      return { valid: true, reason: null }
    }
    const errors: string[] = []
    const remainingCount = tasks.length - tasks.filter(t => t.completed).length
    errors.push(`还有 ${remainingCount} 个任务未完成`)
    if (!journalMeetsMinLength) {
      const remainingChars = Math.max(MIN_JOURNAL_LENGTH - journal.length, 0)
      errors.push(`日记还需 ${remainingChars} 字`)
    }
    if (!hasJournalEntries) {
      errors.push('添加至少一条日记')
    }
    return {
      valid: false,
      reason: `请完成以下条件之一：${errors.join('，或')}`
    }
  }

  // 无任务：日记、心情、日记条目任一即可封存
  if (hasJournalContent || hasMood || hasJournalEntries) {
    return { valid: true, reason: null }
  }
  return {
    valid: false,
    reason: '请完成以下条件之一：写一段日记，选择今日心情，或添加一条日记条目'
  }
})

/**
 * 处理按钮点击
 * 已封存时触发解封流程，未封存时触发封存流程
 * Requirements: 3.1, 3.2
 */
function handleButtonClick() {
  if (isSealed.value) {
    // 已封存，显示解封确认对话框
    showUnsealDialog.value = true
  } else {
    // 未封存，执行封存操作
    handleSeal()
  }
}

/**
 * 处理封存操作
 */
function handleSeal() {
  errorMessage.value = null
  showSuccess.value = false
  
  const validation = canSeal.value
  
  if (!validation.valid) {
    errorMessage.value = validation.reason
    // 5秒后自动清除错误信息
    setTimeout(() => {
      errorMessage.value = null
    }, 5000)
    return
  }
  
  const result = store.sealDay()
  
  if (result) {
    successMessage.value = '封存成功！美好的一天被记录下来了'
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } else {
    errorMessage.value = '封存失败，请重试'
    setTimeout(() => {
      errorMessage.value = null
    }, 3000)
  }
}

/**
 * 处理解封确认
 * Requirements: 2.3, 3.3
 */
function handleUnsealConfirm() {
  errorMessage.value = null
  showSuccess.value = false
  
  const result = store.unsealDay()
  
  if (result) {
    successMessage.value = '解封成功！可以继续编辑了'
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } else {
    errorMessage.value = '解封失败，请重试'
    setTimeout(() => {
      errorMessage.value = null
    }, 3000)
  }
}

/**
 * 处理解封取消
 * Requirements: 2.4
 */
function handleUnsealCancel() {
  // 关闭对话框，保持记录封存状态
  showUnsealDialog.value = false
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.seal-button-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.seal-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  font-size: var(--font-size-lg);
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-lg);
  min-height: 56px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
    filter: brightness(1.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &--sealed {
    background: var(--color-success);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, var(--color-warning), var(--color-accent));
    }
  }
  
  &--can-unseal {
    cursor: pointer;
  }
  
  .seal-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .seal-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transform: skewX(-20deg);
    animation: shine 3s infinite;
  }
}

.feedback-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  
  &--error {
    background: var(--color-danger-light);
    color: var(--color-danger);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
  
  &--success {
    background: var(--color-success-light);
    color: var(--color-success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
}

@keyframes shine {
  0% { left: -100%; }
  20% { left: 200%; }
  100% { left: 200%; }
}

// Transitions
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
