<template>
  <div 
    ref="cardRef"
    class="base-card"
    :class="{ 
      'base-card--glass': glass,
      'base-card--hoverable': hoverable,
      'base-card--padded': padded,
      'base-card--animated': animated
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div v-if="$slots.header" class="base-card__header">
      <slot name="header"></slot>
    </div>
    <div class="base-card__body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAnimation } from '@/composables'

const props = defineProps({
  glass: {
    type: Boolean,
    default: true
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  padded: {
    type: Boolean,
    default: true
  },
  animated: {
    type: Boolean,
    default: false
  }
})

const cardRef = ref<HTMLElement | null>(null)
const { animateCardHover } = useAnimation()

function handleMouseEnter() {
  if (props.animated && cardRef.value) {
    animateCardHover(cardRef.value, true)
  }
}

function handleMouseLeave() {
  if (props.animated && cardRef.value) {
    animateCardHover(cardRef.value, false)
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.base-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  overflow: hidden;
  
  &--glass {
    @include glass-effect;
    background: var(--glass-bg); // Override default bg
  }
  
  &--hoverable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
  
  &--animated {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  &--padded {
    .base-card__body {
      padding: var(--spacing-lg);
    }
    
    .base-card__header {
      padding: var(--spacing-md) var(--spacing-lg);
    }
    
    .base-card__footer {
      padding: var(--spacing-md) var(--spacing-lg);
    }
  }
  
  &__header {
    border-bottom: 1px solid var(--border-color-light);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }
  
  &__footer {
    border-top: 1px solid var(--border-color-light);
    background: rgba(0, 0, 0, 0.02);
  }
}
</style>
