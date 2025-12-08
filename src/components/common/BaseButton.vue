<template>
  <button
    ref="buttonRef"
    class="base-button btn-press"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 
        'base-button--block': block, 
        'base-button--loading': loading, 
        'base-button--icon': icon,
        'base-button--ripple': ripple
      }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
    @click="handleClick"
  >
    <span v-if="loading" class="base-button__loader">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
    </span>
    <span class="base-button__content" :class="{ 'invisible': loading }">
      <slot name="icon-left"></slot>
      <slot></slot>
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAnimation } from '@/composables'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'ghost', 'danger', 'outline', 'warning'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  },
  block: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [Boolean, String],
    default: false
  },
  ripple: {
    type: Boolean,
    default: true
  }
})

const buttonRef = ref<HTMLElement | null>(null)
const { createRipple, animateButtonPress } = useAnimation()

function handleClick(event: MouseEvent) {
  if (props.disabled || props.loading) return
  
  if (buttonRef.value) {
    // 播放按压动画
    animateButtonPress(buttonRef.value)
    
    // 如果启用涟漪效果
    if (props.ripple) {
      createRipple(buttonRef.value, event)
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-normal);
  cursor: pointer;
  overflow: hidden;
  
  &__content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
  }
  
  // Sizes
  &--sm {
    height: 32px;
    padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
    
    &.base-button--icon {
      width: 32px;
      padding: 0;
    }
  }
  
  &--md {
    height: 40px;
    padding: 0 var(--spacing-lg);
    font-size: var(--font-size-base);
    
    &.base-button--icon {
      width: 40px;
      padding: 0;
    }
  }
  
  &--lg {
    height: 48px;
    padding: 0 var(--spacing-xl);
    font-size: var(--font-size-lg);
    
    &.base-button--icon {
      width: 48px;
      padding: 0;
    }
  }
  
  // Variants
  &--primary {
    background: var(--color-primary);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    
    &:hover:not(:disabled) {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    
    &:hover:not(:disabled) {
      background: var(--bg-hover);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
  
  &--ghost {
    background: transparent;
    color: var(--text-secondary);
    
    &:hover:not(:disabled) {
      background: var(--bg-hover);
      color: var(--color-primary);
    }
  }
  
  &--danger {
    background: var(--color-danger);
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    
    &:hover:not(:disabled) {
      background: #dc2626; // 比 #ef4444 深 5% 的颜色
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
    }
  }
  
  &--outline {
    background: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    
    &:hover:not(:disabled) {
      background: var(--color-primary-fade);
    }
  }
  
  &--warning {
    background: var(--color-warning, #f59e0b);
    color: white;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    
    &:hover:not(:disabled) {
      background: #d97706;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  // States
  &--block {
    display: flex;
    width: 100%;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  // Loader
  &__loader {
    @include absolute-center;
    
    .spinner {
      animation: rotate 2s linear infinite;
      width: 20px;
      height: 20px;
      
      & .path {
        stroke: currentColor;
        stroke-linecap: round;
        animation: dash 1.5s ease-in-out infinite;
      }
    }
  }
}

.invisible {
  visibility: hidden;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}
</style>
