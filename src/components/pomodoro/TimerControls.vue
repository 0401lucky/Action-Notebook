<template>
  <div class="timer-controls">
    <!-- 主控制按钮 -->
    <BaseButton
      v-if="timerState === 'idle'"
      variant="primary"
      size="lg"
      @click="$emit('start')"
      aria-label="开始专注"
      class="timer-controls__btn--main"
    >
      <template #icon>▶</template>
      开始专注
    </BaseButton>

    <BaseButton
      v-else-if="timerState === 'focusing' || timerState === 'break'"
      variant="warning"
      size="lg"
      @click="$emit('pause')"
      aria-label="暂停"
      class="timer-controls__btn--main"
    >
      <template #icon>⏸</template>
      暂停
    </BaseButton>

    <BaseButton
      v-else-if="timerState === 'paused'"
      variant="primary"
      size="lg"
      @click="$emit('resume')"
      aria-label="继续"
      class="timer-controls__btn--main"
    >
      <template #icon>▶</template>
      继续
    </BaseButton>

    <!-- 重置按钮 -->
    <BaseButton
      v-if="timerState !== 'idle'"
      variant="secondary"
      @click="$emit('reset')"
      aria-label="重置"
    >
      <template #icon>↺</template>
      重置
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import type { TimerState } from '@/types'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  /** 计时器状态 */
  timerState: TimerState
}

defineProps<Props>()

defineEmits<{
  /** 开始计时 */
  start: []
  /** 暂停计时 */
  pause: []
  /** 继续计时 */
  resume: []
  /** 重置计时 */
  reset: []
}>()
</script>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.timer-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);

  &__btn--main {
    min-width: 160px;

    @include until-sm {
      min-width: 140px;
    }
  }
}
</style>
