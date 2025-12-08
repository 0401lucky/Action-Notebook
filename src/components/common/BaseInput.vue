<template>
  <div class="base-input" :class="inputClasses">
    <div class="base-input__wrapper">
      <span v-if="$slots.prefix" ref="prefixRef" class="base-input__prefix">
        <slot name="prefix"></slot>
      </span>
      
      <input
        v-bind="$attrs"
        :value="modelValue"
        @input="updateValue"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="base-input__field"
        :type="type"
        :placeholder="shouldShowPlaceholder ? placeholder : ''"
      />
      
      <label v-if="label" class="base-input__label" :style="labelStyle">{{ label }}</label>
      
      <span v-if="$slots.suffix" class="base-input__suffix">
        <slot name="suffix"></slot>
      </span>
    </div>
    <div v-if="error" class="base-input__error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])
const slots = defineSlots()

const isFocused = ref(false)
const prefixRef = ref<HTMLElement | null>(null)
const hasValue = computed(() => !!props.modelValue)
const hasPrefix = computed(() => !!slots.prefix)

// 日期类型输入框需要始终显示标签在顶部（因为浏览器会显示日期格式占位符）
const isDateType = computed(() => ['date', 'datetime-local', 'time', 'month', 'week'].includes(props.type))

// 标签是否应该浮动到顶部
const shouldLabelFloat = computed(() => isFocused.value || hasValue.value || isDateType.value)

// 当标签没有浮动且有 prefix 时，需要调整标签位置
const labelStyle = computed(() => {
  if (!shouldLabelFloat.value && hasPrefix.value) {
    // 有 prefix 时，标签需要向右偏移，避免和 prefix 重叠
    return { left: 'calc(var(--spacing-md) + 28px)' }
  }
  return {}
})

// 当有 label 且标签未浮动时，不显示 placeholder（避免重叠）
const shouldShowPlaceholder = computed(() => {
  if (!props.label) return true
  return shouldLabelFloat.value
})

const inputClasses = computed(() => ({
  'base-input--focused': isFocused.value,
  'base-input--has-value': hasValue.value,
  'base-input--error': !!props.error,
  'base-input--date-type': isDateType.value,
  'base-input--has-prefix': hasPrefix.value
}))

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.base-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
    padding: 0 var(--spacing-md);
    height: 48px;
    
    &:hover {
      border-color: var(--text-tertiary);
    }
  }
  
  &__field {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    height: 100%;
    color: var(--text-primary);
    font-size: var(--font-size-base);
    padding: 0;
    
    &::placeholder {
      color: var(--text-placeholder);
    }
  }
  
  &__label {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    transition: all var(--transition-normal);
    pointer-events: none;
    font-size: var(--font-size-base);
    background: transparent;
    padding: 0 4px;
  }
  
  &__prefix,
  &__suffix {
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
  }
  
  &__prefix {
    margin-right: var(--spacing-sm);
  }
  
  &__suffix {
    margin-left: var(--spacing-sm);
  }
  
  &__error-message {
    font-size: var(--font-size-xs);
    color: var(--color-danger);
    margin-left: var(--spacing-xs);
  }
  
  // States
  &--focused,
  &--has-value {
    .base-input__wrapper {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-fade);
    }
    
    .base-input__label {
      top: 0;
      left: var(--spacing-md) !important; // 浮动时重置位置
      font-size: var(--font-size-xs);
      color: var(--color-primary);
      background: var(--bg-secondary);
      height: 2px; // Hack to cover border
      display: flex;
      align-items: center;
    }
  }
  
  // 日期类型输入框：标签始终固定在顶部
  &--date-type {
    .base-input__label {
      top: 0;
      left: var(--spacing-md) !important; // 浮动时重置位置
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      background: var(--bg-secondary);
      height: 2px;
      display: flex;
      align-items: center;
    }
    
    &.base-input--focused .base-input__label {
      color: var(--color-primary);
    }
  }
  
  &--error {
    .base-input__wrapper {
      border-color: var(--color-danger);
      
      &:hover {
        border-color: var(--color-danger);
      }
    }
    
    &.base-input--focused .base-input__wrapper {
      box-shadow: 0 0 0 3px var(--color-danger-light);
    }
    
    .base-input__label {
      color: var(--color-danger);
    }
  }
}
</style>
