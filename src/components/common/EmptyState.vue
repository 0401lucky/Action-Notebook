<template>
  <div class="empty-state">
    <!-- SVG 插图图标 -->
    <div class="empty-state__icon">
      <svg 
        v-if="currentConfig.icon === 'clipboard-list'" 
        class="empty-state__svg"
        viewBox="0 0 120 120" 
        fill="none"
      >
        <!-- 任务列表图标 -->
        <rect x="25" y="15" width="70" height="90" rx="8" fill="var(--glass-bg)" stroke="var(--color-primary)" stroke-width="2"/>
        <rect x="20" y="10" width="10" height="15" rx="2" fill="var(--color-primary)"/>
        <rect x="90" y="10" width="10" height="15" rx="2" fill="var(--color-primary)"/>
        <rect x="55" y="5" width="10" height="10" rx="5" fill="var(--color-accent)"/>
        <rect x="35" y="35" width="50" height="6" rx="3" fill="var(--text-tertiary)" opacity="0.5"/>
        <rect x="35" y="50" width="40" height="6" rx="3" fill="var(--text-tertiary)" opacity="0.5"/>
        <rect x="35" y="65" width="45" height="6" rx="3" fill="var(--text-tertiary)" opacity="0.5"/>
        <rect x="35" y="80" width="35" height="6" rx="3" fill="var(--text-tertiary)" opacity="0.5"/>
      </svg>
      
      <svg 
        v-else-if="currentConfig.icon === 'book-open'" 
        class="empty-state__svg"
        viewBox="0 0 120 120" 
        fill="none"
      >
        <!-- 日记本图标 -->
        <path d="M60 25 L60 95" stroke="var(--color-primary)" stroke-width="2"/>
        <path d="M20 30 Q40 25 60 30 L60 95 Q40 90 20 95 Z" fill="var(--glass-bg)" stroke="var(--color-primary)" stroke-width="2"/>
        <path d="M100 30 Q80 25 60 30 L60 95 Q80 90 100 95 Z" fill="var(--glass-bg)" stroke="var(--color-primary)" stroke-width="2"/>
        <path d="M30 45 Q45 42 55 45" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.5"/>
        <path d="M30 55 Q45 52 55 55" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.5"/>
        <path d="M30 65 Q45 62 55 65" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.5"/>
        <path d="M65 45 Q80 42 90 45" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.5"/>
        <path d="M65 55 Q80 52 90 55" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.5"/>
      </svg>
      
      <svg 
        v-else-if="currentConfig.icon === 'archive'" 
        class="empty-state__svg"
        viewBox="0 0 120 120" 
        fill="none"
      >
        <!-- 归档图标 -->
        <rect x="15" y="25" width="90" height="20" rx="4" fill="var(--color-primary)"/>
        <rect x="20" y="45" width="80" height="55" rx="4" fill="var(--glass-bg)" stroke="var(--color-primary)" stroke-width="2"/>
        <rect x="45" y="60" width="30" height="8" rx="4" fill="var(--color-accent)"/>
        <path d="M50 75 L70 75 L65 85 L55 85 Z" fill="var(--text-tertiary)" opacity="0.5"/>
      </svg>
      
      <svg 
        v-else-if="currentConfig.icon === 'search'" 
        class="empty-state__svg"
        viewBox="0 0 120 120" 
        fill="none"
      >
        <!-- 搜索图标 -->
        <circle cx="50" cy="50" r="30" fill="var(--glass-bg)" stroke="var(--color-primary)" stroke-width="3"/>
        <line x1="72" y1="72" x2="100" y2="100" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round"/>
        <path d="M35 50 Q50 35 65 50" stroke="var(--text-tertiary)" stroke-width="2" opacity="0.5"/>
        <circle cx="50" cy="55" r="3" fill="var(--color-accent)"/>
      </svg>
    </div>
    
    <!-- 标题 -->
    <h3 class="empty-state__title">{{ currentConfig.title }}</h3>
    
    <!-- 描述 -->
    <p class="empty-state__description">{{ currentConfig.description }}</p>
    
    <!-- 操作按钮 -->
    <button 
      v-if="showAction && currentConfig.actionText"
      class="empty-state__action"
      @click="handleAction"
    >
      {{ currentConfig.actionText }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 通用空状态组件
 * 支持多种类型（task/journal/archive/search）
 * 提供默认配置和自定义选项
 */
import { computed } from 'vue'

export type EmptyStateType = 'task' | 'journal' | 'archive' | 'search'

interface EmptyStateConfig {
  icon: string
  title: string
  description: string
  actionText: string | null
}

interface Props {
  /** 空状态类型 */
  type: EmptyStateType
  /** 自定义标题 */
  title?: string
  /** 自定义描述 */
  description?: string
  /** 自定义操作按钮文案 */
  actionText?: string
  /** 是否显示操作按钮，默认 true */
  showAction?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAction: true
})

const emit = defineEmits<{
  (e: 'action'): void
}>()

// 默认配置映射
const emptyStateConfig: Record<EmptyStateType, EmptyStateConfig> = {
  task: {
    icon: 'clipboard-list',
    title: '暂无任务',
    description: '点击下方按钮添加第一个任务',
    actionText: '添加任务'
  },
  journal: {
    icon: 'book-open',
    title: '暂无日记',
    description: '开始记录你的第一篇日记吧',
    actionText: '写日记'
  },
  archive: {
    icon: 'archive',
    title: '暂无归档',
    description: '完成并封存的记录会显示在这里',
    actionText: null
  },
  search: {
    icon: 'search',
    title: '未找到结果',
    description: '尝试使用其他关键词搜索',
    actionText: '清除搜索'
  }
}

// 当前配置（合并默认配置和自定义配置）
const currentConfig = computed<EmptyStateConfig>(() => {
  const defaultConfig = emptyStateConfig[props.type]
  return {
    icon: defaultConfig.icon,
    title: props.title ?? defaultConfig.title,
    description: props.description ?? defaultConfig.description,
    actionText: props.actionText ?? defaultConfig.actionText
  }
})

// 处理操作按钮点击
const handleAction = () => {
  emit('action')
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.empty-state {
  @include flex-column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
  min-height: 200px;

  &__icon {
    margin-bottom: var(--spacing-lg);
    animation: bounce-in 0.6s ease-out;
  }

  &__svg {
    width: 100px;
    height: 100px;
    opacity: 0.9;
  }

  &__title {
    margin: 0 0 var(--spacing-sm);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  &__description {
    margin: 0 0 var(--spacing-lg);
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    max-width: 280px;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: var(--text-inverse);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.3);
    cursor: pointer;
    transition: all var(--transition-normal);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
