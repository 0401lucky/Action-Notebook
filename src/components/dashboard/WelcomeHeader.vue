<template>
  <BaseCard class="welcome-header" :padded="true">
    <!-- 问候语区域 -->
    <div class="welcome-header__greeting">
      <h1 class="welcome-header__title">{{ greetingText }}</h1>
      <p class="welcome-header__date">{{ currentDate }}</p>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
/**
 * 欢迎区域组件
 * 显示问候语、用户昵称和当前日期
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1
 */

import { computed } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { getGreeting, formatDate, formatGreetingWithNickname } from '@/services/dashboard'
import BaseCard from '@/components/common/BaseCard.vue'

const profileStore = useProfileStore()

/**
 * 获取当前小时
 */
const currentHour = computed(() => new Date().getHours())

/**
 * 获取问候语（根据时间段）
 * - 00:00-11:59: 早上好
 * - 12:00-17:59: 下午好
 * - 18:00-23:59: 晚上好
 */
const greeting = computed(() => getGreeting(currentHour.value))

/**
 * 获取用户昵称
 * 如果用户有设置昵称则返回昵称，否则返回 null
 */
const nickname = computed(() => {
  return profileStore.hasNickname ? profileStore.profile?.nickname ?? null : null
})

/**
 * 组合问候语和昵称
 * - 有昵称时: "早上好，小明"
 * - 无昵称时: "早上好"
 */
const greetingText = computed(() => {
  return formatGreetingWithNickname(greeting.value, nickname.value)
})

/**
 * 格式化当前日期
 * 格式: "YYYY年M月D日 星期X"
 */
const currentDate = computed(() => formatDate(new Date()))
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.welcome-header {
  // BaseCard handles background and border
  
  &__greeting {
    @include flex-column;
    gap: var(--spacing-xs);
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    line-height: var(--line-height-tight);
    
    // 渐变文字效果
    @include text-gradient;
  }

  &__date {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-normal);
  }
}

// 响应式适配
@include until-sm {
  .welcome-header {
    &__title {
      font-size: var(--font-size-xl);
    }

    &__date {
      font-size: var(--font-size-sm);
    }
  }
}
</style>
