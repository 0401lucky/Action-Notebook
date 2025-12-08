<template>
  <div class="mood-picker">
    <span class="mood-picker__label">今日心情</span>
    <div class="mood-picker__options">
      <button
        v-for="mood in moods"
        :key="mood.value"
        type="button"
        class="mood-picker__option"
        :class="{ 'mood-picker__option--selected': modelValue === mood.value }"
        :title="mood.label"
        :disabled="disabled"
        @click="selectMood(mood.value)"
      >
        <span class="mood-picker__icon">{{ mood.icon }}</span>
        <span class="mood-picker__name">{{ mood.label }}</span>
        <div class="selection-ring" v-if="modelValue === mood.value"></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MoodType } from '@/types'

interface MoodOption {
  value: MoodType
  label: string
  icon: string
}

interface Props {
  modelValue: MoodType | null
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: MoodType): void
}

withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const moods: MoodOption[] = [
  { value: 'happy', label: '开心', icon: '😊' },
  { value: 'neutral', label: '平淡', icon: '😐' },
  { value: 'sad', label: '沮丧', icon: '😢' },
  { value: 'excited', label: '兴奋', icon: '🤩' },
  { value: 'tired', label: '疲惫', icon: '😴' }
]

function selectMood(mood: MoodType) {
  emit('update:modelValue', mood)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.mood-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__options {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;

    @include until-sm {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--spacing-xs);
    }
  }

  &__option {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    cursor: pointer;
    transition: all var(--transition-bounce);
    min-width: 70px;
    
    @include until-sm {
      min-width: unset;
      padding: 8px;
    }

    &:hover:not(:disabled) {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-light);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &--selected {
      border-color: var(--color-primary);
      background: var(--color-primary-fade);
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);

      .mood-picker__name {
        color: var(--color-primary);
        font-weight: 700;
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__icon {
    font-size: 2rem;
    line-height: 1;
    transition: transform var(--transition-bounce);

    .mood-picker__option:hover & {
      transform: scale(1.1);
    }

    @include until-sm {
      font-size: 1.5rem;
    }
  }

  &__name {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    transition: color var(--transition-fast);

    @include until-xs {
      display: none;
    }
  }
  
  .selection-ring {
    position: absolute;
    inset: -2px;
    border: 2px solid var(--color-primary);
    border-radius: calc(var(--radius-lg) + 2px);
    animation: pulse 2s infinite;
    pointer-events: none;
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 var(--color-primary-fade); }
  70% { box-shadow: 0 0 0 6px rgba(0, 0, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
}
</style>
