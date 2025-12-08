<template>
  <div class="pomodoro-settings">
    <button 
      class="pomodoro-settings__toggle"
      @click="togglePanel"
      :aria-expanded="isOpen"
    >
      <span class="pomodoro-settings__toggle-icon">⚙️</span>
      <span class="pomodoro-settings__toggle-text">设置</span>
      <span 
        class="pomodoro-settings__arrow" 
        :class="{ 'pomodoro-settings__arrow--open': isOpen }"
      >
        ▼
      </span>
    </button>

    <Transition name="settings">
      <BaseCard v-if="isOpen" class="pomodoro-settings__panel" :padded="true">
        <!-- 专注时长 -->
        <div class="pomodoro-settings__field">
          <BaseInput
            id="focus-duration"
            type="number"
            v-model.number="localSettings.focusDuration"
            label="专注时长 (分钟)"
            min="1"
            max="60"
            :error="errors.focusDuration"
            @input="validateField('focusDuration')"
          >
            <template #suffix>分钟</template>
          </BaseInput>
          <span v-if="!errors.focusDuration" class="pomodoro-settings__hint">1-60 分钟</span>
        </div>

        <!-- 短休息时长 -->
        <div class="pomodoro-settings__field">
          <BaseInput
            id="short-break"
            type="number"
            v-model.number="localSettings.shortBreakDuration"
            label="短休息时长 (分钟)"
            min="1"
            max="30"
            :error="errors.shortBreakDuration"
            @input="validateField('shortBreakDuration')"
          >
            <template #suffix>分钟</template>
          </BaseInput>
          <span v-if="!errors.shortBreakDuration" class="pomodoro-settings__hint">1-30 分钟</span>
        </div>

        <!-- 长休息时长 -->
        <div class="pomodoro-settings__field">
          <BaseInput
            id="long-break"
            type="number"
            v-model.number="localSettings.longBreakDuration"
            label="长休息时长 (分钟)"
            min="1"
            max="30"
            :error="errors.longBreakDuration"
            @input="validateField('longBreakDuration')"
          >
            <template #suffix>分钟</template>
          </BaseInput>
          <span v-if="!errors.longBreakDuration" class="pomodoro-settings__hint">1-30 分钟</span>
        </div>

        <!-- 保存按钮 -->
        <div class="pomodoro-settings__actions">
          <BaseButton
            variant="secondary"
            size="sm"
            @click="resetToDefault"
          >
            恢复默认
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="hasErrors || !hasChanges"
            @click="saveSettings"
          >
            保存设置
          </BaseButton>
        </div>

        <!-- 保存成功提示 -->
        <Transition name="fade">
          <div v-if="showSuccess" class="pomodoro-settings__success">
            ✓ 设置已保存
          </div>
        </Transition>
      </BaseCard>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * PomodoroSettings - 番茄钟设置组件
 * 
 * 实现专注时长、短休息时长、长休息时长的配置。
 * 
 * Requirements: 5.1-5.5
 * - 5.1: 显示专注时长、短休息时长、长休息时长的配置选项
 * - 5.2: 接受 1 到 60 分钟范围内的整数值（专注时长）
 * - 5.3: 接受 1 到 30 分钟范围内的整数值（休息时长）
 * - 5.4: 持久化配置并在下次计时时使用新设置
 * - 5.5: 显示验证错误并阻止保存
 */
import { ref, reactive, computed, watch } from 'vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import { DEFAULT_POMODORO_SETTINGS } from '@/types'
import type { PomodoroSettings } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'

const pomodoroStore = usePomodoroStore()

// 面板状态
const isOpen = ref(false)
const showSuccess = ref(false)

// 本地设置副本
const localSettings = reactive<PomodoroSettings>({
  ...pomodoroStore.settings
})

// 错误信息
const errors = reactive({
  focusDuration: '',
  shortBreakDuration: '',
  longBreakDuration: ''
})

/**
 * 是否有验证错误
 * Requirements: 5.5
 */
const hasErrors = computed(() => {
  return !!(errors.focusDuration || errors.shortBreakDuration || errors.longBreakDuration)
})

/**
 * 是否有修改
 */
const hasChanges = computed(() => {
  return (
    localSettings.focusDuration !== pomodoroStore.settings.focusDuration ||
    localSettings.shortBreakDuration !== pomodoroStore.settings.shortBreakDuration ||
    localSettings.longBreakDuration !== pomodoroStore.settings.longBreakDuration
  )
})

/**
 * 切换设置面板
 */
function togglePanel(): void {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // 打开时同步最新设置
    Object.assign(localSettings, pomodoroStore.settings)
    clearErrors()
  }
}

/**
 * 验证单个字段
 * Requirements: 5.2, 5.3, 5.5
 */
function validateField(field: keyof typeof errors): void {
  const value = localSettings[field as keyof PomodoroSettings]
  
  if (field === 'focusDuration') {
    if (!Number.isInteger(value) || value < 1 || value > 60) {
      errors.focusDuration = '专注时长需在 1-60 分钟之间'
    } else {
      errors.focusDuration = ''
    }
  } else if (field === 'shortBreakDuration' || field === 'longBreakDuration') {
    if (!Number.isInteger(value) || value < 1 || value > 30) {
      errors[field] = '休息时长需在 1-30 分钟之间'
    } else {
      errors[field] = ''
    }
  }
}

/**
 * 清除所有错误
 */
function clearErrors(): void {
  errors.focusDuration = ''
  errors.shortBreakDuration = ''
  errors.longBreakDuration = ''
}

/**
 * 保存设置
 * Requirements: 5.4
 */
function saveSettings(): void {
  if (hasErrors.value) return
  
  const success = pomodoroStore.updateSettings({
    focusDuration: localSettings.focusDuration,
    shortBreakDuration: localSettings.shortBreakDuration,
    longBreakDuration: localSettings.longBreakDuration
  })
  
  if (success) {
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 2000)
  }
}

/**
 * 恢复默认设置
 */
function resetToDefault(): void {
  Object.assign(localSettings, DEFAULT_POMODORO_SETTINGS)
  clearErrors()
}

// 监听 store 设置变化
watch(
  () => pomodoroStore.settings,
  (newSettings) => {
    if (!isOpen.value) {
      Object.assign(localSettings, newSettings)
    }
  },
  { deep: true }
)
</script>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.pomodoro-settings {
  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--glass-bg);
    backdrop-filter: var(--backdrop-blur);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    width: 100%;

    &:hover {
      border-color: var(--color-primary);
      background: var(--bg-hover);
    }
    
    &:focus {
      @include focus-ring;
    }
  }

  &__toggle-icon {
    font-size: var(--font-size-lg);
  }

  &__toggle-text {
    flex: 1;
    text-align: left;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
  }

  &__arrow {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    transition: transform var(--transition-fast);

    &--open {
      transform: rotate(180deg);
    }
  }

  &__panel {
    margin-top: var(--spacing-sm);
  }

  &__field {
    margin-bottom: var(--spacing-md);

    &:last-of-type {
      margin-bottom: var(--spacing-lg);
    }
  }

  &__hint {
    display: block;
    margin-top: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-left: var(--spacing-xs);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
  }

  &__success {
    margin-top: var(--spacing-md);
    padding: var(--spacing-sm);
    background: var(--color-success-light);
    color: var(--color-success);
    border-radius: var(--radius-md);
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
}

// 面板展开动画
.settings-enter-active,
.settings-leave-active {
  transition: all var(--transition-normal);
}

.settings-enter-from,
.settings-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 成功提示动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
